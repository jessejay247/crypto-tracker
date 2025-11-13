// backend/tests/wallet.test.js
const request = require('supertest');
const app = require('../src/index');
const User = require('../src/models/User');

describe('Wallet Operations', () => {
  let token;

  beforeEach(async () => {
    // Register and login
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'Test',
        lastName: 'User'
      });

    const user = await User.findOne({ email: 'test@example.com' });
    user.isEmailVerified = true;
    await user.save();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123'
      });

    token = loginRes.body.token;
  });

  describe('POST /api/wallet/create', () => {
    it('should create an Ethereum wallet', async () => {
      const res = await request(app)
        .post('/api/wallet/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          network: 'ETH',
          label: 'Test Wallet'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('walletId');
      expect(res.body).toHaveProperty('address');
      expect(res.body.network).toBe('ETH');
    });

    it('should create a Bitcoin wallet', async () => {
      const res = await request(app)
        .post('/api/wallet/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          network: 'BTC',
          label: 'BTC Wallet'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.network).toBe('BTC');
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post('/api/wallet/create')
        .send({
          network: 'ETH',
          label: 'Test Wallet'
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/wallet/wallets', () => {
    it('should get user wallets', async () => {
      // Create a wallet first
      await request(app)
        .post('/api/wallet/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          network: 'ETH',
          label: 'Test Wallet'
        });

      const res = await request(app)
        .get('/api/wallet/wallets')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('wallets');
      expect(Array.isArray(res.body.wallets)).toBe(true);
      expect(res.body.wallets.length).toBeGreaterThan(0);
    });
  });
});
