const asyncHandler = require("express-async-handler");
const Product = require("../models/product");
const slugify = require("slugify");

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
    });
    res.status(201).json({
        success: true,
        data: product,
    });
});
module.exports = {
    postProduct
}
