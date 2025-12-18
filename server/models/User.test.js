const mongoose = require('mongoose');
const User = require('./User');

describe('User Model', () => {
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
    // Clear the User collection before each test
    await User.deleteMany({});
  });

  it('should create a valid user', async () => {
    const userData = {
      username: 'testuser',
      password: 'hashedpassword',
      role: 'admin'
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.username).toBe(userData.username);
    expect(savedUser.password).toBe(userData.password);
    expect(savedUser.role).toBe(userData.role);
    expect(savedUser.createdAt).toBeDefined();
    expect(savedUser.updatedAt).toBeDefined();
  });

  it('should require username', async () => {
    const userData = {
      password: 'hashedpassword',
      role: 'admin'
    };

    const user = new User(userData);

    await expect(user.save()).rejects.toThrow(/username.*required/i);
  });

  it('should require password', async () => {
    const userData = {
      username: 'testuser',
      role: 'admin'
    };

    const user = new User(userData);

    await expect(user.save()).rejects.toThrow(/password.*required/i);
  });

  it('should require role', async () => {
    const userData = {
      username: 'testuser',
      password: 'hashedpassword'
    };

    const user = new User(userData);

    await expect(user.save()).rejects.toThrow(/role.*required/i);
  });

  it('should validate role enum values', async () => {
    const userData = {
      username: 'testuser',
      password: 'hashedpassword',
      role: 'invalidrole'
    };

    const user = new User(userData);

    await expect(user.save()).rejects.toThrow();
  });

  it('should accept valid role enum values', async () => {
    const validRoles = ['admin', 'customer', 'investor'];

    for (const role of validRoles) {
      const userData = {
        username: `testuser${role}`,
        password: 'hashedpassword',
        role: role
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.role).toBe(role);
    }
  });

  it('should enforce unique username', async () => {
    const userData1 = {
      username: 'duplicateuser',
      password: 'hashedpassword1',
      role: 'admin'
    };

    const userData2 = {
      username: 'duplicateuser',
      password: 'hashedpassword2',
      role: 'customer'
    };

    await new User(userData1).save();

    await expect(new User(userData2).save()).rejects.toThrow(/duplicate key/i);
  });

  it('should allow optional customer_id reference', async () => {
    const userData = {
      username: 'testuser',
      password: 'hashedpassword',
      role: 'customer',
      customer_id: new mongoose.Types.ObjectId()
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser.customer_id).toBeDefined();
  });

  it('should allow optional investor_id reference', async () => {
    const userData = {
      username: 'testuser',
      password: 'hashedpassword',
      role: 'investor',
      investor_id: new mongoose.Types.ObjectId()
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser.investor_id).toBeDefined();
  });

  it('should set timestamps automatically', async () => {
    const userData = {
      username: 'testuser',
      password: 'hashedpassword',
      role: 'admin'
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser.createdAt).toBeInstanceOf(Date);
    expect(savedUser.updatedAt).toBeInstanceOf(Date);
  });
});