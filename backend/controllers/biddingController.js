const asyncHandler = require("express-async-handler");
const BiddingProduct = require("../models/bidding");
const Product = require("../models/product");
const User = require("../models/User");
const sendEmail = require("../utils/mail");
const getBiddingHistory = asyncHandler(async (req, res) => {
    const { productId } = req.params;
  
    const biddingHistory = await BiddingProduct.find({ product: productId }).sort("-createdAt").populate("user").populate("product");
  
    res.status(200).json(biddingHistory);
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
        // First check if bid meets threshold
        if (product.bidThreshold && price >= product.bidThreshold) {
            // If threshold is met, call sellProduct logic
            product.sold = true;
            product.soldTo = userId;
            product.currentBid = price;
            await product.save();

            // Create bidding record
            const biddingProduct = await BiddingProduct.create({
                user: userId,
                product: productId,
                price: price
            });

            // Notify buyer and seller
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

        // Normal bid placement logic
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

const sellProduct = asyncHandler(async (req, res) => {
    const { productId, price } = req.body;
    const userId = req.user.id;
  
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error("Бараа олдсонгүй");
    }
  
    if (product.sold) {
      res.status(400);
      throw new Error("Энэ бараа зарагдсан байна");
    }
  
    if (product.bidThreshold && price >= product.bidThreshold) {
      product.sold = true;
      product.soldTo = userId;
      product.currentBid = price;
      await product.save();
  
      await BiddingProduct.create({
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
        buyerId: userId
      });
    }
  
    if (price <= (product.currentBid || product.price)) {
      res.status(400);
      throw new Error("Одоогийн үнээс өндөр үнийн санал оруулна уу");
    }
  
    product.currentBid = price;
    await product.save();
  
    
    await BiddingProduct.create({
      user: userId,
      product: productId,
      price: price
    });
  
    res.status(200).json({
      message: "Үнийн санал амжилттай бүртгэгдлээ",
      sold: false
    });
  });

module.exports = { 
    getBiddingHistory, 
    placeBid,
    sellProduct,
};