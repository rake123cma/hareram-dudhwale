const mongoose = require('mongoose');

const cowSchema = new mongoose.Schema({
  // Basic info
  name: { type: String, required: true },
  type: { type: String, enum: ['cow', 'buffalo'], default: 'cow' },
  date_of_birth: { type: Date },
  age: { type: Number }, // calculated from date_of_birth

  // Entry information
  date_of_entry: { type: Date, default: Date.now }, // when cow came to farm
  source: { type: String }, // where cow came from

  // Auto-generated ID
  listing_id: { type: String, unique: true }, // LIV-001, LIV-002

  // Status
  status: {
    type: String,
    enum: ['active', 'pregnant', 'dry', 'sick', 'deceased'],
    default: 'active'
  },

  // Breeding information
  last_insemination_date: { type: Date }, // crossing date
  expected_calving_date: { type: Date }, // auto-calculated
  pregnancy_status: { type: Boolean, default: false },
  pregnancy_confirmed_date: { type: Date }, // when pregnancy confirmed

  // Insemination/Semen records
  insemination_records: [{
    insemination_date: { type: Date },
    semen_type: { type: String }, // sexed, conventional, imported, local
    semen_batch: { type: String }, // batch number
    technician_name: { type: String }, // technician who performed insemination
    cost: { type: Number }, // cost of semen
    notes: { type: String }
  }],

  // Calving/Birth records
  calving_records: [{
    calving_date: { type: Date },
    calf_gender: { type: String, enum: ['male', 'female'] },
    calf_name: { type: String },
    calf_status: { type: String, enum: ['alive', 'dead', 'sold'] },
    calf_weight: { type: Number }, // weight in kg
    notes: { type: String }
  }],
  total_calvings: { type: Number, default: 0 }, // how many times gave birth

  // Milk production
  is_milking: { type: Boolean, default: false },
  lactation_start_date: { type: Date },
  lactation_end_date: { type: Date },
  total_milk_produced: { type: Number, default: 0 }, // lifetime milk production
  current_daily_milk: { type: Number, default: 0 }, // current daily production

  // Dry period
  dry_start_date: { type: Date }, // when stopped producing milk

  // Health records
  health_summary: { type: String },
  last_deworming_date: { type: Date },
  vaccination_records: [{ date: Date, vaccine: String }],
  health_notes: { type: String },

  // Deworming records
  deworming_records: [{
    date: { type: Date },
    medicine_name: { type: String },
    dosage: { type: String },
    cost: { type: Number },
    next_due_date: { type: Date },
    notes: { type: String }
  }],

  sickness_records: [{
    date: Date,
    condition: String,
    treatment: String,
    cost: Number,
    notes: String
  }]
}, { timestamps: true });

// Auto-generate listing_id
cowSchema.pre('save', function(next) {
  try {
    if (!this.listing_id && this.isNew) {
      // Find the highest number and increment
      this.constructor.findOne({}, {}, { sort: { 'listing_id': -1 } }, (err, lastLivestock) => {
        if (err) {
          console.error('Error finding last livestock:', err);
          return next(err);
        }
        let nextNumber = 1;
        if (lastLivestock && lastLivestock.listing_id) {
          const match = lastLivestock.listing_id.match(/LIV-(\d+)/);
          if (match) {
            nextNumber = parseInt(match[1]) + 1;
          }
        }
        this.listing_id = `LIV-${String(nextNumber).padStart(3, '0')}`;
        next();
      });
    } else {
      next();
    }
  } catch (error) {
    console.error('Error in listing_id pre-save hook:', error);
    next(error);
  }
});

// Calculate age before saving
cowSchema.pre('save', function(next) {
  try {
    if (this.date_of_birth) {
      // Ensure we have a proper Date object
      let birthDate;
      if (this.date_of_birth instanceof Date) {
        birthDate = new Date(this.date_of_birth);
      } else {
        // Parse string date manually to avoid timezone issues
        const dateStr = this.date_of_birth.toString();
        const dateParts = dateStr.split('T')[0].split('-'); // Handle ISO string
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; // JavaScript months are 0-based
        const day = parseInt(dateParts[2]);
        birthDate = new Date(year, month, day);
      }

      const today = new Date();
      this.age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        this.age--;
      }

      // Ensure age is not negative
      if (this.age < 0) this.age = 0;
    }
    next();
  } catch (error) {
    console.error('Error in age calculation pre-save hook:', error);
    next(error);
  }
});

// Auto-calculate expected calving date based on type and insemination date
cowSchema.pre('save', function(next) {
  try {
    if (this.last_insemination_date) {
      // Ensure we have a proper Date object
      let inseminationDate;
      if (this.last_insemination_date instanceof Date) {
        inseminationDate = new Date(this.last_insemination_date);
      } else {
        // Parse string date manually to avoid timezone issues
        const dateStr = this.last_insemination_date.toString();
        const dateParts = dateStr.split('T')[0].split('-'); // Handle ISO string
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; // JavaScript months are 0-based
        const day = parseInt(dateParts[2]);
        inseminationDate = new Date(year, month, day);
      }

      const gestationMonths = this.type === 'buffalo' ? 10 : 9; // Buffalo: 10 months, Cow: 9 months
      inseminationDate.setMonth(inseminationDate.getMonth() + gestationMonths);
      this.expected_calving_date = inseminationDate;

      console.log(`Calculated expected delivery for ${this.name}: Crossing ${this.last_insemination_date} -> Delivery ${this.expected_calving_date}`);
    }

    // Calculate total calvings from calving records
    if (this.calving_records && Array.isArray(this.calving_records)) {
      this.total_calvings = this.calving_records.length;
    }

    // Update last deworming date from deworming records
    if (this.deworming_records && Array.isArray(this.deworming_records) && this.deworming_records.length > 0) {
      const latestDeworming = this.deworming_records[this.deworming_records.length - 1];
      this.last_deworming_date = latestDeworming.date;
    }

    next();
  } catch (error) {
    console.error('Error in calving date pre-save hook:', error);
    next(error);
  }
});

module.exports = mongoose.model('Cow', cowSchema);