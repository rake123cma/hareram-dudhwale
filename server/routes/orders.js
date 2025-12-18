const express = require('express');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const { auth, authorizeAdmin, authorizeCustomer } = require('../middleware/auth');

const router = express.Router();

// Get all orders (admin only)
router.get('/', auth, authorizeAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, customer_id, start_date, end_date } = req.query;

    let query = {};

    if (status) query.order_status = status;
    if (customer_id) query.customer_id = customer_id;

    if (start_date || end_date) {
      query.createdAt = {};
      if (start_date) query.createdAt.$gte = new Date(start_date);
      if (end_date) query.createdAt.$lte = new Date(end_date);
    }

    const orders = await Order.find(query)
      .populate('customer_id', 'name phone email')
      .populate('items.product_id', 'name category')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get customer's own orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    let query = { customer_id: req.user.customer_id };

    if (status) query.order_status = status;

    const orders = await Order.find(query)
      .populate('items.product_id', 'name category')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer_id', 'name phone email address')
      .populate('items.product_id', 'name category description')
      .populate('created_by', 'name');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user can access this order
    if (req.user.role !== 'admin' && order.customer_id._id.toString() !== req.user.customer_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new order (customers can create, admin can create for any customer)
router.post('/', auth, async (req, res) => {
  try {
    const {
      customer_id,
      items,
      delivery_address,
      payment_method = 'cod',
      special_instructions
    } = req.body;

    // Validate customer
    let customer;
    if (req.user.role === 'admin' && customer_id) {
      customer = await Customer.findById(customer_id);
    } else {
      customer = await Customer.findById(req.user.customer_id);
    }

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Validate and process items
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product) {
        return res.status(400).json({ message: `Product ${item.product_id} not found` });
      }

      const quantity = parseInt(item.quantity);
      const unitPrice = parseFloat(product.default_price || item.unit_price);

      if (quantity <= 0 || unitPrice < 0) {
        return res.status(400).json({ message: 'Invalid quantity or price' });
      }

      const totalPrice = quantity * unitPrice;
      subtotal += totalPrice;

      processedItems.push({
        product_id: product._id,
        product_name: product.name,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice
      });
    }

    // Calculate totals
    const taxAmount = subtotal * 0.05; // 5% tax
    const deliveryCharges = subtotal > 500 ? 0 : 50; // Free delivery above ₹500
    const discountAmount = 0; // Can be implemented later
    const totalAmount = subtotal + taxAmount + deliveryCharges - discountAmount;

    // Generate order number
    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD${String(orderCount + 1).padStart(6, '0')}`;

    // Create order
    const order = new Order({
      order_number: orderNumber,
      customer_id: customer._id,
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_address: delivery_address || customer.address,
      items: processedItems,
      subtotal,
      tax_amount: taxAmount,
      delivery_charges: deliveryCharges,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      payment_method,
      delivery_address: delivery_address || customer.address,
      special_instructions,
      created_by: req.user.id
    });

    const newOrder = await order.save();
    await newOrder.populate('customer_id', 'name phone email');
    await newOrder.populate('items.product_id', 'name category');

    res.status(201).json(newOrder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update order status (admin only)
router.put('/:id/status', auth, authorizeAdmin, async (req, res) => {
  try {
    const { order_status, delivery_date } = req.body;

    const updateData = {};
    if (order_status) updateData.order_status = order_status;
    if (delivery_date) updateData.delivery_date = new Date(delivery_date);

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('customer_id', 'name phone email')
     .populate('items.product_id', 'name category');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update payment status (admin only)
router.put('/:id/payment', auth, authorizeAdmin, async (req, res) => {
  try {
    const { payment_status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { payment_status },
      { new: true }
    ).populate('customer_id', 'name phone email')
     .populate('items.product_id', 'name category');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Cancel order (customer can cancel their own orders, admin can cancel any)
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && order.customer_id.toString() !== req.user.customer_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow cancellation if order is not already delivered or out for delivery
    if (['delivered', 'out_for_delivery'].includes(order.order_status)) {
      return res.status(400).json({ message: 'Cannot cancel order that is already delivered or out for delivery' });
    }

    order.order_status = 'cancelled';
    await order.save();

    await order.populate('customer_id', 'name phone email');
    await order.populate('items.product_id', 'name category');

    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete order (admin only)
router.delete('/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;