const express = require('express');
const Bill = require('../models/Bill');
const Customer = require('../models/Customer');
const DailyAttendance = require('../models/DailyAttendance');
const Account = require('../models/Account');
const BankTransaction = require('../models/BankTransaction');
const { auth, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Generate monthly bills for all active customers
router.post('/generate-monthly', auth, async (req, res) => {
  try {
    const { year, month } = req.body; // Expected format: year: 2024, month: 11

    if (!year || !month) {
      return res.status(400).json({ message: 'Year and month are required' });
    }

    const billingPeriod = `${year}-${String(month).padStart(2, '0')}`;
    const startDate = new Date(year, month - 1, 1); // Month is 0-indexed
    const endDate = new Date(year, month, 0); // Last day of month
    const dueDate = new Date(year, month, 10); // 10th of next month

    // Get customers who have attendance records for the billing period and are daily milk customers
    const attendanceRecords = await DailyAttendance.find({
      date: { $gte: startDate, $lte: endDate }
    }).distinct('customer_id');

    const customers = await Customer.find({
      _id: { $in: attendanceRecords },
      is_active: true,
      customer_type: 'daily milk customer'
    });

    const billsGenerated = [];
    const errors = [];

    for (const customer of customers) {
      try {
        let billData = {
          customer_id: customer._id,
          customer_name: customer.name,
          billing_period: billingPeriod,
          billing_type: customer.billing_type,
          due_date: dueDate,
          invoice_number: generateInvoiceNumber(billingPeriod, customer._id)
        };

        const totalDays = endDate.getDate(); // Total days in the month
        billData.total_days = totalDays;

        // Fetch all attendance records for the period to calculate additional products
        const allAttendanceRecords = await DailyAttendance.find({
          customer_id: customer._id,
          date: { $gte: startDate, $lte: endDate }
        });

        const totalAdditionalAmount = allAttendanceRecords.reduce((sum, record) => {
          return sum + (record.additional_products || []).reduce((subSum, product) => subSum + (product.total_amount || 0), 0);
        }, 0);

        if (customer.billing_type === 'subscription') {
          // Prorated monthly subscription based on delivered days
          const attendanceRecords = allAttendanceRecords.filter(record => record.status === 'present');

          const deliveredDays = attendanceRecords.length;
          const prorationFactor = deliveredDays / totalDays;
          const proratedAmount = (customer.subscription_amount || 0) * prorationFactor;

          billData.total_amount = proratedAmount + totalAdditionalAmount;
          billData.delivered_days = deliveredDays;
          billData.proration_factor = prorationFactor;
          billData.total_liters = 0;
          billData.price_per_liter = 0;
        } else if (customer.billing_type === 'per_liter') {
          // Calculate based on actual delivery
          const attendanceRecords = allAttendanceRecords.filter(record => record.status === 'present');

          const totalLiters = attendanceRecords.reduce((sum, record) => sum + (record.milk_quantity || 0), 0);
          const pricePerLiter = customer.price_per_liter || 0;
          const milkAmount = totalLiters * pricePerLiter;

          billData.total_amount = milkAmount + totalAdditionalAmount;
          billData.total_liters = totalLiters;
          billData.price_per_liter = pricePerLiter;
        }

        // Use findOneAndUpdate with upsert to ensure only one bill per customer per period
        const existingBill = await Bill.findOne({
          customer_id: customer._id,
          billing_period: billingPeriod
        });

        let oldAmount = 0;
        let billStatus = 'created';

        if (existingBill) {
          oldAmount = existingBill.total_amount;
          billStatus = 'updated';
        }

        // Upsert the bill
        bill = await Bill.findOneAndUpdate(
          {
            customer_id: customer._id,
            billing_period: billingPeriod
          },
          {
            ...billData,
            // Keep existing invoice_number if updating
            invoice_number: existingBill ? existingBill.invoice_number : billData.invoice_number
          },
          {
            upsert: true,
            new: true
          }
        );

        const newAmount = bill.total_amount;
        const amountDifference = newAmount - oldAmount;

        // Update customer balance by the difference (for new bills, oldAmount = 0, so adds full amount)
        await Customer.findByIdAndUpdate(customer._id, {
          $inc: { balance_due: amountDifference }
        });

        billsGenerated.push({
          customer_name: customer.name,
          invoice_number: bill.invoice_number,
          amount: bill.total_amount,
          status: billStatus,
          old_amount: oldAmount,
          difference: amountDifference
        });

        // Update corresponding receivable account balance
        try {
          const receivableAccount = await Account.findOne({
            account_type: 'receivable',
            account_name: `${customer.name} (Customer)`
          });

          if (receivableAccount) {
            receivableAccount.current_balance += amountDifference;
            receivableAccount.last_transaction_date = new Date();
            await receivableAccount.save();

            // Create transaction record for audit trail
            const transaction = new BankTransaction({
              date: new Date(),
              type: amountDifference >= 0 ? 'withdrawal' : 'deposit', // Positive = money going out (receivable increase), Negative = money coming in (receivable decrease)
              amount: Math.abs(amountDifference),
              description: billStatus === 'updated'
                ? `Bill updated for ${billingPeriod} - ${customer.name} (adjustment: ₹${amountDifference})`
                : `Bill generated for ${billingPeriod} - ${customer.name}`,
              bank_name: 'Internal',
              account_number: receivableAccount._id.toString(),
              payment_method: 'internal',
              balance_after: receivableAccount.current_balance,
              recorded_by: req.user.id,
              related_entity_type: 'account',
              related_entity_id: receivableAccount._id
            });

            await transaction.save();
          }
        } catch (accountError) {
          // Don't fail the bill generation if account update fails
        }

        billsGenerated.push({
          customer_name: customer.name,
          invoice_number: bill.invoice_number,
          amount: bill.total_amount
        });

      } catch (error) {
        errors.push({
          customer_name: customer.name,
          error: error.message
        });
      }
    }

    res.json({
      message: `Monthly billing completed for ${billingPeriod}`,
      bills_generated: billsGenerated.length,
      errors: errors.length,
      details: { billsGenerated, errors }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all bills with customer details
router.get('/', auth, async (req, res) => {
  try {
    const bills = await Bill.find()
      .populate('customer_id', 'name phone email')
      .sort({ createdAt: -1 });

    // Update customer_name for existing bills if not set
    for (const bill of bills) {
      if (!bill.customer_name) {
        if (bill.customer_id && bill.customer_id.name) {
          bill.customer_name = bill.customer_id.name;
          await bill.save(); // Persist the change
        } else {
          bill.customer_name = 'Unknown'; // For bills with deleted customers
          await bill.save();
        }
      }
    }

    res.json(bills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get bills for a specific customer
router.get('/customer/:customerId', auth, async (req, res) => {
  try {
    const bills = await Bill.find({ customer_id: req.params.customerId })
      .sort({ billing_period: -1 });

    res.json(bills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get bill by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('customer_id', 'name phone email address');

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Record payment for a bill
router.post('/:id/payment', auth, async (req, res) => {
  try {
    const { payment_date, payment_method, amount, transaction_id, notes } = req.body;

    const bill = await Bill.findById(req.params.id).populate('customer_id');
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Calculate payment amount (use provided amount or full bill amount)
    const paymentAmount = amount || bill.total_amount;

    // Update bill status to paid if full payment
    const updateData = {
      payment_date: payment_date || new Date(),
      payment_method: payment_method || 'cash',
      notes: notes || ''
    };

    if (paymentAmount >= bill.total_amount) {
      updateData.status = 'paid';
    }

    // Add payment record to bill
    updateData.$push = {
      payments: {
        amount: paymentAmount,
        payment_date: payment_date || new Date(),
        payment_method: payment_method || 'cash',
        transaction_id: transaction_id || '',
        notes: notes || '',
        recorded_by: req.user.id,
        recorded_at: new Date()
      }
    };

    const updatedBill = await Bill.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    // Update customer balance
    if (bill.customer_id) {
      await Customer.findByIdAndUpdate(bill.customer_id._id, {
        $inc: { balance_due: -paymentAmount }
      });

      // Update receivable account balance
      try {
        const receivableAccount = await Account.findOne({
          account_type: 'receivable',
          account_name: `${bill.customer_id.name} (Customer)`
        });

        if (receivableAccount) {
          // Payment decreases receivable balance (money received from customer)
          receivableAccount.current_balance -= paymentAmount;
          receivableAccount.last_transaction_date = new Date();
          await receivableAccount.save();

          // Create transaction record for audit trail
          const transaction = new BankTransaction({
            date: new Date(),
            type: 'deposit', // Payment received is like money coming in
            amount: paymentAmount,
            description: `Payment received for bill ${bill.invoice_number} - ${bill.customer_id.name}`,
            bank_name: payment_method === 'cash' ? 'Cash' : 'Bank',
            account_number: receivableAccount._id.toString(),
            payment_method: payment_method || 'cash',
            balance_after: receivableAccount.current_balance,
            recorded_by: req.user.id,
            related_entity_type: 'account',
            related_entity_id: receivableAccount._id
          });

          await transaction.save();
        }
      } catch (accountError) {
      }
    }

    res.json({ message: 'Payment recorded successfully', bill: updatedBill });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update bill status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, notes } = req.body;

    const bill = await Bill.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true }
    );

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update bill status by customer and bill month
router.put('/customer/:customerId/status', auth, async (req, res) => {
  try {
    const { bill_month, status, notes } = req.body;

    const bill = await Bill.findOneAndUpdate(
      { customer_id: req.params.customerId, billing_period: bill_month },
      { status, notes },
      { new: true }
    );

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Download bill as PDF
router.get('/:id/pdf', auth, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('customer_id', 'name phone email address')
      .populate('payments.recorded_by', 'username');

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Fetch attendance data for the billing period
    const [year, month] = bill.billing_period.split('-');
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendanceRecords = await DailyAttendance.find({
      customer_id: bill.customer_id,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Create delivery details table
    const [yearNum, monthNum] = bill.billing_period.split('-');
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    let deliveryTableRows = '';

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${yearNum}-${monthNum.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const attendanceForDay = attendanceRecords.find(att => {
        const attDate = new Date(att.date);
        return attDate.toISOString().split('T')[0] === dateString;
      });

      const status = attendanceForDay?.status === 'present' ? 'Present' :
                    attendanceForDay?.status === 'absent' ? 'Absent' : 'No Record';
      const milkQuantity = attendanceForDay?.milk_quantity || 0;
      const additionalProducts = attendanceForDay?.additional_products || [];
      const additionalText = additionalProducts.length > 0
        ? additionalProducts.map(p => `${p.product_type}: ${p.quantity} × ₹${p.unit_price}`).join(', ')
        : '-';
      const notes = attendanceForDay?.notes || '-';

      deliveryTableRows += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${day}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${status}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${milkQuantity} L</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${additionalText}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${notes}</td>
        </tr>
      `;
    }

    // Calculate summary
    const presentDays = attendanceRecords.filter(a => a.status === 'present').length;
    const recordedTotal = attendanceRecords
      .filter(a => a.status === 'present')
      .reduce((sum, a) => sum + (a.milk_quantity || 0), 0);

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill - ${bill.invoice_number}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .bill-details { margin-bottom: 30px; }
          .bill-details table { width: 100%; border-collapse: collapse; }
          .bill-details td { padding: 8px; border: 1px solid #ddd; }
          .bill-details .label { font-weight: bold; background-color: #f5f5f5; }
          .delivery-details { margin-top: 30px; }
          .delivery-details table { width: 100%; border-collapse: collapse; }
          .delivery-details th, .delivery-details td { padding: 6px; border: 1px solid #ddd; text-align: left; }
          .delivery-details th { background-color: #f5f5f5; font-weight: bold; }
          .payments { margin-top: 30px; }
          .payments table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .payments th, .payments td { padding: 8px; border: 1px solid #ddd; text-align: left; }
          .payments th { background-color: #f5f5f5; font-weight: bold; }
          .summary { margin-top: 20px; background-color: #f9f9f9; padding: 15px; border-radius: 5px; }
          .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Hareram DudhWale</h1>
          <h2>Bill Invoice</h2>
          <p>Invoice Number: ${bill.invoice_number}</p>
          <p>Billing Period: ${bill.billing_period}</p>
        </div>

        <div class="bill-details">
          <h3>Customer Information</h3>
          <table>
            <tr>
              <td class="label">Name:</td>
              <td>${bill.customer_name || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label">Phone:</td>
              <td>${bill.customer_id?.phone || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label">Email:</td>
              <td>${bill.customer_id?.email || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label">Address:</td>
              <td>${bill.customer_id?.address || 'N/A'}</td>
            </tr>
          </table>
        </div>

        <div class="bill-details">
          <h3>Billing Information</h3>
          <table>
            <tr>
              <td class="label">Billing Type:</td>
              <td>${bill.billing_type}</td>
            </tr>
            <tr>
              <td class="label">Status:</td>
              <td>${bill.status}</td>
            </tr>
            <tr>
              <td class="label">Due Date:</td>
              <td>${new Date(bill.due_date).toLocaleDateString('en-IN')}</td>
            </tr>
            ${bill.billing_type === 'per_liter' ? `
            <tr>
              <td class="label">Total Milk Delivered:</td>
              <td>${bill.total_liters} Liters</td>
            </tr>
            <tr>
              <td class="label">Price per Liter:</td>
              <td>₹${bill.price_per_liter}</td>
            </tr>
            ` : ''}
            <tr>
              <td class="label">Total Amount:</td>
              <td>₹${bill.total_amount}</td>
            </tr>
          </table>
        </div>

        <div class="delivery-details">
          <h3>Delivery Details</h3>
          <table>
            <thead>
              <tr>
                <th style="text-align: center;">Day</th>
                <th style="text-align: center;">Date</th>
                <th style="text-align: center;">Status</th>
                <th style="text-align: center;">Milk (L)</th>
                <th style="text-align: center;">Additional Products</th>
                <th style="text-align: center;">Notes</th>
              </tr>
            </thead>
            <tbody>
              ${deliveryTableRows}
            </tbody>
          </table>

          <div class="summary">
            <strong>Delivery Summary:</strong><br/>
            Days Present: ${presentDays} | Total Records: ${daysInMonth} | Recorded Total: ${recordedTotal} L
          </div>
        </div>

        ${bill.payments && bill.payments.length > 0 ? `
        <div class="payments">
          <h3>Payment History</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Transaction ID</th>
                <th>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              ${bill.payments.map(payment => `
                <tr>
                  <td>${new Date(payment.payment_date).toLocaleDateString('en-IN')}</td>
                  <td>₹${payment.amount}</td>
                  <td>${payment.payment_method}</td>
                  <td>${payment.transaction_id || 'N/A'}</td>
                  <td>${payment.recorded_by?.username || 'System'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            Total Paid: ₹${bill.payments.reduce((sum, p) => sum + p.amount, 0)}
          </div>
        </div>
        ` : ''}

        <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #666;">
          <p>Thank you for your business!</p>
          <p>Generated on: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}</p>
        </div>
      </body>
      </html>
    `;

    // Set headers for PDF download
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${bill.invoice_number}.html"`);

    // For now, return HTML. In production, convert to PDF using puppeteer or similar
    res.send(htmlContent);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single bill
router.get('/:id', auth, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('customer_id', 'name phone email address balance_due')
      .populate('payments.recorded_by', 'username');

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete bill
router.delete('/:id', auth, async (req, res) => {
  try {
    const bill = await Bill.findByIdAndDelete(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json({ message: 'Bill deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Helper function to generate invoice number
function generateInvoiceNumber(billingPeriod, customerId) {
  const timestamp = Date.now();
  const shortId = customerId.toString().slice(-4);
  return `INV-${billingPeriod}-${shortId}-${timestamp.toString().slice(-4)}`;
}

module.exports = router;