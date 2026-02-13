const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
    donationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Donation',
        required: true
    },
    donor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    campaign: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign',
        required: true
    },
    campaignTitle: String,
    amount: {
        type: Number,
        required: true
    },
    transactionId: {
        type: String,
        unique: true,
        default: () => 'RCP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase()
    },
    paymentId: {
        type: String,
        default: null
    },
    donationDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['success', 'pending', 'failed'],
        default: 'success'
    }
}, {
    timestamps: true
});

const Receipt = mongoose.model('Receipt', receiptSchema);

module.exports = Receipt;
