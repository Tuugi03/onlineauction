const asyncHandler = require("express-async-handler");
const Product = require("../models/product");
const slugify = require("slugify");
const cloudinary = require("cloudinary").v2;
const mongoose = require('mongoose');
const postProduct = asyncHandler(async (req, res) => {
    const { 
        title,
        description, 
        price, 
        category, 
        height, 
        length,
        width,
        weight,
        bidThreshold, // New field
        bidDeadline,  // New field
    } = req.body;
    
    const userId = req.user.id;

    // Validate required fields
    if(!title || !description || !price || !bidDeadline) {
        res.status(400);
        throw new Error("Бүрэн гүйцэд бөглөнө үү");
    }

    // Validate bid deadline is in the future
    if(new Date(bidDeadline) <= new Date()) {
        res.status(400);
        throw new Error("Дуусах хугацаа ирээдүйн огноо байх ёстой");
    }

    // Generate unique slug
    const originalSlug = slugify(title, {
        lower: true,
        remove: /[*+~.()'"!:@]/g,
        strict: true,
    });
    let slug = originalSlug;
    let suffix = 1;

    while(await Product.findOne({ slug })){
        slug = `${originalSlug}-${suffix}`;
        suffix++;
    }

    // Handle image upload
    let fileData = {};
    if(req.file) {
        try {
            const uploadFile = await cloudinary.uploader.upload(req.file.path, {
                folder: "Bidding/Product",
                resource_type: "image",
            });
            
            fileData = {
                fileName: req.file.originalname,
                filePath: uploadFile.secure_url,   
                fileType: req.file.mimetype,
                public_id: uploadFile.public_id,   
            };
        } catch(error) {
            console.log(error);
            res.status(500);
            throw new Error("Зураг хуулах явцад алдаа гарлаа");
        }
    }

    // Create product with auction details
    const product = await Product.create({
        user: userId,
        title,
        slug,
        description, 
        price, 
        category: category || "General",
        height, 
        length,
        width,
        weight,
        bidThreshold: bidThreshold || null, // Optional threshold
        bidDeadline: new Date(bidDeadline),
        image: fileData,
    });

    res.status(201).json({
        success: true,
        data: product,
    });
});

const getAllProducts = asyncHandler(async (req, res) => {
    
    const products = await Product.find({}).sort("-createdAt").populate("user");
    res.json(products);
});

const getAllAvailableProducts = asyncHandler(async (req, res) => {
    
    const products = await Product.find({available: true}).sort("-createdAt").populate("user");
    res.json(products);
});
const deleteProduct = asyncHandler(async (req, res) => {
   const { id } = req.params;
   const product = await Product.findById(id);

   if(!product){
    res.status(400);
    throw new Error("Ийм бараа олдсонгүй");
   }
   
   if(product.user?.toString() !== req.user.id) {
    res.status(401);
    throw new Error("алдаа");
   }

   if(product.image && product.image.public_id) {
    try{
        await cloudinary.uploader.destroy(product.image.public_id)
    }catch(error) {
        console.log(error);
        res.status(500);
        throw new Error("Зургийг устгахад алдаа гарлаа")
    }
   }

   await Product.findByIdAndDelete(id)
   res.status(200).json({message : "Амжилттай устгагдлаа"});
});

const updateProduct = asyncHandler(async (req, res) => {
    const { 
        title,
        description, 
        price, 
        category, 
        height, 
        length,
        width,
        weight, } = req.body;
   const { id } = req.params;
   const product = await Product.findById(id);


   if(!product){
    res.status(400);
    throw new Error("Ийм бараа олдсонгүй");
   }

   if(product.user?.toString() !== req.user.id) {
    res.status(401);
    throw new Error("алдаа");
   }

   let fileData = {}
   if(req.file) {
       let uploadFile
       try {
           uploadFile = await cloudinary.uploader.upload(req.file.path,{
               folder: "Bidding/Product",
               resource_type: "image",
           });
       }catch(error){
           console.log(error);
           res.status(500);
           throw new Error("Алдаа");

       }
       if(product.image && product.image.public_id) {
        try{
            await cloudinary.uploader.destroy(product.image.public_id)
        }catch(error) {
            console.log(error);
            res.status(500);
            throw new Error("Зургийг устгахад алдаа гарлаа")
        }
       }
    
       fileData = {
           fileName: req.file.originalname,
           filePath: uploadFile.secure_url,   // Changed from uploadedFile to uploadFile
           fileType: req.file.mimetype,
           public_id: uploadFile.public_id,   // Changed from uploadedFile to uploadFile
       };
   }

   const updateProduct = await Product.findByIdAndUpdate(
    {
        _id: id,
    },
    {
       title,
       description, 
       price, 
       category, 
       height, 
       length,
       width,
       weight,
       image: Object.keys(fileData).length === 0 ? Product?.image : fileData,
   },{
    new: true,
    runValidators: true,
   }
);
   res.status(201).json(
    updateProduct,
   );
});
const getAllProductsUser = asyncHandler(async (req, res) => {

    const userId = req.user._id;

    const products = await Product.find({ User: userId })
      .sort("-createdAt")
      .populate("user");

    res.json(products);
});


const getProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id).populate("user");

    if(!product){
        res.status(400);
        throw new Error("Ийм бараа олдсонгүй");
       }
    
       res.status(200).json(product)
});

const getAllSoldProduct = asyncHandler(async (req, res) => {
    const products = await Product.find({ Sold: true}).sort("-createdAt").populate("user");
    res.json(products);
});
module.exports = {
    postProduct,
    getAllProducts,
    deleteProduct,
    updateProduct,
    getAllProductsUser,
    getProduct,
    getAllSoldProduct,
    getAllAvailableProducts,
}
