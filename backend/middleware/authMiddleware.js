const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const protect = asyncHandler(async (req, res, next) => {
    let token;
    
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } 
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }
  
    if(!token) {
      res.status(401);
      throw new Error("Та нэвтэрсэний дараа энэ үйлдэлийг хийнэ үү");
    }
  
    try {
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(verified.id).select("-password");
      
      if(!user) {
        res.status(401);
        throw new Error("Хэрэглэгч олдсонгүй");
      }
  
      req.user = user;
      next();
    } catch (error) {
      res.status(401);
      throw new Error("Та нэвтэрсэний дараа энэ үйлдэлийг хийнэ үү");
    }
  });
const admin = (req, res, next) =>{
    if(req.user && req.user.role === "admin"){
        next();

    }else{
        res.status(403);
        throw new Error("Та админ эрхээр нэвтрэнэ үү");
    }
}

module.exports = {
    protect,
    admin
}