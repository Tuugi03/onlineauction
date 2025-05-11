const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema({
    name:{
        type:String,
        require:[true, "Нэрээ заавал бичээрэй"],
    },
    email:{
        type:String,
        require:[true, "mail заавал бичээрэй"],
    },
    password:{
        type:String,
        require:[true, "нууц үгээ заавал бичээрэй"],
    },

    photo:{
        filePath: String,
        public_id: String
    },
    phone:{
        type: Number,
    },
    role:{
        type:String,
        turul: ["admin",  "buyer"],
        default: "buyer",
    },

    googleId: {
        type: String,
        unique: true,
        sparse: true
      },

    balance: {
        type: Number,
        default: 0,
    },
    resetPasswordToken: {type: String,},
    
resetPasswordExpires:{type:Date}
},
{ timeStamp : true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
});

const User = mongoose.model("User", userSchema)
module.exports = User;