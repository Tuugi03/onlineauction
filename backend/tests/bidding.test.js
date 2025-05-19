const request = require('supertest');
const app = require('../app'); 
const {
  getBiddingHistory,
  placeBid,
  sellProduct,
} = require('../controllers/biddingController');
const BiddingProduct = require('../models/bidding');
const Product = require('../models/product');
const User = require('../models/User');
const Transaction = require('../models/transaction');

jest.mock('../models/bidding');
jest.mock('../models/product');
jest.mock('../models/User');
jest.mock('../models/transaction');
jest.mock('../utils/mail', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));

describe('Bidding Controller', () => {
  let mockUser, mockProduct, mockBid;

  beforeEach(() => {
    mockUser = {
      _id: 'user123',
      id: 'user123',
      email: 'test@example.com',
      balance: 1000,
      save: jest.fn().mockResolvedValue(true)
    };

    mockProduct = {
      _id: 'product123',
      title: 'Test Product',
      user: 'seller123',
      currentBid: 500,
      bidThreshold: 1000,
      sold: false,
      save: jest.fn().mockResolvedValue(true)
    };

    mockBid = {
      _id: 'bid123',
      user: 'user123',
      product: 'product123',
      price: 600,
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockReturnThis()
    };

    jest.clearAllMocks();
  });

  describe('getBiddingHistory', () => {
    it('should return bidding history for a product', async () => {
      const mockHistory = [mockBid];
      BiddingProduct.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockHistory)
      });

      const req = { params: { productId: 'product123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await getBiddingHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle errors when fetching history', async () => {
      BiddingProduct.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      const req = { params: { productId: 'product123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await expect(getBiddingHistory(req, res)).rejects.toThrow('Database error');
    });
  });

  describe('placeBid', () => {

    it('Бараа олдоогүй үед алдаа заах', async () => {
      Product.findById.mockResolvedValue(null);

      const req = { 
        body: { productId: 'product123', price: 600 }, 
        user: { id: 'user123' } 
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await placeBid(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: "Энэ бараанд үнэ санал болгох боломжгүй" 
      });
    });

    it('Худалдагчийн хүссэн үнэд хүрэх үед зарах', async () => {
      Product.findById.mockResolvedValue(mockProduct);
      User.findById.mockResolvedValue(mockUser);
      BiddingProduct.create.mockResolvedValue(mockBid);

      const req = { 
        body: { productId: 'product123', price: 1000 }, 
        user: { id: 'user123' } 
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await placeBid(req, res);

      expect(mockProduct.sold).toBe(true);
      expect(mockProduct.soldTo).toBe('user123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "Бараа амжилттай зарагдлаа!",
        sold: true
      }));
    });

    it('Үнэ санал болгох', async () => {
      Product.findById.mockResolvedValue(mockProduct);
      BiddingProduct.findOne.mockResolvedValue({
        ...mockBid,
        price: 500,
        save: jest.fn().mockResolvedValue(true)
      });

      const req = { 
        body: { productId: 'product123', price: 600 }, 
        user: { id: 'user123' } 
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await placeBid(req, res);

      expect(BiddingProduct.findOne).toHaveBeenCalledWith({
        user: 'user123',
        product: 'product123'
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });



  });

  describe('sellProduct', () => {
    it('transaction дуусгах', async () => {
      Product.findById.mockResolvedValue(mockProduct);
      User.findById.mockImplementation(id => {
        return id === 'user123' 
          ? Promise.resolve({ ...mockUser, balance: 1500 })
          : Promise.resolve({ ...mockUser, _id: 'seller123', email: 'seller@example.com' });
      });
      Transaction.create.mockResolvedValue({});

      const req = { 
        body: { productId: 'product123', price: 1000 }, 
        user: { id: 'user123' } 
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await sellProduct(req, res);

      expect(Product.updateOne).toHaveBeenCalled();
      expect(Transaction.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: "Бараа амжилттай зарагдлаа!"
      }));
    });

    it('Худалдан авагчийн үлдэгдэл хүрэлцэхгүй бол алдаа заах', async () => {
      Product.findById.mockResolvedValue(mockProduct);
      User.findById.mockResolvedValue({ ...mockUser, balance: 500 });

      const req = { 
        body: { productId: 'product123', price: 1000 }, 
        user: { id: 'user123' } 
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await sellProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: "Таны дансны үлдэгдэл хүрэлцэхгүй байна"
      }));
    });
    
  });
});