const mongoose = require('mongoose');

const dogSchema = new mongoose.Schema(
  {
    registered_by: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
      index: true 
    },
    name: { type: String, required: true },
    description: { type: String, default: '' },

    status: { 
      type: String, 
      enum: ['available', 'adopted', 'removed'], 
      default: 'available', 
      index: true 
    },

    adopted_by: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      default: null, 
      index: true 
    },
    adoption_message: { type: String, default: null },
    adoption_date: { type: Date, default: null },

    removed_at: { type: Date, default: null },
  },
  { timestamps: true }
);

dogSchema.index({ registered_by: 1, status: 1, _id: 1 });
dogSchema.index({ adopted_by: 1, _id: 1 });

module.exports = mongoose.model('Dog', dogSchema);
