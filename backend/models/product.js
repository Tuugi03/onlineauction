const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,  // Fixed typo from 'require' to 'required'
        ref: "User"
    },
    title: {
        type: String,
        required: true,  // Fixed typo
        trim: true       // Fixed typo from 'trime' to 'trim'
    },
    slug: {
        type: String,
        unique: true
    },
    description: {
        type: String,
        required: true,  // Added required since it's typically needed
        trim: true       // Fixed typo
    },
    image: {
        type: Object,
        default: {}
    },
    category: {
        type: String,
        required: true,
        default: "General"  // Changed from "All" to more standard "General"
    },
    commission: {  // Fixed spelling from 'commision' to 'commission'
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: true
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
        default: 0  // Added default value
    },
    verified: {  // Changed from 'Verified' to lowercase for consistency
        type: Boolean,
        default: false
    },
    sold: {  // Changed from 'Sold' to lowercase
        type: Boolean,
        default: false
    },
    soldTo: {  // Changed from 'SoldTo' to camelCase
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },  // Added for better JSON output
    toObject: { virtuals: true }
});

// Add text index for search functionality
productSchema.index({ 
    title: 'text', 
    description: 'text',
    category: 'text'
});

const Product = mongoose.model("Product", productSchema);  // Capitalized model name
module.exports = Product;