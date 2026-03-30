const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, 'Job title cannot be more than 100 characters'],
        index: true  // Text index for searching
    },
    description: {
        type: String,
        required: true,
        minlength: [50, 'Job description must be at least 50 characters']
    },
    requiredSkills: {
        type: [String],
        required: true,
        validate: {
            validator: function(v) {
                return v.length >= 1 && v.length <= 20;
            },
            message: 'Job must have between 1 and 20 skills'
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true  // Support querying jobs by creator
    },
    status: {
        type: String,
        enum: ['active', 'closed', 'draft', 'pending'],
        default: 'draft',
        index: true  // Support filtering by status
    },
    salary: {
        min: {
            type: Number,
            required: true,
            min: [0, 'Minimum salary cannot be negative'],
            index: true  // Support salary range queries
        },
        max: {
            type: Number,
            required: true,
            index: true
        },
        currency: {
            type: String,
            default: 'USD',
            enum: ['USD', 'EUR', 'GBP', 'INR']
        }
    },
    location: {
        city: {
            type: String,
            trim: true,
            index: true  // Support location-based queries
        },
        country: {
            type: String,
            trim: true,
            index: true
        },
        isRemote: {
            type: Boolean,
            default: false,
            index: true  // Support remote job filtering
        }
    },
    employmentType: {
        type: String,
        enum: ['full-time', 'part-time', 'contract', 'freelance', 'internship'],
        required: true,
        index: true  // Support employment type filtering
    },
    applicationDeadline: {
        type: Date,
        validate: {
            validator: function(v) {
                return v > Date.now();
            },
            message: 'Application deadline must be in the future'
        },
        index: true  // Support deadline-based queries
    },
    companyName: {
        type: String,
        required: true,
        trim: true,
        index: true  // Support company-based searches
    },
    applicants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true  // Support applicant tracking
    }],
    matchedSkills: {
        type: Number,
        default: 0,
        index: true  // Support skill match sorting
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Define indexes with consistent names
JobSchema.index({ title: 'text', description: 'text' }, { name: 'text_search_index' });
JobSchema.index({ createdBy: 1, createdAt: -1 }, { name: 'admin_jobs_index' });
JobSchema.index({ status: 1 }, { name: 'status_index' });
JobSchema.index({ requiredSkills: 1 }, { name: 'skills_index' });
JobSchema.index({ 'salary.min': 1, 'salary.max': 1 }, { name: 'salary_range_index' });
JobSchema.index({ 'location.city': 1, 'location.country': 1 }, { name: 'location_index' });
JobSchema.index({ applicationDeadline: 1 }, { name: 'deadline_index' });
JobSchema.index({ companyName: 1 });

// Virtual to calculate days remaining for application
JobSchema.virtual('daysRemaining').get(function() {
    if (!this.applicationDeadline) return null;
    const today = new Date();
    const deadline = new Date(this.applicationDeadline);
    const timeDiff = deadline.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Pre-save hook to validate salary
JobSchema.pre('save', function(next) {
    if (this.salary.min > this.salary.max) {
        next(new Error('Minimum salary cannot be greater than maximum salary'));
    }
    next();
});

// Method to calculate matched skills for a user
JobSchema.methods.calculateMatchedSkills = function(userSkills) {
    if (!userSkills || !this.requiredSkills) return 0;
    
    const matchedSkills = userSkills.filter(skill => 
        this.requiredSkills.includes(skill)
    );

    this.matchedSkills = matchedSkills.length;
    return matchedSkills.length;
};

// Static method for advanced job search
JobSchema.statics.searchJobs = async function(query, options = {}) {
    const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = options;

    const searchQuery = {
        $or: [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { requiredSkills: { $in: [query] } }
        ]
    };

    const totalJobs = await this.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalJobs / limit);

    const jobs = await this.find(searchQuery)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    return {
        jobs,
        pagination: {
            currentPage: page,
            totalPages,
            totalJobs,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        }
    };
};

module.exports = mongoose.model('Job', JobSchema);
