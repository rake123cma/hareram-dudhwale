const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  category: {
    type: String,
    required: true,
    enum: ['feed', 'medicine', 'vet', 'electricity', 'labour', 'insurance', 'transport', 'maintenance', 'misc']
  },
  amount: { type: Number, required: true },
  description: { type: String },

  // Link to specific cow if applicable
  cow_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cow' },

  // For sickness/medicine expenses
  sickness_record_id: { type: mongoose.Schema.Types.ObjectId }, // reference to cow's sickness record

  // Recorded by
  recorded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Invoice/document reference
  invoice_number: { type: String },
  vendor_name: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);