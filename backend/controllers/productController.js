const asyncHandler = require("express-async-handler");
const Product = require("../models/product");
const slugify = require("slugify");
const cloudinary = require("cloudinary").v2;
const mongoose = require('mongoose');
Product.updateExpiredAuctions();
const postProduct = asyncHandler(async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        
        const { 
            title,
            description, 
            price, 
            category, 
            height, 
            length,
            width,
            weight,
            bidThreshold, 
            bidDeadline, 
        } = req.body;
        
        const userId = req.user.id;

        if(!title || !description || !price || !bidDeadline) {
            throw new Error("Бүрэн гүйцэд бөглөнө үү");
        }

        if(new Date(bidDeadline) <= new Date()) {
            throw new Error("Дуусах хугацаа ирээдүйн огноо байх ёстой");
        }

        const originalSlug = slugify(title, { lower: true, strict: true });
        let slug = originalSlug;
        let suffix = 1;

        while(await Product.findOne({ slug }).session(session)) {
            slug = `${originalSlug}-${suffix}`;
            suffix++;
        }
        console.log('Final slug:', slug);

        let fileData = {};
        if(req.file) {
            console.log('Uploading image to Cloudinary...');
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
                console.log('Image uploaded:', fileData);
            } catch(error) {
                console.error('Cloudinary error:', error);
                throw new Error("Зураг хуулах явцад алдаа гарлаа");
            }
        }

        const [product] = await Product.create([{
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
            bidThreshold: bidThreshold || null,
            bidDeadline: new Date(bidDeadline),
            image: fileData,
        }], { session });

        await session.commitTransaction();
        session.endSession();
        console.log('Product created successfully:', product._id);

        res.status(201).json({
            success: true,
            data: product,
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Product creation failed:', error);
        
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

const getAllProducts = asyncHandler(async (req, res) => {
    
    const products = await Product.find({}).sort("-createdAt").populate("user");
    res.json(products);
});
const getAllAvailableProducts = asyncHandler(async (req, res) => {
    try {
        const { search, category } = req.query;
        const query = { available: true, sold: false, }; 
        
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (category) {
            query.$or = [
                { category: category },
                { 'category._id': category }
            ];
        }
        
        const products = await Product.find(query)
            .populate('user')
            .populate('category', 'title _id')
            .sort({ createdAt: -1 });
        
        res.json(products);
    } catch (error) {
        res.status(500).json({ 
            message: error.message || "Error fetching available products"
        });
    }
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
           filePath: uploadFile.secure_url,   
           fileType: req.file.mimetype,
           public_id: uploadFile.public_id,   
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
    const { search } = req.query;
  
    let query = { user: userId };
  
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
  
    const products = await Product.find(query)
      .sort("-createdAt")
      .populate("user");
  
    res.json(products);
  });

const getAllProductsAdmin = async (req, res) => {
    try {
        const products = await Product.find({ user: req.params.userId });
        res.json(products);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
  };


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
    getAllProductsAdmin,
}
