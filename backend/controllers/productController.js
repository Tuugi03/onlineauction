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
         weight, } = req.body;
    const userId = req.user.id;

    const originalSlug = slugify(title, {
        lower: true,
        remove: /[*+~.()'"!:@]/g,
        strict: true,
    });
    let slug = originalSlug
    let suffix = 1

    while(await Product.findOne({ slug })){
        slug = `${originalSlug}-${suffix}`;
        suffix++;
    }

    if(!title || !description || !price) {
        res.status(400);
        throw new Error("Бүрэн гүйцэд бөглөнө үү")
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
        fileData = {
            fileName: req.file.originalname,
            filePath: uploadFile.secure_url,   
            fileType: req.file.mimetype,
            public_id: uploadFile.public_id,   
        };
    }

    const product = await Product.create({
        user: userId,
        title,
        slug: slug,
        description, 
        price, 
        category, 
        height, 
        length,
        width,
        weight,
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
}
