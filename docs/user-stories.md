# User Stories and Software Behavior

This document describes common user workflows in MoaFinder, including the minimum role required, expected behavior, and outcomes.

---

## Table of Contents

1. [User Registration](#1-user-registration)
2. [Email Verification](#2-email-verification)
3. [User Login](#3-user-login)
4. [Password Reset](#4-password-reset)
5. [Creating an Organization](#5-creating-an-organization)
6. [Requesting Membership to an Organization](#6-requesting-membership-to-an-organization)
7. [Approving Organization Membership](#7-approving-organization-membership)
8. [Creating a New Location](#8-creating-a-new-location)
9. [Updating a Location](#9-updating-a-location)
10. [Deleting a Location](#10-deleting-a-location)
11. [Uploading Pictures for Events/Locations](#11-uploading-pictures-for-eventslocations)
12. [Using Pictures Uploaded by Organization Members](#12-using-pictures-uploaded-by-organization-members)
13. [Creating an Event](#13-creating-an-event)
14. [Updating an Event](#14-updating-an-event)
15. [Deleting an Event](#15-deleting-an-event)
16. [Submitting an Event for Review](#16-submitting-an-event-for-review)
17. [Approving/Rejecting an Event](#17-approvingrejecting-an-event)
18. [Approving an Organization](#18-approving-an-organization)
19. [Assigning Users to Organizations](#19-assigning-users-to-organizations)
20. [Changing User Roles](#20-changing-user-roles)

---

## 1. User Registration

**Minimum Role Required:** None (public access)

**Preconditions:**
- User has a valid email address
- User is not already registered

**Steps:**
1. User navigates to `/register`
2. User fills out the registration form:
   - Name (required)
   - Email (required, must be valid format)
   - Password (required, minimum 12 characters with uppercase, lowercase, number, and special character)
3. User submits the form

**Behavior:**
- System creates a new user with:
  - `role: 'organizer'` (forced default, cannot be changed during registration)
  - `disabled: true` (account is disabled until email verification)
  - `organizations: []` (empty - user has no organizations)
- System generates a verification token (valid for 24 hours)
- System sends a verification email to the user's email address

**Outcome:**
- User account is created but **disabled**
- User receives verification email
- User **cannot log in** until email is verified
- **No organization is created** - user must be assigned to an organization by an admin later

---

## 2. Email Verification

**Minimum Role Required:** None (token-based access)

**Preconditions:**
- User has registered and received verification email
- Verification token is not expired (24-hour validity)

**Steps:**
1. User clicks the verification link in their email
2. User is redirected to `/verify-email?token=<token>`

**Behavior:**
- System validates the token hash
- If valid and not expired, system updates user:
  - `disabled: false`
  - `emailVerified: true`

**Outcome:**
- User can now log in
- User still has no organizations assigned
- User must contact admin to be assigned to an organization before creating content

---

## 3. User Login

**Minimum Role Required:** Verified user account

**Preconditions:**
- User has verified their email
- User account is not disabled

**Steps:**
1. User navigates to `/login`
2. User enters email and password
3. User submits the form

**Behavior:**
- System validates credentials
- If valid, system creates a session token (30-minute expiration)
- System sets authentication cookie

**Outcome:**
- User is redirected to dashboard
- Session expires after 30 minutes of inactivity
- If session expires, user is redirected to `/login?expired=1`

---

## 4. Password Reset

**Minimum Role Required:** None (email-based access)

**Preconditions:**
- User has a registered account

**Steps:**
1. User navigates to `/forgot-password`
2. User enters their email address
3. User receives reset email and clicks the link
4. User enters new password on `/reset-password?token=<token>`

**Behavior:**
- System generates reset token
- System sends email with reset link
- On submission, system validates token and updates password

**Outcome:**
- User's password is updated
- User can log in with new password

---

## 5. Creating an Organization

**Minimum Role Required:** `organizer` (any authenticated user)

**Preconditions:**
- User is logged in

**Steps:**
1. User navigates to Dashboard → "Neue Organisation" in sidebar
2. User fills in organization details:
   - Name (required)
   - Email (required)
   - Contact person (optional)
   - Phone (optional)
   - Website (optional)
   - Address (optional)
3. User submits the form

**Behavior:**
- System creates organization with:
  - `approved: false` (unapproved by default)
  - `owner: <current user ID>`
- Owner is automatically considered a member of the organization

**Outcome:**
- Organization is created but **not approved**
- Organization appears in the system but events cannot be publicly approved
- Admin or editor must approve the organization before events can be published

**Frontend Location:** `/dashboard/organization/new`

---

## 6. Requesting Membership to an Organization

**Minimum Role Required:** `organizer`

**Preconditions:**
- User is logged in
- Organization exists and is approved
- User is not already a member

**Steps:**
1. User navigates to Dashboard → "Organisationen durchsuchen"
2. User finds the organization they want to join
3. User clicks "Mitgliedschaft anfragen"
4. User optionally adds a message explaining why they want to join
5. User confirms the request

**Behavior:**
- System adds a membership request to `organization.membershipRequests[]` with:
  - `user: <user ID>`
  - `status: 'pending'`
  - `requestedAt: <current timestamp>`
  - `message: <optional message>`

**Outcome:**
- Request is visible to admin/editor in the "Profile der Organisationen" page
- User sees "Anfrage ausstehend" status on the organization card
- User awaits approval or rejection

**Frontend Location:** `/dashboard/organization/browse`

---

## 7. Approving Organization Membership

**Minimum Role Required:** `editor`

**Preconditions:**
- User is admin or editor
- Membership request exists with status 'pending'

**Steps:**
1. Admin/editor navigates to Redaktion → "Profile der Organisationen"
2. Admin/editor sees pending membership requests highlighted at the top
3. Admin/editor clicks "Genehmigen" or "Ablehnen" for each request

**Behavior:**
- If approved:
  - User is added to the organization's member list
  - User's `organizations[]` array is updated to include this organization
  - Request status changes to 'approved'
- If rejected:
  - Request status changes to 'rejected'
  - User is not added to the organization

**Outcome:**
- Approved users can now create content for this organization
- Rejected users remain without access to the organization

**Frontend Location:** `/dashboard/editor/organizations`

---

## 8. Creating a New Location

**Minimum Role Required:** `organizer` (with at least one organization)

**Preconditions:**
- User is logged in
- User belongs to at least one organization

**Steps:**
1. User navigates to `/dashboard/places/new` (organizer) or `/dashboard/editor/places/new` (editor/admin)
2. User fills in location details:
   - Name (required)
   - Short name (required, max 40 characters)
   - Description (optional, max 1000 characters)
   - Address (street, number, postal code, city)
   - Organizations (which organizations can use this location)
   - Image (optional)
   - Map position (optional)
   - Opening hours (optional)
3. User submits the form

**Behavior:**
- System creates the location
- Location is linked to selected organization(s)
- If user is not admin, their organization(s) are automatically assigned
- Location becomes available to all members of the assigned organizations

**Outcome:**
- Location is created and immediately available
- All members of the location's organizations can use it for events
- Location appears in location dropdown when creating events (filtered by organization)

---

## 9. Updating a Location

**Minimum Role Required:** `organizer` (for own organization's locations) / `admin` (for all)

**Preconditions:**
- User is logged in
- Location belongs to at least one of the user's organizations (or user is admin)

**Steps:**
1. User navigates to the location edit page
2. User modifies the desired fields
3. User saves changes

**Behavior:**
- System validates that user has permission (location's organizations overlap with user's organizations)
- System updates the location

**Outcome:**
- Location is updated
- Changes are immediately visible
- Events using this location will show updated information

---

## 10. Deleting a Location

**Minimum Role Required:** `organizer` (for own organization's locations) / `admin` (for all)

**Preconditions:**
- User is logged in
- Location belongs to at least one of the user's organizations (or user is admin)

**Steps:**
1. User navigates to the location management page
2. User clicks delete on the location
3. User confirms deletion

**Behavior:**
- System validates user has permission
- System deletes the location

**Outcome:**
- Location is permanently removed
- **Warning:** Events using this location may become orphaned

---

## 11. Uploading Pictures for Events/Locations

**Minimum Role Required:** `organizer` (with at least one organization)

**Preconditions:**
- User is logged in
- User belongs to at least one organization

**Steps:**
1. User navigates to media page (`/dashboard/media`) or uses image upload in event/location form
2. User selects an organization for the image
3. User drags and drops or selects an image file
4. User provides an alt text (required for accessibility)
5. User uploads the image

**Behavior:**
- System validates:
  - File type (JPG, PNG, WebP, GIF allowed)
  - File size (max 5 MB by default)
  - Alt text is provided
  - Organization is selected
- System uploads and processes the image:
  - Creates multiple sizes (thumbnail: 400x300, card: 768x1024, tablet: 1024px wide)
- System stores:
  - `organization: <selected org ID>`
  - `owner: <current user ID>`
  - `alt: <alt text>`

**Outcome:**
- Image is uploaded and available in the media library
- Image is associated with the selected organization
- Only members of that organization can use this image for their content

---

## 12. Using Pictures Uploaded by Organization Members

**Minimum Role Required:** `organizer` (member of the same organization)

**Preconditions:**
- User is logged in
- User belongs to the same organization as the image owner

**Steps:**
1. When creating/editing an event or location, user opens the image selector
2. User chooses "Select existing image" mode
3. User sees a dropdown of available images from their organizations
4. User selects the desired image

**Behavior:**
- System filters available images by the user's organizations
- Media items are only shown if `media.organization` matches one of the user's organizations
- Admins see all images regardless of organization

**Outcome:**
- User can reuse images uploaded by other members of the same organization
- This enables shared media libraries within organizations
- Cross-organization image sharing is not possible (except for admins)

---

## 13. Creating an Event

**Minimum Role Required:** `organizer` (with at least one organization)

**Preconditions:**
- User is logged in
- User belongs to at least one organization
- Organization has at least one location assigned

**Steps:**
1. User navigates to `/dashboard/events/new`
2. If user has multiple organizations, user selects which organization hosts the event
3. User fills in event details:
   - Title (required, max 70 characters)
   - Subtitle/Teaser (optional, max 100 characters)
   - Event type (einmalig/täglich/wöchentlich/monatlich)
   - Start date and time (required)
   - End date (optional)
   - Location (required, filtered by organization)
   - Description (required, max 1000 characters)
   - Image (optional)
   - Tags (optional, max 6)
   - Registration info (optional)
4. User chooses to save as draft or submit for review

**Behavior:**
- If user has 1 organization: organizer is auto-assigned (no dropdown shown)
- If user has multiple organizations: dropdown appears to choose hosting org
- Location dropdown only shows locations belonging to the selected organization
- Event is created with:
  - `organizer: <selected organization ID>` (NOT user ID!)
  - `status: 'draft'` or `'pending'` based on user choice

**Outcome:**
- Event is created
- Draft events are only visible to the user
- Pending events await editorial review
- Event is **not publicly visible** until approved by editor/admin

---

## 14. Updating an Event

**Minimum Role Required:** `organizer` (for own organization's events) / `admin` (for all)

**Preconditions:**
- User is logged in
- Event's organizer (organization) matches one of the user's organizations (or user is admin)

**Steps:**
1. User navigates to the event edit page
2. User modifies the desired fields
3. User saves changes

**Behavior:**
- System validates user has permission (event's organizer org is in user's organizations)
- System updates the event
- If event was approved and significant changes are made, status may need re-approval

**Outcome:**
- Event is updated
- Changes are immediately visible (subject to status)

---

## 15. Deleting an Event

**Minimum Role Required:** `organizer` (for own organization's events) / `admin` (for all)

**Preconditions:**
- User is logged in
- Event's organizer (organization) matches one of the user's organizations (or user is admin)

**Steps:**
1. User navigates to the event management page
2. User clicks delete on the event
3. User confirms deletion

**Behavior:**
- System validates user has permission
- System deletes the event

**Outcome:**
- Event is permanently removed from the system
- Event is no longer visible on public pages

---

## 16. Submitting an Event for Review

**Minimum Role Required:** `organizer`

**Preconditions:**
- User has created an event in draft status
- Event has all required fields filled

**Steps:**
1. User opens the event for editing
2. User clicks "Submit for Review" (Zur Prüfung einreichen)

**Behavior:**
- System changes event status from `draft` to `pending`
- Event becomes visible to editors/admins for review

**Outcome:**
- Event awaits editorial approval
- Event remains invisible to public
- Editors/admins can see pending events in their review queue

---

## 17. Approving/Rejecting an Event

**Minimum Role Required:** `editor`

**Preconditions:**
- User is admin or editor
- Event is in `pending` status
- Event's organization is approved

**Steps:**
1. Editor/admin navigates to editorial review page
2. Editor/admin reviews the event details
3. Editor/admin approves or rejects the event

**Behavior:**
- If approved:
  - Event status changes to `approved`
  - Event becomes publicly visible (if not expired)
- If rejected:
  - Event status may return to `draft`
  - Organizer is notified of rejection

**Outcome:**
- Approved events appear on the public calendar/map
- Rejected events need revision before resubmission

---

## 18. Approving an Organization

**Minimum Role Required:** `editor`

**Preconditions:**
- User is admin or editor
- Organization exists with `approved: false`

**Steps:**
1. Editor/admin navigates to organization management
2. Editor/admin reviews the organization
3. Editor/admin sets `approved: true`

**Behavior:**
- Organization's `approved` field is set to `true`

**Outcome:**
- Organization's events can now be approved and published
- Members can fully utilize the platform
- Without approval, events from this organization cannot be published

---

## 19. Assigning Users to Organizations

**Minimum Role Required:** `admin`

**Preconditions:**
- Admin is logged in
- User and organization exist

**Steps:**
1. Admin navigates to the **Payload Admin Panel** (backend CMS at `/admin`)
2. Admin goes to Users collection
3. Admin opens user's profile
4. Admin selects organizations from the `organizations` relationship field
5. Admin saves changes

**Behavior:**
- User's `organizations[]` array is updated
- User gains access to:
  - Locations belonging to those organizations
  - Events created by those organizations
  - Media uploaded for those organizations

**Outcome:**
- User can now create and manage content for the assigned organizations
- Note: This is done via the Payload Admin Panel, not the custom frontend dashboard
- Alternative: Users can request membership via the browse organizations page, which editors/admins can then approve

---

## 20. Changing User Roles

**Minimum Role Required:** `admin`

**Preconditions:**
- Admin is logged in
- User exists

**Steps:**
1. Admin navigates to user management
2. Admin changes the user's role dropdown (organizer/editor/admin)
3. Admin saves changes

**Behavior:**
- User's `role` field is updated
- New permissions take effect immediately

**Outcome:**
- User has new role with corresponding permissions:
  - `organizer`: Can manage own organization's content
  - `editor`: Can approve organizations and events
  - `admin`: Full access to everything

---

## Quick Reference: Actions by Role

| Action | Organizer | Editor | Admin |
|--------|-----------|--------|-------|
| Register account | ✅ | ✅ | ✅ |
| Create organization (unapproved) | ✅ | ✅ | ✅ |
| Approve organization | ❌ | ✅ | ✅ |
| Create location (if has org) | ✅ | ✅ | ✅ |
| Update/delete own org locations | ✅ | ✅ | ✅ |
| Update/delete any location | ❌ | ❌ | ✅ |
| Upload media (if has org) | ✅ | ✅ | ✅ |
| Use org member's media | ✅ | ✅ | ✅ |
| Create event (draft/pending) | ✅ | ✅ | ✅ |
| Approve events | ❌ | ✅ | ✅ |
| Update/delete own org events | ✅ | ✅ | ✅ |
| Update/delete any event | ❌ | ❌ | ✅ |
| Assign users to organizations | ❌ | ❌ | ✅ |
| Change user roles | ❌ | ❌ | ✅ |
| Delete organizations | ❌ | ❌ | ✅ |
| Delete users | ❌ | ❌ | ✅ |

---

## Related Documentation

- [Roles and Permissions](roles-and-permissions.md) - Detailed permission matrix
- [Backend README](../backend/README.md) - Data model overview
