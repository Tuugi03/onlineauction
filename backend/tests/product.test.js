const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const Product = require('../models/product');
const User = require('../models/User');
const app = require('../app');

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

jest.mock('../models/product');
jest.mock('../models/User');
jest.mock('jsonwebtoken');

describe('Product Controller', () => {
  let mockProduct;
  let mockUser;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-123';
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      name: 'Test User',
      email: 'test@example.com',
      role: 'buyer',
      token: jwt.sign(
        { id: '507f1f77bcf86cd799439011' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      ),
      save: jest.fn().mockResolvedValue(this),
      toObject: jest.fn().mockReturnThis(),
    };

    // Mock JWT verification
    jwt.verify.mockImplementation((token, secret) => {
      if (token !== mockUser.token) {
        throw new Error('Invalid token');
      }
      return { id: mockUser._id.toString() };
    });

    // Mock User lookup
    User.findById.mockImplementation((id) => {
      if (id.toString() === mockUser._id.toString()) {
        return Promise.resolve(mockUser);
      }
      return Promise.resolve(null);
    });

    mockProduct = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
      title: 'Test Product',
      description: 'Test Description',
      price: 100,
      user: mockUser._id,
      save: jest.fn().mockResolvedValue(this),
      toObject: jest.fn().mockReturnThis(),
      image: {
        public_id: 'test-public-id',
        secure_url: 'http://test.com/image.jpg'
      }
    };

    // Product mocks
    Product.findById.mockImplementation((id) => {
      if (id.toString() === mockProduct._id.toString()) {
        return Promise.resolve(mockProduct);
      }
      return Promise.resolve(null);
    });

    Product.findByIdAndDelete.mockResolvedValue(mockProduct);
    Product.findByIdAndUpdate.mockResolvedValue(mockProduct);
    Product.create.mockResolvedValue([mockProduct]);
    Product.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue([mockProduct])
    });
  });

  describe('postProduct', () => {
    it('should create a new product', async () => {
      const response = await request(app)
        .post('/api/product')
        .set('Authorization', `Bearer ${mockUser.token}`)
        .field('title', 'Test Product')
        .field('description', 'Test Description')
        .field('price', 100)
        .field('bidDeadline', new Date(Date.now() + 86400000).toISOString())
        .attach('image', Buffer.from('test-image-content'), 'test-image.jpg');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return error for invalid data', async () => {
      const response = await request(app)
        .post('/api/product')
        .set('Authorization', `Bearer ${mockUser.token}`)
        .send({ title: 'Test' });

      expect(response.status).toBe(400);
    });
  });

  describe('getAllProducts', () => {
    it('should get all products', async () => {
      const response = await request(app)
        .get('/api/product/getAllProducts')
        .set('Authorization', `Bearer ${mockUser.token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      const response = await request(app)
        .delete(`/api/product/${mockProduct._id}`)
        .set('Authorization', `Bearer ${mockUser.token}`);

      expect(response.status).toBe(200);
    });

    it('should return error for unauthorized delete', async () => {
      const otherUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439013');
      Product.findById.mockResolvedValueOnce({
        ...mockProduct,
        user: otherUserId
      });

      const response = await request(app)
        .delete(`/api/product/${mockProduct._id}`)
        .set('Authorization', `Bearer ${mockUser.token}`);

      expect(response.status).toBe(401);
    });
  });

  describe('updateProduct', () => {
    it('should update a product', async () => {
      const response = await request(app)
        .put(`/api/product/${mockProduct._id}`)
        .set('Authorization', `Bearer ${mockUser.token}`)
        .field('title', 'Updated Product')
        .field('price', 150)
        .attach('image', Buffer.from('fake-image-content'), 'test-image.jpg');

      expect(response.status).toBe(201);
    });
  });
});