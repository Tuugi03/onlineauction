const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app');
const User = require('../../models/User');
const Product = require('../../models/product');
const BiddingProduct = require('../../models/bidding');

describe('Хэрэглэгч бүртгэх-> Нэвтрэх-> Үнэ санал болгох', () => {
  let mongoServer;
  let testUser;
  let authToken;
  let testProduct;

 beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('хэрэглэгч бүртгэх', async () => {
    const response = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Integration Test User',
        email: 'integration@test.com',
        password: 'test123'
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toContain('бүртгэгдлээ');

    testUser = await User.findOne({ email: 'integration@test.com' });
    expect(testUser).toBeTruthy();
  });

  it('нэвтрэх', async () => {
    const response = await request(app)
      .post('/api/users/login')
      .send({
        email: 'integration@test.com',
        password: 'test123'
      });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();

    authToken = response.body.token;
  });
  it('бараа нэмж худалдан авагч үнэ санал болгох', async () => {
    const seller = await User.create({
      name: 'Seller',
      email: 'seller@test.com',
      password: 'seller123'
    });
    
    testUser = await User.create({
      name: 'Bidder',
      email: 'bidder@test.com',
      password: 'bidder123',
      balance: 1000
    });

    testProduct = await Product.create({
      title: 'Test Product',
      description: 'Test Description',
      price: 100,
      bidThreshold: 500,
      bidDeadline: new Date(Date.now() + 86400000), 
      user: seller._id
    });

    const loginRes = await request(app)
      .post('/api/users/login')
      .send({
        email: 'bidder@test.com',
        password: 'bidder123'
      });
    authToken = loginRes.body.token;

    const bidRes = await request(app)
      .post('/api/bidding/')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        productId: testProduct._id,
        price: 200
      });

    expect(bidRes.status).toBe(200);
    
    const bid = await BiddingProduct.findOne({
      product: testProduct._id,
      user: testUser._id
    });
    expect(bid).toBeTruthy();
    expect(bid.price).toBe(200);
  });
});