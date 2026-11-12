# Permission evidence and record checks

Checked 12 November 2026. These checks are review prompts for an ecological consultancy. They do not determine jurisdiction, species protection, permission applicability or legal compliance. No work is authorised by a passing report.

## Sourced industry requirement

The [New Zealand Department of Conservation marine reserve research guidance](https://www.doc.govt.nz/get-involved/apply-for-permits/marine-reserve-research/) states that activities such as sample collection and handling marine life require a permit. Observation and other activities have their own conditions. The responsible ecologist records whether the actual activity requires permission and cites that assessment in applicability_basis. A permit-required record must have a reference, scope and validity dates covering surveyed_on. The software checks those recorded fields only. A person must verify the permit itself, permitted species, methods, locations, personnel and conditions. Do not apply this example to every New Zealand survey or to Australian work.

[Australian Commonwealth listed-species permit guidance](https://www.dcceew.gov.au/environment/biodiversity/threatened/permits) describes permits for activities affecting protected matters in Commonwealth areas. State and territory requirements are separate. Australian projects require a local assessment and custom rules. The base does not encode an Australia-wide permit decision.

## Rules implemented

| Rule | Test | Basis |
|---|---|---|
| APPLICABILITY | Missing documented permission assessment | Internal evidence rule supporting the DOC guidance above |
| PERMISSION | Required permission lacks reference, scope or date coverage | Recorded-permission check supporting the DOC guidance above |
| LOCATION | Missing paired coordinates | Internal field evidence quality rule |
| EFFORT | Missing positive minutes | Internal survey effort rule, not a statutory threshold |
| EVIDENCE | Missing field archive reference | Internal evidence traceability rule |
| FUTURE | Recorded survey date is in the future | Internal completed-survey quality rule |
| IDENTIFICATION | An observation is still provisional | Internal reviewer decision rule |
| OBSERVATION-EVIDENCE | Observation has no evidence reference | Internal traceability rule |

Reviews additionally require no open follow-up actions and a named reviewer different from the field observer. Editing survey evidence or actions invalidates the current review. Earlier reviews and before/after audit records remain available. These are internal controls, not claims of a vendor-tier feature or accredited certification.

Species names are operator-entered. Observed counts are not abundance estimates and surveys of different effort or method should not be compared as equivalent. Sensitive flags are review labels, not access control. All generated files remain internal until someone checks location sensitivity and approves release. No sending, submission or deletion command exists.
