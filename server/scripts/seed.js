const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Report = require('../src/models/Report');
const VerificationVote = require('../src/models/VerificationVote');
const Comment = require('../src/models/Comment');
const AuditLog = require('../src/models/AuditLog');
const Notification = require('../src/models/Notification');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bugbounty_college';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB database...');

    // Clear existing collections safely
    await User.deleteMany({});
    await Category.deleteMany({});
    await Report.deleteMany({});
    await VerificationVote.deleteMany({});
    await Comment.deleteMany({});
    await AuditLog.deleteMany({});
    await Notification.deleteMany({});
    console.log('[Seed] Cleaned existing collections.');

    // 1. Create standard Categories
    const categories = await Category.insertMany([
      {
        name: 'Electrical and lighting',
        slug: 'electrical-and-lighting',
        description: 'Broken switches, malfunctioning ceiling fans, short circuits, corridor lighting.',
        icon: 'Zap',
        slaHours: 24,
      },
      {
        name: 'Classroom furniture',
        slug: 'classroom-furniture',
        description: 'Damaged desks, broken chairs, podium issues, whiteboard issues.',
        icon: 'Armchair',
        slaHours: 48,
      },
      {
        name: 'Laboratory equipment',
        slug: 'laboratory-equipment',
        description: 'Faulty oscilloscopes, bunsen burners, fume hoods, computers, chemicals storage.',
        icon: 'FlaskConical',
        slaHours: 24,
      },
      {
        name: 'Internet and networking',
        slug: 'internet-and-networking',
        description: 'Campus Wi-Fi drops, LAN socket faults, router dead zones.',
        icon: 'Wifi',
        slaHours: 12,
      },
      {
        name: 'Cleanliness and hygiene',
        slug: 'cleanliness-and-hygiene',
        description: 'Overflowing dustbins, uncollected waste, cafeteria hygiene, corridor littering.',
        icon: 'Trash2',
        slaHours: 12,
      },
      {
        name: 'Washroom maintenance',
        slug: 'washroom-maintenance',
        description: 'Leaking taps, clogged drains, no running water, broken flush systems.',
        icon: 'Droplets',
        slaHours: 12,
      },
      {
        name: 'Campus roads and walkways',
        slug: 'campus-roads-and-walkways',
        description: 'Potholes, broken pavement tiles, slippery ramps, missing drain covers.',
        icon: 'Compass',
        slaHours: 72,
      },
      {
        name: 'Safety hazards',
        slug: 'safety-hazards',
        description: 'Exposed high-voltage wires, broken glass panes, fire extinguisher inspection overdue.',
        icon: 'AlertTriangle',
        slaHours: 6,
      },
    ]);
    console.log(`[Seed] Inserted ${categories.length} categories.`);

    // 2. Create Users (Admin, Staff, Students)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password@123', salt);

    const admin = await User.create({
      name: 'Dr. Ramesh Kumar (Dean of Infrastructure)',
      email: 'admin@campus.edu',
      passwordHash,
      role: 'admin',
      department: 'Campus Administration',
      reputation: 150,
      studentId: 'FAC-001',
    });

    const staff1 = await User.create({
      name: 'Suresh Patil (Electrical Head)',
      email: 'staff.electrical@campus.edu',
      passwordHash,
      role: 'staff',
      department: 'Electrical Maintenance',
      reputation: 90,
      studentId: 'STF-101',
    });

    const staff2 = await User.create({
      name: 'Anand Verma (Civil & Estate)',
      email: 'staff.civil@campus.edu',
      passwordHash,
      role: 'staff',
      department: 'Civil & Facilities',
      reputation: 80,
      studentId: 'STF-102',
    });

    const student1 = await User.create({
      name: 'Aditi Sharma',
      email: 'aditi.student@campus.edu',
      passwordHash,
      role: 'student',
      studentId: '2023CS0142',
      department: 'Computer Science',
      reputation: 35,
      reportsSubmitted: 3,
      reportsVerified: 12,
    });

    const student2 = await User.create({
      name: 'Karthik Raja',
      email: 'karthik.student@campus.edu',
      passwordHash,
      role: 'student',
      studentId: '2022EC0089',
      department: 'Electronics & Communication',
      reputation: 20,
      reportsSubmitted: 2,
      reportsVerified: 8,
    });

    const student3 = await User.create({
      name: 'Pooja Iyer',
      email: 'pooja.student@campus.edu',
      passwordHash,
      role: 'student',
      studentId: '2024ME0034',
      department: 'Mechanical Engineering',
      reputation: 15,
      reportsSubmitted: 1,
      reportsVerified: 5,
    });

    console.log('[Seed] Created default user accounts.');

    // 3. Create realistic sample reports across diverse statuses and buildings
    const reports = [
      {
        title: 'Exposed wire sparking near Physics Lab switchboard',
        description: 'In Block B Physics Lab 204, the sub-distribution switchboard has exposed 230V live wiring. Sparking occurred twice during yesterday afternoon lab session.',
        category: 'Safety hazards',
        building: 'Science Block B',
        locationDetail: 'Physics Lab 204, Second Floor near Door 2',
        coordinates: { lat: 17.4455, lng: 78.3489 },
        images: [
          { url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80', publicId: 'demo_wire' },
        ],
        reporter: student1._id,
        suggestedSeverity: 'critical',
        priority: 'critical',
        status: 'fixing',
        verificationCount: 7,
        assignedStaff: staff1._id,
        assignedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        expectedResolutionTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
        history: [
          {
            fromStatus: null,
            toStatus: 'reported',
            actor: student1._id,
            actorName: student1.name,
            actorRole: student1.role,
            note: 'Initial emergency safety report filed',
            timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000),
          },
          {
            fromStatus: 'reported',
            toStatus: 'verified',
            actor: admin._id,
            actorName: admin.name,
            actorRole: admin.role,
            note: 'Verified with high priority by Administrator',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
          },
          {
            fromStatus: 'verified',
            toStatus: 'assigned',
            actor: admin._id,
            actorName: admin.name,
            actorRole: admin.role,
            note: `Assigned immediately to ${staff1.name}`,
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          },
          {
            fromStatus: 'assigned',
            toStatus: 'fixing',
            actor: staff1._id,
            actorName: staff1.name,
            actorRole: staff1.role,
            note: 'Power isolated; currently replacing the circuit breaker panel',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
        ],
      },
      {
        title: 'Broken desk benches causing cuts to students',
        description: 'Room 305 benches have sharp protruding nails and splintered plywood. At least two students had their clothes snagged today.',
        category: 'Classroom furniture',
        building: 'Academic Block A',
        locationDetail: 'Room 305, Row 4 Bench',
        coordinates: { lat: 17.446, lng: 78.3495 },
        images: [
          { url: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=600&auto=format&fit=crop&q=80', publicId: 'demo_desk' },
        ],
        reporter: student2._id,
        suggestedSeverity: 'medium',
        priority: 'medium',
        status: 'verified',
        verificationCount: 4,
        history: [
          {
            fromStatus: null,
            toStatus: 'reported',
            actor: student2._id,
            actorName: student2.name,
            actorRole: student2.role,
            note: 'Reported with photos of damage',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
          {
            fromStatus: 'reported',
            toStatus: 'verified',
            actor: student1._id,
            actorName: 'Community Consensus',
            actorRole: 'system',
            note: 'Community verified by students',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
          },
        ],
      },
      {
        title: 'Water tap leaking continuously in Central Library Restroom',
        description: 'The second washbasin tap on Ground floor men washroom does not close properly, wasting significant clean water and flooding the floor.',
        category: 'Washroom maintenance',
        building: 'Central Library',
        locationDetail: 'Ground floor west wing washroom',
        coordinates: { lat: 17.447, lng: 78.348 },
        images: [
          { url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80', publicId: 'demo_tap' },
        ],
        reporter: student3._id,
        suggestedSeverity: 'low',
        priority: 'low',
        status: 'resolved',
        verificationCount: 5,
        assignedStaff: staff2._id,
        assignedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        resolutionEvidence: {
          notes: 'Replaced rubber washer and spindle valve. Tested water flow without leakage.',
          images: [
            { url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80', publicId: 'demo_fixed' },
          ],
          completedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
          completedBy: staff2._id,
        },
        history: [
          {
            fromStatus: null,
            toStatus: 'reported',
            actor: student3._id,
            actorName: student3.name,
            actorRole: student3.role,
            note: 'Reported leaky tap',
            timestamp: new Date(Date.now() - 50 * 60 * 60 * 1000),
          },
          {
            fromStatus: 'reported',
            toStatus: 'verified',
            actor: admin._id,
            actorName: admin.name,
            actorRole: admin.role,
            note: 'Verified for maintenance',
            timestamp: new Date(Date.now() - 49 * 60 * 60 * 1000),
          },
          {
            fromStatus: 'verified',
            toStatus: 'assigned',
            actor: admin._id,
            actorName: admin.name,
            actorRole: admin.role,
            note: `Assigned to ${staff2.name}`,
            timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
          },
          {
            fromStatus: 'assigned',
            toStatus: 'resolved',
            actor: staff2._id,
            actorName: staff2.name,
            actorRole: staff2.role,
            note: 'Valve replaced successfully',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          },
        ],
      },
      {
        title: 'Wi-Fi Access Point offline in Hostel 4 Reading Room',
        description: 'Students preparing for mid-terms cannot access university intranet resources or study materials due to dead AP router.',
        category: 'Internet and networking',
        building: 'Hostel Block 4',
        locationDetail: '1st Floor Study Room, AP-H4-03',
        coordinates: { lat: 17.444, lng: 78.351 },
        images: [
          { url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&auto=format&fit=crop&q=80', publicId: 'demo_wifi' },
        ],
        reporter: student1._id,
        suggestedSeverity: 'high',
        priority: 'high',
        status: 'reported',
        verificationCount: 2,
        history: [
          {
            fromStatus: null,
            toStatus: 'reported',
            actor: student1._id,
            actorName: student1.name,
            actorRole: student1.role,
            note: 'Created report',
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
          },
        ],
      },
      {
        title: 'Deep pothole on main road opposite Cafeteria',
        description: 'Substantial pothole after monsoon showers. Two two-wheeler skids observed this morning near the speed bump.',
        category: 'Campus roads and walkways',
        building: 'Campus Perimeter',
        locationDetail: 'Main Ring Road opposite Central Cafeteria',
        coordinates: { lat: 17.448, lng: 78.35 },
        images: [
          { url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80', publicId: 'demo_road' },
        ],
        reporter: student2._id,
        suggestedSeverity: 'high',
        priority: 'high',
        status: 'assigned',
        verificationCount: 8,
        assignedStaff: staff2._id,
        assignedAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
        expectedResolutionTime: new Date(Date.now() + 14 * 60 * 60 * 1000),
        history: [
          {
            fromStatus: null,
            toStatus: 'reported',
            actor: student2._id,
            actorName: student2.name,
            actorRole: student2.role,
            note: 'Road hazard flagged',
            timestamp: new Date(Date.now() - 15 * 60 * 60 * 1000),
          },
          {
            fromStatus: 'reported',
            toStatus: 'verified',
            actor: admin._id,
            actorName: admin.name,
            actorRole: admin.role,
            note: 'Verified with High Priority',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
          },
          {
            fromStatus: 'verified',
            toStatus: 'assigned',
            actor: admin._id,
            actorName: admin.name,
            actorRole: admin.role,
            note: `Assigned to ${staff2.name}`,
            timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000),
          },
        ],
      },
    ];

    const insertedReports = await Report.insertMany(reports);
    console.log(`[Seed] Inserted ${insertedReports.length} sample reports.`);

    // 4. Create sample votes & comments
    await VerificationVote.create({
      report: insertedReports[0]._id,
      user: student2._id,
      voteType: 'confirm',
      reason: 'I also noticed the sparks this morning, very dangerous.',
    });

    await Comment.create({
      report: insertedReports[0]._id,
      user: staff1._id,
      content: 'Electrician team is on site with isolation testers. Power will be restored by 5 PM.',
      isStaffNote: true,
    });

    await Comment.create({
      report: insertedReports[0]._id,
      user: student1._id,
      content: 'Thank you for the quick response! Lab sessions are currently moved to Room 202.',
      isStaffNote: false,
    });

    // 5. Create notifications
    await Notification.create({
      recipient: student1._id,
      sender: staff1._id,
      title: 'Work In Progress on Your Report',
      message: 'Staff updated status of "Exposed wire sparking" to Fixing.',
      type: 'status_change',
      report: insertedReports[0]._id,
    });

    console.log('[Seed] Demo data seeding finished successfully!');
    console.log('==================================================');
    console.log('DEMO ACCOUNTS FOR LOGIN:');
    console.log('  ADMIN:       admin@campus.edu           / Password@123');
    console.log('  STAFF 1:     staff.electrical@campus.edu / Password@123');
    console.log('  STAFF 2:     staff.civil@campus.edu      / Password@123');
    console.log('  STUDENT 1:   aditi.student@campus.edu    / Password@123');
    console.log('  STUDENT 2:   karthik.student@campus.edu  / Password@123');
    console.log('==================================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
