# CRITICAL SYSTEM RULE: DATA PROTECTION & STABILITY

This document establishes the binding architectural and operational protocol for all updates, refactors, migrations, schema updates, API modifications, UI changes, and deployments in the Instant ERP Education Module.

---

## 1. Absolute Data Safety Rules

1. **Zero Unapproved Data Loss**: Never delete, truncate, reset, overwrite, recreate, reseed, or modify existing data unless explicitly requested and approved by the user.
2. **Data Priority**: Existing records (historical audits, faculty profiles, cohort sessions, templates, and grading rubrics) are the highest-priority asset of the institution.
3. **Strict Backward Compatibility**: Any new feature or change must be completely backward compatible with existing records.
4. **Non-Destructive Database Migrations**:
   - Additive migrations only (new nullable columns, new tables, or new indexes).
   - Never drop existing tables.
   - Never drop existing columns.
   - Never remove existing foreign key relationships.
   - Never remove existing database rows.
5. **Protected Core Entities**:
   - `ObservationTemplate` & `ObservationTemplateVersion`
   - `ObservationMainCriterion`, `ObservationSubCriterion`, & `ObservationCriterion`
   - `Observation`, `ObservationMainResult`, `ObservationSubResult`, & `ObservationScore`
   - `Instructor` & `InstructorImprovementPlan`
   - `Group` & `Session`
   - `Track`
   - `User`, `Role`, & Permissions
   - `KpiDefinition`, `KpiScorecard`, & Reports
6. **Prohibited Operations**:
   - `DELETE *` or unqualified deletes
   - `TRUNCATE`
   - `DROP TABLE`
   - `DROP COLUMN`
   - `RESET DATABASE`
   - `SEED REPLACEMENT` (seed scripts must use safe `upsert` only, never destructive replace)

---

## 2. Mandatory Pre-Update Protocol

Before executing ANY code modification or migration, the assistant must provide:
1. **Files that will be modified** (explicit list).
2. **Database impact assessment** (tables/columns affected; verification that operations are additive).
3. **Data safety verification** (proof that no records are altered or lost).
4. **Rollback strategy** (pre-change Git commit hash, database state restoration steps).

*If any update poses a risk to existing data, STOP immediately, display a warning, and request explicit approval before proceeding.*

---

## 3. Deployment & Post-Deployment Verification

1. **Pre-Change Git Commit**: Create a clean Git commit before starting any multi-file change or migration.
2. **Post-Deployment Integrity Check**:
   - Verify table record counts.
   - Verify foreign key integrity.
   - Verify all Observation Templates & hierarchical criteria exist.
   - Verify all Cohorts and Sessions remain intact.
   - Verify that all dashboards and evaluation builder interfaces load properly.
3. **Automatic Rollback**: If any data loss or inconsistency is detected, revert immediately to the pre-change commit and investigate.
