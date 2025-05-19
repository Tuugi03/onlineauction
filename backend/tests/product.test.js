const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const Product = require('../models/product');
const User = require('../models/User');
const app = require('../app');
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockImplementation(() => ({ 
    id: '507f1f77bcf86cd799439011' 
  })),
}));
jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
      upload: jest.fn().mockResolvedValue({
        secure_url: 'http://test.com/image.jpg',
        public_id: 'test-public-id'
      }),
    },
  },
}));
jest.mock('../middleware/authMiddleware', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = {
      _id: '507f1f77bcf86cd799439011', 
      name: 'Test User',
      role: 'buyer'
    };
    next();
  }),
  admin: jest.fn((req, res, next) => next())
}));

jest.mock('../models/product');
jest.mock('../models/User');
jest.mock('jsonwebtoken');

describe('Product Controller', () => {
  let mockProduct;
  let mockUser;
  let mockToken;

beforeAll(() => {
  jest.setTimeout(100000);
  process.env.JWT_SECRET = 'test-secret-123';
  mockToken = jwt.sign(
    { id: '507f1f77bcf86cd799439011' }, 
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
});

  beforeEach(() => {
    jest.clearAllMocks();

      if (!mockToken) {
    mockToken = jwt.sign(
      { id: '507f1f77bcf86cd799439011' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }
  const userId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');

    mockUser = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      name: 'Test User',
      email: 'test@example.com',
      role: 'buyer',
      token: mockToken,
      save: jest.fn().mockResolvedValue(this),
      toObject: jest.fn().mockReturnThis(),
    };

    User.findById.mockImplementation((id) => ({
      ...mockUser,
      select: jest.fn().mockResolvedValue(mockUser), 
    }));

        jwt.verify.mockImplementation((token) => {
        if (token === mockToken) {
          return { id: mockUser._id.toString() };
        }
        throw new Error('Invalid token');
      });
   
     User.findById.mockImplementation((id) => {
    if (id.toString() === mockUser._id.toString()) {
      return Promise.resolve({
        ...mockUser,
        select: jest.fn().mockResolvedValue(mockUser) 
      });
    }
    return Promise.resolve(null);
  });


    mockProduct = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
      title: 'Test Product',
      description: 'Test Description',
      price: 100,
      user: userId,
      save: jest.fn().mockResolvedValue(this),
      toObject: jest.fn().mockReturnThis(),
      image: {
        public_id: 'test-public-id',
        secure_url: 'http://test.com/image.jpg'
      }
    };

  Product.findById.mockImplementation((id) => {
    if (id.toString() === mockProduct._id.toString()) {
      return Promise.resolve({
        ...mockProduct,
        user: userId 
      });
    }
    return Promise.resolve(null);
  });


    Product.create.mockResolvedValue([mockProduct]);
    Product.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue([mockProduct])
    });
  });

  describe('postProduct', () => {
   it('Шинэ бараа нэмэх', async () => {
  expect(mockToken).toBeDefined();
  
  const response = await request(app)
    .post('/api/product')
    .set('Authorization', `Bearer ${mockToken}`) 
    .field('title', 'Test Product')
    .field('description', 'Test Description')
    .field('price', 100)
    .field('bidDeadline', new Date(Date.now() + 86400000).toISOString())
    .attach('image', Buffer.from('test-image-content'), 'test-image.jpg')
    .timeout(50000);

  expect(response.status).toBe(200);
},);

  })

  describe('getAllProducts', () => {
    it('Бүх барааг харах', async () => {
      const response = await request(app)
        .get('/api/product/getAllProducts')

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

});