# Meeting Cheat Sheet — Thu Apr 30, 9:30am

*Personal — fold into notebook, don't hand out. Confidence about the product, deference about the school's role.*

---

## Opening (60 seconds, out loud)

> Thanks for taking the time. Quick context: the platform is running on the staging URL, working end-to-end. I'd like permission for a 4-week alpha — 30 to 50 students between AP exams and finals — with a proper rollout in September if it goes well. Built independently. You don't owe me a yes today, and I'm flexible on whatever changes would make you both comfortable. I brought a one-pager (hand them the PDFs) and the live site is up if you want to see it.

Then **shut up. Let them lead.**

---

## Three-layer cheating story (memorize verbatim)

1. **Honor-code checkbox** — required at upload, student confirms own work
2. **Admin review queue** — every submission seen by a human admin before going live
3. **Flag/report button** — every approved item, any student can flag, re-review, removed if confirmed

---

## Hard-question quick answers

| If they ask… | Say… |
|---|---|
| What if students cheat | Three layers above. Plus "I can remove anything within hours." |
| What when you graduate | Documented handoff: faculty sponsor + rising student admin team, OR shut Sage's tenant down. School's call. No code lives on Sage infra either way. |
| Who has admin access | Me + any students I designate. Happy to give Mr. Campeau, Dr. Balossi, or any faculty full admin — same delete-anything controls as me. |
| Parent calls about something | Same-day takedown. Full data export at no cost. School can revoke entire tenant any time. |
| Is this an official Sage thing | No. Multi-tenant platform — Sage is one tenant. Terms + FAQ explicitly say independent, not officially endorsed unless school says so. |
| How is it monetized | Free. No ads. No data sales. The $50/month contest is from my pocket, optional per school, off by default until you approve. |
| What data is stored | Name, school email, graduating year, uploads. Vercel + Supabase + Resend, all US providers. Deletion within 7 days on request. Privacy policy is published. |

---

## When stuck on a hard question

> "That's a fair concern. Let me think about it — what would a good answer look like to you?"

Pulls them into co-designing the solution. Way better than a half-baked on-the-spot answer.

---

## Demo flow (only when they ask, ~4 minutes)

1. **Landing page** at `sage.successaths.com` — what students see logged out
2. **Sign in** — restricted to `@sagehillschool.org`
3. **Browse → course → unit → material** — student experience
4. **Submit page** — point at the **honor-code checkbox** explicitly
5. **Switch to admin view → Submissions** — click **Approve** on a real-looking pending item
6. **Show the report flag** on an approved material — click it, show the modal

Don't show: contest page, marketing assets, leaderboard (unless asked).

---

## DO / DON'T

**DO**
- Bring 2 printed copies of the overview PDF
- Take visible notes when they raise concerns
- Confirm any verbal yes out loud before leaving ("To make sure I got it: …")
- Ask what they need from you ("Anything specific you'd like me back with — privacy summary, faculty-admin proposal?")

**DON'T**
- Lead with the contest/prize. Wait for them to ask.
- Push for an immediate yes
- Get defensive on a hard question (concerns ≠ accusations)
- Over-explain the tech stack — they don't care it's Drizzle
- Assume yes is the only outcome

---

## Possible outcomes (be ready to gracefully accept any)

- ✅ **Approved unconditionally**
- 🔧 **Approved with conditions** — "yes if you make a faculty admin"
- 🧪 **Pilot only** — "seniors only this spring"
- ⏸ **Come back in fall** — they want more time
- ❌ **No yet** — revisit, regroup

---

## Asks (if they say yes)

- Faculty admin contact name
- 1-line town meeting mention?
- IT whitelist push for `sage.successaths.com`
- Any required edits to overview / TOS / contest

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

*You built this thing. You know it. Listen more than you talk. Let the PDF and the demo do the work.*
