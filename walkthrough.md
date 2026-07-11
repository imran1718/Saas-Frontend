# Walkthrough: Module 2 - Roles & Permissions (RBAC Engine)

We have successfully completed Module 2! This establishes a robust Role-Based Access Control mechanism across both the backend and frontend.

## What Was Built

### 1. Database & Schema Updates
- Seeded the `permissions` table with a comprehensive canonical list grouped by module (e.g., `order`, `shipment`, `user`).
- Updated the `roles` table to include `is_editable` and `description` fields, marking system roles like `owner` as non-editable.

### 2. Backend Security & RBAC Engine
- **Privilege Escalation Guards**: Enforced in `role.service.js`. A user cannot grant permissions they do not possess themselves, nor can they assign the reserved Platform Admin permissions (`courier.manage`, `subscription.manage`). Trying to do so results in an explicit HTTP 422/403.
- **System Protection**: Roles with `is_editable=false` cannot be updated or deleted.
- **Cache-Accelerated lookups**: To prevent joining multiple tables on every API call, user permissions are extracted during authentication and cached in Redis with a 5-minute TTL. The cache automatically invalidates when a role is modified.
- **Route Protection**: Implemented a reusable `can('module.action')` middleware that seamlessly plugs into any Express route.

### 3. API Endpoints (OpenAPI)
Created standard REST endpoints and documented them in `docs/roles.openapi.yaml`:
- `GET /api/v1/permissions`: Retrieves the catalogue grouped by module.
- `GET/POST/PUT/DELETE /api/v1/roles`: Full role CRUD.

### 4. Frontend Implementation
- **State Management**: Updated `authStore.ts` to persist the loaded `permissions` array for the current user session.
- **Helper Hook**: Added a `usePermission(key)` React hook that returns true/false, making it trivial to hide or show buttons contextually.
- **Role Administration Pages**:
  - `settings/roles`: A dashboard table displaying roles, assignments, and system-locked status.
  - `settings/roles/new` & `settings/roles/[roleId]`: The create/edit forms.
  - **PermissionMatrix Component**: A responsive checkbox grid that groups permissions logically by module, complete with "Select All" toggles.

## Verification
- Unit tests run against `role.service.js` confirm that privilege escalation is completely blocked, and system roles cannot be deleted.
- The Redis integration is active and tied to the authentication flow.
- Database migrations were successfully executed against the local PostgreSQL container.
