const mongoose = require('mongoose');
const Customer = require('./models/Customer');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hareram_dudhwale');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Update existing customers to have default last_milk_quantity
const updateLastMilkQuantity = async () => {
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
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Error updating last_milk_quantity:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await updateLastMilkQuantity();
  
  // Close connection
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
};

// Run the migration
main().catch(console.error);