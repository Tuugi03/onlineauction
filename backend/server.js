const dotenv = require('dotenv').config();
const mongoose = require('mongoose');
const http = require('http');
const socketio = require('socket.io');
const app = require('./app'); 
const jwt = require('jsonwebtoken');


const server = http.createServer(app);
const activeAuctions = {};
const io = socketio(server, {
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on('connection', (socket) => {
  const token = socket.handshake.query.token;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;

    console.log(` User ${socket.userId} connected socket ${socket.id}`);
  } catch (err) {
    console.error(' Invalid token:', err.message);
    socket.disconnect();
  }

  socket.on('productSold', async ({ productId }) => {
    try {
      const product = await Product.findById(productId);
      io.emit('productUpdate', product);
    } catch (error) {
      console.error('Алдаа:', error);
    }
  });

  socket.on('bidUpdate', (product) => {
    io.emit('bidUpdate', product);
  });

  socket.on('startAuctionCountdown', ({ productId, deadline }) => {
    if (activeAuctions[productId]) {
      clearInterval(activeAuctions[productId]);
      delete activeAuctions[productId];
    }

    const broadcastTime = () => {
      const now = new Date();
      const end = new Date(deadline);
      const remaining = end - now;

      if (remaining <= 0) {
        io.emit('auctionEnded', { productId });
        clearInterval(activeAuctions[productId]);
        delete activeAuctions[productId];
      } else {
        io.emit('countdownUpdate', {
          productId,
          timeLeft: {
            days: Math.floor(remaining / (1000 * 60 * 60 * 24)),
            hours: Math.floor((remaining / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((remaining / 1000 / 60) % 60),
            seconds: Math.floor((remaining / 1000) % 60)
          }
        });
      }
    };

    broadcastTime();
    
    activeAuctions[productId] = setInterval(broadcastTime, 1000);
  });


});

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
