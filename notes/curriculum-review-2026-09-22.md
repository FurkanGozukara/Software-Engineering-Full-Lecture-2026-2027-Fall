# Curriculum review: the remaining thirteen lectures

Reviewed 22 September 2026. The detailed teaching content lives in [the weekly source plans](../plan/00_START_HERE.txt); this record explains the revision and its evidence. The [latest teaching review](#teaching-review-follow-up-22-september-2026) supersedes the earlier validation snapshots below.

The existing plan is a strong introductory course. Its best features are worth retaining: one coherent Campus Rooms case, predictions before explanations, comparisons under changed conditions, independent checks, and a complete path from human need to maintenance. It already includes contemporary security, delivery, accessibility, observability and AI assistance. Replacing the sequence would lose useful dependencies and continuity with the recorded first lecture.

The main improvement is to make several underdeveloped engineering decisions concrete. Adding every specialist topic would make the course harder to understand. The revised plans retain fourteen weeks and the same 112 scene identifiers, and distinguish core explanation from optional depth inside each remaining week. The final standard is whether a viewer can explain a decision, predict a changed condition and identify the evidence that would change their mind.

| Week | Focus retained | Improvement applied |
|---|---|---|
| 2 | Requirements and traceability | Validate the human outcome; make accessible completion as concrete as speed; show that a precise AI request still needs independent checks. |
| 3 | Behavior, data and interaction models | Distinguish an invariant from eventual progress, and identifier shape from referential integrity. Bounded model exploration is optional. |
| 4 | Flow, uncertainty and decisions | Add lifecycle and opportunity cost, reducing scope or deferring work, and a fair comparison of coordination methods. |
| 5 | Modularity, contracts and refactoring | Expose construction through validation, deterministic policy and explicit results; compare build, reuse and buy decisions. |
| 6 | Architecture and distributed failure | Make an HTTP contract concrete; trace an outbox across crashes and duplicate delivery attempts. |
| 7 | Collaboration and version history | Connect working tree, selected changes, local commits and shared history; resolve review disagreements through evidence. |
| 8 | Testing and credible evidence | Contrast a useful test double with real provider-contract evidence; connect static and dynamic verification to their claims. |
| 9 | Security, privacy and dependencies | Map risks to ASVS verification requirements and evidence; follow an affected dependency into mitigation; clarify CRA phases. |
| 10 | Automated delivery and release | Separate verification permissions from release authority; connect provenance with artifact identity; give flags owners and retirement conditions. |
| 11 | Reliability, diagnosis and performance | Connect traces with profiling, distinguish overload admission from retries, clarify incident responsibilities and error-budget interpretation. |
| 12 | Maintenance and evolution | Require evidence that backup data restores usable state; account for later writes, interruption and cache freshness. |
| 13 | AI-assisted engineering | Show useful bounded delegation, task specifications, research limitations and evaluation against a deterministic baseline. |
| 14 | Integrated engineering decision | Make the release record actionable, include operating and exit costs, and test transfer beyond Campus Rooms. |

Each revised week has an additional answered reasoning question and a closing transfer question with its worked answer. Its existing three Anchor scenes remain the main demonstrations. Additions fit within existing scenes; the revised depth paragraph replaces the earlier elasticity paragraph. No new requirement is imposed on a later week by an optional extension.

The source register now contains 59 references. Newly checked additions include [ASVS 5.0.0](https://owasp.org/projects/asvs), [OpenAPI 3.2.1, published 10 September 2026](https://spec.openapis.org/oas/v3.2.1.html), Google's SRE chapters on [overload](https://sre.google/sre-book/handling-overload/) and [data integrity](https://sre.google/sre-book/data-integrity/), METR's [February study-design update](https://metr.org/blog/2026-02-24-uplift-update/) and [May self-report survey](https://metr.org/blog/2026-05-11-ai-usage-survey/), and the public [DORA AI Capabilities Model overview](https://dora.dev/ai/capabilities-model/report/). The final foundation review adds the [PostgreSQL index introduction](https://www.postgresql.org/docs/18/indexes-intro.html) for a qualitative performance trade-off. These support specific choices, not a claim that newer is always better.

The review also corrects misleading implications:

- NIST still labels [SSDF 1.2 an initial public draft](https://csrc.nist.gov/pubs/sp/800/218/r1/ipd); the final baseline is not silently replaced.
- The CRA's reporting date and main-obligation date are distinct. The [Commission's current page](https://digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act) confirms 11 September 2026 and 11 December 2027 respectively. Scope and exemptions remain explicit.
- A precise requirement enables verification; it does not guarantee a correct generated candidate or a productivity improvement.
- Generic static checks need not know the domain policy. Specialized checks can verify richer properties when supplied with an appropriate specification.
- The SLO fixture's fresh-window exhaustion calculation is not remaining budget after the displayed window has already overspent.
- The invented dependency is unavailable in a fictional registry fixture; the course makes no universal claim about live public registries.

The review used the first lecture's source plan, production handoff and written transcript, including its closing request, “Make room booking fair and easy.” It did not perform a fresh video inspection or audio review. The accepted first-lecture files and its fixture entries remain intact. Its introductory language about a room and hour is followed in Week 2 by the existing precise whole-minute duration and half-open-interval rules, without introducing an hourly slot grid.

The source register distinguishes new retrievals from the original September 16-17 checks. The official SWEBOK indexed page still identifies V4.0a; direct access failed. The CS2023 final-report landing page was accessible, but the complete HTML exceeded the retrieval size limit. The DORA capabilities download was not audited. These are scope references, not a full standards or accreditation audit. Recheck volatile sources before the corresponding lecture is authored.

The revised [combined Markdown](../plan/Software_Engineering_14_Week_Plan.md) and [instructor PDF](../plan/Software_Engineering_14_Week_Plan.pdf) are derived from the source plans. Revised future decks, student PDFs and recordings are subsequent production work; a completed plan does not claim they exist.

Initial review checkpoint, earlier on 22 September 2026 (before the public-course follow-up below):

- Plan structure, source references, case-rule links, recomputed fixtures and manifest freshness: PASS. All 112 scene IDs and roles are preserved; all eight Week 1 fixture entries and the canonical case are unchanged.
- Derived Markdown/PDF freshness, site fixture synchronization and generated index freshness: PASS. The existing numerical fixtures are unchanged; the SLO addition clarifies interpretation.
- Existing-deck regression selection: **131 passed, 11 skipped, 1441 deselected**. The selection covers Week 1, the existing Week 5 dependency scene, the existing Week 11 latency scene, Week 1 PDF and plan checks. Ten skips concern absent sliders; one concerns an unspecified scene text assertion. Unbuilt future decks are not claimed to pass.
- Instructor PDF: **135 pages**. All pages were rasterized and inspected in six structural contact sheets; ten pages were inspected at reading size. Automated text-bound and replacement-glyph checks found no issues. Page numbers and heading-break protection were added to the existing export helper. This is an instructor reading copy, not a new set of student lecture PDFs.
- Week 1 source plan, deck, deck script and student PDF, plus the site index, match the baseline; Week 1 production media was not modified.
- Git whitespace check and tutorial-workspace documentation routing: PASS. The source changes are local on `plan/remaining-weeks-20260922`; nothing was published.

Local verification receipts: `build/curriculum_revision_20260922.json`, `build/curriculum-preservation-20260922.json` and `build/curriculum-pdf-review/report.json`. The temporary application and review scripts are in the ignored `build/` directory. The committed baseline and current source diff preserve the content history.


## Public-course follow-up: 22 September 2026

The user's audience and pacing clarification is now applied in the source package. Its single decision home is [START HERE](../plan/00_START_HERE.txt). The inherited undergraduate framing and the plan checker's hard-coded duration header have been removed. The user's follow-up retains an approximate overall lecture target, permits shorter or longer lectures, and excludes chapter, section and scene timing allocations; the target value lives only in START HERE. All fourteen headers say flexible pacing. Week 1's teaching content, deck, PDF and recorded media are retained; only its plan header changed. The obsolete calendar offsets were replaced with the actual remaining build sequence. The package assumes no separately assigned coursework or university administration.

Weeks 2-14 now each close with an original, answered question outside room booking:

| Week | Transfer setting | Decision made visible |
|---|---|---|
| 2 | Desktop editor | Clarify a safe-save promise before choosing autosave. |
| 3 | Mobile notes | Separate local persistence from remote synchronization. |
| 4 | Library maintenance | Inspect review capacity and accepted work, not drafting alone. |
| 5 | Image library | Check behavioral compatibility when replacing a decoder. |
| 6 | Batch importer | Reconcile writes and completion evidence across a crash. |
| 7 | Library documentation | Detect incompatible meaning after a clean text merge. |
| 8 | File converter | Derive expectations independently of the implementation. |
| 9 | Desktop export | Enforce permission at the boundary performing the operation. |
| 10 | Command-line distribution | Connect the downloaded artifact with verification evidence. |
| 11 | Batch reporting | Include correctness and completeness in successful completion. |
| 12 | Desktop document format | Account for saved state before promising rollback. |
| 13 | Automated repository edit | Bound useful automation to the intended checkout and checks. |
| 14 | Device configuration | Elicit interruption, safe-state and recovery requirements again. |

These questions and their answers are explained within the lecture and retained in the reading copy. Their matching `transfer_checks` fixtures contain qualitative authored scenarios, not industry measurements. They introduce neither a second implementation track nor extra scene identifiers. The main case remains useful continuity with the recorded first lecture; it is not the viewer's institution.

Week 14 also adds a concrete professional-judgment comparison: release pressure changes while the known inaccessible status cue remains. The explanation identifies affected people, a safer alternative and escalation of the unresolved decision. [ACM's official ethics excerpts](https://www.acm.org/binaries/content/assets/about/acm-code-of-ethics-booklet.pdf) support considering affected people and harm; direct retrieval returned HTTP 403, so the source register records the access limit. The release scenario is course-authored, not copied guidance or legal advice.

The follow-up rechecked selected current primary references, including [SWEBOK's official indexed page](https://www.computer.org/education/bodies-of-knowledge/software-engineering), [OWASP Top 10:2025](https://top10.owasp.org/2025/), [ASVS](https://owasp.org/projects/asvs), [DORA's current delivery measures](https://dora.dev/guides/dora-metrics/), [OpenAPI 3.2.1](https://spec.openapis.org/oas/v3.2.1.html), [NIST's draft status](https://csrc.nist.gov/pubs/sp/800/218/r1/ipd) and the [CRA timeline](https://digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act). It did not repeat a full-source audit or inspect/listen to the delivered recording.

Final validation receipts for this follow-up are `build/public-course-plan-check-20260922.json`, `build/public-course-verification-20260922.json` and `build/public-course-pdf-review/report.json`. They verify the plan structure, source links, current derived files, all thirteen matching transfer questions, unchanged scene IDs, preserved Week 1 teaching content and unchanged numerical/canonical fixtures. The 135-page instructor PDF was rasterized with Poppler; all pages were inspected in six contact sheets and nine selected pages at reading size, with no text-bound or replacement-glyph findings. The existing-deck regression selection again passed: **131 passed, 11 skipped, 1441 deselected** (165.50 seconds); the skips have the same reasons recorded above. Future complete decks and recordings still require their own authoring and production checks.

Pacing clarification follow-up: the overall target is now explicit in START HERE while chapter timings remain unassigned. The combined Markdown/PDF was rebuilt and freshness/plan checks passed; the changed orientation and reference-analysis pages were inspected after export. No lecture content, fixtures, deck code or recorded media changed in this clarification.

## Final foundation review: 22 September 2026

The saved revision was reviewed rather than replaced. The week-by-week mechanisms, outcomes and depth choices already form a strong introductory sequence. This pass adds two bounded explanations: Week 2 connects a requested solution to a simulated workflow observation and prototype; Week 11 offers a qualitative scan/index comparison after a storage bottleneck is supported by evidence. The latter is an optional alternative to deeper alert-window reasoning, so it creates no later prerequisite. Week 12 already covers acceptable data loss, restoration time and consistent usable recovery; no duplicate recovery lesson was added.

The coverage document now maps all eighteen SWEBOK knowledge-area headings to the course's worked coverage, selected foundations and further-study boundaries. This is an original instructor map, supported by the [official indexed topic outline](https://www.computer.org/education/bodies-of-knowledge/software-engineering/topics); direct access returned HTTP 403. It is not a standards-conformance audit or a claim that this introductory course teaches every topic in those areas. The new performance source is [PostgreSQL's official index introduction](https://www.postgresql.org/docs/18/indexes-intro.html), with no benchmark values imported.

Selected current references were rechecked: NIST draft status, DORA delivery measures and report overview, OpenAPI, OWASP's Top 10 landing page, WCAG, CRA application dates, CS2023 scope, and the SRE data-integrity chapter. This was not a fresh audit of every registered source. The first lecture's handoff and closing written transcript were read; no listening, fresh audiovisual review or media revision was performed.

Current validation: plan checks and their pytest test pass; the manifest, combined reading copies, site fixtures and index are current; Git whitespace checks pass. Preservation checks retain all 112 scene IDs/roles, eight Week 1 scene fixtures, the canonical case, numerical fixtures, Week 1 deck/script/PDF and thirteen matching transfer questions. No existing deck implementation changed, so the previously recorded browser-regression result above was not rerun for this small source-plan refinement.

At this foundation-review checkpoint the instructor PDF had **138 pages**. All pages were rasterized and inspected in six structural contact sheets, with ten selected pages inspected at reading size. Automated text-bound and replacement-glyph checks found no issues. The added examples have matching qualitative fixtures and the source register had 59 entries. Checkpoint receipts: `build/foundation-plan-check-20260922.json`, `build/foundation-final-verification-20260922.json` and `build/foundation-pdf-review/report.json`.

## Teaching review follow-up: 22 September 2026

Assessment: retain the existing remaining-week sequence. It supplies a strong general introduction with contemporary engineering examples; adding every specialist subject would weaken the explanation. The next quality gains depend on understandable demonstrations, carefully explained decisions and successful transfer to other software. A plan alone cannot establish that the eventual lectures are the best ever produced.

This pass makes four focused changes:

- Week 2 corrects an overly narrow principle: observable quality acceptance can be categorical, as in keyboard completion and understandable status, as well as numerical. The explanation and qualitative fixture now agree.
- Week 8 adds guided exploratory testing within the existing user-journey comparison. A discovered status mismatch becomes a regression example; representative-user usability research answers a separate question. The conceptual reference is [ISTQB section 4.4.2](https://istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf), and the scenario is original. No certification curriculum or timing allocations are adopted.
- Future plans and authoring guidance address the viewer and smaller playback windows instead of assuming a classroom. The recorded Week 1 source and artifacts remain intact.
- The [instructor preflight](../plan/21_instructor_preflight.txt) now checks outcome-to-explanation coverage, first-use terminology, causal comparisons, independence from optional extensions, and the answered transfer question. This is authoring acceptance, not viewer coursework.

The source register now has **60 entries**. Selected current sources were rechecked: [DORA delivery measures](https://dora.dev/guides/dora-metrics/), [NIST SSDF draft status](https://csrc.nist.gov/pubs/sp/800/218/r1/ipd), [OWASP ASVS](https://owasp.org/projects/asvs) and [OpenAPI 3.2.1](https://spec.openapis.org/oas/v3.2.1.html). Their existing treatment remains appropriate. This was not a fresh audit of every source. The first lecture's closing written transcript was checked for continuity; no audio or fresh audiovisual review occurred.

Current reading copy: **139 pages**. All pages were rasterized and inspected in six structural contact sheets; eleven selected pages were inspected at reading size. No clipping, overlap or missing text was found in those views, and automated text-bound and replacement-glyph checks found no issues. The PDF helper initially lacked PyMuPDF in the tutorial virtual environment; the existing `C:/Python310/python.exe` environment supplied the dependencies and completed the review without an installation.

Plan validation and its pytest test pass; the derived manifest, Markdown/PDF, site fixtures and index are current. Preservation and review evidence is in `build/teaching-final-verification-20260922.json` and `build/teaching-pdf-review/report.json`. All 112 scene IDs/roles, prior fixture values and thirteen transfer examples remain. Existing deck implementations did not change, so their earlier browser regression result was reused rather than rerun. The audience and pacing decision remains solely in START HERE. Changes are local; future decks and recordings still require production and review.
