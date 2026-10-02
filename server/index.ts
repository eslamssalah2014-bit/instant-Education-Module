import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { storage } from './services/storage.js';
import { AuthenticatedRequest } from './middleware/auth.js';
import { authRouter } from './routes/auth.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { observationsRouter } from './routes/observations.routes.js';
import { templatesRouter } from './routes/templates.routes.js';
import { instructorsRouter } from './routes/instructors.routes.js';
import { reportsRouter } from './routes/reports.routes.js';
import { notificationsRouter } from './routes/notifications.routes.js';
import { auditRouter } from './routes/audit.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// RBAC User Context Middleware
// Supports X-User-Id header to simulate or switch active role session
app.use((req: AuthenticatedRequest, res, next) => {
  const userId = (req.headers['x-user-id'] as string) || 'usr-em-1'; // Default: Dr. Sarah Jenkins (Education Manager)
  const user = storage.getUserById(userId);
  if (user) {
    req.user = user;
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Instant ERP - Education Management Module',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Meta lookups (tracks, groups metadata)
app.get('/api/meta', (req, res) => {
  res.json({
    tracks: storage.getTracks(),
    groups: storage.getGroups(),
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/observations', observationsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/instructors', instructorsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/audit-logs', auditRouter);

// Serve Static Frontend if built
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[Instant ERP] Education Management Module Server running on http://localhost:${PORT}`);
});
