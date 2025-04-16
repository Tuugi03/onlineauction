const mongoose = require("mongoose");

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
        required: true,
        trim: true
    },
    image: {
        type: Object,
        default: {}
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
    // New: The threshold amount that instantly wins the auction
    bidThreshold: {
        type: Number,
        default: null  // null means no threshold (regular auction)
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

// Text index for search
productSchema.index({ 
    title: 'text', 
    description: 'text',
    category: 'text'
});

// Middleware to check if bid meets threshold
productSchema.pre('save', function(next) {
    // Check if current bid meets or exceeds threshold
    if (this.bidThreshold && this.currentBid >= this.bidThreshold) {
        this.sold = true;
        this.soldTo = this.highestBidder;
        this.available = false;
    }
    
    // Check if bid deadline has passed
    if ((this.bidDeadline && new Date() > this.bidDeadline) || this.sold) {
        this.available = false;
    }
    
    next();
});

// Virtual for time remaining
productSchema.virtual('timeRemaining').get(function() {
    if (!this.bidDeadline) return null;
    return this.bidDeadline - new Date();
});

// Static method to update expired auctions
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