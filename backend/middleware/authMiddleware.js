const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const protect = asyncHandler(async (req, res, next)=>{

    try{
        const token = req.cookies.token
        if(!token){
            res.status(401)
            throw new Error("нэвтэрсэнийн дараа хандана уу");

        }
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(verified.id).select("-password");
        if(!user){
            res.status(401);
            throw new Error("хэрэглэгч олдсонгүй")
        }

        req.user = user;
        next();
    }
    catch (error){
        res.status(401);
        throw new Error("нэвтэрсэнийн дараа хандана уу")

    }
});
const admin = (req, res, next) =>{
    if(req.user && req.user.role === "admin"){
        next();

    }else{
        res.status(403);
        throw new Error("zowhon admin erh");
    }
}
module.exports = {
    protect,
    admin
}