const mongoose = require('mongoose');
const DailyAttendance = require('./models/DailyAttendance');

async function updateNovemberMilk() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hareram_dudhwale');
    
    const customerId = '69324dd6856ddcf5aa7ffddf';
    
    // First check all records for this customer
    const allRecords = await DailyAttendance.find({ customer_id: customerId });

    // Check November records
    const novemberStart = new Date(2025, 10, 1); // November 1
    const novemberEnd = new Date(2025, 11, 1);   // December 1

    const novemberRecords = await DailyAttendance.find({
      customer_id: customerId,
      date: { $gte: novemberStart, $lt: novemberEnd }
    });

    const presentRecords = novemberRecords.filter(r => r.status === 'present');

    if (presentRecords.length === 0) {
      return;
    }
    
    let totalMilk = 0;
    let updatedCount = 0;
    
    for (let i = 0; i < presentRecords.length; i++) {
      const milkQuantity = i < 28 ? 2 : 0; // 28 days × 2L = 56L
      totalMilk += milkQuantity;

      const result = await DailyAttendance.updateOne(
        { _id: presentRecords[i]._id },
        { milk_quantity: milkQuantity }
      );

      if (result.modifiedCount > 0) {
        updatedCount++;
      }
    }
    
    // Verify
    const verifyRecord = await DailyAttendance.findOne({
      customer_id: customerId,
      date: { $gte: novemberStart, $lt: novemberEnd },
      status: 'present'
    });
    
  } catch (error) {
  } finally {
    await mongoose.disconnect();
  }
}

updateNovemberMilk();
