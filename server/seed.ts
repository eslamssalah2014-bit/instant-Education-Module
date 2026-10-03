import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const storePath = path.resolve(process.cwd(), 'data/store.json');

async function seed() {
  console.log('Starting seed process to Supabase PostgreSQL...');

  if (!fs.existsSync(storePath)) {
    console.error('store.json not found at', storePath);
    return;
  }

  const rawData = fs.readFileSync(storePath, 'utf-8');
  const store = JSON.parse(rawData);

  // 1. Roles
  if (store.roles && store.roles.length > 0) {
    console.log(`Seeding ${store.roles.length} roles...`);
    for (const r of store.roles) {
      await prisma.role.upsert({
        where: { id: r.id },
        update: {},
        create: {
          id: r.id,
          name: r.name,
          displayName: r.displayName,
          description: r.description || '',
          permissions: r.permissions || [],
          createdAt: new Date(r.createdAt || Date.now()),
          updatedAt: new Date(r.updatedAt || Date.now()),
        },
      });
    }
  }

  // 2. Users
  if (store.users && store.users.length > 0) {
    console.log(`Seeding ${store.users.length} users...`);
    for (const u of store.users) {
      await prisma.user.upsert({
        where: { id: u.id },
        update: {},
        create: {
          id: u.id,
          email: u.email,
          name: u.name,
          avatar: u.avatar || null,
          roleType: u.roleType,
          phone: u.phone || null,
          department: u.department || 'Education',
          createdAt: new Date(u.createdAt || Date.now()),
          updatedAt: new Date(u.updatedAt || Date.now()),
        },
      });
    }
  }

  // 3. Tracks
  if (store.tracks && store.tracks.length > 0) {
    console.log(`Seeding ${store.tracks.length} tracks...`);
    for (const t of store.tracks) {
      await prisma.track.upsert({
        where: { id: t.id },
        update: {},
        create: {
          id: t.id,
          name: t.name,
          code: t.code,
          description: t.description || '',
          color: t.color || '#4f46e5',
          headUserId: t.headUserId || null,
          createdAt: new Date(t.createdAt || Date.now()),
          updatedAt: new Date(t.updatedAt || Date.now()),
        },
      });
    }
  }

  // 4. Instructors
  if (store.instructors && store.instructors.length > 0) {
    console.log(`Seeding ${store.instructors.length} instructors...`);
    for (const ins of store.instructors) {
      await prisma.instructor.upsert({
        where: { id: ins.id },
        update: {},
        create: {
          id: ins.id,
          userId: ins.userId,
          employeeId: ins.employeeId || `EMP-${ins.id}`,
          trackId: ins.trackId,
          title: ins.title || 'Instructor',
          specialization: ins.specialization || '',
          status: ins.status || 'ACTIVE',
          averageScore: Number(ins.averageScore) || 0.0,
          totalObserved: Number(ins.totalObserved) || 0,
          lastObservedAt: ins.lastObservedAt ? new Date(ins.lastObservedAt) : null,
          hireDate: ins.hireDate ? new Date(ins.hireDate) : new Date(),
          createdAt: new Date(ins.createdAt || Date.now()),
          updatedAt: new Date(ins.updatedAt || Date.now()),
        },
      });
    }
  }

  // 5. Groups
  if (store.groups && store.groups.length > 0) {
    console.log(`Seeding ${store.groups.length} groups...`);
    for (const g of store.groups) {
      await prisma.group.upsert({
        where: { id: g.id },
        update: {},
        create: {
          id: g.id,
          name: g.name,
          code: g.code || `GRP-${g.id}`,
          trackId: g.trackId,
          instructorId: g.instructorId,
          term: g.term || 'Q4 2026',
          studentCount: Number(g.studentCount) || 24,
          createdAt: new Date(g.createdAt || Date.now()),
          updatedAt: new Date(g.updatedAt || Date.now()),
        },
      });
    }
  }

  // 6. Observation Templates
  if (store.templates && store.templates.length > 0) {
    console.log(`Seeding ${store.templates.length} templates...`);
    for (const tmpl of store.templates) {
      await prisma.observationTemplate.upsert({
        where: { id: tmpl.id },
        update: {},
        create: {
          id: tmpl.id,
          name: tmpl.name,
          code: tmpl.code || `TMPL-${tmpl.id}`,
          type: tmpl.type,
          description: tmpl.description || '',
          isActive: tmpl.isActive !== false,
          isArchived: Boolean(tmpl.isArchived),
          currentVersionId: tmpl.currentVersionId || null,
          createdAt: new Date(tmpl.createdAt || Date.now()),
          updatedAt: new Date(tmpl.updatedAt || Date.now()),
        },
      });
    }
  }

  // 7. Template Versions
  if (store.templateVersions && store.templateVersions.length > 0) {
    console.log(`Seeding ${store.templateVersions.length} template versions...`);
    for (const ver of store.templateVersions) {
      await prisma.observationTemplateVersion.upsert({
        where: { id: ver.id },
        update: {},
        create: {
          id: ver.id,
          templateId: ver.templateId,
          versionNumber: ver.versionNumber,
          changeLog: ver.changeLog || ver.changelog || 'Initial version',
          createdById: ver.createdById,
          isActive: ver.isActive !== false,
          createdAt: new Date(ver.createdAt || Date.now()),
        },
      });
    }
  }

  // 8. Observation Criteria
  if (store.criteria && store.criteria.length > 0) {
    console.log(`Seeding ${store.criteria.length} criteria...`);
    for (const c of store.criteria) {
      await prisma.observationCriterion.upsert({
        where: { id: c.id },
        update: {},
        create: {
          id: c.id,
          templateVersionId: c.templateVersionId,
          name: c.name,
          description: c.description || '',
          weightPercentage: Number(c.weightPercentage || c.weight) || 20,
          orderIndex: Number(c.orderIndex) || 0,
          isActive: c.isActive !== false,
          createdAt: new Date(c.createdAt || Date.now()),
          updatedAt: new Date(c.updatedAt || Date.now()),
        },
      });
    }
  }

  // 8b. Observation Main Criteria (Hierarchical)
  if (store.mainCriteria && store.mainCriteria.length > 0) {
    console.log(`Seeding ${store.mainCriteria.length} main criteria...`);
    for (const mc of store.mainCriteria) {
      await prisma.observationMainCriterion.upsert({
        where: { id: mc.id },
        update: {},
        create: {
          id: mc.id,
          templateVersionId: mc.templateVersionId,
          name: mc.name,
          description: mc.description || '',
          weightPercentage: Number(mc.weightPercentage) || 30,
          calculatedScore: Number(mc.calculatedScore) || 30,
          orderIndex: Number(mc.orderIndex) || 0,
          isActive: mc.isActive !== false,
        },
      });
    }
  }

  // 8c. Observation Sub Criteria (Hierarchical)
  if (store.subCriteria && store.subCriteria.length > 0) {
    console.log(`Seeding ${store.subCriteria.length} sub criteria...`);
    for (const sc of store.subCriteria) {
      await prisma.observationSubCriterion.upsert({
        where: { id: sc.id },
        update: {},
        create: {
          id: sc.id,
          mainCriterionId: sc.mainCriterionId,
          name: sc.name,
          description: sc.description || '',
          weightPercentage: Number(sc.weightPercentage) || 50,
          calculatedScore: Number(sc.calculatedScore) || 15,
          orderIndex: Number(sc.orderIndex) || 0,
          isActive: sc.isActive !== false,
        },
      });
    }
  }

  // 9. Observations
  if (store.observations && store.observations.length > 0) {
    console.log(`Seeding ${store.observations.length} observations...`);
    for (const obs of store.observations) {
      await prisma.observation.upsert({
        where: { id: obs.id },
        update: {},
        create: {
          id: obs.id,
          observationCode: obs.observationCode,
          templateVersionId: obs.templateVersionId,
          type: obs.type,
          instructorId: obs.instructorId,
          observerId: obs.observerId,
          groupId: obs.groupId,
          trackId: obs.trackId,
          observationDate: new Date(obs.observationDate || Date.now()),
          status: obs.status || 'SUBMITTED',
          totalScore: Number(obs.totalScore) || 0.0,
          weightedScore: Number(obs.weightedScore) || 0.0,
          percentageScore: Number(obs.percentageScore) || 0.0,
          grade: obs.grade || null,
          createdAt: new Date(obs.createdAt || Date.now()),
          updatedAt: new Date(obs.updatedAt || Date.now()),
        },
      });
    }
  }

  // 10. Observation Scores
  if (store.scores && store.scores.length > 0) {
    console.log(`Seeding ${store.scores.length} scores...`);
    for (const s of store.scores) {
      await prisma.observationScore.upsert({
        where: { id: s.id },
        update: {},
        create: {
          id: s.id,
          observationId: s.observationId,
          criterionId: s.criterionId,
          criterionName: s.criterionName || '',
          score: Number(s.score) || 0,
          weight: Number(s.weight) || 0,
          weightedScore: Number(s.weightedScore) || 0,
          feedback: s.feedback || '',
          createdAt: new Date(s.createdAt || Date.now()),
        },
      });
    }
  }

  // 11. Observation Feedback
  if (store.feedbacks && store.feedbacks.length > 0) {
    console.log(`Seeding ${store.feedbacks.length} feedbacks...`);
    for (const fb of store.feedbacks) {
      await prisma.observationFeedback.upsert({
        where: { id: fb.id },
        update: {},
        create: {
          id: fb.id,
          observationId: fb.observationId,
          generalComments: fb.generalComments || '',
          strengths: fb.strengths || '',
          areasForImprovement: fb.areasForImprovement || '',
          recommendations: fb.recommendations || '',
          createdAt: new Date(fb.createdAt || Date.now()),
          updatedAt: new Date(fb.updatedAt || Date.now()),
        },
      });
    }
  }

  // 12. Notifications
  if (store.notifications && store.notifications.length > 0) {
    console.log(`Seeding ${store.notifications.length} notifications...`);
    for (const notif of store.notifications) {
      await prisma.notification.upsert({
        where: { id: notif.id },
        update: {},
        create: {
          id: notif.id,
          userId: notif.userId,
          title: notif.title,
          message: notif.message,
          type: notif.type || 'OBSERVATION_SUBMITTED',
          link: notif.link || null,
          isRead: Boolean(notif.isRead),
          createdAt: new Date(notif.createdAt || Date.now()),
        },
      });
    }
  }

  // 13. Audit Logs
  if (store.auditLogs && store.auditLogs.length > 0) {
    console.log(`Seeding ${store.auditLogs.length} audit logs...`);
    for (const log of store.auditLogs) {
      await prisma.auditLog.upsert({
        where: { id: log.id },
        update: {},
        create: {
          id: log.id,
          userId: log.userId || null,
          userRole: log.userRole || null,
          action: log.action,
          entity: log.entity,
          entityId: log.entityId || null,
          details: log.details || {},
          ipAddress: log.ipAddress || '127.0.0.1',
          userAgent: log.userAgent || null,
          createdAt: new Date(log.createdAt || Date.now()),
        },
      });
    }
  }

  console.log('Seeding completed successfully to Supabase PostgreSQL!');
}

seed()
  .catch((err) => {
    console.error('Error during seeding:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
