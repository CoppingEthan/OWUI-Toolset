---
name: code-review
description: Review code for correctness, security, performance, and maintainability. Use this skill when the user asks for a code review, "look at this PR", "check my code", "is this OK", "any issues with this", or any request to evaluate / critique code. Works for any language.
---

## When to use

The user has shown you code (a diff, a pasted file, a snippet, a PR link, or files in the sandbox) and wants feedback. Default to a review even if they only ask "what do you think?" — that's still a review request.

## Before reviewing — orient

1. **Scope** — single function? Whole file? Multi-file change? PR diff?
2. **Language and runtime** — confirm if not obvious; many issues are language-specific.
3. **Stage** — early sketch, ready to merge, post-incident hot-fix? Severity bar adjusts accordingly.
4. **What did the author actually intend?** Read commit messages / PR descriptions / surrounding code first. A "bug" you flag may be intentional.

If the change spans files you can't see, ask for them or use the sandbox/file tools to read more. Don't review in isolation if a function's caller behaviour is load-bearing.

## What to look for, in priority order

### 1. Correctness (highest priority)

- Does the code do what the description claims?
- Off-by-one errors, boundary conditions, empty inputs, unicode, very large inputs.
- Race conditions, ordering assumptions, double-frees, double-callbacks.
- Error handling: are errors caught at the right level? Silently swallowed? Re-thrown with context?
- Resource leaks: file handles, DB connections, listeners, goroutines, timers.
- Concurrency: shared mutable state, locking discipline, await ordering.

### 2. Security

- Input validation at every trust boundary (HTTP, DB, env, FS).
- Injection vectors: SQL, command, path traversal, SSRF, XXE, prototype pollution.
- Auth/authorization checks on every privileged endpoint.
- Secrets not in source, logs, or error messages.
- `crypto.timingSafeEqual` or equivalent on all token compares.
- Outbound URL fetches: validated against allow-list, no localhost/private-IP unless intentional.
- File paths: resolved + checked against an allow-prefix.
- Dependency choices: known-vulnerable packages, lockfile drift.

### 3. Robustness / failure modes

- What happens when the network is slow? When the disk is full? When a callee returns null?
- Retries: idempotent? Bounded? Backed off?
- Timeouts on every external call.
- Logs that will help on-call diagnose without leaking sensitive data.

### 4. Performance — only if it actually matters

- N+1 queries, unnecessary re-renders, blocking I/O on hot paths.
- Big-O issues if the input can grow.
- Don't ask for premature optimization. If it's already fast enough at expected scale, leave it.

### 5. Readability / maintainability

- Names: do they say what the thing is or just what it's made of?
- Functions doing two things — split.
- Comments that explain *why*, not *what* the code does.
- Dead code, commented-out code, leftover debug logs.
- Tests: cover the new logic? Cover failure cases, not just happy path?

## Style of feedback

- **Be specific.** "This will break when X" is feedback. "This feels off" isn't.
- **Cite file:line** where relevant: `[server.js:640]`.
- **Prioritise.** Three "must fix"s buried in twenty nits is worse than three "must fix"s alone.
- **Show what you'd change**, don't just point.
- **Acknowledge tradeoffs.** Most decisions are tradeoffs, not crimes.
- **Ask before assuming malice or stupidity.** If you don't understand why the code is the way it is, ask. The author may have a good reason.

## Output structure

Use these labels so the author can triage fast:

```
## Must fix
[Things that are definitely wrong / will break in production / are security issues]
- [file:line] — issue + suggested fix

## Should consider
[Things likely to bite later / non-obvious tradeoffs / better alternatives]
- [file:line] — issue + reasoning

## Nits / style
[Cosmetic preferences — author can ignore freely]
- [file:line] — nit

## Looks good
[Briefly call out 1-2 things that are particularly well done — not flattery, but specific]
```

If everything is fine, say "Looks good — no blockers" and explain *why* you think it's good (what could have gone wrong but didn't).

## What to skip

- **Don't bikeshed style** if a linter / formatter is already in the repo. That's the linter's job.
- **Don't rewrite to your taste.** If the code is clear and works, opinionated rewrites are noise.
- **Don't suggest premature abstractions** — three similar lines beats a clever generic helper.
- **Don't add error handling for impossible cases** unless you can name the case.

## Final pass

Before delivering: read your review back. Would the author act on each point, or would they roll their eyes? If the latter, cut it.
