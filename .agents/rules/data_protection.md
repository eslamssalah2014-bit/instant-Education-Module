# DATA PROTECTION & STABILITY RULES

## Core Directive
Existing data is the highest priority asset. Never delete, truncate, reset, overwrite, recreate, or reseed existing production or test data without explicit user instruction.

## Pre-Update Assessment
Before any update, refactor, or migration, provide:
1. Files to be modified.
2. Database impact assessment.
3. Data safety verification.
4. Rollback strategy.

## Prohibitions
- No `DROP TABLE` or `DROP COLUMN`.
- No `TRUNCATE` or unqualified `DELETE`.
- No automated resets of `ObservationTemplate`, `ObservationCriterion`, `Observation`, `Instructor`, `Group`, `Session`, or `Track`.
- Additive migrations only.
