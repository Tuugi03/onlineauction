const asyncHandler = require("express-async-handler");
const transaction = require("../models/transaction");

const getMyTransactions = asyncHandler(async (req, res) => {
    const userId = req.user.id;
  
    const myTransactions = await transaction.find({
      $or: [
        { buyer: userId },
        { seller: userId }
      ]
    })
    .populate('buyer', 'name email') 
    .populate('seller', 'name email') 
    .populate('product', 'title price') 
    .sort({ createdAt: -1 }); 
  
    res.status(200).json(myTransactions);
  });
  
module.exports = { 
    getMyTransactions
};