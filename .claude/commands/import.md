---
description: "import for ecological survey records"
---

# import

Read CLAUDE.md and docs/cli.md. Read the affected project or survey first. Use the operator name as an audit label and only supplied facts. Run:

```bash
npm run surveys -- import wildnote --project=PROJECT --file=imports/pivot.xlsx --mapping=imports/mapping.json --dry-run --actor="Name"
```

Read docs/replace-wildnote.md. Inspect the actual workbook and mapping, including permission applicability and review dates. Show the dry-run count, then remove --dry-run for the requested import. Preserve the source archive. Never label the example workbook as a genuine vendor export.
