import { useEffect, useRef, useState } from "react";
import { sudokuApi } from "../api/sudokuApi";
import {
  elapsedMilliseconds,
  readSession,
  readStatistics,
  recordCompletion,
  saveSession,
} from "../storage/gameStorage";

export function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function estimatedScore(game, seconds) {
  return Math.max(
    100,
    { EASY: 1000, MEDIUM: 2000, HARD: 3000 }[game.puzzle.difficulty] +
      Math.max(0, 600 - Math.floor(seconds / 5)) -
      game.hints * 100 -
      game.mistakes * 25,
  );
}

export default function useGame() {
  const [initial] = useState(() => readSession());
  const [game, setGame] = useState(initial.game);
  const current = useRef(initial.game);
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(initial.warning);
  const [statistics, setStatistics] = useState(readStatistics);
  const [now, setNow] = useState(Date.now());
  const [selection, setSelection] = useState(null);

  function commit(next) {
    current.current = next;
    setGame(next);
    if (!saveSession(next))
      setNotice(
        "Browser storage is unavailable. Keep this tab open to retain your game.",
      );
  }

  async function loadCatalog() {
    setLoadingCatalog(true);
    setError("");
    try {
      setCatalog(await sudokuApi.catalog());
    } catch (failure) {
      setError(failure.message);
    } finally {
      setLoadingCatalog(false);
    }
  }

  useEffect(() => {
    loadCatalog();
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
      if (current.current?.startedAt && !saveSession(current.current))
        setNotice("Automatic saving is unavailable in this browser.");
    }, 1000);
    const suspend = () => {
      const active = current.current;
      if (active?.startedAt)
        commit({
          ...active,
          elapsedMs: elapsedMilliseconds(active),
          startedAt: null,
          status: "paused",
        });
    };
    const visibility = () => {
      if (document.hidden) suspend();
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", suspend);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", suspend);
    };
  }, []);

  async function operation(action) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      return await action();
    } catch (failure) {
      setError(failure.message);
      return false;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  function pause() {
    const active = current.current;
    if (active?.status === "playing")
      commit({
        ...active,
        elapsedMs: elapsedMilliseconds(active),
        startedAt: null,
        status: "paused",
      });
  }

  async function start(difficulty) {
    return operation(async () => {
      const available = catalog.filter(
        (puzzle) => puzzle.difficulty === difficulty,
      );
      if (!available.length)
        throw new Error("No puzzles are available at this difficulty yet.");
      const other = available.filter(
        (puzzle) => puzzle.id !== current.current?.puzzle.id,
      );
      const choices = other.length ? other : available;
      const puzzle = await sudokuApi.puzzle(
        choices[Math.floor(Math.random() * choices.length)].id,
      );
      const validation = await sudokuApi.validate(puzzle.id, puzzle.original);
      commit({
        version: 1,
        runId: crypto.randomUUID(),
        puzzle,
        board: puzzle.original.map((row) => [...row]),
        elapsedMs: 0,
        startedAt: Date.now(),
        hints: 0,
        mistakes: 0,
        status: "playing",
        validation,
        verified: true,
        result: null,
      });
      setSelection(null);
      setNotice("A fresh grid. A fresh perspective.");
      return true;
    });
  }

  async function resume() {
    return operation(async () => {
      const saved = current.current;
      if (!saved) return false;
      const puzzle = await sudokuApi.puzzle(saved.puzzle.id);
      const validation = await sudokuApi.validate(puzzle.id, saved.board);
      const next = {
        ...saved,
        puzzle,
        validation,
        mistakes:
          saved.mistakes +
          (!saved.verified &&
          saved.pendingCell &&
          validation.incorrectCells.some(
            (cell) =>
              cell.row === saved.pendingCell.row &&
              cell.column === saved.pendingCell.column,
          )
            ? 1
            : 0),
        pendingCell: null,
        verified: true,
        status: "playing",
        startedAt: Date.now(),
      };
      commit(next);
      if (validation.completed) await finish(next);
      setNotice("Welcome back. Pick up right where you left off.");
      return true;
    });
  }

  async function finish(candidate) {
    const frozen = {
      ...candidate,
      elapsedMs: elapsedMilliseconds(candidate),
      startedAt: null,
      status: "paused",
    };
    commit(frozen);
    const seconds = Math.floor(frozen.elapsedMs / 1000);
    const result = await sudokuApi.complete(
      frozen.puzzle.id,
      frozen.board,
      seconds,
      frozen.hints,
      frozen.mistakes,
    );
    try {
      setStatistics(recordCompletion(frozen, result));
    } catch {
      setNotice(
        "Puzzle complete! This browser could not save your statistics.",
      );
    }
    commit({ ...frozen, status: "completed", result });
  }

  async function validateCurrent(candidate, changedCell) {
    const validation = await sudokuApi.validate(
      candidate.puzzle.id,
      candidate.board,
    );
    // Selection is immediate, but every move's Sudoku result is returned by Java.
    const mistake =
      changedCell &&
      validation.incorrectCells.some(
        (cell) =>
          cell.row === changedCell.row && cell.column === changedCell.column,
      );
    const latest = current.current;
    const next = {
      ...latest,
      validation,
      verified: true,
      mistakes: candidate.mistakes + (mistake ? 1 : 0),
    };
    commit(next);
    if (validation.completed) await finish(next);
  }

  async function place(value) {
    const active = current.current;
    if (
      locked.current ||
      active?.status !== "playing" ||
      !active.verified ||
      !selection ||
      active.puzzle.original[selection.row][selection.column] !== 0
    )
      return;
    if (
      !Number.isInteger(value) ||
      value < 0 ||
      value > 9 ||
      active.board[selection.row][selection.column] === value
    )
      return;
    return operation(async () => {
      const board = active.board.map((row) => [...row]);
      board[selection.row][selection.column] = value;
      const next = {
        ...active,
        board,
        verified: false,
        pendingCell: value ? selection : null,
      };
      commit(next);
      await validateCurrent(next, next.pendingCell);
      setNotice(value ? "Entry checked." : "Cell cleared.");
    });
  }

  async function retryValidation() {
    return operation(async () => {
      const active = current.current;
      if (active)
        await validateCurrent(
          active,
          active.verified ? null : active.pendingCell,
        );
    });
  }

  async function hint() {
    const active = current.current;
    if (active?.status !== "playing" || !active.verified) return;
    return operation(async () => {
      const reveal = await sudokuApi.hint(
        active.puzzle.id,
        active.board,
        selection,
      );
      const board = active.board.map((row) => [...row]);
      board[reveal.row][reveal.column] = reveal.value;
      const next = {
        ...current.current,
        board,
        hints: active.hints + 1,
        verified: false,
        pendingCell: null,
      };
      commit(next);
      setSelection({ row: reveal.row, column: reveal.column });
      await validateCurrent(next, null);
      setNotice(reveal.explanation);
    });
  }

  async function restart() {
    return operation(async () => {
      const active = current.current;
      const board = active.puzzle.original.map((row) => [...row]);
      const validation = await sudokuApi.validate(active.puzzle.id, board);
      commit({
        ...active,
        runId: crypto.randomUUID(),
        board,
        elapsedMs: 0,
        startedAt: Date.now(),
        hints: 0,
        mistakes: 0,
        validation,
        verified: true,
        pendingCell: null,
        result: null,
        status: "playing",
      });
      setSelection(null);
      setNotice("A clean start. Take your time.");
    });
  }

  async function exportSolution() {
    return operation(async () => {
      const active = current.current;
      const blob = await sudokuApi.export(active.puzzle.id, active.board);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${active.puzzle.id}.solution.txt`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("Your solution is ready. The original puzzle is unchanged.");
    });
  }

  const seconds = game ? Math.floor(elapsedMilliseconds(game, now) / 1000) : 0;
  return {
    game,
    catalog,
    loadingCatalog,
    busy,
    error,
    notice,
    statistics,
    selection,
    setSelection,
    seconds,
    score: game?.result?.score ?? (game ? estimatedScore(game, seconds) : 0),
    start,
    resume,
    pause,
    hint,
    place,
    restart,
    retryValidation,
    exportSolution,
    loadCatalog,
    save: () => {
      const ok = saveSession(current.current);
      setNotice(
        ok
          ? "Progress saved on this device."
          : "This browser could not save your game.",
      );
    },
  };
}
