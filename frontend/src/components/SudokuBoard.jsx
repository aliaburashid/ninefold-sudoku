import { useRef } from "react";
import { Pause } from "lucide-react";

export default function SudokuBoard({
  game,
  selection,
  onSelect,
  onInput,
  onResume,
  busy,
}) {
  const buttons = useRef([]);
  const validation = game.validation;
  const paused = game.status === "paused";
  const selectedValue = selection
    ? game.board[selection.row][selection.column]
    : 0;
  const incorrect = new Set(
    validation?.incorrectCells.map((cell) => `${cell.row}:${cell.column}`),
  );
  const conflicts = validation?.conflicts || [];
  const conflictCells = new Set(
    conflicts.flatMap((group) =>
      group.cells.map((cell) => `${cell.row}:${cell.column}`),
    ),
  );
  function keyDown(event, row, column) {
    if (paused) return;
    const directions = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    if (directions[event.key]) {
      event.preventDefault();
      const [dr, dc] = directions[event.key];
      const nextRow = (row + dr + 9) % 9,
        nextColumn = (column + dc + 9) % 9;
      onSelect({ row: nextRow, column: nextColumn });
      buttons.current[nextRow * 9 + nextColumn]?.focus();
    } else if (/^[1-9]$/.test(event.key)) {
      event.preventDefault();
      onInput(Number(event.key));
    } else if (["Backspace", "Delete", "0"].includes(event.key)) {
      event.preventDefault();
      onInput(0);
    }
  }
  return (
    <div className="board-wrap">
      <div
        className={`sudoku-board ${paused ? "board-hidden" : ""}`}
        role="grid"
        aria-label="Sudoku puzzle"
        aria-rowcount={9}
        aria-colcount={9}
        aria-busy={busy}
        inert={paused || undefined}
      >
        {game.board.map((rowValues, row) => (
          <div className="sudoku-row" role="row" key={row}>
            {rowValues.map((value, column) => {
              const clue = game.puzzle.original[row][column] !== 0;
              const selected =
                selection?.row === row && selection?.column === column;
              const peer =
                selection &&
                (selection.row === row ||
                  selection.column === column ||
                  (Math.floor(selection.row / 3) === Math.floor(row / 3) &&
                    Math.floor(selection.column / 3) ===
                      Math.floor(column / 3)));
              const conflict = conflictCells.has(`${row}:${column}`);
              const wrong = incorrect.has(`${row}:${column}`);
              const groupConflict = conflicts.some((group) =>
                group.type === "row"
                  ? group.index === row
                  : group.type === "column"
                    ? group.index === column
                    : group.index ===
                      Math.floor(row / 3) * 3 + Math.floor(column / 3),
              );
              const classes = [
                "sudoku-cell",
                clue && "clue",
                peer && "peer",
                selectedValue !== 0 && value === selectedValue && "matching",
                groupConflict && "conflict-group",
                wrong && "incorrect",
                conflict && "conflict",
                selected && "selected",
                column === 2 || column === 5 ? "box-right" : "",
                row === 2 || row === 5 ? "box-bottom" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <div
                  role="gridcell"
                  aria-selected={selected}
                  aria-readonly={clue}
                  aria-invalid={conflict || wrong || undefined}
                  key={column}
                >
                  <button
                    ref={(element) => {
                      buttons.current[row * 9 + column] = element;
                    }}
                    className={classes}
                    tabIndex={
                      selected || (!selection && row === 0 && column === 0)
                        ? 0
                        : -1
                    }
                    onClick={() => onSelect({ row, column })}
                    onKeyDown={(event) => keyDown(event, row, column)}
                    aria-label={`Row ${row + 1}, column ${column + 1}, ${value || "empty"}${clue ? ", original clue" : ""}${conflict ? ", rule conflict" : wrong ? ", incorrect answer" : ""}`}
                  >
                    {value || ""}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {paused && (
        <div className="pause-cover">
          <span className="pause-icon">
            <Pause size={26} />
          </span>
          <h2>A little breathing room.</h2>
          <p>Your puzzle will be right here.</p>
          <button className="button primary" onClick={onResume} disabled={busy}>
            Resume game
          </button>
        </div>
      )}
    </div>
  );
}
