const express = require('express');
const DailyAttendance = require('../models/DailyAttendance');
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const { auth, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Get attendance for a specific date (temporarily public for development)
router.get('/date/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const attendance = await DailyAttendance.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('customer_id', 'name phone delivery_time subscription_amount price_per_liter');

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get attendance for a specific customer (temporarily public for development)
router.get('/customer/:customerId', async (req, res) => {
  try {
    const attendance = await DailyAttendance.find({
      customer_id: req.params.customerId
    }).sort({ date: -1 });

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark attendance for a customer (create or update) (admin only)
router.post('/', auth, authorizeAdmin, async (req, res) => {
  try {
    const { date, customer_id, status, milk_quantity, additional_products, notes } = req.body;

    // Check if attendance already exists for this customer on this date
    const existingAttendance = await DailyAttendance.findOne({
      date: new Date(date),
      customer_id: customer_id
    });

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = status;
      existingAttendance.milk_quantity = milk_quantity || 0;
      existingAttendance.additional_products = additional_products || [];
      existingAttendance.notes = notes;
      const updatedAttendance = await existingAttendance.save();
      
      // Update customer's last milk quantity if present
      if (status === 'present' && milk_quantity > 0) {
        console.log(`Updating last_milk_quantity for customer ${customer_id} to ${milk_quantity}`);
        await Customer.findByIdAndUpdate(customer_id, {
          last_milk_quantity: milk_quantity
        });
        console.log(`Successfully updated last_milk_quantity for customer ${customer_id}`);
      }
      
      return res.json(updatedAttendance);
    } else {
      // Create new attendance record
      const attendance = new DailyAttendance({
        date: new Date(date),
        customer_id,
        status,
        milk_quantity: milk_quantity || 0,
        additional_products: additional_products || [],
        notes
      });
      const newAttendance = await attendance.save();
      
      // Update customer's last milk quantity if present
      if (status === 'present' && milk_quantity > 0) {
        console.log(`Creating new attendance: Updating last_milk_quantity for customer ${customer_id} to ${milk_quantity}`);
        await Customer.findByIdAndUpdate(customer_id, {
          last_milk_quantity: milk_quantity
        });
        console.log(`Successfully updated last_milk_quantity for customer ${customer_id}`);
      }
      
      const populatedAttendance = await DailyAttendance.findById(newAttendance._id)
        .populate('customer_id', 'name phone delivery_time subscription_amount price_per_liter');
      return res.status(201).json(populatedAttendance);
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Bulk mark attendance for multiple customers
router.post('/bulk', auth, async (req, res) => {
  try {
    const { date, attendanceData } = req.body; // attendanceData should be array of {customer_id, status, milk_quantity, additional_products, notes}

    const results = [];

    for (const data of attendanceData) {
      try {
        const attendance = new DailyAttendance({
          date: new Date(date),
          customer_id: data.customer_id,
          status: data.status,
          milk_quantity: data.milk_quantity || 0,
          additional_products: data.additional_products || [],
          notes: data.notes
        });
        const saved = await attendance.save();
        results.push(saved);
      } catch (err) {
        // If duplicate key error, update existing
        if (err.code === 11000) {
          const existing = await DailyAttendance.findOneAndUpdate(
            { date: new Date(date), customer_id: data.customer_id },
            {
              status: data.status,
              milk_quantity: data.milk_quantity || 0,
              additional_products: data.additional_products || [],
              notes: data.notes
            },
            { new: true }
          );
          if (existing) results.push(existing);
        }
      }
    }

    // Create sale records for milk and additional products
    for (const attendance of results) {
      try {
        // Always update customer's last milk quantity if present
        if (attendance.status === 'present' && attendance.milk_quantity > 0) {
          console.log(`Updating last_milk_quantity for customer ${attendance.customer_id} to ${attendance.milk_quantity}`);
          await Customer.findByIdAndUpdate(attendance.customer_id, {
            last_milk_quantity: attendance.milk_quantity
          });
          console.log(`Successfully updated last_milk_quantity for customer ${attendance.customer_id}`);
        }

        // Check for existing milk sale for this customer on this date
        const existingMilkSale = await Sale.findOne({
          date: new Date(date),
          customer_id: attendance.customer_id,
          product_type: 'milk'
        });

        // Create sale for milk if present
        if (attendance.status === 'present' && attendance.milk_quantity > 0) {
          const customer = await Customer.findById(attendance.customer_id);
          if (customer && customer.price_per_liter) {
            if (existingMilkSale) {
              await Sale.findByIdAndUpdate(existingMilkSale._id, {
                quantity: attendance.milk_quantity,
                unit_price: customer.price_per_liter,
                total_amount: attendance.milk_quantity * customer.price_per_liter
              });
              // Update customer balance (subtract old, add new)
              const oldAmount = existingMilkSale.total_amount;
              const newAmount = attendance.milk_quantity * customer.price_per_liter;
              await Customer.findByIdAndUpdate(attendance.customer_id, { $inc: { balance_due: newAmount - oldAmount } });
            } else {
              const invoiceNumber = `MILK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              const sale = new Sale({
                date: new Date(date),
                customer_id: attendance.customer_id,
                product_type: 'milk',
                quantity: attendance.milk_quantity,
                unit_price: customer.price_per_liter,
                total_amount: attendance.milk_quantity * customer.price_per_liter,
                invoice_number: invoiceNumber
              });
              await sale.save();
              // Update customer balance
              await Customer.findByIdAndUpdate(attendance.customer_id, { $inc: { balance_due: attendance.milk_quantity * customer.price_per_liter } });
            }
          }
        }

        // Create sale records for additional products
        if (attendance.additional_products && attendance.additional_products.length > 0) {
          for (const product of attendance.additional_products) {
            const existingProductSale = await Sale.findOne({
              date: new Date(date),
              customer_id: attendance.customer_id,
              product_type: product.product_type,
              quantity: product.quantity, // Assuming same quantity means same sale
              unit_price: product.unit_price
            });

            if (existingProductSale) {
              await Sale.findByIdAndUpdate(existingProductSale._id, {
                total_amount: product.total_amount
              });
              // Update customer balance (subtract old, add new)
              const oldAmount = existingProductSale.total_amount;
              const newAmount = product.total_amount;
              await Customer.findByIdAndUpdate(attendance.customer_id, { $inc: { balance_due: newAmount - oldAmount } });
            } else {
              const invoiceNumber = `SALE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              const sale = new Sale({
                date: new Date(date),
                customer_id: attendance.customer_id,
                product_type: product.product_type,
                quantity: product.quantity,
                unit_price: product.unit_price,
                total_amount: product.total_amount,
                invoice_number: invoiceNumber
              });
              await sale.save();
              // Update customer balance
              await Customer.findByIdAndUpdate(attendance.customer_id, { $inc: { balance_due: product.total_amount } });
            }
          }
        }
      } catch (saleError) {
        // Continue with other records, don't fail the whole save
      }
    }

    const populatedResults = await DailyAttendance.find({
      _id: { $in: results.map(r => r._id) }
    }).populate('customer_id', 'name phone delivery_time subscription_amount price_per_liter');

    res.status(201).json(populatedResults);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update specific attendance record (admin only)
router.put('/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    const attendance = await DailyAttendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('customer_id', 'name phone delivery_time subscription_amount price_per_liter');

    res.json(attendance);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete attendance record (admin only)
router.delete('/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    await DailyAttendance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Attendance record deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get customers who need attendance marking for a date (active customers not yet marked) (temporarily public for development)
router.get('/pending/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all active customers
    const activeCustomers = await Customer.find({ is_active: true });

    // Get customers already marked for this date
    const markedAttendance = await DailyAttendance.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).select('customer_id');

    const markedCustomerIds = markedAttendance.map(a => a.customer_id.toString());

    // Filter out customers already marked
    const pendingCustomers = activeCustomers.filter(
      customer => !markedCustomerIds.includes(customer._id.toString())
    );

    res.json(pendingCustomers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;