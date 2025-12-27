// Quick fix script to set last_milk_quantity for all customers
// Run this directly in MongoDB or with node if server is running

const mongoose = require('mongoose');

// If running with existing server connection
if (mongoose.connection.readyState === 1) {
  const Customer = require('./models/Customer');
  
  async function fixMilkQuantity() {
    try {
      console.log('Starting quick fix for last_milk_quantity...');
      
      // Set default last_milk_quantity for all customers
      const result = await Customer.updateMany(
        {},
        {
          $set: { 
            last_milk_quantity: 1,
            $setOnInsert: { createdAt: new Date() }
          }
        }
      );
      
      console.log(`Updated ${result.modifiedCount} customers`);
      
      // Set 2 liters for both delivery customers
      const bothResult = await Customer.updateMany(
        { delivery_time: 'both' },
        { $set: { last_milk_quantity: 2 } }
      );
      
      console.log(`Updated ${bothResult.modifiedCount} customers with both delivery time to 2 liters`);
      
      console.log('Quick fix completed!');
      
      // Show current status
      const customers = await Customer.find().select('name delivery_time last_milk_quantity');
      console.log('\nCurrent customers data:');
      customers.forEach(c => {
        console.log(`${c.name}: ${c.delivery_time} = ${c.last_milk_quantity}L`);
      });
      
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  fixMilkQuantity().then(() => {
    console.log('Script completed');
    process.exit(0);
  });
} else {
  console.log('Please run this script when server is running with MongoDB connection');
  console.log('Or run this in MongoDB shell:');
  console.log(`
  use hareram_dudhwale
  db.customers.updateMany({}, {$set: {last_milk_quantity: 1}})
  db.customers.updateMany({delivery_time: "both"}, {$set: {last_milk_quantity: 2}})
  `);
}