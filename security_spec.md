# Phase 0: Security TDD Specification

## 1. Data Invariants
1. **Component Invariant**: A component cannot be created without a valid title, description, fullDescription, category, and creatorId matching the authenticated user.
2. **Review Invariant**: A review must specify a valid componentId referencing an existing component, have a valid rating (1 to 5), and have creator/user details matching the authenticated user's session.
3. **Immutability Invariant**: Fields like `createdAt` and `creatorId` (or `userEmail`) must be completely immutable once set.

## 2. The "Dirty Dozen" Payloads (Targeting Security Rule Violations)

1. **Unauthenticated Read / Write (Pillar 1)**
   - Payload: Anonymous request attempting to fetch all `components`.
   - Expected: `PERMISSION_DENIED`

2. **Shadow Field Injection / Ghost Fields (Pillar 2 - Validation Blueprints)**
   - Payload: Component creation with an extra unapproved field `isVerified: true`.
   - Expected: `PERMISSION_DENIED`

3. **Identity Spoofing - Creator Impersonation (Pillar 2 & 4)**
   - Payload: User `A` tries to create a component with `creatorId: "user_B"`.
   - Expected: `PERMISSION_DENIED`

4. **Resource ID Poisoning - Malicious ID (Pillar 3 - Path Variable Hardening)**
   - Payload: Attempting to create a document under `/components/$$$INVALID_ID$$$`.
   - Expected: `PERMISSION_DENIED`

5. **Size Limit Violations - Volumetric Attack (Pillar 3)**
   - Payload: Component with 2MB title or description.
   - Expected: `PERMISSION_DENIED`

6. **Rating Value Boundary Overflow (Pillar 2)**
   - Payload: Review with `rating: 100` or `rating: -5`.
   - Expected: `PERMISSION_DENIED`

7. **Review Email Spoofing (Pillar 2)**
   - Payload: User authenticated as `student@domain.com` attempts to submit a review with `userEmail: "admin@circuithub.com"`.
   - Expected: `PERMISSION_DENIED`

8. **Review Component Orphan (Pillar 11 - Global Consistency)**
   - Payload: Submitting a review referencing a non-existent `componentId` (e.g. `does-not-exist`).
   - Expected: `PERMISSION_DENIED`

9. **Terminal State / Field Modification Attempt (Pillar 12 - Immutability)**
   - Payload: Update request trying to change `createdAt` of a component.
   - Expected: `PERMISSION_DENIED`

10. **Query Scraper Bypass (Pillar 8 - Secure List Queries)**
    - Payload: Blanket query fetching all reviews without passing the proper filtered query.
    - Expected: `PERMISSION_DENIED` (forced where clause)

11. **PII Data Leakage Request (Pillar 6)**
    - Payload: Fetching another user's personal/private profile details without owner auth.
    - Expected: `PERMISSION_DENIED`

12. **System-Only Override (Pillar 7)**
    - Payload: Trying to manually client-write static fallback items or system ratings.
    - Expected: `PERMISSION_DENIED`
