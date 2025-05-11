const asyncHandler = require("express-async-handler");
const BiddingProduct = require("../models/bidding");
const Product = require("../models/product");
const User = require("../models/User");
const Transaction = require("../models/transaction");
const {sendEmail} = require("../utils/mail");


const getBiddingHistory = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const biddingHistory = await BiddingProduct.find({ product: productId })
    .sort('-createdAt')
    .populate('user')
    .populate('product');


  res.status(200).json({ history: biddingHistory });
});
const placeBid = asyncHandler(async (req, res) => {
  const { productId, price } = req.body;
  const userId = req.user.id;

  if (!productId || !price) {
      return res.status(400).json({ message: "Бүх талбарыг бөглөнө үү" });
  }

  const product = await Product.findById(productId);
  if (!product || product.sold) {
      return res.status(400).json({ message: "Энэ бараанд үнэ санал болгох боломжгүй" });
  }

  try {
      if (product.bidThreshold && price >= product.bidThreshold) {
          product.sold = true;
          product.soldTo = userId;
          product.currentBid = price;
          await product.save();

          const biddingProduct = await BiddingProduct.create({
              user: userId,
              product: productId,
              price: price
          });

          const buyer = await User.findById(userId);
          const seller = await User.findById(product.user);

          await sendEmail({
              email: buyer.email,
              subject: "Баяр хүргэе! Та дуудлага худалдаанд яллаа!",
              html: `Та энэхүү барааг "${product.title}"-г ${price} төгрөгөөр худалдан авлаа.`
          });

          await sendEmail({
              email: seller.email,
              subject: "Бараа амжилттай зарагдлаа",
              html: `Таны "${product.title}" бараа ${price} төгрөгөөр зарагдлаа.`
          });

          return res.status(200).json({ 
              message: "Бараа амжилттай зарагдлаа!",
              sold: true,
              buyerId: userId,
              product: product,
              biddingProduct: biddingProduct
          });
      }

      const existingUserBid = await BiddingProduct.findOne({ 
          user: userId, 
          product: productId 
      });
      
      if (existingUserBid) {
          if (price <= existingUserBid.price) {
              return res.status(400).json({ 
                  message: "Та өмнөх үнийн дүнгээс өндөр үнийн дүн байршуулна уу" 
              });
          }
          existingUserBid.price = price;
          await existingUserBid.save();
          
          product.currentBid = price;
          await product.save();
          
          return res.status(200).json({ 
              biddingProduct: existingUserBid,
              product 
          });
      }

      const highestBid = await BiddingProduct.findOne({ product: productId })
          .sort({ price: -1 });
      
      if (highestBid && price <= highestBid.price) {
          return res.status(400).json({ 
              message: "Та өмнөх үнийн дүнгээс өндөр үнийн дүн байршуулна уу" 
          });
      }

      const biddingProduct = await BiddingProduct.create({
          user: userId,
          product: productId,
          price,
      });

      product.currentBid = price;
      await product.save();

      res.status(200).json({
          biddingProduct,
          product
      });

  } catch (error) {
      console.error('Bidding error:', error);
      res.status(500).json({ 
          message: "Үнийн санал өгөхөд алдаа гарлаа" 
      });
  }
});
const checkUserBidStatus = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const userBid = await BiddingProduct.findOne({ 
    user: userId, 
    product: productId 
  }).sort({ price: -1 });

  const isOutbid = userBid ? (product.currentBid > userBid.price) : false;

  res.status(200).json({
    isOutbid,
    currentBid: product.currentBid,
    userBid: userBid?.price || null
  });
});

const sellProduct = asyncHandler(async (req, res) => {
  const { productId, price } = req.body;
  const userId = req.user.id;

  try {
    const product = await Product.findById(productId);
    if (!product) throw new Error("Бараа олдсонгүй");
    if (product.sold) throw new Error("Энэ бараа өмнө нь зарагдсан байна");

    const buyer = await User.findById(userId);
    if (!buyer) throw new Error("Худалдан авагчийн мэдээлэл олдсонгүй");
    if (buyer.balance < price) throw new Error("Таны дансны үлдэгдэл хүрэлцэхгүй байна");

    const seller = await User.findById(product.user);
    if (!seller) throw new Error("Барааны эзэний мэдээлэл олдсонгүй");

    const updates = await Promise.all([
      User.updateOne(
        { _id: userId },
        { $inc: { balance: -price } }
      ),
      User.updateOne(
        { _id: product.user },
        { $inc: { balance: price } }
      ),
      Product.updateOne(
        { _id: productId },
        { 
          $set: { 
            sold: true,
            soldTo: userId,
            currentBid: price 
          }
        }
      ),
      Transaction.create({
        buyer: userId,
        seller: product.user,
        product: productId,
        amount: price,
        status: 'completed'
      }),
      BiddingProduct.create({
        user: userId,
        product: productId,
        price: price
      })
    ]);

    try {
      await Promise.all([
        sendEmail({
          email: buyer.email,
          subject: "Баяр хүргэе! Та амжилттай худалдан авлаа!",
          html: `Таны худалдан авсан "<strong>${product.title}</strong>" барааны үнэ <strong>${price}₮</strong> байна.`
        }),
        sendEmail({
          email: seller.email,
          subject: "Бараа амжилттай зарагдлаа",
          html: `Таны "<strong>${product.title}</strong>" бараа <strong>${price}₮</strong>-р амжилттай зарагдлаа.`
        })
      ]);
    } catch (emailError) {
      console.error('Имэйл илгээхэд алдаа гарлаа:', emailError);
    }

    // 6. Амжилттай хариу буцаах
    return res.status(200).json({ 
      success: true,
      message: "Бараа амжилттай зарагдлаа!",
      data: {
        productId: productId,
        productName: product.title,
        price: price,
        buyerId: userId,
        soldAt: new Date()
      }
    });

  } catch (error) {
    console.error('Алдаа:', error);
    res.status(400).json({ 
      success: false,
      message: error.message || "Бараа зарах үед алдаа гарлаа",
      error: error.message
    });
  }
});


module.exports = { 
    getBiddingHistory, 
    placeBid,
    sellProduct,
    checkUserBidStatus
};