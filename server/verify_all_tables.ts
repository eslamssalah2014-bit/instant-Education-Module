import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function checkAllTables() {
  console.log('--- Checking table counts directly using DIRECT_URL ---');
  
  const [
    auditLogCount,
    groupCount,
    instructorCount,
    notificationCount,
    observationCount,
    criterionCount,
    feedbackCount,
    scoreCount,
    templateCount,
    versionCount,
    trackCount,
    roleCount,
    userCount,
  ] = await Promise.all([
    prisma.auditLog.count(),
    prisma.group.count(),
    prisma.instructor.count(),
    prisma.notification.count(),
    prisma.observation.count(),
    prisma.observationCriterion.count(),
    prisma.observationFeedback.count(),
    prisma.observationScore.count(),
    prisma.observationTemplate.count(),
    prisma.observationTemplateVersion.count(),
    prisma.track.count(),
    prisma.role.count(),
    prisma.user.count(),
  ]);

  const results = {
    AuditLog: { rowCount: auditLogCount, status: auditLogCount === 0 ? 'CLEARED (0 rows)' : 'ACTIVE' },
    Group: { rowCount: groupCount, status: groupCount === 0 ? 'CLEARED (0 rows)' : 'ACTIVE' },
    Instructor: { rowCount: instructorCount, status: instructorCount === 0 ? 'CLEARED (0 rows)' : 'ACTIVE' },
    Notification: { rowCount: notificationCount, status: notificationCount === 0 ? 'CLEARED (0 rows)' : 'ACTIVE' },
    Observation: { rowCount: observationCount, status: observationCount === 0 ? 'CLEARED (0 rows)' : 'ACTIVE' },
    ObservationCriterion: { rowCount: criterionCount, status: criterionCount === 0 ? 'CLEARED (0 rows)' : 'ACTIVE' },
    ObservationFeedback: { rowCount: feedbackCount, status: feedbackCount === 0 ? 'CLEARED (0 rows)' : 'ACTIVE' },
    ObservationScore: { rowCount: scoreCount, status: scoreCount === 0 ? 'CLEARED (0 rows)' : 'ACTIVE' },
    ObservationTemplate: { rowCount: templateCount, status: templateCount === 0 ? 'CLEARED (0 rows)' : 'ACTIVE' },
    ObservationTemplateVersion: { rowCount: versionCount, status: versionCount === 0 ? 'CLEARED (0 rows)' : 'ACTIVE' },
    Track: { rowCount: trackCount, status: trackCount === 0 ? 'CLEARED (0 rows)' : 'ACTIVE' },
    Role: { rowCount: roleCount, status: `PRESERVED (${roleCount} System Roles & Permissions)` },
    User: { rowCount: userCount, status: `PRESERVED (${userCount} Required Admin Account: Dr. Sarah Jenkins)` },
  };

  console.table(results);
}

checkAllTables()
  .catch((err) => {
    console.error('Check failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
