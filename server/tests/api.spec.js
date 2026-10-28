require('dotenv').config();
const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');

describe('BugBounty for College API Integration Tests', function () {
  this.timeout(30000);

  let adminToken = '';
  let studentToken = '';
  let staffToken = '';
  let testReportId = '';

  before(async () => {
    const testDbUri = process.env.MONGODB_URI ? `${process.env.MONGODB_URI}_test` : 'mongodb://127.0.0.1:27017/bugbounty_college_test';
    await mongoose.connect(testDbUri);
    await mongoose.connection.dropDatabase();

    // 1. Explicitly seed initial admin to test bootstrap behavior
    const passwordHash = await User.hashPassword('Password@123');
    await User.create({
      name: 'Admin Infrastructure',
      email: 'admin.infra@campus.edu',
      passwordHash,
      role: 'admin',
      department: 'Dean Office',
    });

    const adminRes = await request(app).post('/api/v1/auth/login').send({
      email: 'admin.infra@campus.edu',
      password: 'Password@123',
    });
    adminToken = adminRes.body.token;

    // 2. Seed maintenance staff
    await User.create({
      name: 'Electrician Ramesh',
      email: 'ramesh.staff@campus.edu',
      passwordHash,
      role: 'staff',
      department: 'Electrical Maintenance',
    });

    const staffRes = await request(app).post('/api/v1/auth/login').send({
      email: 'ramesh.staff@campus.edu',
      password: 'Password@123',
    });
    staffToken = staffRes.body.token;
  });

  after(async () => {
    if (mongoose.connection.readyState !== 0) {
      try {
        await mongoose.connection.dropDatabase();
      } catch (e) {}
      await mongoose.connection.close();
    }
  });

  it('1. GET /api/health should return online status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal('online');
  });

  it('2. POST /api/v1/auth/register creates student account', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Rohan Sharma',
      email: 'rohan.student@campus.edu',
      password: 'Password@123',
      department: 'Computer Science',
    });
    expect(res.status).to.equal(201);
    expect(res.body.success).to.be.true;
    expect(res.body.token).to.be.a('string');
    studentToken = res.body.token;
  });

  it('3. POST /api/v1/auth/login rejects incorrect passwords', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'rohan.student@campus.edu',
      password: 'WrongPassword!',
    });
    expect(res.status).to.equal(401);
    expect(res.body.success).to.be.false;
  });

  it('4. POST /api/v1/auth/login successfully returns authenticated student data', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'rohan.student@campus.edu',
      password: 'Password@123',
    });
    expect(res.status).to.equal(200);
    expect(res.body.data.user.role).to.equal('student');
  });

  it('5. POST /api/v1/categories allows Admin to define dynamic categories', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Electrical and lighting',
        slaHours: 24,
      });
    expect(res.status).to.equal(201);
    expect(res.body.data.category.name).to.equal('Electrical and lighting');
  });

  it('6. POST /api/v1/categories forbids Students from creating categories', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'Unauthorized Category' });
    expect(res.status).to.equal(403);
  });

  it('7. POST /api/v1/reports creates new campus issue', async () => {
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${studentToken}`)
      .field('title', 'Ceiling Fan Sparking in Room 204')
      .field('description', 'Ceiling fan regulator sparking when switched on. High burn smell.')
      .field('category', 'Electrical and lighting')
      .field('building', 'Science Block B')
      .field('locationDetail', 'Room 204')
      .field('suggestedSeverity', 'high');

    expect(res.status).to.equal(201);
    expect(res.body.data.report.status).to.equal('reported');
    testReportId = res.body.data.report._id;
  });

  it('8. POST /api/v1/reports/:id/verify prevents reporter from verifying own issue', async () => {
    const res = await request(app)
      .post(`/api/v1/reports/${testReportId}/verify`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ voteType: 'confirm' });
    expect(res.status).to.equal(400);
  });

  it('9. POST /api/v1/reports/:id/verify allows other user to confirm and withdraw vote', async () => {
    const res = await request(app)
      .post(`/api/v1/reports/${testReportId}/verify`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ voteType: 'confirm' });
    expect(res.status).to.equal(200);
    expect(res.body.data.report.verificationCount).to.equal(1);

    // Toggle withdraw
    const withdraw = await request(app)
      .post(`/api/v1/reports/${testReportId}/verify`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ voteType: 'confirm' });
    expect(withdraw.status).to.equal(200);
    expect(withdraw.body.data.report.verificationCount).to.equal(0);
  });

  it('10. GET /api/v1/dashboard/public returns aggregated metrics', async () => {
    const res = await request(app).get('/api/v1/dashboard/public');
    expect(res.status).to.equal(200);
    expect(res.body.data.metrics.totalReports).to.be.at.least(1);
  });

  it('11. POST /api/v1/reports/:id/assign allows Admin to assign staff and set SLA', async () => {
    const staff = await User.findOne({ email: 'ramesh.staff@campus.edu' });
    const res = await request(app)
      .post(`/api/v1/reports/${testReportId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        staffId: staff._id,
        priority: 'critical',
      });
    expect(res.status).to.equal(200);
    expect(res.body.data.report.status).to.equal('assigned');
    expect(res.body.data.report.priority).to.equal('critical');
  });

  it('12. POST /api/v1/reports/:id/status allows Staff to progress to fixing and resolved', async () => {
    const fix = await request(app)
      .post(`/api/v1/reports/${testReportId}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'fixing', note: 'Technician on-site isolating switch' });
    expect(fix.status).to.equal(200);
    expect(fix.body.data.report.status).to.equal('fixing');

    const resolve = await request(app)
      .post(`/api/v1/reports/${testReportId}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .field('status', 'resolved')
      .field('note', 'Replaced capacitor and burnt wire connections.');
    expect(resolve.status).to.equal(200);
    expect(resolve.body.data.report.status).to.equal('resolved');
  });

  it('13. POST /api/v1/reports/:id/reopen allows Student to reopen issue with dispute reason', async () => {
    const res = await request(app)
      .post(`/api/v1/reports/${testReportId}/reopen`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ reason: 'Fan is still producing sparks on speed 4' });
    expect(res.status).to.equal(200);
    expect(res.body.data.report.status).to.equal('reopened');
  });
});
