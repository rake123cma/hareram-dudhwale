const mongoose = require('mongoose');
const Customer = require('./Customer');

describe('Customer Model', () => {
  beforeAll(async () => {
    // Connect to a test database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test-db', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    // Close the connection
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear the Customer collection before each test
    await Customer.deleteMany({});
  });

  it('should create a valid customer', async () => {
    const customerData = {
      name: 'John Doe',
      phone: '1234567890',
      email: 'john@example.com',
      address: '123 Main St',
      pincode: '834001',
      category: 'premium'
    };

    const customer = new Customer(customerData);
    const savedCustomer = await customer.save();

    expect(savedCustomer._id).toBeDefined();
    expect(savedCustomer.name).toBe(customerData.name);
    expect(savedCustomer.phone).toBe(customerData.phone);
    expect(savedCustomer.email).toBe(customerData.email);
    expect(savedCustomer.address).toBe(customerData.address);
    expect(savedCustomer.pincode).toBe(customerData.pincode);
    expect(savedCustomer.category).toBe(customerData.category);
    expect(savedCustomer.is_active).toBe(true); // default value
    expect(savedCustomer.customer_type).toBe('daily milk customer'); // default value
    expect(savedCustomer.registration_source).toBe('admin'); // default value
    expect(savedCustomer.createdAt).toBeDefined();
    expect(savedCustomer.updatedAt).toBeDefined();
  });

  it('should require name', async () => {
    const customerData = {
      phone: '1234567890',
      category: 'premium'
    };

    const customer = new Customer(customerData);

    await expect(customer.save()).rejects.toThrow(/name.*required/i);
  });

  it('should require phone', async () => {
    const customerData = {
      name: 'John Doe',
      category: 'premium'
    };

    const customer = new Customer(customerData);

    await expect(customer.save()).rejects.toThrow(/phone.*required/i);
  });

  it('should require category', async () => {
    const customerData = {
      name: 'John Doe',
      phone: '1234567890'
    };

    const customer = new Customer(customerData);

    await expect(customer.save()).rejects.toThrow(/category.*required/i);
  });

  it('should validate billing_type enum values', async () => {
    const customerData = {
      name: 'John Doe',
      phone: '1234567890',
      category: 'premium',
      billing_type: 'invalid_type'
    };

    const customer = new Customer(customerData);

    await expect(customer.save()).rejects.toThrow();
  });

  it('should accept valid billing_type enum values', async () => {
    const validTypes = ['subscription', 'per_liter'];

    for (const type of validTypes) {
      const customerData = {
        name: `Test Customer ${type}`,
        phone: `123456789${validTypes.indexOf(type)}`,
        category: 'premium',
        billing_type: type
      };

      const customer = new Customer(customerData);
      const savedCustomer = await customer.save();

      expect(savedCustomer.billing_type).toBe(type);
    }
  });

  it('should validate billing_frequency enum values', async () => {
    const customerData = {
      name: 'John Doe',
      phone: '1234567890',
      category: 'premium',
      billing_frequency: 'invalid_freq'
    };

    const customer = new Customer(customerData);

    await expect(customer.save()).rejects.toThrow();
  });

  it('should accept valid billing_frequency enum values', async () => {
    const validFrequencies = ['daily', 'weekly', 'monthly'];

    for (const freq of validFrequencies) {
      const customerData = {
        name: `Test Customer ${freq}`,
        phone: `123456789${validFrequencies.indexOf(freq)}`,
        category: 'premium',
        billing_frequency: freq
      };

      const customer = new Customer(customerData);
      const savedCustomer = await customer.save();

      expect(savedCustomer.billing_frequency).toBe(freq);
    }
  });

  it('should validate delivery_time enum values', async () => {
    const customerData = {
      name: 'John Doe',
      phone: '1234567890',
      category: 'premium',
      delivery_time: 'invalid_time'
    };

    const customer = new Customer(customerData);

    await expect(customer.save()).rejects.toThrow();
  });

  it('should accept valid delivery_time enum values', async () => {
    const validTimes = ['morning', 'evening', 'both'];

    for (const time of validTimes) {
      const customerData = {
        name: `Test Customer ${time}`,
        phone: `123456789${validTimes.indexOf(time)}`,
        category: 'premium',
        delivery_time: time
      };

      const customer = new Customer(customerData);
      const savedCustomer = await customer.save();

      expect(savedCustomer.delivery_time).toBe(time);
    }
  });

  it('should validate customer_type enum values', async () => {
    const customerData = {
      name: 'John Doe',
      phone: '1234567890',
      category: 'premium',
      customer_type: 'invalid_type'
    };

    const customer = new Customer(customerData);

    await expect(customer.save()).rejects.toThrow();
  });

  it('should accept valid customer_type enum values', async () => {
    const validTypes = ['guest customer', 'daily milk customer'];

    for (const type of validTypes) {
      const customerData = {
        name: `Test Customer ${type}`,
        phone: `123456789${validTypes.indexOf(type)}`,
        category: 'premium',
        customer_type: type
      };

      const customer = new Customer(customerData);
      const savedCustomer = await customer.save();

      expect(savedCustomer.customer_type).toBe(type);
    }
  });

  it('should validate registration_source enum values', async () => {
    const customerData = {
      name: 'John Doe',
      phone: '1234567890',
      category: 'premium',
      registration_source: 'invalid_source'
    };

    const customer = new Customer(customerData);

    await expect(customer.save()).rejects.toThrow();
  });

  it('should accept valid registration_source enum values', async () => {
    const validSources = ['admin', 'homepage'];

    for (const source of validSources) {
      const customerData = {
        name: `Test Customer ${source}`,
        phone: `123456789${validSources.indexOf(source)}`,
        category: 'premium',
        registration_source: source
      };

      const customer = new Customer(customerData);
      const savedCustomer = await customer.save();

      expect(savedCustomer.registration_source).toBe(source);
    }
  });

  it('should set default values correctly', async () => {
    const customerData = {
      name: 'John Doe',
      phone: '1234567890',
      category: 'premium'
    };

    const customer = new Customer(customerData);
    const savedCustomer = await customer.save();

    expect(savedCustomer.billing_frequency).toBe('monthly');
    expect(savedCustomer.delivery_time).toBe('morning');
    expect(savedCustomer.balance_due).toBe(0);
    expect(savedCustomer.customer_type).toBe('daily milk customer');
    expect(savedCustomer.registration_source).toBe('admin');
    expect(savedCustomer.is_active).toBe(true);
  });

  it('should allow optional fields', async () => {
    const customerData = {
      name: 'John Doe',
      phone: '1234567890',
      category: 'premium',
      email: 'john@example.com',
      address: '123 Main St',
      pincode: '834001',
      subscription_amount: 500,
      price_per_liter: 50,
      balance_due: 100
    };

    const customer = new Customer(customerData);
    const savedCustomer = await customer.save();

    expect(savedCustomer.email).toBe(customerData.email);
    expect(savedCustomer.address).toBe(customerData.address);
    expect(savedCustomer.pincode).toBe(customerData.pincode);
    expect(savedCustomer.subscription_amount).toBe(customerData.subscription_amount);
    expect(savedCustomer.price_per_liter).toBe(customerData.price_per_liter);
    expect(savedCustomer.balance_due).toBe(customerData.balance_due);
  });

  it('should set timestamps automatically', async () => {
    const customerData = {
      name: 'John Doe',
      phone: '1234567890',
      category: 'premium'
    };

    const customer = new Customer(customerData);
    const savedCustomer = await customer.save();

    expect(savedCustomer.createdAt).toBeInstanceOf(Date);
    expect(savedCustomer.updatedAt).toBeInstanceOf(Date);
  });
});