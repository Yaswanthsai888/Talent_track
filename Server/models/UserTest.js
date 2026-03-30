const mongoose = require('mongoose');

const UserTestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    test: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
        required: true
    },
    status: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed', 'expired'],
        default: 'not_started'
    },
    startTime: Date,
    endTime: Date,
    submittedAnswers: [String],
    score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('UserTest', UserTestSchema);
