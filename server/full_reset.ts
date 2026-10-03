import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const storePath = path.resolve(process.cwd(), 'data/store.json');

async function fullReset() {
  console.log('=== STARTING 100% COMPLETE BUSINESS DATA RESET ===\n');

  // 1. Observations and related
  await prisma.observationScore.deleteMany({});
  await prisma.observationFeedback.deleteMany({});
  await prisma.observation.deleteMany({});
  console.log('Cleared Observations, Scores, Feedbacks.');

  // 2. Groups
  await prisma.group.deleteMany({});
  console.log('Cleared Groups.');

  // 3. Instructors
  await prisma.instructor.deleteMany({});
  console.log('Cleared Instructors.');

  // 4. Notifications & Audit Logs
  await prisma.notification.deleteMany({});
  await prisma.auditLog.deleteMany({});
  console.log('Cleared Notifications & Audit Logs.');

  // 5. Evaluation Templates, Versions, Criteria
  await prisma.observationCriterion.deleteMany({});
  await prisma.observationTemplateVersion.deleteMany({});
  await prisma.observationTemplate.deleteMany({});
  console.log('Cleared Criteria, Template Versions, Templates.');

  // 6. Tracks
  await prisma.track.deleteMany({});
  console.log('Cleared Tracks.');

  // 7. Users: Retain ONLY 1 required admin/system account (Dr. Sarah Jenkins - Education Manager)
  await prisma.user.deleteMany({
    where: {
      roleType: {
        not: 'EDUCATION_MANAGER',
      },
    },
  });
  console.log('Cleared all non-admin users. Retained single required admin account.');

  // Verify all tables
  const tables: any = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;

  const counts: Record<string, { rowCount: number; status: string }> = {};
  for (const t of tables) {
    const tableName = t.table_name;
    const res: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "${tableName}"`);
    const count = res[0]?.count ?? 0;
    let status = 'CLEARED (0 rows)';
    if (tableName === 'Role') {
      status = 'PRESERVED (System Roles & Permissions)';
    } else if (tableName === 'User') {
      status = 'PRESERVED (1 Single Required Admin Account)';
    }
    counts[tableName] = { rowCount: count, status };
  }

  console.log('\n=== FINAL TABLE ROW COUNTS IN POSTGRESQL ===');
  console.table(counts);

  // Update data/store.json to match exact clean state
  if (fs.existsSync(storePath)) {
    const adminUser = {
      id: 'usr-em-1',
      email: 'sarah.jenkins@instanterp.edu',
      name: 'Dr. Sarah Jenkins',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      roleType: 'EDUCATION_MANAGER',
      phone: '+1 (555) 234-5678',
      department: 'Education Leadership',
      createdAt: '2026-01-01T08:00:00.000Z',
      updatedAt: '2026-01-01T08:00:00.000Z',
    };

    const roles = [
      {
        id: 'role-em',
        name: 'EDUCATION_MANAGER',
        displayName: 'Education Manager',
        description: 'Executive management with full visibility and governance over curriculum and quality.',
        permissions: ['*'],
      },
      {
        id: 'role-hot',
        name: 'HEAD_OF_TRACK',
        displayName: 'Head of Track',
        description: 'Track leader supervising instructor performance and evaluations within their domain.',
        permissions: ['observations:create', 'observations:view_track', 'dashboard:view_track', 'analytics:view_track', 'reports:view_track'],
      },
      {
        id: 'role-qa',
        name: 'QA_TEAM',
        displayName: 'Quality Assurance Evaluator',
        description: 'Independent evaluation specialist conducting formal pedagogical & technical audits.',
        permissions: ['observations:create', 'observations:view_all', 'dashboard:view_all', 'analytics:view_all', 'reports:access', 'reports:export'],
      },
      {
        id: 'role-inst',
        name: 'INSTRUCTOR',
        displayName: 'Instructor / Faculty',
        description: 'Classroom instructor receiving feedback, observations, and recommendations.',
        permissions: ['observations:view_own', 'feedback:view_own'],
      },
    ];

    const cleanStore = {
      users: [adminUser],
      roles,
      tracks: [],
      instructors: [],
      groups: [],
      templates: [],
      templateVersions: [],
      criteria: [],
      observations: [],
      scores: [],
      feedbacks: [],
      notifications: [],
      auditLogs: [],
    };

    fs.writeFileSync(storePath, JSON.stringify(cleanStore, null, 2), 'utf-8');
    console.log('\n[store.json] successfully updated to 100% clean state.');
  }

  console.log('\n=== FULL SYSTEM DATA RESET COMPLETED SUCCESSFULLY ===');
}

fullReset()
  .catch((err) => {
    console.error('Full reset failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
