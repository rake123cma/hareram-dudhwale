const express = require('express');
const bcrypt = require('bcryptjs');
const Customer = require('../models/Customer');
const DailyAttendance = require('../models/DailyAttendance');
const Account = require('../models/Account');
const User = require('../models/User');
const { auth, authorizeAdmin, authorizeCustomer } = require('../middleware/auth');

const router = express.Router();

// Customer self-service endpoints
router.get('/my-profile', auth, authorizeCustomer, async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.customer_id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Get user data to include profile picture for OAuth users
    const user = await User.findOne({ customer_id: req.user.customer_id });
    
    // Combine customer and user data
    const profileData = {
      ...customer.toObject(),
      profilePicture: user?.profilePicture || null,
      provider: user?.provider || null,
      hasPassword: !!user?.password // Check if user has a password set
    };
    
    res.json(profileData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/my-balance', auth, async (req, res) => {
  try {
    // Allow admin to get balance for any customer, customers can only get their own
    let customerId;
    if (req.user.role === 'admin' && req.query.customerId) {
      customerId = req.query.customerId;
    } else {
      customerId = req.user.customer_id;
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({ balance: customer.balance_due || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/my-sales', auth, async (req, res) => {
  try {
    // Allow admin to get sales for any customer, customers can only get their own
    let customerId;
    if (req.user.role === 'admin' && req.query.customerId) {
      customerId = req.query.customerId;
    } else {
      customerId = req.user.customer_id;
    }

    const sales = await DailyAttendance.find({ customer_id: customerId })
      .sort({ date: -1 })
      .limit(50); // Last 50 records

    // Format the data for frontend
    const formattedSales = sales.map(sale => ({
      _id: sale._id,
      date: sale.date,
      product_name: 'Milk', // Assuming milk for now
      quantity: sale.milk_quantity,
      unit: 'liters',
      total_amount: sale.milk_quantity * 60, // Default price
      status: sale.status,
      additional_products: sale.additional_products || []
    }));

    res.json(formattedSales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Customer self-service profile update
router.put('/my-profile', auth, authorizeCustomer, async (req, res) => {
  try {
    // Allow customers to update only certain fields (excluding email and phone for security)
    const allowedFields = ['name', 'phone', 'address', 'pincode', 'billing_type', 'subscription_amount', 'price_per_liter'];
    const updateData = {};

    // Filter only allowed fields
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    console.log('Profile update request:', updateData);
    
    const customer = await Customer.findByIdAndUpdate(req.user.customer_id, updateData, { new: true });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    console.log('Profile updated successfully:', customer);
    res.json(customer);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(400).json({ message: err.message });
  }
});

// Set password for Google OAuth users (without requiring current password)
router.put('/set-password', auth, authorizeCustomer, async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    // Validation
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Password and confirmation do not match' });
    }

    // Password validation function (similar to auth.js)
    const validatePassword = (password) => {
      const minLength = 8;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

      if (password.length < minLength) {
        return 'Password must be at least 8 characters long';
      }
      if (!hasUpperCase) {
        return 'Password must contain at least one uppercase letter';
      }
      if (!hasLowerCase) {
        return 'Password must contain at least one lowercase letter';
      }
      if (!hasNumbers) {
        return 'Password must contain at least one number';
      }
      if (!hasSpecialChar) {
        return 'Password must contain at least one special character';
      }
      return null;
    };

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    // Find user
    const user = await User.findOne({ customer_id: req.user.customer_id });
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    // Check if user already has a password (for OAuth users who already set one)
    if (user.password && user.password !== '') {
      return res.status(400).json({ message: 'Password already exists. Use change password instead.' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password and set username to email for email login
    user.password = hashedNewPassword;
    if (user.provider === 'google') {
      // For Google OAuth users, set username to email for email login capability
      const customer = await Customer.findById(req.user.customer_id);
      if (customer && customer.email) {
        user.username = customer.email;
      }
    }
    await user.save();

    res.json({ message: 'Password set successfully! You can now login with email and password.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Customer password change
router.put('/change-password', auth, authorizeCustomer, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirmation do not match' });
    }

    // Password validation function (similar to auth.js)
    const validatePassword = (password) => {
      const minLength = 8;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

      if (password.length < minLength) {
        return 'Password must be at least 8 characters long';
      }
      if (!hasUpperCase) {
        return 'Password must contain at least one uppercase letter';
      }
      if (!hasLowerCase) {
        return 'Password must contain at least one lowercase letter';
      }
      if (!hasNumbers) {
        return 'Password must contain at least one number';
      }
      if (!hasSpecialChar) {
        return 'Password must contain at least one special character';
      }
      return null;
    };

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    // Find user
    const user = await User.findOne({ customer_id: req.user.customer_id });
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedNewPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get customers - temporarily public for development/testing
router.get('/', async (req, res) => {
  try {
    const { phone } = req.query;

    if (phone) {
      // Public access for phone search (used in registration/login)
      const customer = await Customer.findOne({ phone });
      if (customer) {
        // Return limited info for security
        res.json([{
          _id: customer._id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email
        }]);
      } else {
        res.json([]);
      }
    } else {
      // For development: allow access without strict authentication
      // In production, this should require admin authentication
      const customers = await Customer.find().limit(50); // Limit for performance
      res.json(customers);
      
      // Debug: Log first customer to check if last_milk_quantity exists
      if (customers.length > 0) {
        console.log('First customer data:', {
          _id: customers[0]._id,
          name: customers[0].name,
          last_milk_quantity: customers[0].last_milk_quantity,
          delivery_time: customers[0].delivery_time
        });
      }
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create customer (admin only)
router.post('/', auth, authorizeAdmin, async (req, res) => {
  const customer = new Customer(req.body);
  try {
    const newCustomer = await customer.save();

    // Automatically create a receivable account for this customer
    try {
      const receivableAccount = new Account({
        account_name: `${newCustomer.name} (Customer)`,
        account_type: 'receivable',
        description: `Receivable account for customer ${newCustomer.name}`,
        opening_balance: newCustomer.balance_due || 0,
        current_balance: newCustomer.balance_due || 0,
        contact_number: newCustomer.phone,
        email: newCustomer.email,
        created_by: req.user.id
      });

      await receivableAccount.save();
    } catch (accountError) {
      // Don't fail the customer creation if account creation fails
    }

    // Create user account with default password for milk customers added by admin
    if (newCustomer.customer_type === 'daily milk customer') {
      try {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = new User({
          username: newCustomer.phone,
          password: hashedPassword,
          role: 'customer',
          customer_id: newCustomer._id
        });
        await user.save();
      } catch (userError) {
        console.error('Failed to create user account:', userError);
        // Don't fail the customer creation if user account creation fails
      }
    }

    res.status(201).json(newCustomer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update customer (admin only)
router.put('/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete customer (admin only)
router.delete('/:id', auth, authorizeAdmin, async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Sync existing customers to create receivable accounts (admin only)
router.post('/sync-receivable-accounts', auth, authorizeAdmin, async (req, res) => {
  try {
    // Find all customers
    const customers = await Customer.find();

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const customer of customers) {
      try {
        // Check if receivable account already exists
        const existingAccount = await Account.findOne({
          account_type: 'receivable',
          account_name: `${customer.name} (Customer)`
        });

        if (!existingAccount) {
          // Create receivable account
          const receivableAccount = new Account({
            account_name: `${customer.name} (Customer)`,
            account_type: 'receivable',
            description: `Receivable account for customer ${customer.name}`,
            opening_balance: customer.balance_due || 0,
            current_balance: customer.balance_due || 0,
            contact_number: customer.phone,
            email: customer.email,
            created_by: req.user.id
          });

          await receivableAccount.save();
          created++;
        } else {
          skipped++;
        }
      } catch (accountError) {
        errors++;
      }
    }

    res.json({
      message: 'Sync completed',
      created,
      skipped,
      errors,
      total: customers.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update last_milk_quantity for existing customers (admin only)
router.post('/update-last-milk-quantity', auth, authorizeAdmin, async (req, res) => {
  try {
    console.log('Starting update of last_milk_quantity for existing customers...');
    
    // Find customers who don't have last_milk_quantity set or have it as null/undefined
    const result = await Customer.updateMany(
      { 
        $or: [
          { last_milk_quantity: { $exists: false } },
          { last_milk_quantity: null },
          { last_milk_quantity: { $lt: 0 } }
        ]
      },
      { 
        $set: { 
          last_milk_quantity: 1  // Default to 1 liter
        }
      }
    );
    
    console.log(`Updated ${result.modifiedCount} customers with default last_milk_quantity`);
    
    // Also set reasonable defaults based on delivery time for customers with delivery_time === 'both'
    const bothDeliveryResult = await Customer.updateMany(
      { 
        delivery_time: 'both',
        $or: [
          { last_milk_quantity: { $exists: false } },
          { last_milk_quantity: null },
          { last_milk_quantity: { $lt: 2 } }
        ]
      },
      { 
        $set: { 
          last_milk_quantity: 2  // Default to 2 liters for both delivery times
        }
      }
    );
    
    console.log(`Updated ${bothDeliveryResult.modifiedCount} customers with both delivery time to 2 liters`);
    
    // Get updated count
    const totalCustomers = await Customer.countDocuments();
    const customersWithLastMilkQuantity = await Customer.countDocuments({ last_milk_quantity: { $exists: true, $ne: null } });
    
    res.json({
      message: 'Migration completed successfully!',
      defaultUpdated: result.modifiedCount,
      bothDeliveryUpdated: bothDeliveryResult.modifiedCount,
      totalCustomers,
      customersWithLastMilkQuantity,
      databaseName: 'hareram_dudhwale'
    });
    
  } catch (error) {
    console.error('Error updating last_milk_quantity:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
