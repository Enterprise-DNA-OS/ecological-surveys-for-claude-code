---
description: "revise survey for ecological survey records"
---

# revise-survey

Read CLAUDE.md and docs/cli.md. Read the affected project or survey first. Use the operator name as an audit label and only supplied facts. Run:

```bash
npm run surveys -- revise-survey --survey=SURVEY --reason="Why this changed" --evidence-ref="archive reference" --actor="Name"
```

Present the result with record codes. Use --json for untrimmed values. List ambiguity candidates and stop instead of selecting a record by guess.
