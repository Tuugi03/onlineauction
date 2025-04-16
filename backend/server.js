const dotenv = require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const http = require('http');
const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const Product = require('./models/product');
const BiddingProduct = require('./models/bidding');
const userRoute = require("./routes/userRoute");
const biddingRoute = require("./routes/biddingRoute");
const productRoute = require("./routes/productRoute");
const categoryRoute = require("./routes/categoryRoute");
const errorHandler = require("./middleware/errorMiddleWare");

const app = express();

app.use(cookieParser());

const corsOptions = {
  origin: ["http://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);

const io = socketio(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});
io.on('connection', (socket) => {
  socket.on('productSold', async ({ productId }) => {
    try {
      const product = await Product.findById(productId);
      io.emit('productUpdate', product);
    } catch (error) {
      console.error('Error updating sold product:', error);
    }
  });

  socket.on('bidUpdate', (product) => {
    io.emit('bidUpdate', product);
  });
});

app.use("/api/users", userRoute);
app.use("/api/product", productRoute);
app.use("/api/bidding", biddingRoute);
app.use("/api/category", categoryRoute);

app.use("/uploads", express.static(path.join(__dirname, "upload")));



app.use(errorHandler);

mongoose.connect(process.env.DATABASE_CLOUD)
  .then(() => {
    server.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err);
    process.exit(1);
  });