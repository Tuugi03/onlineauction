const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const biddingSchema = mongoose.Schema( {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
      ref: "User",
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
      ref: "Product",
    },
    price: {
      type: Number,
      require: [true, "Please add a Price"],
    },
  },
  { timestamps: true }
);
const Bidding = mongoose.model("Bidding", biddingSchema)
module.exports = Bidding;