# Success at Sage — Platform Overview

*Prepared for Sage Hill administrative review · April 2026*

---

**What it is.** Success at Sage is the Sage Hill instance of **Success at HS** — a free, peer-reviewed study platform that operates per school. Students share notes, study guides, and practice tests, organized by course and unit. Every submission is manually reviewed by an admin before it becomes visible to peers — nothing goes live without approval.

**Built and maintained by:** Jahaan Pardhanani, independently. No faculty or staff time is required to operate it.

**Status:** functional and hosted; public launch pending school approval.

## How a submission flows

1. **Login** — student signs in with email and password. Signups are restricted to `@sagehillschool.org` addresses so that only Sage students can access the Sage instance.
2. **Upload** — student submits to a specific course and unit. Submissions can be plain-text notes, PDF uploads, photos auto-converted to PDF, or external links. A required honor-code checkbox confirms the material is the student's own work or publicly shareable.
3. **Review queue** — submission enters a pending state, visible only to the submitter and admins.
4. **Admin decision** — admin approves (it becomes visible to all students) or rejects with a note explaining why. Rejected items can be revised and resubmitted.
5. **Post-publication flagging** — every approved item carries a report button. Any student can flag any material for re-review; flagged content is re-evaluated and removed if confirmed.

## Who can access what

- **Students:** view approved material, upload their own submissions, and view their own submission history. Cannot see other students' pending material.
- **Admins:** view all material (pending and approved), approve/reject, edit, and manage the monthly contest. Admin status is set server-side — not something a user can self-grant.
- **Unauthenticated visitors:** see only the landing page.

## Safeguards

- **Academic integrity — three layers.** (1) A required honor-code checkbox at the moment of upload. (2) Admin review of every submission before it goes live, catching answer keys, in-progress graded assignments, or anything resembling teacher-owned IP. (3) A flag/report button on every approved material; any student can trigger a re-review. The platform is explicitly for study materials, not live assessments.
- **Content moderation.** Any inappropriate, harassing, or off-topic material is rejected at review or removed via a flag. Students, teachers, or staff can request removal of any item at any time; admin removes on receipt.
- **Identity.** No anonymous uploads. Every account is tied to a verified `@sagehillschool.org` address, and every submission is tied to an account.

## Student data & privacy

- **Collected:** name, graduating year, email, submission content, and view counts for aggregate leaderboard purposes. No grades, no financial data.
- **Stored on:** Supabase (Postgres, US region) for database and file storage; Vercel for hosting; transactional email via Resend. All US-based providers.
- **Access:** Jahaan, plus any tenant admin the school designates. No third parties, no advertising, no data sharing or sale.
- **Retention:** material remains until the student or an admin removes it. Account and all uploads can be fully deleted on request within 7 days. Full data export available at no cost on request.
- **Public policies:** privacy policy, terms of service, and FAQ are linked from the site footer (`sage.successaths.com/privacy`, `/terms`, `/faq`).

## Monthly contest *(happy to modify or remove)*

To encourage participation, the student with the most approved submissions each month wins a $50 Amazon gift card. Winners are determined only from admin-approved material, so low-quality spam does not win. **Prize funding: self-funded by Jahaan.** The contest is configurable per school and is currently off by default until approval. Happy to reduce, rework, or drop the feature.

## Hosting, cost, and continuity

- **Hosted on** Vercel. The site is reachable at:
  - `sage.successaths.com` — canonical Sage URL (currently blocked by the school filter as "uncategorized"; whitelist request submitted to IT)
  - `success-at-sage.vercel.app` — Vercel preview URL, works on any network including Sage wifi
  - `successatsage.com` — older URL, 301-redirects to the new domain so prior posters and links continue to work
- **Cost** is covered entirely by me; the school bears no financial responsibility.
- **Continuity.** Documented handoff plan: when I graduate (or earlier if needed), admin access transfers to a designated faculty sponsor + rising student admin team, OR Sage's tenant is shut down entirely — the school's call. Either way, no platform code or data needs to live on Sage's infrastructure. Platform is provided as-is with no SLA or liability to the school.

## Open items I'd welcome school input on

- **Branding** — the platform is generically branded "Success at HS"; the Sage tenant displays "Success at Sage" through the per-school template. Happy to adjust either if preferred.
- **Prize structure** — open to adjusting or removing the contest entirely.
- **Faculty oversight** — happy to grant any faculty member designated by the school full admin rights, identical to mine — including the ability to delete any submission, remove any account, or export all data. Would also welcome a more formal faculty-sponsor relationship if useful.
- **Data governance** — happy to adopt any school-required privacy policy, TOS, or data handling terms beyond what's already public.

## Contact

Jahaan Pardhanani · 29PardhananiJ@sagehillschool.org
Live site (any network): **https://success-at-sage.vercel.app**
Live site (after IT whitelist): **https://sage.successaths.com**
FAQ: **https://sage.successaths.com/faq**
