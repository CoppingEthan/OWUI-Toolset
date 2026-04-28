---
name: meeting-notes
description: Turn raw meeting input (transcript, recording summary, scratch notes, or "here's what we discussed") into clear, actionable meeting notes. Use this skill when the user asks for meeting notes, minutes, a recap, action items, summary of a meeting, or "write up our discussion".
---

## When to use

The user has meeting content — a transcript, AI-generated summary, their own messy notes, or a verbal description — and wants it turned into structured meeting notes that someone who wasn't there can actually read and act on.

## Before drafting — clarify

1. **Audience** — attendees only? Wider team? Public/customer-facing? This sets tone and what to omit.
2. **Format preference** — bullets, narrative, or formal minutes? Short recap or full record?
3. **Action item ownership** — does the user know who owns each action, or do you need to ask?
4. **Confidentiality** — is anything off-the-record / NDA / sensitive that shouldn't be written down?
5. **Time-bound items** — were specific dates/deadlines discussed? Capture them precisely; don't paraphrase as "soon".

If you have a transcript, identify the speakers if possible and read the whole thing before drafting. If the user gave you scratch notes, ask what they remember about anything ambiguous.

## Format (default)

Lead with what's most useful: the decisions and action items. Background context goes lower.

```
# [Meeting topic]

**Date**: [YYYY-MM-DD]
**Attendees**: [names]
**Purpose**: [1 sentence — why this meeting happened]

## Decisions made
- [Decision] — [brief rationale if non-obvious]
- [Decision]

## Action items
| Owner | Action | Due |
|-------|--------|-----|
| [name] | [specific action] | [date] |
| [name] | [specific action] | [date] |

## Discussion summary
[2-5 short paragraphs covering the key topics in the order they were discussed. Lead each with the topic, then the substance. Skip pleasantries, tangents, and false starts.]

## Open questions / parking lot
- [Question or topic deferred to a future meeting]
- [Question with no owner yet]

## Next meeting
[Date / scheduled time, or "TBD"]
```

For a quick recap (Slack-friendly), drop the discussion summary and keep just decisions + action items.

## What to capture

**Always capture:**
- Decisions made (and who made them, if it matters)
- Action items with owner + due date
- Numerical commitments (budget, headcount, dates)
- Disagreements that didn't get resolved (so future-you remembers)
- Specific quotes only if attribution + verbatim accuracy matter

**Skip:**
- Pleasantries, intros, off-topic banter
- "Let me share my screen" / tech setup chatter
- False starts where someone retracts what they said
- Speculative tangents that weren't acted on
- Most "X said, then Y said, then X said" blow-by-blow

## Action items — write them properly

Bad: "Discuss pricing"
Good: "[Sarah] to draft pricing options for Pro tier; share by Friday EOD"

Components of a good action item:
- **Owner** — exactly one person. Multi-owner items don't get done.
- **Verb-led** — starts with the action ("Draft", "Schedule", "Send", "Review"), not a topic.
- **Specific** — what does "done" look like? "Discuss pricing" has no done state.
- **Deadline** — even a soft one is better than none. "By next Tuesday" beats "soon".

If you don't know the owner or deadline, mark it `[owner: TBD]` or `[due: TBD]` rather than fabricating.

## Tone

- Past tense for what happened, future tense for actions.
- Neutral and matter-of-fact. Don't editorialise on whose idea was good.
- Use names with first reference, then first names afterward (or whatever convention the org uses).
- If something was a heated debate, you can note "robust discussion on X" without taking sides.

## Sensitive content

Before delivering: scan for anything that shouldn't be written down — personnel issues, legal exposure, customer names under NDA, comp/salary specifics, M&A talk. Flag these to the user with a note like:

> ⚠️ I left out [X] because it looked sensitive — let me know if you want it included with a confidentiality marker.

## Output

Default: deliver the formatted notes ready to paste into a doc, Slack, or email. If the user wants a shorter Slack version, offer "Want a 3-bullet summary version too?" at the end.

If the source material was very thin and you had to make assumptions, list them at the bottom under "Assumptions I made" so the user can correct you.
