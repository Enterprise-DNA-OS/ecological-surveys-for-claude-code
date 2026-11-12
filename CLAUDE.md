# Ecological Surveys for Claude Code: operating instructions

This is the office review desk for an ecological consultancy. It holds project surveys, species observations, permission evidence, follow-up actions and revision-specific reviews. It does not capture mobile fieldwork or determine legal permission.

## Who this is for

Set your business name in brand.json. Identify the current operator and project before a write. The fictional demo is not a client or field result.

## Routing table

| Operator request | Recipe |
|---|---|
| projects | /projects |
| surveys | /surveys |
| review queue | /review-queue |
| evidence gaps | /evidence-gaps |
| permit check | /permit-check |
| species register | /species-register |
| provisional identifications | /provisional-identifications |
| actions due | /actions-due |
| owner workload | /owner-workload |
| stale surveys | /stale-surveys |
| sensitive records | /sensitive-records |
| survey effort | /survey-effort |
| review history | /review-history |
| compliance | /compliance |
| attention | /attention |
| notes | /notes |
| audit | /audit |
| imports | /imports |
| project | /project |
| survey | /survey |
| add project | /add-project |
| add survey | /add-survey |
| revise survey | /revise-survey |
| add observation | /add-observation |
| revise observation | /revise-observation |
| add action | /add-action |
| complete action | /complete-action |
| review survey | /review-survey |
| log | /log |
| import | /import |
| export | /export |
| weekly review | /weekly-review |
| draft survey | /draft-survey |
| draft field return | /draft-field-return |
| customise | /customise |
| new view | /new-view |

## Rules

Read the matching .claude/commands file and use the single npm run surveys CLI. Start every answer from live CLI output. All runtimes, including Claude Code, Codex, OpenCode and Cursor, use these same recipes.

Use --json for full text. Unique codes, ID prefixes and case-insensitive names resolve records. If ambiguous, list candidates. Never invent observations, species status, permission applicability, evidence or review conclusions.

Every mutation requires --actor. Actor names are audit labels, not verified identities. Only the database owner or a trusted operator should connect. Shared multi-user access needs separate authentication and role design.

A review is tied to a survey revision. Survey edits, observation changes and action changes invalidate it. Notes preserve context without changing the evidence revision. The person recording a review must be different from the field observer. Only record reviews the operator has actually completed.

No sending, submitting, publishing or deleting. Drafts and reports contain sensitive ecological data. Keep them private, particularly locations of vulnerable species. This base never supplies statutory permission or replaces the responsible ecologist's judgment.

Run npm test after a change. Do not edit an applied migration. Use a new migration, preserve old review evidence and export a backup before customisation. Never seed a production database.

Built by Enterprise DNA. Installed and run through Omni by Enterprise DNA: https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=wildnote
