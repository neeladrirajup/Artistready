# Artistready admin console requirements

**Status:** Product requirements draft  
**Audience:** Product, design, application, API, and database teams  
**Scope:** An authenticated admin area for managing artist profiles, catalogs, profile fields, photos, and messages.

## 1. Goal

Give authorized Artistready staff one place to find every artist, correct or moderate profiles, manage the choices shown during profile creation, and contact users. The admin area should use the same visual language and artist cards as Discover, with clearly separated management controls.

This document specifies the requested behavior. It does not grant admin access to ordinary artist accounts or make private artist information public.

## 2. Access and roles

| Role | Allowed actions |
| --- | --- |
| Artist | Manage their own profile through the existing artist experience. No admin access. |
| Moderator | View and search profiles; edit permitted profile content; hide or restore profiles; remove photos; message users. |
| Catalog manager | Manage crafts, categories, roles, and configurable profile fields. Cannot view private profile answers merely because they manage field definitions. |
| Super admin | All admin actions, including profile deletion and granting or revoking admin roles. |

- Admin identity must be assigned by an existing super admin through a protected server-side process. There must be no public registration path or browser-side role switch that grants admin access.
- Every admin page, API operation, and database operation must verify the signed-in identity and required permission on the server. A hidden button is not authorization.
- Require a fresh sign-in or equivalent verification before destructive actions and admin role changes.
- Log admin access to sensitive records and all changes with actor, subject, action, time, reason, and before/after values where appropriate. Do not put passwords, OTPs, or private messages in audit records.
- Respect existing preference visibility (`all`, verified managers, or only the artist). Moderators do not automatically become verified managers. A narrowly authorized support workflow may expose private information only when necessary and must log that access.

## 3. Admin navigation and page layout

Proposed routes: `/admin`, `/admin/artists`, `/admin/categories`, `/admin/fields`, `/admin/messages`, and `/admin/audit`.

The Artists page should resemble Discover: the existing brand, typography, colors, search, filters, artist image cards, and responsive grid. Add a compact admin navigation and a visible status badge to each card. Admin actions appear in a card menu and on the artist detail page; they must not be confused with public actions such as Save or Share.

The list includes **published, hidden, incomplete, and deleted-pending-purge** profiles according to the admin's permission. Search by artist name, profile ID, craft, city, and account email or phone if the role permits it. Filter by publication status, craft, location, and last updated date. Paginate or progressively load results, show a result count, and provide empty, loading, and error states. On mobile, use the same card layout with an accessible action menu.

## 4. Artist profile management

### 4.1 View and edit

- Opening a card shows the artist profile with its current status and edit controls for each existing section: Essentials, About, roles, skills, languages, photos, showreels, credits, training, recognition, measurements, clothing and footwear, preferences, booking and availability, and education. Where a section contains private information, show only what that admin role may access.
- Admin editing must follow the same field validation and allowed values as artist editing. Show who last changed the section and when. Require a reason for an admin change; send the artist an in-app notice describing the change and a way to raise a correction request.
- Save only the section being edited. Detect concurrent changes and ask the admin to refresh or resolve a conflict instead of silently overwriting an artist's newer edit.
- An admin must not be able to change an artist's login credentials or impersonate the artist from the profile editor.

### 4.2 Hide and restore

- **Hide profile** removes it immediately from Discover, search results, and public profile links while preserving the account and profile data. The owner sees the status and reason in their own profile area. An authorized admin can restore it.
- Require a reason and a confirmation before hiding. Record both hide and restore in the audit log. Private direct links must not reveal hidden profiles to other users.

### 4.3 Delete

- **Delete profile** is a super-admin action with a typed confirmation and reason. First mark it deleted and remove it from all discovery and public views. Define a recovery period (proposed: 30 days) during which a super admin may restore it.
- After the recovery period, a separate purge process removes profile data and associated media according to the approved retention policy. Account deletion, message history, legal holds, and backup expiry must be specified before permanent purge is enabled.
- The UI must clearly distinguish Hide, Delete, and Restore. Never perform permanent deletion from a single card-menu click.

## 5. Crafts, categories, and casting roles

- Catalog manager can add and edit crafts such as **Music Director** and **Choreographer**, including display name, unique stable code/slug, optional description, icon, sort order, and active/inactive status.
- Categories shown in Discover and crafts shown during profile creation must come from the same managed catalog. New entries should appear in both relevant places after publication without a code deployment.
- Each craft may have its own selectable casting/job roles. The manager can add, rename, reorder, and deactivate roles for that craft. Existing profiles retain their assigned value when a role is renamed or deactivated; the admin is shown how many profiles use it.
- Prevent duplicate names/codes and accidental deletion of a category with assigned profiles. Deactivation hides it from new selection while keeping historical profile data and search/display labels intact.
- A draft change is previewable before publication. Publishing records the catalog version and actor.

## 6. Manage fields in profile sections

- Catalog manager can add an **admin-defined field** to any existing profile section, including Measurements and Artist preferences and boundaries. They can edit its label, help text, option labels, order, required/optional setting, visibility, and whether artists may edit it.
- Supported initial field types: short text, long text, number with unit and range, date, yes/no, single choice, and multiple choice. Define validation and maximum lengths at creation. Reject executable markup and unsafe URLs.
- New fields start optional for existing profiles. Making a field required must include a migration plan for existing records; it must not make existing profiles unsavable. Replacing or removing a choice must preserve historical answers or require an explicit data migration.
- A field's internal code and stored type become immutable after publication. Renaming a label is allowed. Changing meaning or type requires a new field and a reviewed migration. Use archive/restore rather than immediately erasing a field with values.
- Field visibility choices should include public, verified managers, and artist only. Preference answers default to artist only; a field definition cannot override an artist's stricter preference visibility.
- Provide a preview of the create-profile form, section editor, and profile display for desktop and mobile before publishing a field change.
- Existing core attributes continue to use their dedicated relational columns/tables. Admin-defined fields use a versioned field-definition table and typed relational value rows, one scalar value per artist/field (or one row per selected option for multiple choice). Do not store the whole profile or field answers as a JSON blob.
- APIs must return field metadata and values in JSON for the UI, while database reads and writes use PostgreSQL stored procedures. The application must not issue direct `SELECT`, `INSERT`, `UPDATE`, or `DELETE` statements for these operations.

## 7. Photo moderation

- Admin can review an artist's uploaded photos in their profile, with thumbnail, upload date, file size, and whether a photo is the cover or pinned image.
- Moderator can remove a photo after entering a reason and confirming. Removal must stop it appearing in the artist profile and public media URLs, and clear or replace any cover/pinned reference to it in the same transaction.
- Notify the artist that the photo was removed and why, without sending the removed image. Record the media ID and action in the audit log. The storage object should be purged under the media retention policy; do not leave publicly accessible orphan files.
- Show an explicit warning when removing the last profile photo or the cover photo. Admin must not upload replacement photos on an artist's behalf without a separate agreed workflow.

## 8. Messages to users

- Moderator or super admin can send an **in-app message** to one artist from the profile page or Messages page. Show recipient identity before sending, require a subject and message body, and identify the sender as Artistready Admin. Do not support impersonation.
- Recipient sees the message in the existing app inbox/notification area. Record sent, delivered, and read timestamps when available. Show clear failure/retry states; retries must not create duplicate messages.
- Keep a conversation history visible to authorized staff and the recipient. Provide a reply path or clearly mark the message as one-way. Apply rate limits, content length limits, and basic abuse controls.
- First release is one-to-one in-app messaging. Bulk messages, email, SMS, attachments, and automated campaigns require separate requirements and opt-in rules before implementation.

## 9. Data and integration requirements

The current application has some categories/crafts defined in code, and its data documentation covers more than one storage stage. Before implementation, select the active local and hosted storage targets and migrate hard-coded options into the catalog without losing existing artist choices. The local PostgreSQL path should follow the project's stored-procedure rule for every database read and write. Any hosted path must provide equivalent authorization, validation, and behavior before this admin area goes live.

Minimum data model additions:

| Area | Suggested records |
| --- | --- |
| Admin access | Admin grants and role permissions |
| Catalog | Crafts/categories, craft roles, catalog publication versions |
| Fields | Section field definitions, choices, typed artist field values, publication versions |
| Moderation | Profile status/history, photo removal records, deletion/recovery dates |
| Messaging | Conversations, messages, recipients, delivery/read status |
| Accountability | Immutable admin audit events |

Every mutation should be transactional where related rows or media references change together. Use stable IDs, timestamps in UTC, foreign keys, and indexes for admin list filtering. Media bytes stay in object storage; the database stores ownership, keys, and metadata. Backups and restore procedures must cover both database records and media.

## 10. Acceptance criteria

1. An ordinary artist cannot open an admin route or call any admin API. Each admin role can access only its permitted actions.
2. Admin Artists shows all relevant profile statuses in a Discover-style responsive grid. Search and filters return correct records; public Discover excludes hidden and deleted profiles.
3. A moderator can edit an allowed section, hide a profile, restore it, and remove a photo. Each action updates the artist-facing app appropriately, notifies the artist where specified, and creates an audit event.
4. Only a super admin can delete and restore a deleted profile. A deleted profile is unavailable through public links and can be recovered during the configured recovery period.
5. A catalog manager can publish Music Director and Choreographer and assign roles to them. Artists can then select those crafts; Discover displays and filters them without code changes.
6. A catalog manager can publish a new optional Measurement or Preference field. It appears in profile creation, section edit, admin view, and the permitted profile view; existing profiles still load and save.
7. Removed photos disappear from profile, cover/pinned display, and public delivery, with no broken image left in the UI.
8. An admin can send one in-app message to an artist; the artist can view it, and the admin can see delivery state without duplicate sends.
9. Concurrent artist/admin edits do not silently overwrite one another. Failed writes leave data consistent and show a usable error.
10. All admin database operations are executed through stored procedures in the selected PostgreSQL environment, and API responses are JSON.

## 11. Decisions to confirm before implementation

- Recovery period and final purge/backup retention for deleted profiles and photos (30 days proposed).
- Which staff receive Moderator, Catalog manager, and Super admin access, and how an initial super admin is provisioned.
- Whether admin messages allow user replies in the first release (recommended: yes).
- Whether users should be notified for every admin edit or only visible/moderation changes (recommended: every admin edit).
- Whether admin-defined fields are allowed in every section at launch or rolled out first to Measurements and Preferences; the data model should support every section either way.
