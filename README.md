# ClauseCite

Paste any terms of service, contract, or policy. ClauseCite runs a fixed, published set of
deterministic patterns and shows the exact words each pattern matched - grouped by risk
category, with why it matters and what to check next.

- **No AI, no score, no upload.** The scan is 18 regex rule families running entirely in
  your browser. Same text produces the byte-identical report every time.
- **Every flag is traceable.** Each flag cites the exact matched span and its clause
  heading, and the full rule set ships in `rules.js`.
- **Negation-aware.** Wording like 'we do not sell your data' or 'we indemnify you' is
  marked UNCLEAR with a neutral note instead of a confident risk - no directional
  assertion is made when the sentence may mean the opposite.
- **Honest limits.** A flag means "wording worth reading", never a legal conclusion.
  Deterministic patterns catch only the phrasings they know; a missing flag never proves
  a clause is absent. Not legal advice.

## Run

Static site - open `index.html` or serve the folder. Tests: `node test.js` (33 checks:
risk-family coverage on a hostile sample, span integrity, determinism, benign-text
specificity, segmentation, report honesty note).

## Scope

Positioned against AI contract summarizers and browser extensions by transparency and
reproducibility: the reader sees the exact matched words and the published pattern that
fired, not a paraphrase. No novelty claim is made; similar scanners exist.
