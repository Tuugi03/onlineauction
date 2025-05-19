const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = require('../../app');
const User = require('../../models/User');
const Product = require('../../models/product');
const { MongoMemoryServer } = require('mongodb-memory-server');
jest.mock('nodemailer');
jest.mock('cloudinary').v2;
jest.setTimeout(30000);

describe('Хэрэглэгч бүртгэх-> Нэвтрэх -> Бараа нэмэх', () => {
  let testUser;
  let authToken;
  let mongoServer;

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
it('бараа нэмэх', async () => {
  const productData = {
    title: 'test',
    description: 'test',
    price: 99.99,
    bidDeadline: new Date(Date.now() + 86400000).toISOString()
  };

  const response = await request(app)
    .post('/api/product')
    .set('Authorization', `Bearer ${authToken}`)
    .field('title', productData.title)
    .field('description', productData.description)
    .field('price', productData.price)
    .field('bidDeadline', productData.bidDeadline);

  const product = await Product.findOne({ title: productData.title })
    .populate('user', 'name email');

  expect(response.status).toBe(201);
  expect(product).toBeTruthy();
  expect(product.title).toBe(productData.title);
  expect(product.user._id.toString()).toBe(testUser._id.toString());
});})