# Anti-patterns

Six failure modes that show up in AI-generated documents. Cross-check every
draft against this list before shipping.

## 1 · Emptiness

A document with all the slots filled but no content worth reading.

| Symptom | Example | Fix |
|---|---|---|
| Paragraph that restates its heading in sentence form | Heading: "Validation evidence". Body: "This section provides evidence of the validation we performed." | Either show the evidence or delete the section. |
| Bullet that names a concept without saying anything about it | "• Caching" | Replace with the specific cache (Redis), the specific operation (token validation), and the specific outcome (p99 from 480ms to 312ms). |
| Description that could apply to any project | "We built a scalable, modern, user-friendly system." | Name what makes *this* project different. If it's the same as ten others, you don't need the document. |
| Section header with one sentence under it | "Risk." "Some risks exist." | Either list the risks concretely or remove the section. Don't leave a hollow section. |

> The rule: **every paragraph must do work.** If removing the paragraph
> wouldn't lose information, remove it.

## 2 · Fabrication

Invented metrics, citations, or specifics. The single most damaging
anti-pattern because it makes the document actively wrong, not just weak.

| Symptom | Example | Fix |
|---|---|---|
| Made-up percentages | "Improved performance by 40%" — without source | Either find the real number or write "improved performance" without quantification. |
| Invented citations | "Lewis et al. 2020" — when you haven't actually checked the paper | Cite only papers you can link to and verify. |
| Manufactured user quotes | "One customer said: 'This changed everything.'" | Either use a real quote with attribution or paraphrase without quotes. |
| Hallucinated APIs | Code example referring to a function that doesn't exist | Verify every API/function/flag against the actual codebase before including. |

When data is genuinely missing, mark the gap explicitly: `[DATA NEEDED:
revenue figures for Q2]`. The reader knows it's a hole. Filling it with
plausible-sounding numbers is worse than leaving it empty.

## 3 · Mimicry

Imitating the *surface* of a genre without inheriting its *substance*.

| Symptom | Example | Fix |
|---|---|---|
| Status report with only positive deltas | Every metric is up-and-to-the-right; nothing slipped | Real status reports include slippage. If everything went well, say why and what you learned. If nothing slipped, you're not reporting honestly. |
| Resume with vague verbs | "Drove cross-functional alignment" | Replace with Action + Scope + Result + Outcome. "Led 3-person team that migrated 142 tables from pg15 to pg16 in 47 minutes, saving $48k/mo." |
| Architecture diagram with every box primary blue | The accent doesn't mean anything | Pick one focal node, demote the rest. (See `references/diagrams.md`.) |
| Post-mortem with no root cause | "Action: improve monitoring." | The action items are downstream of root cause, which is downstream of contributing factors. Don't skip the analysis. |

> Mimicry passes a casual reader's "looks like the right shape" test. It
> fails a careful reader's "is this useful" test. Aim for the second reader.

## 4 · Excess

Padding to fill template slots.

| Symptom | Example | Fix |
|---|---|---|
| Resume with 5 projects when 3 are real | Two fabricated to fill template | Use 3 real projects. Templates are guides, not minimums. |
| Long-doc with one-sentence sections | A "Background" section that says "This is a background." | Merge thin sections into adjacent ones, or delete. |
| Bulleted list of 9 items where 3 would suffice | Reader scrolls past it | Cut to the 3 that actually matter. |
| Code block with 200 lines of context | Reader can't find the change | Show the diff or the relevant 10 lines. Link to the full file. |

> The rule: **a resume with 3 real projects does not need 5 fabricated ones.**
> Generalize: a template's slot is a permission to include, not a requirement.

## 5 · Source gaps

Currentness claims without verification.

| Symptom | Example | Fix |
|---|---|---|
| "Latest version" without a number | "Uses the latest Postgres" | Name the version (16.2) and the date checked. |
| "Recent research" without a citation | "Recent papers show…" | Cite. If you can't, soften to "research suggests…" without claiming recency. |
| Specific launch date or funding amount without source | "Raised $40M in March 2026" | Either link the press release or remove the specific. |
| Pricing claim without checking | "Costs $X per seat" | Pricing changes. Either verify and date the check, or write "see vendor pricing page." |

When in doubt, ask the user. Do not silently fill in current-sounding facts.

## 6 · Tone contamination

Slipping out of the document's register.

| Symptom | Example | Fix |
|---|---|---|
| Formal letter with informal punctuation | "Dear Sir/Madam, We're SO excited to announce..." | Match register throughout. Either formal-formal or casual-casual. |
| Resume with marketing copy | "I'm passionate about delighting customers!" | Resumes are facts + results. Save the voice for the cover letter. |
| Post-mortem with blame | "The on-call engineer should have…" | Blameless writing focuses on systems, not individuals. Rewrite to focus on what the *process* allowed. |
| Equity report with hype | "This stock will moon" | Equity reports use measured language. Replace conviction with evidence + targets. |
| AI-flavored corporate filler | "In the rapidly evolving landscape of…" | Cut. Every word should be specific. |

> Each template has a register. Read a few real-world examples of the document
> type before drafting. Match the register, don't invent it.

## Pre-ship checklist

Run through this before declaring a draft done:

- [ ] Every paragraph does work (no emptiness).
- [ ] Every number, citation, version, and date is verifiable (no fabrication).
- [ ] The document reads like a real example of its genre, not a parody (no mimicry).
- [ ] Nothing is padding — slots only contain content that earns space (no excess).
- [ ] Currentness claims are backed by sources with check-dates (no source gaps).
- [ ] Tone is consistent end-to-end and matches the genre (no tone contamination).
