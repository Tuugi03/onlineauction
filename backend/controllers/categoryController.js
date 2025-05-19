const asyncHandler = require("express-async-handler");
const Category = require("../models/category");

const createCategory = asyncHandler(async (req, res) => {
    try {
        const existingCategory = await Category.findOne({title: req.body.title});
        if(existingCategory) {
          return res.status(400).json({message : "Энэ категори нь аль хэдийн үүссэн байна"});

        }
        const category = await Category.create({
            user: req.user._id,
            title: req.body.title,
        });

        res.json(category);
    } catch (error){
        res.status(500).json({message: "Алдаа"})

    }
});

const getAllCategories = asyncHandler(async (req, res) => {
    try{
        const category = await Category.find({}).populate("user").sort("-createdAt");
        res.json(category);
    }catch(error){
        res.json(error);

    }
});

const getCategory = asyncHandler(async (req, res) => {
    const {id} = req.params;

    try{
        const category = await Category.findById(id).populate("user").sort("-createdAt");
        res.json(category);
    }catch(error){
        res.json(error);

    }
});



const deleteCategory = asyncHandler(async (req, res) => {
    const {id} = req.params;

    try{
        await Category.findByIdAndDelete(id);
        res.status(200).json({message:"амжилттай устгагдлаа"});
    }catch(error){
        res.json(error);

    }
});
module.exports = {
    createCategory,
    getAllCategories,
    getCategory,
    deleteCategory
}