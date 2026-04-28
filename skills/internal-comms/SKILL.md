---
name: internal-comms
description: Help write internal company communications using established formats. Use this skill whenever asked to write internal communications such as status reports, leadership updates, 3P updates (Progress/Plans/Problems), company newsletters, FAQs, incident reports, or project updates.
license: Apache-2.0 — adapted from anthropic/skills/internal-comms (see LICENSE.txt)
---

## When to use this skill

Use this skill for:
- 3P updates (Progress, Plans, Problems)
- Company newsletters
- FAQ responses
- Status reports
- Leadership updates
- Project updates
- Incident reports

## How to use this skill

1. Identify the communication type from the user's request.
2. Find the matching format section below (3P Updates / Company Newsletter / FAQ Answers / General Communications).
3. Follow that section's instructions for tone, structure, and content.

If the request doesn't match any of the formats below, ask for clarification or more context about the desired format.

Keywords: 3P updates, company newsletter, weekly update, FAQ, common questions, internal comms, leadership update.

---

## 3P Updates (Progress, Plans, Problems)

3P updates are very succinct executive/leadership reports — the kind a busy reader can skim in 30–60 seconds. They cover a single team across one time period (almost always a week), and the bigger the team, the less granular the items should be. A small team's "Progress" might be "shipped feature X"; a whole company's might be "hired 20 people" or "closed 10 deals".

Three sections:
1. **Progress** — what the team accomplished in the past week. Things shipped, milestones, tasks closed.
2. **Plans** — what the team will work on in the next week. Top-of-mind, highest-priority items.
3. **Problems** — anything slowing the team down. Headcount gaps, blockers, bugs, deals that fell through.

Before writing, confirm the team name. If not specified, ask explicitly.

### Where to gather info (if available)

- Slack: posts from team members, especially in large channels with lots of reactions
- Google Drive: docs from critical team members with high view counts
- Email: messages with lots of replies or substantive content covering the period
- Calendar: non-recurring meetings of importance (product reviews, etc.)

Time windows:
- Progress: between a week ago and today
- Plans: from today to one week ahead
- Problems: between a week ago and today

If you don't have access to those sources, ask the user what they want covered. They may pre-supply the info, in which case you're mainly formatting.

### Workflow

1. Clarify scope (team name + time period)
2. Gather information (tools or user)
3. Draft following the strict format below
4. Review for concision (30–60 seconds to read) and that it's data-driven

### Format (strict)

Pick a fun emoji that captures the team's vibe. Then:

```
[emoji] [Team Name] (Dates Covered, usually a week)
Progress: [1-3 sentences of content]
Plans: [1-3 sentences of content]
Problems: [1-3 sentences of content]
```

Each section: 1–3 sentences max, matter-of-fact tone, metrics where possible. Never use any other formatting.

---

## Company Newsletter

A company-wide weekly/monthly summary, sent via Slack and email, ~20–25 bullets long.

Attributes:
- **Lots of links** — pull docs from Google Drive, prominent Slack messages from announce channels and execs, company-wide emails, external press references.
- **Short and to-the-point** — each bullet 1–2 sentences max.
- **Use "we"** — you are part of the company. Many bullets should say "we did X" or "we shipped Y".

### Where to gather info (if available)

- Slack: messages in big channels with high reaction/reply counts
- Email: exec messages with company-wide announcements
- Calendar: large-attendee meetings (All-Hands, big announcements). Attached docs are great links.
- Documents: new docs from the past week or two with attention — vision docs, quarter/half plans, exec-authored work
- External press: any articles or press the company received

If none of those are accessible, ask the user what to cover and act mainly as a formatting/polishing pass.

### Sections

For a 1000+ person company there's a lot going on. Cluster bullets into themed sections like {Product Development, Go to Market, Finance}, or {Recruiting, Execution, Vision}, or {External News, Internal News} — pick the cut that highlights different parts of the company well.

### Prioritisation

Focus on:
- Company-wide impact (not team-level details)
- Leadership announcements
- Major milestones and achievements
- Things affecting most employees
- External recognition or press

Avoid:
- Granular team updates (those go in 3Ps)
- Information relevant only to small groups
- Duplicates of already-communicated information

### Example structure

```
:megaphone: Company Announcements
- Announcement 1
- Announcement 2

:dart: Progress on Priorities
- Area 1
    - Sub-area
    - Sub-area
- Area 2
    - Sub-area

:pillar: Leadership Updates
- Post 1
- Post 2

:thread: Social Updates
- Update 1
- Update 2
```

---

## FAQ Answers

You're producing a weekly set of FAQs — questions employees are actually asking, with concise summarised answers, to keep the company informed and on the same page.

Two jobs:
1. Find questions that are big sources of confusion for *lots* of employees, generally about things that affect a large portion of the workforce.
2. Provide a nice summarised answer to minimise confusion.

Topics that tend to surface here: recent corporate events (fundraising, new execs), upcoming launches, hiring progress, changes to vision or focus, etc.

### Where to gather info (if available)

- Slack: questions with lots of replies, reactions, or thumbs-up — signs many employees want the same answer
- Email: emails with FAQs already written can be a direct source
- Documents: Google Drive docs, calendar-event attachments — directly added or inferred from contents

### Format

```
- *Question*: [insert question — 1 sentence]
- *Answer*: [insert answer — 1-2 sentences]
```

### Guidance

- Be holistic — represent the whole company, not just one user or team.
- Base answers on official communications when possible.
- If something's uncertain, say so clearly.
- Link to authoritative sources (docs, announcements, emails).
- Tone: professional but approachable.
- Flag if a question really needs executive input or an official response.

---

## General Communications

For internal communications that don't fit 3P updates, newsletters, or FAQs.

Before drafting:
1. Ask about the target audience.
2. Understand the communication's purpose.
3. Clarify the desired tone (formal / casual / urgent / informational).
4. Confirm any specific formatting requirements.

General principles:
- Be clear and concise.
- Use active voice.
- Put the most important information first.
- Include relevant links and references.
- Match the company's communication style.
