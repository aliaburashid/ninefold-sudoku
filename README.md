# Ninefold

A React Sudoku experience backed by this project's original Java reader and DFS/backtracking/MRV solver. The HTTP layer is additive; this implementation does not edit pre-existing Java source files.

The owner-confirmed versions of `Sudoku.java` (including `saveSolution()`) and `SudokuApplication.java` are the accepted preservation baseline. Their checksums are recorded in `docs/original-java.sha256`; the earlier snapshot is archived in `docs/initial-java.sha256`. The final clean build and preservation check pass. See [verification status](docs/VERIFICATION.md).

## Run locally

Requirements: Java 17 and Node.js/npm (verified with Java 17 and Node 24).

From the project root, start Spring Boot:

```sh
./mvnw spring-boot:run
```

In a second terminal:

```sh
cd frontend
npm ci
npm run dev
```

Open http://127.0.0.1:5173. Vite proxies `/api` to Spring Boot on port 8080. No CORS configuration is needed for this development setup. Stop either server with Ctrl+C.

If those ports are occupied, use a matching pair:

```sh
# Terminal 1, project root
./mvnw spring-boot:run -Dspring-boot.run.arguments=--server.port=8091

# Terminal 2, frontend/
API_PROXY_TARGET=http://127.0.0.1:8091 npm run dev -- --port 5174
```

The original application still reads and prints its existing puzzle files on startup. It now continues running as an HTTP server. Its intentionally invalid puzzle files still produce console error messages; they are excluded from the web catalog.

## Playing

- Choose Easy, Medium, or Hard, then select **Let's play**.
- Select a cell and enter a number with the keypad or keyboard. Arrow keys move between cells; Backspace/Delete erases. Original clues are locked.
- A repeated number marks both the conflicting cells and their row/column/box. A wrong answer without a duplicate receives separate feedback. All Sudoku checks come from Java.
- **A little hint** reveals a legal value from the Java-generated solution. Clear wrong entries before requesting a reveal. Hints cost 100 points; there is no hint quota or lives limit.
- Pause hides the board and freezes the timer. Hiding the browser tab also pauses. Reloading resumes through the welcome screen, with no closed-tab time added.
- Progress saves automatically to local storage. **Save** also saves explicitly. Statistics belong to this browser, without accounts or a database.
- A completed board is checked by Java before the celebration, score, and personal statistics are recorded.
- **Export solution** writes a separate backend file and downloads it as `{puzzle-id}.solution.txt`. Existing puzzle resources are never overwritten.

## Scoring

`max(100, difficultyBase + max(0, 600 - floor(activeSeconds / 5)) - hints * 100 - mistakes * 25)`

Difficulty bases: Easy 1,000; Medium 2,000; Hard 3,000. Paused time is excluded. Only a new incorrect placement adds a mistake; rechecking the same board does not. Minimum score is 100. Scores use browser-provided time and counters and are personal records, not authenticated competitive results.

## Architecture

```text
frontend/ React + Vite + JavaScript + CSS + Motion
    ↓ fetch /api (same development proxy convention as LimitGuard)
controllers/SudokuController
    ↓
services/PuzzleCatalogService / SudokuGameService / SolutionExportService
    ↓
existing SudokuReader / SudokuSolver / Sudoku / SudokuCell
```

DTOs keep internal cell objects and complete solutions out of the public puzzle responses. `SudokuConfiguration` registers the unchanged reader/solver and rejects decimal/string/null values in integer request fields. Requests use separate board instances because the original solver changes the board while solving and temporarily changes values during validation.

New playable puzzles are under `src/main/resources/puzzles/web/`. See [adding puzzles and provenance](docs/PUZZLES.md). Adding a catalog entry requires no React changes.

Exports default to `generated-solutions/`. To choose another directory, pass `--ninefold.export-directory=/absolute/path`. Export uses `CREATE_NEW`: identical repeat exports are allowed, but different existing content is not overwritten.

## Verification

```sh
# From the project root
shasum -a 256 -c docs/original-java.sha256
python3 scripts/verify_catalog.py
./mvnw test
./mvnw package

# From frontend/
npm test
npm run build
```

Browser tests require the frontend and backend to be running. They use installed Google Chrome by default:

```sh
# frontend/, default development ports
npm run test:browser

# alternate ports
NINEFOLD_URL=http://127.0.0.1:5174 npm run test:browser
```

Alternatively run `npx playwright install chromium` and set `PLAYWRIGHT_CHANNEL=chromium`. Tests exercise real HTTP calls to Java, including a full game and downloaded solution. Screenshots and failure traces appear under `frontend/test-results/`.

The offline Python catalog tool is import-time QA: it independently counts solutions up to two and verifies source fingerprints. It is not used by React or the runtime game. The Java solver remains the source of gameplay solutions.

## Design and accessibility

Ninefold uses warm paper, ink, cobalt, and muted yellow, with local Manrope and DM Sans fonts. Keyboard navigation, visible focus, labeled cells, non-color-only error cues, native confirmation dialogs, reduced-motion support, and responsive controls are included.

Research references: [Fivecube Sudoku](https://dribbble.com/shots/26725563-Sudoku-Mobile-App-UX-UI), [NestStrix Sudoku](https://dribbble.com/shots/4173081-Sudoku-Game-App), [Nixtio gamified dashboard](https://dribbble.com/shots/27216880-Gamified-Dashboard-UI-Avatar-System-Leaderboard), [Hick's Law](https://lawsofux.com/hicks-law/), [Fitts's Law](https://lawsofux.com/fittss-law/), and [goal-gradient effect](https://lawsofux.com/goal-gradient-effect/). These informed the original direction; no design assets were copied.

See [API contracts](docs/API.md) for request and response details.
