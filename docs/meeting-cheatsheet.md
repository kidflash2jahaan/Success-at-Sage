# Meeting Cheat Sheet — Thu Apr 30, 9:30am

*Personal — fold into notebook, don't hand out. Assume they haven't read the overview PDF yet. Walk them through the basics out loud before stating the ask.*

---

## Why they'd want this — subtext only, **never say out loud**

You're offering value, not asking for a favor. Read this once before walking in, then forget the words and just walk in confident:

- **Mr. Campeau** — concrete operationalization of the honor code; peer-support culture made visible; student-initiative win. Zero faculty workload.
- **Dr. Balossi** — "Sage Hill student built a platform now used by N schools" is an admissions / alumni / fundraising story. Improved AP outcomes at no school cost. Proof Sage's mission shows up in practice, not just on the wall.
- **For both** — revocable in one click. No Sage infrastructure. Faculty admin available. The parent-call scenario is already pre-planned.

*Internalize this so you don't sound supplicant. Don't say any of it out loud — saying these reasons reads as managing them, and admins smell that.*

---

## Opening (90 seconds, out loud)

Hand them the printed overview PDFs as you sit down — *"I brought a one-pager in case it's useful to follow along or for after."* Then talk them through it without them needing to read it.

> "Thanks for taking the time. Quick context — Success at HS is a study-notes platform I built independently. The Sage instance is at sage.successaths.com. Students sign in with their @sagehillschool.org email and upload notes, study guides, or practice tests, organized by course and unit.
>
> The cheating-prevention story has **three layers**. One: an honor-code checkbox at the moment of upload. Two: every submission is reviewed by an admin before going live — nothing publishes until a human approves it. Three: every approved item has a flag/report button so any student can re-trigger review.
>
> What I'm here to ask: permission for a 4-week alpha — 30 to 50 students between AP exams and finals — with a proper rollout in September if it goes well. Built and funded entirely by me. Sage bears no cost or technical responsibility.
>
> You don't owe me a yes today. I'm flexible on whatever changes would make you both comfortable. Want me to walk you through the live site?"

Then **shut up. Let them lead the conversation.**

---

## If they ask "tell me more before the demo" — talking points to cover

| Topic | One-liner |
|---|---|
| **Branding** | Multi-tenant — Sage is one tenant of several schools using the platform. Not officially endorsed by Sage. Terms and FAQ explicitly say so. |
| **Data** | Name, school email, graduating year, uploads. Stored on Vercel + Supabase + Resend, all US providers. Privacy policy is public. |
| **Cost** | Free for students. No ads, no premium tier, no data sales. Optional $50/month contest is from my pocket — off by default until the school approves. |
| **Continuity** | Documented handoff: when I graduate, faculty sponsor + rising student admin team OR shut Sage's tenant down. School's call. No code lives on Sage infra. |
| **Faculty oversight** | Any faculty member you designate gets full admin — same delete-anything controls as me. |

---

## Demo (when they ask, ~5 minutes)

1. **Landing page** at `sage.successaths.com` — what students see logged out
2. **Sign in** — restricted to `@sagehillschool.org`
3. **Browse → course → unit → material** — student experience
4. **Submit page** — point at the **honor-code checkbox** explicitly
5. **Switch to admin view → Submissions queue** — click **Approve** on a real-looking pending item
6. **Show the report flag** on an approved material — click it, show the modal

Don't show: contest page, marketing assets, leaderboard (unless asked).

---

## Hard-question quick answers (some overlap with opening — repeat is fine)

| If they ask… | Say… |
|---|---|
| What if students cheat | Three layers (honor code + admin review + flag). I can also remove anything within hours. |
| What when you graduate | Documented handoff: faculty sponsor + rising student admin team, OR shut Sage's tenant down. School's call. No code on Sage infra. |
| Who has admin access | Me + students I designate. Happy to give Mr. Campeau, Dr. Balossi, or any faculty full admin — same controls. |
| Parent calls about something | Same-day takedown. Full data export at no cost. School can revoke entire tenant any time. |
| Is this an official Sage thing | No. Multi-tenant — Sage is one tenant. Terms + FAQ explicitly say independent, not officially endorsed. |
| How is it monetized | Free. No ads. No data sales. Contest from my pocket, optional per school, off by default. |
| What data is stored | Name, school email, graduating year, uploads. Vercel + Supabase + Resend. Deletion within 7 days on request. |
| Why now / why this timing | AP review + finals is the highest-value moment for shared notes. May = alpha; September = proper launch. |
| Can faculty add their own materials | Faculty can sign in with their @sagehillschool.org email and upload like any user, OR be granted admin to manage the queue. |
| Can students post anonymously | No. Every account tied to a verified school email; every submission tied to an account. |
| What about copyrighted material | Honor-code checkbox covers it; admin review catches what slips through; flag button is the third layer. We've never approved an obvious violation. |

---

## When stuck on a hard question

> "That's a fair concern. Let me think about it — what would a good answer look like to you?"

Pulls them into co-designing the solution. Way better than a half-baked on-the-spot answer.

---

## DO / DON'T

**DO**
- Hand the overview PDFs at the start — even if they don't read them now, they have the link list and the policy summary for after
- Take visible notes when they raise concerns (signals seriousness)
- Confirm any verbal yes out loud before leaving — *"To make sure I got it: …"*
- Ask what they need from you — *"Anything specific you'd like me back with — privacy summary, faculty-admin proposal, parent communication?"*

**DON'T**
- Lead with the contest/prize. Wait for them to ask.
- Push for an immediate yes
- Get defensive on a hard question (concerns ≠ accusations)
- Over-explain the tech stack — they don't care it's Drizzle on Supabase
- Assume yes is the only outcome
- Read the overview to them — they'll resent it. Talk *around* the doc, let them flip through it themselves if curious.

---

## Possible outcomes (be ready to gracefully accept any)

- ✅ **Approved unconditionally**
- 🔧 **Approved with conditions** — "yes if you make a faculty admin"
- 🧪 **Pilot only** — "seniors only this spring"
- ⏸ **Come back in fall** — they want more time
- ❌ **No yet** — revisit, regroup
- 🔁 **Wants more docs first** — privacy summary, parent communication, faculty announcement

---

## Asks (if they say yes)

- Faculty admin contact name
- **Any institutional channel for announcement** — newsletter paragraph, an email from the Dean to seniors/juniors, advisory-period mention, or a faculty member spending 60 seconds in their AP review class
- IT whitelist push for `sage.successaths.com`
- Any required edits to overview / TOS / contest

*(There's no town meeting between now and end-of-year, so don't ask for that. Frame the institutional ask as flexible — "whatever feels right to you" — rather than naming a specific channel.)*

---

## Bring

- Laptop, charged, signed in as **admin**, `sage.successaths.com` loaded
- Phone (backup demo + mobile experience demo)
- 2 printed copies of `success-at-sage-overview.pdf`
- Notebook + pen
- This sheet, folded inside the notebook

---

## After (within 4 hours of meeting)

Send recap email to Mr. Campeau + Dr. Balossi:

> Subject: Re: Request for Approval — Success at Sage
>
> Thanks again for the time today. To recap what we discussed:
> – [decision / direction]
> – [what I'm doing next]
> – [what you'll get back to me on]
>
> [Anything I committed to deliver, with a date.]
>
> Let me know if I missed anything.
>
> — Jahaan

---

*You built this thing. You know it. Walk them through it slowly. Listen more than you talk. Let the demo do the heavy lifting.*
