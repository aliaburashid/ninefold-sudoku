import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eraser,
  Lightbulb,
  Pause,
  RotateCcw,
  Save,
  Sparkles,
  Timer,
  TriangleAlert,
} from "lucide-react";
import SudokuBoard from "../components/SudokuBoard";
import NumberPad from "../components/NumberPad";
import ScoreRules from "../components/ScoreRules";
import { formatTime } from "../hooks/useGame";

export default function GamePage({ controller, onNewGame, onRestart }) {
  const {
    game,
    selection,
    setSelection,
    seconds,
    score,
    busy,
    hint,
    place,
    pause,
    resume,
    save,
    notice,
    retryValidation,
  } = controller;
  const paused = game.status === "paused";
  const validation = game.validation;
  const hasConflicts = validation?.conflicts.length > 0;
  const hasWrong = validation?.incorrectCells.length > 0;
  const progress = validation?.progress || 0;
  return (
    <main className="game-page">
      <div className="game-heading">
        <div>
          <button className="text-link back-link" onClick={onNewGame}>
            <ArrowLeft size={16} /> All puzzles
          </button>
          <h1>
            A little space to focus<span>.</span>
          </h1>
        </div>
        <span className={`level-badge ${game.puzzle.difficulty.toLowerCase()}`}>
          {game.puzzle.difficulty.toLowerCase()} <span>·</span>{" "}
          {game.puzzle.title}
        </span>
      </div>
      <div className="game-layout">
        <section className="play-area" aria-label="Your puzzle">
          <div className="board-status">
            <span>
              <Timer size={16} />
              <strong aria-label="Elapsed time">{formatTime(seconds)}</strong>
              <span className="time-state">
                {paused ? "paused" : "in the flow"}
              </span>
            </span>
            <button
              className="icon-button"
              onClick={paused ? resume : pause}
              disabled={busy}
              aria-label={paused ? "Resume game" : "Pause game"}
            >
              <Pause size={17} />
            </button>
          </div>
          <SudokuBoard
            game={game}
            selection={selection}
            onSelect={setSelection}
            onInput={place}
            onResume={resume}
            busy={busy}
          />
          <div
            className={`board-feedback ${hasConflicts || hasWrong ? "warning" : ""}`}
            role="status"
            aria-live="polite"
          >
            {hasConflicts || hasWrong ? (
              <TriangleAlert size={16} />
            ) : (
              <Check size={16} />
            )}
            <span>
              {!game.verified
                ? "Checking your latest entry…"
                : hasConflicts
                  ? "A repeated number. Highlighted cells share a row, column, or box."
                  : hasWrong
                    ? "No rule conflict, but a highlighted answer needs another look."
                    : "Looking good. Follow your next possibility."}
            </span>
          </div>
          <div className="keyboard-tip">
            Arrow keys to move <span>·</span> 1–9 to enter <span>·</span> Delete
            to erase
          </div>
        </section>
        <aside className="game-sidebar">
          <div className="flow-card">
            <div className="card-eyebrow">
              <span className="eyebrow">YOUR MOMENTUM</span>
              <Sparkles size={17} />
            </div>
            <div className="progress-heading">
              <strong>
                {progress}
                <span>%</span>
              </strong>
              <span>
                one cell
                <br />
                at a time
              </span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Correct entries"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ width: `${progress}%` }} />
            </div>
            <p>
              {validation?.correctEntries || 0} of{" "}
              {validation?.totalEditable || 0} open cells found
            </p>
            <div className="score-preview">
              <span>Potential score</span>
              <strong>{score.toLocaleString()}</strong>
            </div>
            <div className="game-counters">
              <span>
                <strong>{game.hints}</strong> hints used
              </span>
              <span>
                <strong>{game.mistakes}</strong> mistakes
              </span>
            </div>
          </div>
          <div className="input-card">
            <div className="card-eyebrow">
              <span className="eyebrow">MAKE YOUR NEXT MOVE</span>
              <span className="selection-label">
                {selection
                  ? `R${selection.row + 1} · C${selection.column + 1}`
                  : "Select a cell"}
              </span>
            </div>
            <NumberPad
              disabled={
                paused ||
                busy ||
                !game.verified ||
                !selection ||
                !!game.puzzle.original[selection.row][selection.column]
              }
              onInput={place}
            />
            <div className="input-actions">
              <button
                onClick={hint}
                disabled={paused || busy || !game.verified}
                className="hint-button"
              >
                <Lightbulb size={19} /> A little hint <span>−100</span>
              </button>
              <button
                onClick={() => place(0)}
                disabled={
                  paused ||
                  busy ||
                  !game.verified ||
                  !selection ||
                  !!game.puzzle.original[selection.row][selection.column]
                }
                aria-label="Erase selected cell"
              >
                <Eraser size={19} /> Erase
              </button>
            </div>
          </div>
          <div className="utility-actions">
            <button onClick={save}>
              <Save size={16} /> Save
            </button>
            <button onClick={onRestart} disabled={busy}>
              <RotateCcw size={16} /> Restart
            </button>
            <button onClick={onNewGame} disabled={busy}>
              New game <ArrowRight size={16} />
            </button>
          </div>
          <p className="save-note">
            <span className="live-dot" /> Automatically saved on this device
          </p>
          {!game.verified && !busy && (
            <button className="button secondary" onClick={retryValidation}>
              Retry entry check
            </button>
          )}
          <ScoreRules />
          <p className="hint-explanation" aria-live="polite">
            {notice}
          </p>
        </aside>
      </div>
    </main>
  );
}
