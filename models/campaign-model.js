const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    goal: Number,
    raised: {
        type: Number,
        default: 0,
        validate: {
            validator: function(v) {
                // Ensure raised never exceeds goal when saving via Mongoose
                // Use function() so `this` is the document
                return v <= (this.goal || 0);
            },
            message: 'Raised cannot exceed goal'
        }
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    deadline: Date,
    category: {
        type: String,
        default: 'General',
        enum: ['Education', 'Healthcare', 'Environment', 'Technology', 'Arts', 'Social Cause', 'General']
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});


const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;