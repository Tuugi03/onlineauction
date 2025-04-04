const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
    user: {
        type:mongoose.Schema.Types.ObjectId,
        require: true,
        ref:"User"
    },
    title:{
        type: String,
        require: true,
        trime:true
    },
    slug:{
        type:String,
        unique:true,

    },
    description:{
        type:String,
        unique: true,
        trime:true
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
    SoldTo: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
   
    
},{ timestamps: true });

const product = mongoose.model("Product", productSchema)
module.exports = product;