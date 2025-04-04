const asyncHandler = require("express-async-handler");
const User = require("../models/User")
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const generateToken = (id) => {
    // return jwt.sing({id} , process.env.JWT_SECRET, { expiresIn: "1d"});
    return jwt.sign({id} , process.env.JWT_SECRET, {expiresIn: "1d"});
};
const registerUser = asyncHandler(async (req, res)=>{
    const {name, email, password} = req.body;

    if (!name || !email || !password){
        res.status(400);
        throw new Error("Мэдээллүүдээ бүрэн гүйцэл бөглөнө үү");
    }
    const userExist = await User.findOne({email});
    if(userExist){
        res.status(400);
        throw new Error("Email нь аль хэдийн хэрэглэддэг email байна.");

    }

    const user = await User.create({
        name,
        email,
        password,
    });
    
    const token = generateToken(user._id);
    res.cookie("token" , token,{
        path:"/",
        httpOnly:true,
        expires: new Date(Date.now() + 1000 * 86400),
        sameSite:"none",
        secure: true,
    });

    if(user){
        const {_id, name, email, photo, role} = user;
        res.status(201).json({_id, name, email, photo, role});

    }else{
        res.status(400);
        throw new Error("Буруу өгөгдөл");
    }
});const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400);
      throw new Error("Мэдээллүүдээ бүрэн гүйцэл бөглөнө үү");
    }
  
    const user = await User.findOne({ email });
    
    if (!user) {
      res.status(401); 
      throw new Error("Хэрэглэгч олдсонгүй мэдээлэлээ шалгана уу");
    }
  
    const passwordIsCorrect = await bcrypt.compare(password, user.password);
  
    if (!passwordIsCorrect) {
      res.status(401);
      throw new Error("Email эсвэл нууц үг буруу байна");
    }
  
    const token = generateToken(user._id);
    
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400), 
      sameSite: "none",
      secure: true,
    });
  
    const { _id, name, photo, role } = user;
    res.status(200).json({ 
      _id,
      name,
      email: user.email,
      photo,
      role,
      token 
    });
  });
const loginstatus = asyncHandler(async (req, res)=> {
    const token = req.cookies.token;
    if(!token){
        return res.json(false)
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if(verified){
        return res.json(true);
    }
    return res.json(false);
});
const loggoutUser = asyncHandler(async (req, res)=> {
    res.cookie("token" , "",{
        path:"/",
        httpOnly:true,
        expires: new Date(0),
        sameSite:"none",
        secure: true,
    });
    return res.status(200).json({message: "Системээс амжилттай гарлаа"});
});
const getUser = asyncHandler(async (req, res) =>{
    const user = await User.findById(req.user._id).select("-password");
    res.status(200).json(user);
});
const getUserBalance = asyncHandler(async (req, res) =>{
    const user = await User.findById(req.user._id);

    if(!user) {
        res.status(404);
        throw new Error("хэрэглэгч олдсонгүй");

    }

    res.status(200).json({
        balance: user.balance,
    });
});
const allUsers = asyncHandler(async (req, res) =>{
    const userList = await User.find({});

    if(!userList.length){
        return res.status(404).json({ message:"no user found"});

    }
    res.status(200).json(userList);
});
const commisisionBalance = asyncHandler(async (req, res) =>{
    try{
        const admin = await User.findOne({role: "admin"});
        if(!admin){
            res.status(404);

        }
        const commisisionBalance = admin.commisisionBalance;
        res.status(200).json({commisisionBalance});

    }catch(error){
        res.status(500).json({error: "дотоод алдаа"})
    }
});

module.exports = {registerUser,
    loginUser,
    loginstatus,
    loggoutUser,
    getUser,
    getUserBalance,
    allUsers,
    commisisionBalance
};