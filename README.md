# Instant ERP - Education Management Module

A production-ready **Education Management & Academic Quality Assurance Module** built for **Instant ERP**. Designed to manage, track, review, analyze, and improve instructor performance through structured observations, dynamic criteria evaluation rubrics, live scoring calculations, and actionable feedback workflows.

---

## 🌟 Key Capabilities & Features

### 1. Executive Performance Dashboard
- **Observation Metrics**: Total Observations, Observations This Month, Technical Audits, Pedagogical Audits, Average Observation Score.
- **Instructor Metrics**: Active Instructors, Observed Faculty Coverage (%), Average Instructor Score, Peak Score, Lowest Score.
- **Track Analytics**: Real-time diagnostics for **Frontend**, **Backend**, **Mobile**, **AI & Data Analysis**, **Cybersecurity**, and **UI/UX** tracks with score indices and trends.
- **Observer Calibration**: Observation volume distribution and average scores issued by evaluators.
- **Criteria Analytics**: Rubric performance breakdown, month-over-month trends, highest and lowest scores.
- **Interactive Visualizations (Recharts)**: Monthly score progression line charts, horizontal benchmark bar charts, and **Track × Criteria Performance Heatmaps**.

### 2. Observation Management & Data Table
- **Filtering Engine**: Filter by Instructor, Track, Group, Observer, Type (Technical vs. Non-Technical), and Date Range.
- **Interactive Table**: Search across all fields, column sorting (Date, Score, Instructor, Track, Group), and customizable pagination.
- **Instant Exports**:
  - **Excel Export (.xlsx)**: Exports complete observation dataset with scores, weights, grades, and qualitative feedback using `xlsx`.
  - **PDF Export (.pdf)**: Generates formatted audit summary tables using `jspdf` and `jspdf-autotable`.
- **Observation Details Modal**: Comprehensive breakdown of individual criterion scores, weights, evaluator notes, and dedicated sections for:
  - Key Strengths
  - Areas for Improvement
  - Actionable Recommendations
  - General Comments
  - Direct single-session PDF audit report export.

### 3. Conduct New Observation (Live Evaluation Workflow)
- **Roster Integration**: Select active instructors; cohort groups automatically load based on assigned teaching schedules.
- **Dynamic Criteria Loading**: Switching between **Technical Observation** and **Non-Technical Observation** automatically loads the active template rubric version.
  - *Technical Rubric Example*: Technical Knowledge (25%), Content Accuracy (20%), Practical Demonstration (20%), Student Problem Solving Support (20%), Technical Communication (15%).
  - *Non-Technical Rubric Example*: Communication Skills (25%), Student Engagement (25%), Classroom Management (20%), Time Management (15%), Professionalism (15%).
- **Live Scoring Calculations**:
  - Criterion Weighted Score = `(Score / 10) * Weight %`
  - Real-time updates for Total Score, Average Score, Percentage Score, and Grade Badge (*Outstanding*, *Proficient*, *Developing*, *Needs Attention*).
- **Mandatory Qualitative Development Plan**: General Comments, Strengths, Areas for Improvement, and Recommendations are enforced before submission.
- **Submission Lifecycle**:
  - Updates instructor aggregate statistics and last observation date.
  - Sends immediate notification to the instructor.
  - Logs structured immutable audit event.
  - Triggers celebration animation (`canvas-confetti`).

### 4. Observation Criteria Management (Dynamic Template Builder)
- **Template Lifecycle**: Create, edit, clone, archive, activate, and deactivate evaluation templates.
- **Criteria Editor**: Add, edit, delete, and reorder (Up/Down) evaluation criteria with custom descriptions.
- **Weight Integrity Validator**: Real-time progress bar enforcing that criteria weights **must sum to exactly 100%**.
- **Immutable Version Control**:
  - Template updates create distinct version records (e.g. `v1.0`, `v1.1`, `v1.2`) with version numbers, author tracking, timestamps, and change log narratives.
  - Historical observations remain linked to the exact version under which they were conducted.

### 5. Instructor Portal ("My Observations")
- Dedicated view for faculty members to review their academic growth.
- **Faculty Indicators**: Personal average score, peak score, lowest score, and last observation date.
- **Session History**: Chronological evaluation log with view-only access to scores, evaluator feedback, strengths, and recommendations.
- **Zero-Edit Permissions**: Instructors cannot tamper with evaluation results.

### 6. Academic Reports Center
Five specialized institutional reports with interactive charts, summary tables, and one-click **Excel (.xlsx)** & **PDF (.pdf)** downloads:
1. **Instructor Performance Report**
2. **Track Performance Report**
3. **Observer Performance Report**
4. **Monthly Observation Report**
5. **Criteria Analysis Report**

### 7. Security, Traceability & Audit Logs
- Comprehensive audit trail recording all evaluation submissions, template version upgrades, and report accesses.
- Complete snapshot details with IP addresses and actor roles.

---

## 🛡️ Role-Based Access Control (RBAC) Matrix

| Feature / Action | Education Manager | Head of Track | QA Team | Instructor |
| :--- | :---: | :---: | :---: | :---: |
| **Executive Dashboard** | Full View (Global) | Assigned Track Only | Full View | Restricted |
| **All Observations Table** | Full Access | Assigned Track Only | Full Access | Own Sessions Only |
| **Create Observation** | Yes | Yes (Assigned Track) | Yes | No |
| **Criteria / Template Builder** | Yes | View-Only | View-Only | Restricted |
| **Bump Template Version** | Yes | No | No | No |
| **Instructor Portal** | View-Only | View-Only | View-Only | Full Access |
| **Academic Reports Center** | Full Access + Export | Track Reports Only | Full Access + Export | Restricted |
| **Security & Audit Logs** | Yes | Restricted | Restricted | Restricted |

> **Interactive Persona Switcher**: Use the **Persona (RBAC)** dropdown in the top navigation bar to test the application from any role:
> - **Dr. Sarah Jenkins** (Education Manager)
> - **Alex Vance** (Head of Track - Frontend)
> - **Dr. Elena Rostova** (Head of Track - Backend)
> - **Marcus Thorne** (QA Evaluator)
> - **David Miller** (Instructor - Frontend Track)
> - **Amira Hassan** (Instructor - Frontend Track)
> - **Omar Farooq** (Instructor - Backend Track)

---

## 🗄️ Database Architecture (Prisma Schema)

Located at `prisma/schema.prisma`. Configured for production PostgreSQL with strict relational constraints, foreign keys, and indexes:

- `User` & `Role`: RBAC definitions and user profiles.
- `Track`: Academic departments (*Frontend*, *Backend*, *Mobile*, *AI*, *Cybersecurity*, *UI/UX*).
- `Instructor`: Faculty profiles linked to users and tracks, tracking aggregate averages.
- `Group`: Cohorts mapped to instructors and tracks.
- `ObservationTemplate`: Rubric definitions (*Technical* vs *Non-Technical*).
- `ObservationTemplateVersion`: Immutable version history (`v1.0`, `v1.1`, etc.) with change logs.
- `ObservationCriterion`: Individual rubric items with weight percentage (sum = 100%).
- `Observation`: The core observation evaluation record.
- `ObservationScore`: Individual criterion score snapshot (1–10) with weight and feedback.
- `ObservationFeedback`: Qualitative feedback (*strengths*, *areas for improvement*, *recommendations*).
- `Notification`: In-app event alerts for faculty and management.
- `AuditLog`: Security audit trail capturing state changes, exports, and actor credentials.

---

## 🚀 Running the Module

The project is located at:
```bash
C:\Users\eslam salah Hosny\.gemini\antigravity\scratch\instant-erp
```

### Start the full-stack system:
```bash
cd "C:\Users\eslam salah Hosny\.gemini\antigravity\scratch\instant-erp"
npm start
```
- **Web App & API Server**: `http://localhost:4000` (Direct production bundle serving)
- **Vite Dev Server**: `http://localhost:5173` (With hot-module replacement and `/api` proxy)

### Other useful commands:
```bash
npm run build      # Compile TypeScript and bundle Vite assets to dist/
npm run server     # Run Node.js / Express backend with tsx
npx prisma generate # Regenerate Prisma Client
```
