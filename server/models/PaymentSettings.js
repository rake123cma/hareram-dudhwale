const mongoose = require('mongoose');

const paymentSettingsSchema = new mongoose.Schema({
  account_number: { type: String, required: true },
  account_holder_name: { type: String, required: true },
  bank_name: { type: String, required: true },
  ifsc_code: { type: String, required: true },
  upi_id: { type: String },
  qr_code_image: { type: String }, // Base64 encoded image or file path
  is_active: { type: Boolean, default: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Ensure only one active payment settings document exists
paymentSettingsSchema.pre('save', async function(next) {
  if (this.is_active) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, is_active: true },
      { is_active: false }
    );
  }
  next();
});

module.exports = mongoose.model('PaymentSettings', paymentSettingsSchema);