const asyncHandler = require("express-async-handler");
const BiddingProduct = require("../models/bidding");
const Product = require("../models/product");
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
    if (!product || product.isSold) {
        return res.status(400).json({ message: "Энэ бараанд үнэ санал болгох боломжгүй" });
    }

    try {
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
   const {productId} = req.body
   const userId = req.user.id;

   const product = await Product.findById(productId);
   if(!product){
    res.status(400);
    throw new Error("Ийм бараа олдсонгүй");
   }

   if(product.user.toString() !== userId) {
    return res.status(403).json({ error: "Алдаа"});

   }

   const highestBid = await BiddingProduct.findOne({ product: productId }).sort({price: -1}).populate("user");
   if(!highestBid){
    res.status(400);
    throw new Error("Уучлаарай энэ удаад ялагч тодроогүй байна");
}
    product.Sold = true;
    product.SoldTo = highestBid.user;
    await product.save();

    await sendEmail({
        email: highestBid.user.email,
        subject: "Баяр хүргэе! Та дуудлага худалдаанд яллаа!",
        html: `Та энэхүү барааг "${product.title}"-г ${highestBid.price} төгрөгөөр худалдан авлаа.`,
      });
    
      res.status(200).json({ message: "Бараа амжилттай зарагдлаа!" });
    
});

module.exports = { 
    getBiddingHistory, 
    placeBid,
    sellProduct,
};