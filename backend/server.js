const dotenv = require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const userRoute = require("./routes/userRoute");
const productRoute = require("./routes/productRoute");
const errorHandler = require("./middleware/errorMiddleWare");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
    express.urlencoded({
        extended: false,
    })
);
app.use(bodyParser.json());

app.use(cors({
    origin: [ "http://localhost:3000", "onlineauction.com"],
    credentials: true,
    })
);

const PORT = process.env.PORT || 5000;
app.use("/api/users", userRoute);
app.use("/api/product", productRoute);

app.use(errorHandler);

app.get("/", (req, res) => {
    res.send("home page")
});

mongoose
    .connect(process.env.DATABASE_CLOUD, {
    })
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.log(err);
    });