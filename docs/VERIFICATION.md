# Verification status

Verified on 2026-10-15 with Java 17.0.20.1, Node 24.13.0, and installed Google Chrome.

| Check | Result |
| --- | --- |
| Catalog format, clue validity, source fingerprints, difficulty ranges, and independent uniqueness counting | All nine puzzles pass |
| Full backend test suite | All 12 pass, including the preservation audit and original Spring context test |
| Accepted Java source checksum audit | All eight recorded files match the owner-confirmed baseline |
| Clean Maven verification and executable JAR packaging | Pass (`mvn -o clean verify`) |
| Frontend unit tests | 5 pass |
| Production frontend build | Pass |
| Real frontend/backend browser tests | 7 pass |
| Responsive layouts | Pass at widths 320, 375, 768, and 1440 |
| Standard-motion celebration and reduced-motion gameplay | Pass |
| Final packaged JAR startup and REST API | Pass; all nine playable catalog puzzles load from the packaged resources |
| Four original puzzle exports | All four isolated exports match the existing `.solution.txt` files and satisfy Sudoku rules |

The final clean Maven verification ran 12 tests with zero failures, errors, or skipped tests and produced `target/sudoku-0.0.1-SNAPSHOT.jar`. The frontend's five unit tests and production build were also rerun successfully. The seven browser integration tests listed below passed during the preceding integration run; no frontend or API implementation changes were made during this baseline update.

On 2026-10-15, the owner explicitly confirmed these intentional development changes as the new baseline:

- `Sudoku.java`: added `saveSolution(String filename)` and file-writing imports.
- `SudokuApplication.java`: added a call to that method on successful console solving, plus IOException handling.

Both Java files and their comments remain untouched by the Ninefold implementation. `original-java.sha256` now records the accepted baseline; only those two checksum entries changed. The earlier manifest is retained unchanged in `initial-java.sha256` as a historical audit record. The preservation test continues to compare against `original-java.sha256` and now passes.

Final verification also captured and compared SHA-256 hashes for all 60 Java/resource files before and after testing, including the existing solution files. No Java source, puzzle input, or existing solution file was changed by this verification.

To verify startup exports without overwriting existing files, the final packaged JAR was launched from a temporary directory containing copies of the original puzzle inputs. It generated all four solution files there. Each output matched its corresponding existing project solution, and each row, column, and box contained digits 1–9 exactly once. The temporary server and working directory were cleaned up after the check.

The new API export remains separate: it writes to `generated-solutions/` by default, uses `CREATE_NEW`, refuses to replace different existing output, and leaves original puzzle files alone. The concurrently added console export writes to its own existing resources-path destination; its implementation has not been changed.

Browser tests use real Vite-to-Java requests and cover clue protection, duplicate conflicts, erasing, hints, mistake counters, save/reload/resume, restart confirmation, timer pause/resume, all difficulties, full completion, animated score display, solution download, statistics deduplication, keyboard movement, service failure/retry, and responsive layouts.

Local integration verification used frontend port 5174 and backend port 8091 because ports 5173 and 8080 were occupied by other applications. Test solution exports were directed to a temporary directory. Full-page screenshots are available in `frontend/test-results/ninefold-*.png`.
