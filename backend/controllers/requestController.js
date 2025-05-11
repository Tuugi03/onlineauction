const asyncHandler = require("express-async-handler");
const request = require("../models/request");

const getRequests = asyncHandler(async (req, res) => {
    const requests = await request.find()
    .populate('user', 'name email') 
    .sort({ createdAt: -1 }); 

  res.status(200).json(requests);
});
const addRequest = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { amount } = req.body;

  if (!amount || amount < 5000) {
    res.status(400);
    throw new Error('Amount must be at least 5000');
  }

  const newRequest = await request.create({
    user: userId,
    amount,
  });

  res.status(201).json(newRequest);
});
const deleteRequest = asyncHandler(async (req, res) => {
  const requestId = req.params.id;

  const deletedRequest = await request.findByIdAndDelete(requestId).populate('user', 'name email');

  if (!deletedRequest) {
    res.status(404);
    throw new Error("Хүсэлт олдсонгүй");
  }

  res.status(200).json({ message: "Хүсэлт амжилттай устгагдлаа", deletedRequest });
});


module.exports = { 
    getRequests,
    addRequest,
    deleteRequest
};