// app.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const productRoute = require("./routes/productRoute");
const biddingRoute = require("./routes/biddingRoute");
const userRoute = require("./routes/userRoute");
const categoryRoute = require("./routes/categoryRoute");
const searchRoute = require("./routes/searchRoute");
const requestRoute = require("./routes/requestRoute");
const transactionRoute = require("./routes/transactionRoute");
const errorHandler = require("./middleware/errorMiddleWare");

const app = express();

app.use(cookieParser());

const corsOptions = {
  origin: 'http://localhost:5173', 
  credentials: true,
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'x-access-token'
  ],
  exposedHeaders: ['x-access-token'],
  methods: ['GET', 'POST', 'PUT', 'DELETE']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/users", userRoute);
app.use("/api/product", productRoute);
app.use("/api/bidding", biddingRoute);
app.use("/api/category", categoryRoute);
app.use("/api/search", searchRoute);
app.use("/api/transaction", transactionRoute);
app.use("/api/request", requestRoute);

app.use("/uploads", express.static(path.join(__dirname, "upload")));

app.use(errorHandler);

module.exports = app; 
