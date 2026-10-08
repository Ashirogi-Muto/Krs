# Live preview in the CMS: plan (8 Oct 2026)

Status: **built and deployed 8 Oct 2026** (phase 1 07:29, phase 2 07:54, phase 3 08:20 UTC; details and limits in website/AGENT.md §15). **Approved 8 Oct 2026 ("approve as recommended")**: drafts + autosave on Pages only; Events without drafts; `@payloadcms/live-preview-react@3.90.2` pinned; preview-only `data-cms-*` attributes OK; shared wording = attributes on the main places + text match; Phase 1 ships as one deploy (1a Pages + 1b other screens, tested separately).

The owner's goals:

1. A side panel in the CMS edit screen shows the real page being edited, and it updates while you edit.
2. Focusing a field in the CMS highlights the matching text in the preview.
3. Clicking something in the preview jumps to that field in the CMS. That means switching to the right tab,
   expanding the section, scrolling to it and focusing it.

Built in three phases. Each phase ships on its own, and I stop after each one for review.

---

## 0. Facts checked in the installed code (not from memory)

| Topic | Finding (file) |
|---|---|
| Versions | payload 3.90.2, next 16.3.6 (`node_modules/*/package.json`) |
| Live preview in Payload | `admin.livePreview` on a collection/global or the root config: `url(args)`, `breakpoints`, `openByDefault` (`payload/dist/config/types.d.ts` §LivePreviewConfig). It adds a side panel that holds an `<iframe>`, plus a "Live Preview" toggle. |
| What the panel sends | On every form change it posts `{ type: 'payload-live-preview', data: formState, … }` to the iframe, with the URL's origin as the target origin. After each save or autosave it posts `{ type: 'payload-document-event' }`. It listens for `{ type: 'payload-live-preview', ready: true }` and only accepts it if `url.startsWith(event.origin)` (`@payloadcms/ui/dist/elements/LivePreview/Window`, `providers/LivePreview`). |
| Refresh after save | `RefreshRouteOnSave` lives in `@payloadcms/live-preview-react` **3.90.2**. It is about 40 lines. Its only dependency is `@payloadcms/live-preview` 3.90.2, which is also tiny (I read both packed tarballs). It checks `event.origin === serverURL`, calls `router.refresh()`, and sends the "ready" message to `window.parent`. It is **not installed** today. |
| Payload drafts | `versions: { drafts: { autosave: { interval } } }`. The default autosave interval is **2000 ms** (`versions/defaults.js`). It adds a `_status` field (**default 'draft'**, `versions/baseFields.js`) and a parallel set of `_<slug>_v…` version tables. **Saving a draft writes only the version tables. The main table, which every public query reads, is not touched** (`collections/operations/utilities/update.js`, `if (!isSavingDraft) db.updateOne`). Only Publish updates the main table. The catch: a brand-new document saved only as a draft *does* get a main-table row, with `_status = 'draft'`. |
| Next draft mode | `draftMode().enable()` sets the `__prerender_bypass` cookie (HttpOnly, Secure, SameSite=None). Pages viewed in draft mode skip the page cache and every cache layer, and are sent with `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` (`next/dist/docs/01-app/02-guides/draft-mode.md`). **The cookie value is the same for everyone on a given build**, so it proves nothing about who you are. Every preview decision must therefore *also* check the logged-in user. |
| Framing | **The site already allows framing by its own origin and no one else**: `X-Frame-Options: SAMEORIGIN` and `frame-ancestors 'self'` (`next.config.ts`; checked on prod with `curl -I`). The CMS (`/admin`) and the pages share one origin, so the iframe works without changing any header. **No header change is planned.** Finance (separate apps and domains) is untouched. |
| Payload cookie auth | `payload.auth()` accepts the `payload-token` cookie only if the request carries an allowed `Origin` or `Sec-Fetch-Site: same-origin`/`same-site`/`none` (`payload/dist/auth/extractJWT.js`). A request from another site gets no session. |
| CMS field ids | A field's DOM id is `field-` plus its path, with `.` replaced by `__`. Examples: `field-layout__0__eyebrow`, `field-registration__step1`, `field-venue`. Unnamed tabs (Events, after fe184c7) add nothing to the path. Fields in an inactive tab are **not in the DOM** until that tab is opened. |
| Public page queries | `getPage` (`lib/pages/index.ts`, `published = true`, `overrideAccess: false`); `unpublishedPagePaths` (`lib/site-settings.ts`); the sitemap (`app/sitemap.ts`); content lists (`lib/data/content.ts` `fromCms`, `published = true`); events (`lib/data/events.ts`, `status != DRAFT`). The Pages REST access rule is `{ published: true }` for the public. |

---

## 1. What we use from Payload, and what is custom

**From Payload, unchanged:**
- `admin.livePreview`: the side panel, the iframe, the device-size buttons and the toggle.
- Versions and drafts with autosave (Pages only, see §3).
- `RefreshRouteOnSave` from `@payloadcms/live-preview-react@3.90.2`, pinned to the exact version, the same release as
  Payload.
  - It goes in the root and the website lockfile; `npm audit` and the CI audit gate must pass.
  - Alternative: copy its 40 lines into the repo and add no package. Recommendation: use the package. It ships in
    lockstep with Payload, so a Payload upgrade can't silently break the protocol.
- Breakpoints: Desktop 1280×800, Tablet 768×1024, Mobile 390×844.

**Custom (ours):**
- `/api/preview` (enter) and `/api/preview/exit`: switch draft mode on and off, after checking the session.
- `isPreview()`: a server helper returning true only when **draft mode is on AND `payload.auth()` returns a CMS
  editor**. A leftover draft cookie on its own does nothing.
- `cmsAttrs()`: renders `data-cms-*` attributes in preview only. Outside preview it returns `{}`, so React renders
  no attribute at all.
- `PreviewBridge`: a client component inside the previewed page, rendered only in preview. It handles highlighting
  and click-to-edit, and shows a small "Preview · click to edit: on/off · Exit" badge.
- `CmsPreviewBridge`: a client provider in the CMS (`admin.components.providers`). It turns field focus into highlight
  messages, and turns "focus this path" messages into tab switch, expand, scroll and focus.

---

## 2. Which screens get the preview, and the URL shown

The iframe always loads `/api/preview?c=<collection>&id=<id>` (or `?g=<global>`). The route **looks up the path
on the server from the document**, never from a URL parameter, so it can't be turned into an open redirect. The URL stays the same
while you type, so the iframe isn't reloaded on every keystroke.

| Screen | Preview shows | Drafts |
|---|---|---|
| Website → Pages | the page's `path` | **yes** (autosave, Phase 1) |
| Events | `/aurix/<slug>` | no (see §3) |
| Projects | `/projects/<slug>` | no (could be added later) |
| Posts | `/blogs/<slug>` | no (later) |
| Resources | `/learning/<slug>` | no (later) |
| Labels & messages (global) | `/aurix/register` (registration form and messages); the other texts appear on many pages, so you click through to them inside the preview | no |
| Event pages (global) | `/aurix/hackathon` | no |
| Navigation & footer, Site settings (globals) | `/` | no |
| Privacy & terms (global) | `/privacy` | no |
| Participant portal, Staff & admin texts | **no preview**. The portal needs a participant login; staff tools are already the live screens | no |

There is no page picker for shared screens: Payload's preview toolbar has no URL picker. Instead, **links work inside the
preview**: with "click to edit" switched off in the badge, you can browse to any page. The editor stays where it is,
and later saves refresh whatever page is open.

---

## 3. Drafts and autosave

**Recommendation:**
- **Drafts and autosave on Pages only**, in Phase 1.
- Every other screen gets the preview without drafts. Its preview refreshes when you press Save, and **Save makes the
  change live at once**, exactly as today.
- Add drafts to Projects, Posts and Resources later, if wanted.
- **Never on Events.** Registration reads Events directly: open/close dates, fee, team size, status. Two states
  ("draft" vs "live") on the record that decides whether a team can register is a competition-integrity risk
  (domain 32) that isn't worth the convenience.

**What changes for editors on Pages:**
- Save becomes two buttons, **"Save draft"** and **"Publish changes"**.
- Autosave keeps a draft every 2 s while you type. Visitors see a change only after Publish.
- The existing **"Published" checkbox stays and keeps its meaning: whether the page is on the site.** I'll rename it
  to **"Show on the site"**, with the note "Untick to hide this page. The Publish button makes your latest edits
  live." Page visibility already counts unticked pages as hidden.

**Every public query keeps showing only published content.**
- Already-published pages: the main table keeps the published content while drafts go to the version tables.
  Payload does this itself (§0).
- Brand-new pages that were only ever saved as a draft get a main-table row with `_status = 'draft'`. To keep those
  off the site, every public page query adds `_status = 'published'`:
  - `getPage`;
  - the "built-in page was unpublished" count in `getPage`;
  - `unpublishedPagePaths`, extended to "not shown OR never published", so the page is treated as hidden;
  - the sitemap;
  - the public `read` access on Pages: `published = true AND _status = 'published'`, which also covers REST
    `?draft=true`;
  - `readVersions` limited to CMS editors.
- **Events, Projects, Posts and Resources are not touched**: no drafts, no new column, queries unchanged. The
  registration code (`api/aurix/register` → `getEventBySlug` → `lib/data/events.ts`) is therefore unaffected.
- A unit test asserts that a draft-only page and a draft edit of a published page never come back from the public
  accessors.

**Other effects:**
- **Seeders:** `initPages` passes `_status: 'published'` when it creates a built-in page; without it, Payload's
  default would be 'draft'.
- **Cache refresh hook:** `revalidateSite` runs on every change. It will skip draft saves (`doc._status === 'draft'`)
  so autosave doesn't purge the site's cache every 2 s.
- **Version history:** `maxPerDoc: 25`. Autosave updates one "autosave" version in place, not one per save.

**Migration (generated on krs_migtest, a fresh prod copy):**
- What it adds:
  - `pages._status` (enum, default 'draft');
  - a `pages_latest`/version index;
  - `_pages_v` and about 50 `_pages_v_blocks_*` / `_pages_v_*` tables, one per existing pages table.
- Nothing is dropped or retyped.
- **Explicit data step in `up`:** `UPDATE pages SET _status = 'published'` for every existing row. Without it, all
  18 live pages would count as drafts and disappear from the public queries.
  - Tested on the copy: all 18 pages still visible, identical visible text, sitemap unchanged.
- No version rows are created for existing pages. Payload opens a page with no versions from the main row.

---

## 4. Preview mode and who may enter it

**`GET /api/preview?c=pages&id=18` (or `?g=form-texts`):**
1. Rate-limited to 120/min per IP.
2. `payload.auth({ headers })`: never decode the cookie. A request from another site carries no valid session (§0).
3. Refused unless the user is a CMS editor:
   - `CONTENT_EDITORS` for pages and wording;
   - `EVENT_EDITORS` or `REG_MANAGERS` for events;
   - admins always allowed.
   - Participants, judges, anonymous users and team members without these roles get **403**.
4. The path comes **from the document**: `findByID` with `overrideAccess: true` after the role check. `c`, `g` and `id`
   are checked against a fixed list or as integers. The redirect target must start with `/` and not `//`.
5. `draftMode().enable()`, then a 303 redirect to the path. A logger audit line records `PREVIEW_ENTER`, the user id
   and the path, with no email or PII.

There is no secret in any URL: who you are is decided by the CMS session.
`GET` is used because the CMS iframe can only load a URL. Payload's own session check already rejects cross-site
requests, so CSRF can at worst switch on preview for an editor, which only shows them their own drafts.

**`POST /api/preview/exit`:**
- Switches draft mode off and returns to the same page (the path is validated).
- Used by the "Exit preview" button in the badge.
- `/api/auth/logout` also switches draft mode off.

**Inside pages, `isPreview()` decides everything** (draft mode on AND an editor session):
- **Drafts:** `getPage` reads the latest draft (`draft: true`, `overrideAccess: true` after the editor check).
- **Hidden pages:** `requireVisibleRoute()` doesn't 404 a hidden page for an editor in preview. The badge says
  "Hidden from visitors". Unpublished/"not shown" pages are handled the same way.
- **Exposure:** a visitor who somehow has the draft cookie but no editor session gets exactly the public page.

**Preview responses:**
- `Cache-Control: private, no-cache, no-store`: Next sets it automatically in draft mode, and a test checks it.
- `noindex`: `<meta name="robots" content="noindex, nofollow">` is added by the root `generateMetadata` when
  `isPreview()`.
- Never cached: Next excludes draft mode from the page cache and ISR. Cloudflare doesn't cache HTML, and the
  response is no-store anyway.

**Visitors:** HTML is unchanged byte for byte. `isPreview()` returns false and `cmsAttrs()` returns `{}`.

---

## 5. Mapping fields to the preview

**Attributes, preview only, through one helper.**
`cmsAttrs({ path, doc?, global?, ref? })` returns `{}` outside preview, so React renders nothing. In preview it returns:
- `data-cms-path="layout.0.title"`: a field of the document being edited;
- `data-cms-doc="pages/18"`: which document;
- `data-cms-global="form-texts" data-cms-path="general.comingSoon"`: shared wording;
- `data-cms-ref="gallery-albums/7"`: an item from another collection.

**Where they go:**
- `RenderBlocks` already passes `index` to every section. It will add a `cms(path)` function to the section
  props (`Ctx`).
- Each section type puts `{...cms('title')}` on the elements that show that field.
- The shared `SectionHeader`, `ButtonRow` and similar get optional attribute props, so most sections need one-line
  changes.
- The section wrapper gets `data-cms-path="layout.N"`, so fields with no visible text still have a target (theme,
  spacing, anchor, select/checkbox).

**Approval point: "don't touch the UI of the main site and the AURIX portal."**
These attributes are invisible, exist only in an editor's preview, and change nothing visitors receive. That will be
verified by comparing the visible text of every public page with production, and by checking that visitor HTML has no
`data-cms-` anywhere. Please confirm this is OK.

**Field id ↔ path:** `field-` + `path.replaceAll('.', '__')`, and the reverse.
- Tested both ways, including `layout.3.cards.1.title` and `registration.step1`.
- Paths are checked against `^[A-Za-z0-9_]+(\.[A-Za-z0-9_]+)*$` and limited to 200 characters before use.

**Shared wording (Labels & messages, Event pages, Navigation & footer, Site settings):**
- These texts are used in hundreds of places. Annotating every place is a large, risky edit across the visitor
  components.
- Plan:
  - The high-traffic places get `data-cms-global`: navigation links, footer, event page headings, registration
    form labels.
  - Everything else uses a **text-match fallback**. Focusing a wording field highlights every element in the preview
    whose text equals the field's current value. Clicking preview text that carries no attribute looks for a
    field on the open screen with exactly that text.
  - The fallback can match more than one place, and says so ("3 matches").

---

## 6. Messages between the CMS and the preview

Both sides are the same origin (`https://kalamroboticssociety.com`), so the checks are strict and simple.

**Schema** (anything else is ignored):
```
CMS → preview   { type: 'krs-cms:highlight', path: string, value?: string(≤300) }   // value only for text-match
                { type: 'krs-cms:clear' }
preview → CMS   { type: 'krs-cms:focus', path: string }                             // same document
                { type: 'krs-cms:open', target: 'doc'|'global', slug: string, id?: number, path?: string }
                { type: 'krs-cms:ready' }
```

**CMS side:**
- Accepts only if `event.origin === location.origin` AND `event.source === <preview iframe>.contentWindow`.
- Sends with `targetOrigin = location.origin`, never `'*'`.

**Preview side:**
- Accepts only if `event.origin === location.origin` AND `event.source === window.parent`, and `window.parent !== window`.

**What is trusted from the frame:** nothing beyond "focus this path" or "open this screen".
- `slug` must be in a fixed list of collections and globals; `id` must be an integer; `path` must match the regex.
- The CMS bridge never saves, never changes a value, and never navigates outside `/admin/...`.

No `innerHTML` anywhere. Highlighting is a CSS class (outline) plus `scrollIntoView`.

---

## 7. Edge cases

| Case | Plan |
|---|---|
| Fields inside tabs (Events, Pages "Sections"/"SEO", wording screens) | A server-built map, `fieldName → tab label`, from each config's tabs (Events uses `EVENT_TABS`). Before focusing, the bridge clicks the matching `.tabs-field__tab-button`, waits a frame for the field to mount, then focuses it. |
| Collapsed sections / array rows (rules, rounds, FAQs) | Walk the path from the outside in. For each `…__N` row: if the row is collapsed (`aria-expanded="false"` on its toggle), click it and wait for the field to mount. **Unknown to check in Phase 3:** whether Payload 3.90 renders fields inside collapsed rows. Either way, toggling first is correct. |
| Rich text (Lexical) | Highlight and click work on the whole block (`layout.N.content`). Focus goes to the Lexical editor container. No per-paragraph mapping. |
| Image fields | The `<img>` gets the attribute. Clicking it scrolls to the upload field and outlines it; there is no input to focus. |
| Select/checkbox with no visible text (theme, spacing, "show on site") | They point at the section wrapper `layout.N`. Focusing one outlines the whole section. |
| Items from other collections (gallery photos, people, competition cards, projects, posts, resources) | `data-cms-ref="<slug>/<id>"`. Clicking opens `/admin/collections/<slug>/<id>` **in a new tab**, so unsaved edits on the current screen are never lost. |
| Shared wording on many pages | Clicking opens that screen in a new tab: `/admin/globals/<slug>#focus=<path>`. On load, the bridge reads `#focus`, switches tab and focuses the field, and shows a note: "This text is shared: changing it changes every page that uses it." |
| Computed text (dates, fees, "Coming Soon", team size) | Annotated with the source field: `startDate`, `registrationFee`, `minTeamSize`. For "Coming Soon", the event's `comingSoon` checkbox. Focusing the source highlights the computed text. |
| Links in the preview | "Click to edit" on (default): clicking a link selects the field. Off: links work normally. |
| Preview of an unsaved new document | No id yet, so the panel shows "Save once to preview". |

---

## 8. Live updates and expected delay

**Pages (drafts + autosave):**
- Typing → autosave after 2 s idle → `payload-document-event` → `router.refresh()` → the server renders the
  draft.
- Expect **about 3–4 s** from when you stop typing until the preview shows it. This host renders a page in about
  0.5–1.5 s.

**Other screens (no drafts):**
- The preview refreshes **after you press Save**, about 1–2 s. Save is live for visitors at once, as today.

**Payload's client-side live data (`useLivePreview`) is not used.** It requires client-rendered pages, and ours are
server components. Rewriting them would change the visitor site.

---

## 9. Phases

**Phase 1: preview panel.**
- *Phase 1a, Pages:*
  - drafts and autosave on Pages, with the migration and data step;
  - the "Show on the site" relabel;
  - `/api/preview` and `/api/preview/exit`, `isPreview()`, preview badge with "Exit";
  - `RefreshRouteOnSave` in the site layouts (preview only);
  - `livePreview` on Pages.
- *Phase 1b, everything else:* `livePreview` on Events, Projects, Posts, Resources and the wording screens, with no
  drafts.
- Ships as one deploy, or as 1a then 1b if you prefer.

**Phase 2: field → highlight.**
- `cmsAttrs`/`cms()` in the section components and in `EventPage`.
- Detail pages for projects, posts and resources.
- Text-match fallback for shared wording.
- The CMS bridge's focus → highlight, and the preview bridge's highlight.

**Phase 3: preview click → field.**
- Click handling, tab switch, expanding collapsed rows, scroll and focus.
- New-tab opening for items from other collections and for shared wording, with the `#focus` handling.

---

## 10. Tests (all must pass before each deploy)

**Unit tests:**
- Field id ↔ path, both ways (tabs, arrays, groups).
- `cmsAttrs()` renders nothing when not in preview (React render to string: no `data-cms`).
- `/api/preview`: anonymous → 401; participant / judge / team member without editor roles → 403; editor → 303 to the
  document's path. A bad `c`, `g` or `id` → 400. A path parameter can't redirect anywhere.
- Preview responses: `Cache-Control` contains `no-store` and `private`; robots `noindex`.
- Frame headers unchanged: `X-Frame-Options: SAMEORIGIN` and `frame-ancestors 'self'` only. This test pins the
  current policy.
- Public queries never return drafts:
  - a draft-only page is absent from `getPage`, the sitemap and `unpublishedPagePaths` logic;
  - a published page with a newer draft returns the published text;
  - `isPreview()` is false without an editor even with draft mode on.
- The message schema validator: rejects other types, bad slugs, non-integer ids, bad paths.
- Existing tests stay green (125 today): `cms-coverage`, `security-fixes`, `accounts`, `visibility`…

**CI image on an unmigrated prod copy** (AGENT.md §14 method):
- The migration runs on start, and all 18 pages are `_status = 'published'`.
- Every public page has the same visible text as prod (27/27 snapshot).
- Visitor HTML of every page contains no `data-cms-` (curl + grep).
- Row counts are unchanged.

**Real browser, Playwright, prod address routed to the local image** (AGENT.md §14 method, copy-only super admin plus
a copy-only participant), with screenshots in the summary:
- the panel shows the page;
- an edit appears after autosave (Pages) and after Save (Events);
- focusing fields highlights the right text, including in Events tabs and a collapsed FAQ row;
- clicking preview text focuses the right field;
- clicking a gallery photo or shared label opens the right screen;
- a participant or anonymous user gets 401/403 from `/api/preview` and never sees drafts;
- an unpublished/hidden page shows in preview only;
- "Exit preview" works.

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| Live pages disappear after the drafts migration | The explicit data step (`_status = 'published'`), tested on the copy with a 27/27 visible-text comparison before deploy. Backup first (`krs-db-backup`). |
| A draft leaks to visitors | Public queries filter on `_status` (§3), REST access rule updated, unit tests. Payload never writes drafts into the main row of published docs. |
| The draft cookie alone grants access | `isPreview()` also requires an editor session. Unit test. |
| Visitor HTML changes | `cmsAttrs` returns `{}`; every-page `data-cms-` grep plus the visible-text comparison. |
| Editors confused by "Save draft / Publish" | The "Show on the site" relabel, and a note in the Where to edit guide. Pages only. |
| Bigger database: about 50 version tables, autosave versions | Autosave updates one version in place; `maxPerDoc: 25`. The DB is currently 92 KB compressed. |
| Autosave purges the page cache every 2 s | The revalidate hook skips draft saves. |
| Phase 3 DOM details (collapsed rows, tab mounting) differ from my assumptions | Checked first in Phase 3 against the real admin. They don't affect Phases 1–2. |
| Payload upgrade changes the preview protocol | The package is pinned to the Payload version; `RefreshRouteOnSave` and the panel come from the same release. |

**Turning it off:**
- **Remove the panel:** remove the `livePreview` entries in one config file and redeploy. Pages, drafts and data are
  untouched.
- **Turn off drafts on Pages:** a separate change. It needs a migration to drop the drafts columns again, so it
  would be planned on its own, with nothing dropped without approval.
- **Turn off click-to-edit only:** "click to edit: off" in the preview badge, per editor.

---

## 12. Decisions I need from you

1. **Drafts and autosave on Pages only** (recommended), or none at all? Without drafts, Pages preview refreshes on
   Save, and Save is live immediately.
2. **Events without drafts** (recommended; registration reads Events directly). OK?
3. **Add `@payloadcms/live-preview-react@3.90.2`** (recommended), or copy its 40 lines into the repo?
4. **Preview-only invisible `data-cms-*` attributes** in the site's components. OK under "don't touch the UI"?
5. **Shared wording:** attributes on the main places plus text matching for the rest (recommended), or attributes
   everywhere (much larger change)?
6. Phase 1 as **one deploy, or 1a (Pages) then 1b**?

---

## Security & Threat Surface Analysis

All the domain files opened below show `Last Reviewed: 2026-09-25`, under 6 months old, so none are stale.

- **Domain 01 (AuthN)**: Applicable. Preview entry uses `payload.auth({ headers })` only, never decoding the cookie.
  Payload's cookie extraction already rejects cross-site requests (Origin/Sec-Fetch-Site, §0). The Next draft cookie
  is the same for everyone, so it is never treated as identity: `isPreview()` requires an editor session on every
  request. Logout also switches draft mode off. No new credentials or tokens.
- **Domain 02 (AuthZ)**: Applicable.
  - Role check on the server: editors only per document type; participants, judges and anonymous users are refused.
  - The document is loaded by id only after the role check.
  - `overrideAccess: true` for draft reads happens only inside `isPreview()`.
  - Pages `readVersions` is limited to editors, and the public `read` rule adds `_status = published`.
  - Unit tests cover anonymous, participant and non-editor staff.
- **Domain 03 (Injection/Input)**: Applicable.
  - Preview route inputs are checked against fixed lists (`c`, `g`), as integers (`id`) and with a path regex.
  - The redirect path comes from the database, not the request. Message fields are validated the same way.
  - All queries go through the Payload Local API (parameterised). No `eval`, no `innerHTML`.
- **Domain 04 (Frontend)**: Applicable.
  - Clickjacking: the current policy (`frame-ancestors 'self'`, `X-Frame-Options: SAMEORIGIN`) stays; a test pins it.
  - Redirects: same-site paths only, from the database.
  - Draft cookie: HttpOnly, Secure, SameSite=None (Next's choice). It is harmless alone, because the editor session
    is required.
  - No secrets in localStorage. The click-to-edit on/off choice is kept in `sessionStorage`, a non-sensitive
    boolean.
- **Domain 05 (API/Network)**:
  - Applicable for the new routes: rate limit 120/min per IP on `/api/preview`; preview pages are `private, no-store`
    (Next draft mode, tested).
  - Applicable for headers: `noindex` meta in preview; the existing `nosniff`, HSTS (proxy) and Referrer-Policy are
    unchanged.
  - Not applicable for CORS: unchanged, because the preview is same-origin and there are no cross-origin calls.
- **Domain 06 (Data protection)**: Applicable, minor.
  - Preview HTML can show unpublished drafts, but only to editors, and it is no-store.
  - The CMS panel posts form state only to the same origin, which is Payload's own behaviour; ours sends paths and at
    most 300 characters of field text, same origin.
  - The audit log line records user id and path, with no email or PII.
- **Domain 07 (AI/LLM)**: Not applicable. No prompts, models or agent tools are involved in this change.
- **Domain 08 (Supply chain)**: Applicable.
  - The only new packages are `@payloadcms/live-preview-react` and `@payloadcms/live-preview`, both pinned to exact
    version 3.90.2. They come from the same publisher and release as `payload`, and I read both tarballs: about 10
    small files, no install scripts, no other dependencies.
  - `npm ci` and the CI `npm audit` gate (SHA-pinned actions) stay unchanged and must pass.
- **Domain 09 (Host/Docker)**: Not applicable. No Dockerfile, compose, port or volume change. Deploy goes through the
  existing `krs-pull-deploy`.
- **Domain 10 (Logging)**: Applicable. A `PREVIEW_ENTER`/`PREVIEW_DENIED` audit line with user id, path and outcome.
  The path is checked against the regex before logging, so CRLF can't be injected. No tokens, emails or cookie values
  are logged. The existing rotating logger is reused.
- **Domain 11 (Secrets)**: Not applicable. No new secret: preview access relies on the existing CMS session and
  Next's build-generated bypass id. No preview secret in URLs or `.env`.
- **Domain 12 (DNS)**: Not applicable. No domain, DNS or proxy host change; the iframe is same-origin.
- **Domain 13 (Email)**: Not applicable. No email is sent or templated by this change.
- **Domain 14 (Vector/RAG)**: Not applicable. There is no vector store in this project.
- **Domain 15 (Business logic)**: Applicable.
  - Draft vs published is a two-state workflow on Pages. Publish is Payload's server-side operation; our public
    readers check `_status` on the server.
  - The registration workflow is deliberately left without drafts (Events), so registration open/close, fee and team
    size each keep one server-side state.
- **Domain 16 (File upload)**: Not applicable. No upload path changes; image fields are only outlined in the preview.
- **Domain 17 (iframe/postMessage)**: Applicable.
  - Both listeners check `event.origin === location.origin` and the exact `event.source` (the iframe's contentWindow,
    or `window.parent`).
  - Every send uses an explicit `targetOrigin` (never `'*'`). The message schema is fixed and validated.
  - The frame can only ask the CMS to focus a path or open an allow-listed screen, never to change data.
  - No third-party embed. No `sandbox` attribute is added: Payload controls the iframe, and the content is our own
    same-origin site.
- **Domain 18 (Webhooks/Payments)**: Not applicable. No webhook or payment code is touched; Events' fee and payment
  label get no drafts.
- **Domain 19 (Backup/DR)**: Applicable.
  - The drafts migration (new tables plus the explicit `_status` data step) runs only after `sudo krs-db-backup` and a
    row-count snapshot.
  - It is tested first on krs_migtest from the latest dump; the restore path is the existing documented one.
  - The `down` migration is not used on prod.
- **Domain 20 (Compliance)**: Not applicable. No personal-data collection, retention or deletion changes. Preview shows
  CMS content (pages), not registrations.
- **Domain 21 (Mobile)**: Not applicable. There is no native app; the device buttons only resize the iframe.
- **Domain 22 (Kubernetes)**: Not applicable. Docker Compose only; no orchestration manifests.
- **Domain 23 (Message queues)**: Not applicable. No background job or queue is added; the email worker is unchanged.
- **Domain 24 (E2E crypto)**: Not applicable. No encrypted messaging or key exchange; postMessage is in-browser and
  same-origin.
- **Domain 25 (Adversarial ML)**: Not applicable. No ML models.
- **Domain 26 (Healthcare)**: Not applicable. No medical data.
- **Domain 27 (Financial ledger)**: Not applicable. The finance apps and ledgers are untouched (different apps and
  domains; deploy uses `--finance skip`).
- **Domain 28 (Multi-tenancy)**: Not applicable. One tenant (KRS). "Editor vs public" is covered under Domain 02.
- **Domain 29 (DoS)**: Applicable.
  - Preview pages render dynamically: no cache, by design, editors only.
  - Autosave every 2 s triggers a DB write and one page render per open editor; the revalidate hook skips drafts.
  - The `/api/preview` rate limit applies, and the path regex is linear (no backtracking).
- **Domain 30 (CI/CD)**: Not applicable. Workflows are unchanged; the existing build and audit gates run as is.
- **Domain 31 (Git)**: Not applicable. No secrets added; commits go to `claude/deploy-ready` only.
- **Domain 32 (Competition integrity)**: Applicable.
  - Events (registration window, fee, team size, status) deliberately get **no drafts**, so preview can never create
    a second, unpublished version of the rules registration enforces.
  - Server-side checks in `api/aurix/register` stay unchanged.
- **Domain 33 (Client rendering)**: Not applicable. No canvas, WebGL or cross-origin media drawing; highlights are
  CSS outlines.
- **Domain 34 (Client persistence)**: Applicable, minor. Only one boolean (click-to-edit on/off) goes in
  `sessionStorage`. No drafts or content are stored client-side; Payload keeps drafts on the server.
- **Domain 35 (Third-party API scope)**: Not applicable. No outbound third-party APIs or keys.
