const crypto = require('crypto');
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = require('../app'); 
const { pendingVerifications } = require('../controllers/userController');


const User = require('../models/User');

jest.mock('../models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('cloudinary').v2;
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true)
  })
}));

jest.mock('../utils/mail');

describe('Хэрэглэгч', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pendingVerifications.clear();
    
  });

  const mockUser = (overrides = {}) => ({
    _id: new mongoose.Types.ObjectId(),
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedpassword',
    balance: 1000,
    save: jest.fn().mockResolvedValue(this),
    ...overrides
  });

  describe('Бүртгүүлэх', () => {
    it('Шинэ хэрэглэгч бүртгэх', async () => {
      User.findOne.mockResolvedValue(null);
      const newUser = mockUser();
      User.prototype.save.mockResolvedValue(newUser);

      const response = await request(app)
        .post('/api/users/register')
        .send({
          name: 'New User',
          email: 'new@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: "Хэрэглэгч амжилттай бүртгэгдлээ"
      });
    });

    it('Бүртгэлтэй email алдаа заах', async () => {
      User.findOne.mockResolvedValue(mockUser());

      const response = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Existing User',
          email: 'existing@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain("аль хэдийн бүртгэлтэй");
    });
  });

  describe('Нэвтрэх', () => {
    it('Нэвтрэх', async () => {
      const user = mockUser();
      User.findOne.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mocktoken');

      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'correctpassword'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBe('mocktoken');
    });

    it('Нууц үг буруу үед алдаа заах', async () => {
      const user = mockUser();
      User.findOne.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain("буруу байна");
    });
  });
  describe('Email шалгах', () => {
    it('Бүртгэлийн үед шинэ email-рүү код явуулах', async () => {
      User.findOne.mockResolvedValue(null);
      
      const response = await request(app)
        .post('/api/users/send-code')
        .send({ email: 'new@example.com' });
      
      expect(response.status).toBe(200);
      expect(pendingVerifications.has('new@example.com')).toBeTruthy();
    });

    it('Кодыг шалгах', async () => {
      const email = 'test@example.com';
      const code = '123456';
      pendingVerifications.set(email, { code, expires: Date.now() + 600000 });

      
      const response = await request(app)
        .post('/api/users/verify-email')
        .send({ email, code });
      
      expect(response.status).toBe(200);
    });
  });

 describe('Нууц үг сэргээх', () => {
  beforeEach(() => {
    jest.spyOn(crypto, 'randomBytes').mockReturnValue({
      toString: () => 'mocked-reset-token'
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reset email явуулах', async () => {
    const mockUser = {
      email: 'test@example.com',
      save: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockResolvedValue(mockUser);

    const response = await request(app)
      .post('/api/users/forgot-password')
      .send({ email: 'test@example.com' });

    expect(crypto.randomBytes).toHaveBeenCalledWith(20);
    expect(response.status).toBe(200);
  });

  it('зөв token эсэхийг шалгах', async () => {
    const mockUser = {
      resetPasswordToken: 'validtoken',
      resetPasswordExpires: Date.now() + 3600000,
    };
    User.findOne.mockResolvedValue(mockUser);

    const response = await request(app)
      .get('/api/users/verify-reset-token/validtoken');

    expect(response.status).toBe(200);
  });
});
})