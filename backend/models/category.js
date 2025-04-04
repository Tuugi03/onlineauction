const mongoose = require("mongoose");

const categorySchema = mongoose.Schema({
    user: {
          type: mongoose.Schema.Types.ObjectId,
          require: true,
          ref: "User",
        },
    title: {
        type: String,
        require: [true, "Мэдээллийг бүрэн гүйцэд бөглөнө үү"]
    },

},
    {
        timestamps: true,
    }
);

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;