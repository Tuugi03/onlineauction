const asyncHandler = require("express-async-handler");
const User = require("../models/User")
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {sendCode, sendResetEmail} = require("../utils/mail");
const pendingVerifications = new Map();
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const cloudinary = require("cloudinary").v2;
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
require('dotenv').config();

const generateToken = (id) => {
    return jwt.sign({id} , process.env.JWT_SECRET, {expiresIn: "1d"});
};
const sendVerificationCodeOnly = asyncHandler(async (req, res) => {
    const { email } = req.body;
  
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409);
      throw new Error("Энэ имэйл хаяг аль хэдийн бүртгэлтэй байна");
    }
  
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; 
  
    pendingVerifications.set(email, { code, expires });
  
    await sendCode(email, code);
  
    res.status(200).json({ message: "Баталгаажуулах код илгээгдлээ" });
  });
  const verifyEmailCode = asyncHandler(async (req, res) => {
    const { email, code } = req.body;
  
    const record = pendingVerifications.get(email);
  
    if (!record || record.code !== code || record.expires < Date.now()) {
      res.status(400);
      throw new Error("Баталгаажуулах код буруу эсвэл хугацаа дууссан");
    }
  
    pendingVerifications.delete(email);
  
    res.status(200).json({ message: "Имэйл баталгаажлаа" });
  });
  
  const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    
    if (existing) {
      res.status(409);
      throw new Error("Энэ имэйл хаяг аль хэдийн бүртгэлтэй байна");
    }

    const newUser = new User({
      name,
      email,
      password
    });
  
    await newUser.save();
  
    res.status(201).json({ message: "Хэрэглэгч амжилттай бүртгэгдлээ" });
  });
  const addBalanceToUser = asyncHandler(async (req, res) => {
    try {
      const { userId, amount } = req.body;
      
      if (!userId || isNaN(amount)) {
        return res.status(400).json({ message: 'Invalid request' });
      }
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      user.balance = (user.balance || 0) + parseFloat(amount);
      await user.save();
  
      res.status(200).json({ message: 'Balance updated successfully', user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
const loginUser = asyncHandler(async (req, res) => {
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
      token,
      balance: user.balance
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

const generateResetToken = () => {
  return crypto.randomBytes(20).toString('hex');
};

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
      res.status(400);
      throw new Error("Имэйл хаягаа оруулна уу");
  }

  console.log("Forgot password request for:", email); 

  const user = await User.findOne({ email });

  if (user) {
      console.log("User found, generating reset token..."); 
      const resetToken = generateResetToken();
      const resetTokenExpiry = Date.now() + 3600000; 
      console.log(resetToken,"asdadas")

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetTokenExpiry;
      await user.save();

      const resetUrl = `${process.env.BASE_URL}/reset-password/${resetToken}`;

      console.log("Sending reset email to:", user.email, "with URL:", resetUrl); 
      
      try {
          await sendResetEmail(user.email, resetUrl);
          console.log("Reset email sent successfully"); 
      } catch (error) {
          console.error("Error sending reset email:", error);
          throw new Error("Имэйл илгээхэд алдаа гарлаа");
      }
  }

  res.status(200).json({ 
      message: "Хэрэв энэ имэйл бүртгэлтэй бол нууц үг сэргээх линк илгээгдсэн болно" 
  });
});

const verifyResetToken = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
      res.status(400);
      throw new Error("Линк хүчингүй эсвэл хугацаа нь дууссан байна");
  }

  res.status(200).json({ 
      message: "Линк хүчинтэй", 
      email: user.email 
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
      res.status(400);
      throw new Error("Нууц үг хамгийн багадаа 6 тэмдэгтээс бүрдэнэ");
  }

  const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
      res.status(400);
      throw new Error("Линк хүчингүй эсвэл хугацаа нь дууссан байна");
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({ 
      message: "Нууц үг амжилттай шинэчлэгдлээ" 
  });
  
});
const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ 
      $or: [
        { googleId },
        { email }
      ] 
    });

    if (!user) {
      user = new User({
        googleId,
        name,
        email,
        photo: picture,
        password: crypto.randomBytes(16).toString('hex') 
      });
      await user.save();
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.isVerified = true;
      if (!user.photo && picture) user.photo = picture;
      await user.save();
    }

    const token = generateToken(user._id);
    
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400),
      sameSite: "none",
      secure: true,
    });

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      photo: user.photo,
      role: user.role,
      token,
      balance: user.balance
    });

  } catch (error) {
    console.error('Алдаа:', error);
    res.status(401);
    throw new Error("Алдаа");
  }
});

const getGoogleClientId = asyncHandler(async (req, res) => {
  res.status(200).json({ clientId: process.env.GOOGLE_CLIENT_ID });
});
const updateUserPhoto = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404);
      throw new Error("Хэрэглэгч олдсонгүй");
    }

    let fileData = {};
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "Bidding/UserAvatars",
        resource_type: "image",
      });

      if (user.photo?.public_id) {
        await cloudinary.uploader.destroy(user.photo.public_id);
      }

      fileData = {
        filePath: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      };
    }

    user.photo = fileData;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Профайл зураг амжилттай шинэчлэгдлээ",
      photo: user.photo
    });

  } catch (error) {
    console.error("Error updating photo:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Зураг шинэчлэхэд алдаа гарлаа"
    });
  }
});

module.exports = {registerUser,
    loginUser,
    loginstatus,
    loggoutUser,
    getUser,
    getUserBalance,
    allUsers,
    verifyEmailCode,
    sendVerificationCodeOnly,
    addBalanceToUser,
    forgotPassword,
    verifyResetToken,
    resetPassword,
    googleLogin,
    getGoogleClientId,
    updateUserPhoto,
    pendingVerifications
    
};