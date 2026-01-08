# User Roles, Organizations, and Permissions

This document explains how user roles, organizations, locations, and events work together in MoaFinder.

## The Three User Roles

| Role | German Name | Description |
|------|-------------|-------------|
| **admin** | Admin | Full access to everything. Can manage all users, organizations, locations, events. Can approve/reject anything and delete anything. |
| **editor** | Redaktion | Can approve organizations and events. Similar to admin but **cannot delete organizations** and **cannot change user roles**. |
| **organizer** | Organizer | Default role for all new users. Can only manage content within their assigned organizations. |

---

## How Organizations Work

### Creation & Approval Flow

1. **Any authenticated user** can create a new organization, but it starts as **unapproved** (`approved: false`)
2. Only **admin or editor** can set `approved: true`
3. **Unapproved organizations cannot have their events approved** (they remain in draft/pending status)

### Organization Ownership

- Each organization has an **owner** (the user who created it)
- The owner is stored in the `owner` relationship field
- Owners get special update access if they're editors

### Organization-User Relationship

- A **user can belong to multiple organizations** (via `user.organizations[]`)
- An **organization can have multiple members**
- Only **admins can assign users to organizations** (via the admin panel)

---

## Is an Organization Created When a User Registers?

**No!** Organizations are NOT automatically created during registration.

**New user registration flow:**

1. User fills out registration form (name, email, password)
2. User is created with:
   - `role: 'organizer'` (forced default)
   - `disabled: true` (until email verification)
   - `organizations: []` (empty - no organizations)
3. Verification email is sent
4. User verifies email → `disabled` becomes `false`
5. **Admin must manually assign the user to an organization** before they can do anything useful

See `backend/src/app/api/users/register/route.ts`:
```typescript
// Note: Organizations are now created only by admins.
// New users start without any organization and must be assigned by an admin.
```

---

## Locations (Veranstaltungsorte)

Locations are **shared resources** that can belong to **multiple organizations**.

| Action | Who Can Do It |
|--------|---------------|
| **Read all locations** | Everyone (public) |
| **Create location** | Admin, Editor, or Organizer (if they belong to at least 1 org) |
| **Update location** | Admin (any), or users whose organizations include this location |
| **Delete location** | Admin (any), or users whose organizations include this location |

**Key behavior:**

- Locations have an `organizations[]` array (many-to-many relationship)
- When a non-admin creates a location, their organization(s) are automatically assigned
- Users can only see/select locations **belonging to their organizations** when creating events (unless admin)

---

## Events (Veranstaltungen)

| Action | Who Can Do It |
|--------|---------------|
| **Read approved & non-expired** | Everyone (public) |
| **Create event (draft/pending)** | Any organizer with at least 1 organization |
| **Create event (approved)** | Admin or Editor only |
| **Update/Delete** | User whose organization matches the event's `organizer` field |
| **Approve events** | Editor, Admin |

**Event workflow:**

1. Events have a `status`: `draft` → `pending` → `approved`
2. The **organizer** field on an event points to an **Organization** (not a user!)
3. If user has 1 org → auto-assigned silently
4. If user has multiple orgs → dropdown appears to choose which org hosts the event

---

## Who Can Change What - Summary Table

| Resource | Action | Admin | Editor | Organizer |
|----------|--------|-------|--------|-----------|
| **Users** | Create/Read/Update/Delete | ✅ All | ❌ Own only | ❌ Own only |
| **Users** | Change role | ✅ | ❌ | ❌ |
| **Users** | Assign to organizations | ✅ | ❌ | ❌ |
| **Organizations** | Create | ✅ | ✅ | ✅ (unapproved) |
| **Organizations** | Approve | ✅ | ✅ | ❌ |
| **Organizations** | Update | ✅ All | ✅ Own/member only | ❌ |
| **Organizations** | Delete | ✅ | ❌ | ❌ |
| **Locations** | Create | ✅ | ✅ | ✅ (if has org) |
| **Locations** | Update/Delete | ✅ All | ✅ Own orgs | ✅ Own orgs |
| **Events** | Create (draft/pending) | ✅ | ✅ | ✅ (if has org) |
| **Events** | Create/Set approved | ✅ | ✅ | ❌ |
| **Events** | Update/Delete | ✅ All | ✅ Own orgs | ✅ Own orgs |

---

## Visual Data Flow

### User Registration (No Organization Created)

```
Register → Create User (organizer, disabled) → Verify Email
               ↓
         NO ORGANIZATION CREATED!
         Admin must assign user to organization later
```

### Relationship Model

```
User ────< organizations (hasMany) >──── Organization
                                              │
                                              ↓ owner
                                            User

Location ──< organizations (hasMany) >── Organization

Event ──< organizer >── Organization
      ──< location >── Location
```

**Key points:**

1. A user's `organizations` array determines what locations/events they can manage
2. Locations require at least one organization; they become available to all members of those orgs
3. Events tie to an organizer org; the location dropdown filters by that user's orgs
4. Organizations must be approved before their events can be approved

---

## Dashboard Access by Role

| Dashboard Section | Admin | Editor | Organizer |
|-------------------|-------|--------|-----------|
| Profile & Password | ✅ | ✅ | ✅ |
| Organization Profile | ✅ | ✅ | ✅ |
| Events (own orgs) | ✅ | ✅ | ✅ |
| Locations (own orgs) | ✅ | ✅ | ✅ |
| **Redaktion** (all orgs, approvals) | ✅ | ✅ | ❌ |
| **Admin** (users, settings) | ✅ | ❌ | ❌ |

---

## Related Files

- `backend/src/collections/Users.ts` - User collection with role field and access control
- `backend/src/collections/Organizations.ts` - Organization collection with approval workflow
- `backend/src/collections/Locations.ts` - Locations with multi-org support
- `backend/src/collections/Events.ts` - Events with organizer relationship and status workflow
- `backend/src/app/api/users/register/route.ts` - Registration endpoint (no org creation)
- `frontend/src/layouts/DashboardLayout.jsx` - Role-based sidebar navigation
- `frontend/src/pages/dashboard/DashboardRoutes.jsx` - Role-guarded routes
