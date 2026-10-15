# Ninefold API

Base path: `/api/puzzles`. Coordinates are zero-based. Boards contain exactly nine arrays of nine integers, from 0 to 9. Zero is empty. Decimals, strings, booleans, and null cells are rejected.

| Method and path | Request | Response |
| --- | --- | --- |
| GET `/` | Optional `difficulty=EASY`, `MEDIUM`, or `HARD` | Array of puzzle responses |
| GET `/{id}` | None | One puzzle response |
| POST `/{id}/validation` | `{ "board": [[...], ...] }` | Rule conflicts, incorrect cells, progress, completion |
| POST `/{id}/hints` | `{ "board": [...], "row": 0, "column": 0 }` | One legal value and explanation; coordinates optional but provided together |
| POST `/{id}/completion` | `{ "board": [...], "elapsedSeconds": 900, "hints": 2, "mistakes": 3 }` | Verified completion and full score breakdown |
| POST `/{id}/solution-export` | `{ "board": [...] }` | `text/plain` attachment, and a separate backend file |

Puzzle responses contain `id`, `title`, `difficulty`, `rating`, `clueCount`, `source`, `sourceUrl`, and `original`. They never include a solution.

Validation responses contain:

```json
{
  "ruleValid": false,
  "conflicts": [{ "type": "row", "index": 0, "cells": [{ "row": 0, "column": 0 }, { "row": 0, "column": 1 }] }],
  "incorrectCells": [{ "row": 0, "column": 0 }],
  "correctEntries": 0,
  "totalEditable": 45,
  "progress": 0,
  "completed": false
}
```

Conflict types are `row`, `column`, and `box`. A box's index is `(row / 3) * 3 + column / 3` using integer division. A cell can be incorrect without violating a local Sudoku rule; these are deliberately separate fields. Progress measures correctly filled originally empty cells, excluding given clues.

Hints solve the original puzzle through the existing Java solver's catalog result. They do not solve a player's mistaken board. If the selected cell is a clue or already filled, the service selects an empty MRV cell. If any incorrect entry exists, a hint is refused with 409 until the player corrects/erases it. A request itself does not change the client's hint counter; the client applies and counts a successful reveal once.

Completion requires all 81 cells filled, legal values, unchanged original clues, and `SudokuSolver.isValidBoard()`. Its response includes `score`, `basePoints`, `timeBonus`, `hintDeduction`, `mistakeDeduction`, `elapsedSeconds`, `hints`, and `mistakes`. Timer and counters are browser-supplied, suitable for local personal statistics.

Malformed requests return 400; unknown puzzle IDs return 404; unavailable hints return 409; changed clues or incomplete/invalid completion/export submissions return 422. Unexpected server failures return 500 with a safe message. Ordinary gameplay mistakes are a successful validation response, not an HTTP error.

Errors follow LimitGuard's structure:

```json
{
  "timestamp": "2026-10-15T10:00:00Z",
  "status": 422,
  "error": "UNPROCESSABLE_ENTITY",
  "message": "Original puzzle clues cannot be changed.",
  "path": "/api/puzzles/easy-01/validation"
}
```

The frontend uses a same-origin Vite proxy. For separate-origin deployment, configure a deliberate allowed-origin policy and `VITE_API_BASE_URL`, or serve both through the same reverse proxy. No authentication/database layer is installed.
