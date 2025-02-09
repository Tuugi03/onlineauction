const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
    user: {
        type:mongoose.Schema.Types.ObjectId,
        require: true,
        ref:"User"
    },
    title:{
        type:String,
        require: true
    },
    description:{
        type:String,
        unique: true
    },
    image:{
        type:Object,
       
        default:{},
    },
    category:{
        type:String,
        require: true,
        default:"All"

    },
    commision:{
        type: Number,
        default:0
    },
    price:{
        type:Number,
        require: true
        
    },
    height:{type:Number},
    length:{type:Number},
    width:{type:Number},
    weight:{type:Number},
    Verified:{type:Boolean, default:false},
    Sold:{type:Boolean, default:false},
    screenXoldTo: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    
})

const product = mongoose.model("Product", productSchema)
module.exports = product;