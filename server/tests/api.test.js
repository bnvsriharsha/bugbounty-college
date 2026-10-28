const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Report = require('../src/models/Report');
const Category = require('../src/models/Category');

require('dotenv').config();

jest.setTimeout(30000);

beforeAll(async () => {
  const testDbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bugbounty_college_test';
  await mongoose.connect(testDbUri, {
    serverSelectionTimeoutMS: 5000,
    driverInfo: { name: 'nodejs', version: '24.14.0' },
  });
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.connection.dropDatabase();
    } catch (e) {}
    await mongoose.connection.close();
  }
});

describe('=== BugBounty Core System & API Tests ===', () => {
  let adminToken = '';
  let studentToken = '';
  let staffToken = '';
  let testReportId = '';

  test('1. Health Check Endpoint', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('online');
  });

  test('2. Student Registration', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Test Student',
      email: 'test.student@campus.edu',
      password: 'Password@123',
      department: 'Computer Science',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    studentToken = res.body.token;
  });

  test('3. Rejection of Incorrect Passwords', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'test.student@campus.edu',
      password: 'WrongPassword!',
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('4. Successful Login & Role Validation', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'test.student@campus.edu',
      password: 'Password@123',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('student');
  });

  test('5. Seed or Promote Admin for testing', async () => {
    const passwordHash = await User.hashPassword('Password@123');
    const adminUser = await User.create({
      name: 'Admin Test',
      email: 'admin.test@campus.edu',
      passwordHash,
      role: 'admin',
    });
    const staffUser = await User.create({
      name: 'Staff Test',
      email: 'staff.test@campus.edu',
      passwordHash,
      role: 'staff',
    });

    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'admin.test@campus.edu',
      password: 'Password@123',
    });
    adminToken = adminLogin.body.token;

    const staffLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'staff.test@campus.edu',
      password: 'Password@123',
    });
    staffToken = staffLogin.body.token;
  });

  test('6. Category Creation (Admin Only)', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Lighting and Fans',
        slaHours: 24,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.category.name).toBe('Lighting and Fans');
  });

  test('7. Unauthorized Category Creation by Student is Blocked', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        name: 'Unauthorized Category',
      });
    expect(res.status).toBe(403);
  });

  test('8. Report Creation with Validation', async () => {
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${studentToken}`)
      .field('title', 'Ceiling Fan Not Working in Room 101')
      .field('description', 'Ceiling fan regulator does not function, creates high humming sound.')
      .field('category', 'Lighting and Fans')
      .field('building', 'Academic Block A')
      .field('locationDetail', 'Room 101')
      .field('suggestedSeverity', 'medium');

    expect(res.status).toBe(201);
    expect(res.body.data.report.status).toBe('reported');
    testReportId = res.body.data.report._id;
  });

  test('9. Student Cannot Verify Own Report (Anti-Abuse)', async () => {
    const res = await request(app)
      .post(`/api/v1/reports/${testReportId}/verify`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ voteType: 'confirm' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('cannot verify');
  });

  test('10. Other User Can Verify Report & Vote Toggles Atomically', async () => {
    const res = await request(app)
      .post(`/api/v1/reports/${testReportId}/verify`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ voteType: 'confirm' });

    expect(res.status).toBe(200);
    expect(res.body.data.report.verificationCount).toBe(1);

    // Toggling with the same vote withdraws it
    const withdrawRes = await request(app)
      .post(`/api/v1/reports/${testReportId}/verify`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ voteType: 'confirm' });

    expect(withdrawRes.status).toBe(200);
    expect(withdrawRes.data.report.verificationCount).toBe(0);
  });

  test('11. Public Dashboard Aggregates Database Correctly', async () => {
    const res = await request(app).get('/api/v1/dashboard/public');
    expect(res.status).toBe(200);
    expect(res.body.data.metrics.totalReports).toBeGreaterThanOrEqual(1);
  });

  test('12. Admin Assigns Issue to Staff', async () => {
    const staff = await User.findOne({ email: 'staff.test@campus.edu' });
    const res = await request(app)
      .post(`/api/v1/reports/${testReportId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        staffId: staff._id,
        priority: 'high',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.report.status).toBe('assigned');
    expect(res.body.data.report.priority).toBe('high');
  });

  test('13. Staff Updates Status to Fixing and Resolves with Evidence', async () => {
    // Start fixing
    const fixRes = await request(app)
      .post(`/api/v1/reports/${testReportId}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'fixing', note: 'Technician on-site testing capacitor' });
    expect(fixRes.status).toBe(200);
    expect(fixRes.body.data.report.status).toBe('fixing');

    // Resolve
    const resolveRes = await request(app)
      .post(`/api/v1/reports/${testReportId}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .field('status', 'resolved')
      .field('note', 'Replaced capacitor and verified fan blades');
    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.report.status).toBe('resolved');
    expect(resolveRes.body.data.report.resolutionEvidence.notes).toContain('Replaced capacitor');
  });

  test('14. Student Can Reopen Resolved Issue with Reason', async () => {
    const res = await request(app)
      .post(`/api/v1/reports/${testReportId}/reopen`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ reason: 'Fan is wobbling violently after speed 3' });

    expect(res.status).toBe(200);
    expect(res.body.data.report.status).toBe('reopened');
    expect(res.body.data.report.reopenHistory.length).toBe(1);
  });
});
