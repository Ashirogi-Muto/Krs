# Custom access roles — plan (8 Oct 2026). BUILT and deployed 8 Oct 18:47 UTC (website/AGENT.md §20)

**Owner's request:**
- **Account types** become: Super Admin, Admin, Team member, Judge, Participant.
- **Team members** get *custom access roles*, created and managed in the CMS.
- **Who manages roles:** Super Admin, Admin and **team leads** can create roles.
- **What a role grants:** fine-grained control over every CMS page.

Approved by the owner on 8 Oct ("go ahead") and built as below; details and deviations in website/AGENT.md §20.

## 0. Owner's decisions (8 Oct 2026); these override the sections below where they differ

1. **Team leads** = team members holding **"Manage access roles"**.
   - **Who grants it:** only Super Admin and Admin, and it can never be passed on by a team lead.
   - **Creating and editing roles:** they may create roles and edit **any** role, as long as every permission in that
     role, before **and** after the edit, is one they hold themselves.
   - **No widening their own access:** they can't edit a role they hold.
   - **Assigning:** they may give roles to other team members, but not to themselves, not to admins, and not to
     Judges or Participants.
2. **Grantable admin screens:** Page visibility, Participants (list/confirm/lock/unlock/delete participant accounts),
   and content deletes (projects, posts, resources, people).
   - **Team accounts stays admins-only**, so team leads assign roles from the **role itself** (a "People with this
     role" list on the Access role page; see §2).
   - **Retention and Staff & admin texts** stay owner/admins-only.
3. **Judges:** unchanged for now (no CMS access); judging comes later.
4. **Granularity:** per CMS page **and per document**. A role can be limited to chosen documents (see §2a).
5. **Defaults taken (owner may override):**
   - "assigned events" scope also limits **submissions** and exports, not only registrations/check-in;
   - presets are normal, editable roles;
   - the old `roles` field is removed only after the owner confirms.

## 1. What changes for people

| Account type | Today | After |
|---|---|---|
| Super Admin | everything | unchanged |
| Admin | everything except the owner-only items | unchanged |
| Team member (`STAFF`) | access = 15 fixed roles ticked on the account | access = the **access roles** assigned to the account (union of all of them) |
| Judge | no CMS access | per Q3 |
| Participant | portal only | unchanged |

**Day one:** every account keeps exactly the access it has today. The 15 fixed roles become 15+ *preset* access roles
with identical rights (§7), and existing accounts are assigned their presets automatically.

## 2. The permission model

**Grants are fixed keys.** A role is a list of permission keys taken from a fixed catalogue, defined in code as one
constant (`lib/permissions/catalogue.ts`), plus a few scopes. There is no free-form JSON, so a role can only ever hold
keys the code knows. Anything unknown or missing means no access (fail closed).

**One section per CMS page.** The catalogue is grouped exactly like the CMS sidebar, one section per CMS page:

| CMS page | Grantable permissions |
|---|---|
| **AURIX → Event registrations** | View (scope: all events / only the account's assigned events) · see contacts (leader + member email & phone) · see leader phone only · see student IDs & ID verification · see money (amount due, payment reference, verified at) · see/edit staff notes · edit team status · edit ID verification + reason · edit payment status + verified at · edit team details (name, leader, college, members, event) · edit check-in fields |
| AURIX → Student IDs | View files (= "see student IDs") · edit (replace file) |
| AURIX → Submissions | View (scope as registrations) · download files · set review status & notes · delete |
| AURIX → Events | View drafts · edit texts · edit locked fields (dates, fees, team sizes, closing times, prize pool, payment label, flags) |
| AURIX → Announcements | View · create · edit · delete |
| AURIX → Email queue | View |
| AURIX → Form submissions (join/contact) | View · mark handled |
| AURIX → Short links | View · create · edit · delete |
| Content → Pages | View drafts · view history · create · edit/publish · delete |
| Content → Projects / Posts / Resources / People | View unpublished · create · edit (delete stays admins-only today; grantable per Q2) |
| Content → Gallery, Media | View · create · edit · delete |
| Website settings (globals) | Edit, one checkbox each: Site settings, Navigation, Event pages, Labels & messages, Participant portal texts, Page texts, Legal pages, AURIX schedule |
| Tools | Check-in (all events / assigned events) · Payment matching · ID re-upload screen + send emails · CSV exports: full / finance / check-in / roster (columns still follow the "see …" groups) |
| Dashboard panels | Overview · Finance · Registration desk · Your events · Counts · Totals |
| Access roles (new) | Manage access roles (§4) |

**Never grantable, enforced in code:**
- **Create** on records only the site makes (registrations, student IDs, submissions, email queue, form submissions).
- **Deleting** registrations, student IDs, events, accounts or the email queue, and creating events.
- **Retention**, **Staff & admin texts**, and editing the owner's account.
- Admin-only screens (Participants, Team accounts, Page visibility) unless Q2 says otherwise.

**Sidebar follows permissions.** Each collection's sidebar entry (`admin.hidden`) is derived from the same keys
("View" on that page), so it can't drift from the access rules.

### The "Access roles" collection (Accounts group)

| Field | Type | Notes |
|---|---|---|
| name | text, unique | e.g. "Registration desk" |
| description | textarea | what the role is for |
| permissions | `select` hasMany, options = the catalogue | stored in its own table; Payload rejects any value not in the options |
| registrationScope | select: all events / assigned events | applies to registrations, submissions, check-in, exports (per Q4) |
| preset | checkbox, read-only | marks the seeded presets |
| createdBy | relationship → users, read-only | set on create; used by the team-lead rules (§4) |

**Membership is stored on the role.** The role gets a `members` field (relationship → users, hasMany), limited to team
members other than the editor. Each account gets `accessRoles`, a read-only *join* field that Payload fills from
`members`. This means:
- **Team leads assign people on the role page**, without needing the admin-only Team accounts screen.
- **Every account still shows its roles.**
- **There is one source of truth.**

`assignedEvents` stays on the account.

### 2a. Per-document limits (owner: "also per document")

**Scope on each page.** For each CMS page whose documents are distinct things, a role can say **"all documents"** or
**"only these: [pick documents]"**:

| CMS page | Limit by | Applies to |
|---|---|---|
| Event registrations, Submissions, check-in, exports | **event** (all / the account's assigned events / these events) | view, every field group, edits, check-in, CSV |
| Events | event | view drafts, edit texts, edit locked fields |
| Pages | page | view drafts, history, edit/publish, delete |
| Projects, Posts, Resources, People, Gallery albums, Short links, Announcements | document | view unpublished, edit, delete |
| Media | none (shared library) | — |
| Website settings (globals) | none: each global is already its own checkbox | — |

**Enforcement:** the limit becomes a server-side `where` (`id in [...]`, or `event in [...]` for registrations and
submissions) added to Payload's access result.
- **Lists:** documents outside the limit don't appear.
- **Direct access:** opening, editing or deleting one by ID gives "not allowed".
- **Sidebar:** shown when the role has view on any document.

**Rules:**
- **Create is not grantable on a page that is limited to chosen documents.** A new document would fall outside the
  limit straight away.
- **A limit only narrows.** It never adds documents the base permission doesn't cover.
- **Union of roles:** when two roles grant the same action with different limits, the person gets the union (e.g. role
  A = Hackathon, role B = Robo Soccer → both).
- **A deleted document in a limit simply matches nothing.**

**CMS editing screen.** A custom field component draws `permissions` as a matrix:
- one block per CMS page;
- columns View / Create / Edit / Delete;
- extra rows for the field groups, tools and panels;
- cells that can't be granted are greyed out with the reason;
- a summary line at the top ("can see contacts and money for all events").

## 3. How permissions reach every check (the technical core)

**Where rules run.** Payload rules run in three kinds of places:
- collection access, which can be async;
- field access;
- sidebar visibility (`admin.hidden`), which is synchronous.

All three receive `req.user`.

**Verified in Payload 3.90's source:**
- **Fresh user per request:** the JWT strategy reloads the user from the database on **every request**
  (`findByID`, `overrideAccess: true`, `depth: auth.depth`).
- **Sidebar visibility:** evaluated **on the server** with `req.user`, and an exception counts as "hidden".

**Design:**
- Set `auth.depth: 1` on Users so `req.user.accessRoles` arrives populated (each role's permissions and scope), with
  no extra query in the access functions.
- A pure, synchronous `can(user, key)` / `scopeOf(user, key)` in `lib/permissions.ts`:
  - Super Admin and Admin get every grantable key;
  - a team member gets the union of the keys of their roles;
  - everyone else gets none;
  - results are memoised per user object (WeakMap), so one request computes them once.
- **Delay after a role edit: none.** The next request from anyone holding the role uses the new permissions; no
  cache, no re-login, no redeploy.
- A role referenced but missing (deleted) contributes nothing (fail closed).
- **Not stored on the account.** Permissions are never copied onto the account itself. That would go stale and be a
  second source of truth.

**Rewrite of `roles.ts`.** The group constants (`SEE_CONTACTS`, `REG_MANAGERS`, …) are replaced by permission keys.
- Every caller (46 files: collections, field rules, sidebar, custom screens, staff pages, `/api/admin/*`, dashboard)
  moves to `can(user, '<key>')`.
- `hasRole`/`holds` are deleted, so nothing can keep using the old roles by accident.

## 4. Who may create, edit and assign roles (escalation rules)

| Action | Super Admin | Admin | Team lead (holds "Manage access roles") | Others |
|---|---|---|---|---|
| Create an access role | any | any | only with keys **and document limits they hold themselves** | no |
| Edit an access role | any | any | any role whose keys/limits **before and after** are within their own, and which they don't hold | no |
| Delete an access role | any | any | same condition as edit, and only when nobody holds it | no |
| Add/remove people on a role | any team member | any team member | other team members only (not themselves, not admins, Judges or Participants), on roles they may edit | no |
| Grant "Manage access roles" | yes | yes | **never** | no |
| Change their **own** roles | — | — | **never** | — |

**"Within their own" covers document limits too.** A team lead limited to the Hackathon event can't create a role
covering all events.

**Enforcement:** these rules live in access functions and a `beforeChange` hook on both collections, not in the UI:
- **subset check:** a team lead's `permissions` ⊆ the editor's own;
- **no self-assignment;**
- **"Manage access roles" can't be passed on** by a team lead (only admins grant it);
- **no editing a role the editor holds themselves**, so a team lead can't widen their own role.

## 5. Audit

**Access roles:** every create, update and delete is logged with who, the role, and the permissions before → after (a
diff of keys).

**Team accounts:** every assignment change is logged with who, whose account, and the roles before → after.

**Where it goes:** `audit.log`. Deletes are already covered by `withDeleteAudit`.

## 6. Enforcement inventory (everything moved to `can()`)

- **Collections:** access rules on all 15 grantable collections, plus the field rules on event registrations and
  events.
- **Globals:** access rules on all 8 grantable globals.
- **Custom CMS screens:** ID re-upload, the role editor, and the admin screens (per Q2).
- **Sidebar and dashboard:** `AdminNavLinks`, `RoleDashboard`.
- **Staff pages:** `/checkin`, `/payment-matching`, `/retention` (stays owner-only).
- **`/api/admin/*` routes:** `check-in`, `payment-matching`, `registrations-export` (views and columns), `id-reupload`,
  `submissions/[id]/file`, `accounts`, `page-visibility`, `retention`.
- **CMS entry:** `canUseAdmin` becomes admins, plus team members holding at least one role, plus judges per Q3.
- **Unchanged:** the portal and participant APIs; they check ownership, not roles.

## 7. Presets (seeded, create-only, reproduce today exactly)

| Preset role | Keys (summary) | Scope |
|---|---|---|
| Registration team | registrations: view, contacts, leader phone, IDs, notes (see+edit), edit status, edit ID verification · Student IDs view · check-in (all) · ID re-upload · dashboard: desk | all |
| Technical event team | registrations: view, leader phone · check-in (assigned) · exports check-in + roster · dashboard: your events | assigned |
| Logistics | registrations: view, leader phone · check-in (all) · dashboard: counts | all |
| Discipline committee | registrations: view · dashboard: counts | all |
| Technical support | registrations: view · dashboard: counts | all |
| Media & outreach | all website content + globals except Event pages/AURIX schedule edits shared with Event Head · events: drafts + edit texts · announcements · short links · form submissions · dashboard: totals | — |
| Sponsors | dashboard: totals | — |
| Decoration | dashboard: counts | — |
| Finance | registrations: view, contacts, leader phone, money, notes (see+edit), edit payment · payment matching · export finance · dashboard: finance | all |
| Treasurer | registrations: view, money · export finance · dashboard: finance | all |
| Core member / Supervisor | registrations: view, money · dashboard: overview | all |
| President | everything registrations (all field groups and edits incl. details/check-in) · Student IDs view+edit · submissions view/download/review/delete · email queue · events drafts (read only) · form submissions · announcements · check-in (all) · payment matching · ID re-upload · all exports · dashboard: overview | all |
| Event Head | President + events: edit texts + edit locked fields · Event pages · AURIX schedule | all |
| Registration lead (Team Head + Registration) | Registration team + export full | all |
| Logistics lead (Team Head + Logistics) | Logistics + exports check-in + roster | all |
| Discipline lead (Team Head + Discipline) | Discipline + export roster | all |
| Technical event lead (Team Head + Technical event) | Technical event team with scope **all** | all |

**Same constant for code and seed.** The preset definitions live in code as one constant, used both to seed the
database (create-only, by name; never overwrites an edited preset) and by the tests.

**Transition:**
- A team member's permissions = their access roles **plus** the presets mapped from their old `roles` values.
- The existing `tests/rbac.test.ts` therefore passes **unchanged**, which proves every preset equals today.
- Existing accounts are then assigned their presets by a guarded data step.
- The old `roles` field stays (hidden, read-only) until you confirm it can go.

**Production today:**
- 3 team-member accounts: Media+President, Media, Team Head alone (no rights);
- 6 admin/owner accounts, unaffected.

## 8. Migration (additive only)

**Generated on `krs_migtest`** from the newest backup; the SQL is read before committing.
- **New tables:**
  - `access_roles`;
  - `access_roles_permissions` (select hasMany);
  - relation rows in `users_rels` for `accessRoles`;
  - locked-docs / preferences columns.
- **No column is dropped or changed.**

**Data step (guarded, idempotent):**
- inserts the preset roles that don't exist yet (by name);
- assigns presets to team accounts that have old `roles` values and no access roles yet;
- Team Head combinations map to the "lead" presets.

**Before deploying:** test on a fresh prod copy with the CI image, the same way as §19, before the usual backup → counts
→ `krs-pull-deploy --finance skip` → counts unchanged.

## 9. Tests

- **`tests/rbac.test.ts`:** unchanged; must pass via the legacy-mapped presets.
- **New `tests/access-roles.test.ts`:**
  - each preset assigned as an *access role* gives exactly the same matrix as its old role;
  - union of two roles;
  - registration scope;
  - every field group in isolation;
  - fail-closed (unknown key, deleted role, empty role, non-team-member holding roles);
  - escalation (team lead granting a key they lack, self-assignment, passing on "Manage access roles", editing own
    role);
  - every catalogue key is used by at least one check, and every check uses a catalogue key, so no dead or unchecked
    permission can exist.
- **Live on a prod copy:**
  - one copy-only account per preset and 3 custom roles;
  - REST reads/writes, fields in responses, CMS screens and sidebar, staff pages, exports, check-in scope;
  - role edit → effective on the next request;
  - escalation attempts over REST.
- **No real accounts, no real emails.**

## 10. Pre-flight

**What I intend to do:** §2–§9, in this order:
1. catalogue + `can()` + presets + unchanged rbac test passing on legacy roles;
2. collection + migration;
3. move every check to `can()`;
4. the matrix editor screen;
5. escalation rules + audit;
6. tests;
7. prod-copy live test;
8. deploy;
9. docs.

**Assumptions:**
- Today's matrix (`tests/rbac.test.ts`, AGENT.md §19) is the intended behaviour to preserve.
- "Each CMS page" means each **sidebar page/screen** (not individual documents; see Q6).
- Participants and Judges keep their account types.

**Risks:**
- **A missed caller keeps the old logic.** Mitigation: `hasRole`/`holds` are deleted; type-check fails on leftovers;
  the key-coverage test.
- **`auth.depth: 1` populates other user relations too.** `assignedEvents` would arrive as event documents.
  Mitigation: `assignedEventIds` already accepts both shapes; `/api/users/me` output checked.
- **Team-lead escalation paths.** Mitigation: §4 rules in hooks, with dedicated tests.
- **The matrix UI is the largest new piece.** Mitigation: it's only a view over a validated `select`; the server never
  trusts it.
- **A role edit takes effect immediately.** Good for revoking, but a wrong edit is live at once. Mitigation: audit diff,
  and the presets can be re-applied.

**Unknowns:** the answers to §11. Whether team leads also need to create team **accounts** (today admins only).

## 11. Questions for the owner — answered 8 Oct, see §0 (kept for the record)

1. **Team leads:** is a team lead anyone holding a "Manage access roles" permission (granted only by admins)? May they
   assign roles to accounts, and to which accounts? May they edit roles created by others?
2. **Admin-only screens:** should Participants, Team accounts, Page visibility (and content deletes) be grantable to a
   custom role? Retention stays owner-only.
3. **Judges:** CMS with Submissions only (view, download, no review status), or a custom role, or keep them out?
4. **Event scope:** should "assigned events" also limit submissions (and exports, as today), or only
   registrations/check-in?
5. **Presets:** keep them as normal editable roles, or locked? Remove the old `roles` field after migration?
6. **Granularity:** per CMS page (this plan), or also per document (e.g. "may edit only the Hackathon event / only the
   Home page")?

## Security & Threat Surface Analysis

All domain files were reviewed 2026-09-25 (within 6 months), so none are stale.

- **Domain 01 (AuthN):** Applicable. Authentication is unchanged (Payload login, lockout, 24 h sessions, the unlock
  fix from §19). Permissions ride on the per-request user reload (`overrideAccess` findByID), so a revoked role or a
  deleted account loses access on its next request. No new tokens.
- **Domain 02 (AuthZ):** Applicable, the core of the change.
  - Every check goes through one server-side `can()`, fail closed.
  - Registration scope is a server-derived `where` on the account's `assignedEvents`.
  - Bulk REST operations use the same access rules.
  - Escalation guards from §4 live in hooks and access functions.
  - Admin/owner-only operations stay non-grantable in code.
  - Per-document limits (§2a) are server-side `where` filters combined with Payload's access result, so lists, by-ID
    reads/updates/deletes and bulk operations all respect them.
  - A team lead can't create a role wider than their own keys and limits.
- **Domain 03 (Injection):** Applicable. Permissions are a `select` with fixed options, so arbitrary values are
  rejected by Payload validation. Role names and descriptions are plain text, rendered escaped. No raw SQL; the data
  step uses fixed statements.
- **Domain 04 (Frontend):** Applicable. The matrix editor is a React field component without `dangerouslySetInnerHTML`.
  It only edits the form value and the server re-validates. CSRF stays as is: Payload origin checks and same-origin
  checks on `/api/admin/*`.
- **Domain 05 (API/Network):** Applicable. The access-roles collection gets Payload REST endpoints; all go through its
  access rules (§4). There are no new public routes, and existing `/api/admin/*` rate limits stay.
- **Domain 06 (Data protection):** Applicable. Contacts, phones, ID files, money and notes stay behind explicit field
  groups. Errors stay generic (Payload's "not allowed"). No new PII is stored; roles contain no personal data.
- **Domain 07 (AI/LLM):** Not Applicable — no prompt, model or agent code is touched.
- **Domain 08 (Supply chain):** Not Applicable — no new packages; the matrix UI uses `@payloadcms/ui` and React,
  which are already installed.
- **Domain 09 (Host/Docker):** Not Applicable — no Dockerfile, compose, port or volume change; deploy via the existing
  `krs-pull-deploy`.
- **Domain 10 (Logging/Audit):** Applicable. Role create/update/delete and role assignments are logged to
  `audit.log` with actor and before → after key diffs (§5). No PII is in these entries (role names and keys only).
  Existing rotation applies.
- **Domain 11 (Secrets):** Not Applicable — no environment variables, keys or credentials are added or read.
- **Domain 12 (DNS):** Not Applicable — no domain, proxy host or routing change.
- **Domain 13 (Email):** Applicable, narrowly. "ID re-upload: send emails" becomes grantable. The existing
  per-user rate limit (5/min) and the outbox daily budget stay, and the permission is not in any preset that lacks it
  today.
- **Domain 14 (Vector/RAG):** Not Applicable — no vector store or embeddings exist in this project.
- **Domain 15 (Business logic):** Applicable. The workflow risk is a team lead widening their own or others'
  rights. Covered by the subset rule, no self-assignment, the non-transferable "Manage access roles", no editing a held
  role, and server-side validation in `beforeChange`. Concurrent edits: Payload document locking plus re-validation on
  save.
- **Domain 16 (File uploads):** Applicable, narrowly. Access to student ID files and submission downloads becomes
  permission-based. File handling is unchanged: ID files stay outside the web root behind Payload's access-checked
  route, and submissions use signed links after `can()`.
- **Domain 17 (Embeds):** Not Applicable — no iframe, postMessage or widget change (live preview untouched).
- **Domain 18 (Webhooks/Payments):** Not Applicable — no webhook or payment gateway code. "Edit payment status" keeps
  today's field rule, only re-keyed.
- **Domain 19 (Backup/DR):** Applicable. Additive migration plus the idempotent data step. `krs-db-backup` and the
  pre-deploy backup run before the deploy; counts are compared before and after; rollback = previous image (the new
  tables are unused by it).
- **Domain 20 (Compliance):** Applicable. Who may see participant PII becomes configurable, so every role change is
  audited (§5) and presets reproduce today. Retention/deletion stays owner-only and is not grantable.
- **Domain 21 (Mobile):** Not Applicable — no native or hybrid app exists.
- **Domain 22 (Kubernetes):** Not Applicable — plain Docker Compose; no orchestration manifests.
- **Domain 23 (Message queues):** Not Applicable — the email outbox worker is unchanged; no broker is used.
- **Domain 24 (E2E crypto):** Not Applicable — no messaging or key-exchange code.
- **Domain 25 (Adversarial ML):** Not Applicable — no ML models.
- **Domain 26 (Healthcare/PHI):** Not Applicable — no medical data is collected.
- **Domain 27 (Financial ledger):** Not Applicable — the finance ledgers are a separate app and database. Here only the
  read visibility of amount due and payment reference and the existing payment-status field rule are re-keyed, with no
  balance logic.
- **Domain 28 (Multi-tenancy):** Not Applicable — a single organisation; "assigned events" is a per-account filter,
  not tenant isolation.
- **Domain 29 (Rate limit/DoS):** Applicable, narrowly.
  - Permission resolution is O(roles × keys) per request, memoised.
  - `auth.depth: 1` adds one relation join per request (small: few roles per account).
  - The role list REST endpoint is paginated by Payload.
- **Domain 30 (CI/CD):** Not Applicable — the existing "Build website image" workflow is unchanged.
- **Domain 31 (Git):** Applicable, narrowly. Commits only to `claude/deploy-ready`, with explicitly staged paths;
  `new-frontend` and `agy/frontend` stay untouched. No secrets are involved.
- **Domain 32 (Competition integrity):** Applicable. Submission review status decides who enters round 2, so "Set
  review status" is its own key, separate from "download". Presets keep it with President, Event Head and admins only,
  and Judges per Q3.
- **Domain 33 (Client rendering):** Not Applicable — no canvas, WebGL or GPU code.
- **Domain 34 (Offline persistence):** Not Applicable — nothing is stored client-side; the matrix is a normal Payload
  form.
- **Domain 35 (Third-party APIs):** Not Applicable — no outbound API keys or OAuth grants are involved.

**SPEC note:** SPEC.md lists the account types as SUPER_ADMIN, ADMIN, ORGANIZER, JUDGE, PARTICIPANT. The code and this
plan use "Team member" (`STAFF`) for organisers. I suggest updating SPEC.md to the new model once this is approved;
I won't edit it without your go-ahead.
