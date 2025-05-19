const mongoose = require("mongoose");
const cron = require('node-cron');
const productSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        unique: true
    },
    description: {
        type: String,
        required: false,
        trim: true,
    },
   images: {
        type: [{
            url: String,
            publicId: String,
            isPrimary: {
                type: Boolean,
                default: false 
            }
        }],
        validate: [arrayLimit],
        default: []
    },
    category: {
        type: String,
        required: true,
        default: "General"
    },
    commission: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: true
    },
    bidThreshold: {
        type: Number,
        default: null  
    },
    height: {
        type: Number
    },
    length: {
        type: Number
    },
    width: {
        type: Number
    },
    weight: {
        type: Number
    },
    currentBid: {
        type: Number,
        default: 0
    },
    highestBidder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    bidDeadline: {
        type: Date,
        required: true
    },
    verified: {
        type: Boolean,
        default: false
    },
    sold: {
        type: Boolean,
        default: false
    },
    soldTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    available: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
function arrayLimit(val) {
    return val.length <= 3;
}

productSchema.index({ 
    title: 'text', 
    description: 'text',
    category: 'text'
});

productSchema.pre('save', function(next) {
    const now = new Date();
    
    if (this.bidThreshold && this.currentBid >= this.bidThreshold) {
        this.sold = true;
        this.soldTo = this.highestBidder;
        this.available = false;
    }
    
    if (this.bidDeadline && now > this.bidDeadline) {
        this.available = false;
    }
    
    next();
});

productSchema.virtual('timeRemaining').get(function() {
    if (!this.bidDeadline) return null;
    return this.bidDeadline - new Date();
});

productSchema.statics.updateExpiredAuctions = async function() {
    const now = new Date();
    await this.updateMany(
        {
            available: true,
            bidDeadline: { $lte: now }
        },
        {
            $set: { available: false }
        }
    );
};

const Product = mongoose.model("Product", productSchema);
module.exports = Product;