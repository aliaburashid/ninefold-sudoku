# Playable puzzles and provenance

The nine initial playable puzzles were retrieved on 2026-10-15 from the [Sudoku Exchange Puzzle Bank](https://github.com/grantm/sudoku-exchange-puzzle-bank). The dataset is [public domain under the Unlicense](https://github.com/grantm/sudoku-exchange-puzzle-bank/blob/master/LICENSE.txt). Its author generated uniquely solvable puzzles with QQWing and graded them with Sukaku Explainer.

The original source row IDs, complete digit strings, ratings, and download URLs are recorded in [puzzle-provenance.json](puzzle-provenance.json). Each puzzle also has a metadata sidecar next to its `.txt` file. A source ID is the first 12 hexadecimal characters of the SHA-1 hash of its 81 digits. The offline verifier checks this fingerprint as well as uniqueness, shape, clues, and rating range.

| Puzzle | Source ID | Published rating |
| --- | --- | --- |
| easy-01 | 0000183b305c | 1.2 |
| easy-02 | 0001d5d6314e | 1.2 |
| easy-03 | 000212406270 | 1.2 |
| medium-01 | 0000847b216e | 2.3 |
| medium-02 | 0000c45fb232 | 2.0 |
| medium-03 | 0000fc7c6b96 | 2.3 |
| hard-01 | 00005f662e09 | 3.4 |
| hard-02 | 00009e4900fa | 2.6 |
| hard-03 | 0000b2c3fc62 | 4.3 |

Categories use the source's thresholds: Easy below 1.5; Medium 1.5–2.4; Hard 2.5–4.9. These ratings reflect required solving techniques, not just clue counts. They are dataset conventions, not universal promises about completion time. [Source's rating explanation](https://sudokuexchange.com/puzzle-bank/)

Every included puzzle passed independent solution counting with exactly one solution. Runtime loading also verifies solvability using the original Java reader and solver. The production solver stops at its first solution and does not itself prove uniqueness; run the offline check when adding puzzles.

## Add a puzzle without changing React

1. Obtain a uniquely solvable, difficulty-rated puzzle from a reliable source. Keep its rating and provenance.
2. Add a file such as `src/main/resources/puzzles/web/medium/medium-04.txt`, using exactly nine lines of nine digits. Zero means empty. IDs must be unique and begin with `easy-`, `medium-`, or `hard-`.
3. Add the matching `medium-04.properties` metadata file:

   ```properties
   title=In the groove 04
   rating=2.3
   source=Sudoku Exchange Puzzle Bank
   sourceUrl=https://raw.githubusercontent.com/grantm/sudoku-exchange-puzzle-bank/master/medium.txt
   sourceId=THE_12_CHARACTER_SOURCE_FINGERPRINT
   license=Public domain (Unlicense)
   ```

4. Run `python3 scripts/verify_catalog.py`. Resolve any invalid shape, clue, rating, fingerprint, unsolvable, or multiple-solution failure before including the puzzle.
5. Restart/rebuild Spring Boot so the new resource is on its classpath. The frontend loads the catalog from `/api/puzzles`; its counts and choices update automatically.

The metadata file is necessary because an arbitrary puzzle's human difficulty cannot be inferred honestly from its filename or number of zeros. For another source, record its published rating mapped to this documented scale and compute the SHA-1 prefix of the unchanged 81-digit string for the fingerprint field. Keep source licensing information with the metadata.

The existing top-level `puzzles/invalid*.txt` files remain untouched for console demonstrations and regression tests. The web catalog scans only `puzzles/web/*/*.txt`. Invalid catalog entries are skipped with a server warning so other entries remain available.

Exports go to `generated-solutions/` by default, never into this catalog. Saved browser games live in local storage and are unrelated to solution files.
