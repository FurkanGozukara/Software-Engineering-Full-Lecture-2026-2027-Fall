# Task: export and inspect the student PDFs

Run `python scripts/export_pdf.py --site site --all` (or `--week NN`). The export waits for each deck's `html[data-print-ready="true"]` signal; if a deck never declares it, fix the deck, never add a delay.

Then run `cd plan && SE_COURSE_SITE=../site pytest -q -m pdf` and open every PDF yourself. Check each page for clipping, tiny labels, missing diagrams, blank canvas output, overlapping reveals, truncated code and repeated controls. Check that questions come before their revealed explanations, that scene identifiers are visible, that condition values selected by controls are printed as text, and that a grayscale preview keeps every comparison meaningful.

Report per week: page count, pages inspected, defects found and fixed, and anything left unresolved. Keep the accessible HTML available beside the PDF; a successful export is not a claim of a tagged, conformant PDF.
