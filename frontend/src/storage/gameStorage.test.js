import { describe, it, expect } from "vitest";
import {
  elapsedMilliseconds,
  readSession,
  readStatistics,
  recordCompletion,
  saveSession,
  SESSION_KEY,
} from "./gameStorage";
import { estimatedScore, formatTime } from "../hooks/useGame";

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) || null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}
function sample() {
  return {
    version: 1,
    runId: "run-one",
    puzzle: {
      id: "medium-01",
      difficulty: "MEDIUM",
      original: Array.from({ length: 9 }, () => Array(9).fill(0)),
    },
    board: Array.from({ length: 9 }, () => Array(9).fill(0)),
    elapsedMs: 65000,
    startedAt: null,
    hints: 2,
    mistakes: 3,
    status: "playing",
  };
}

describe("session persistence and scoring", () => {
  it("round-trips the original grid, edits, timer, and statistics and resumes paused", () => {
    const storage = memoryStorage();
    const game = sample();
    game.board[0][0] = 3;
    expect(saveSession(game, storage)).toBe(true);
    const restored = readSession(storage).game;
    expect(restored.board[0][0]).toBe(3);
    expect(restored.puzzle.original[0][0]).toBe(0);
    expect(restored.elapsedMs).toBe(65000);
    expect(restored.hints).toBe(2);
    expect(restored.mistakes).toBe(3);
    expect(restored.status).toBe("paused");
    expect(restored.startedAt).toBeNull();
  });
  it("accumulates active time without adding paused time", () => {
    expect(elapsedMilliseconds({ ...sample(), startedAt: 1000 }, 6000)).toBe(
      70000,
    );
    expect(elapsedMilliseconds(sample(), 900000)).toBe(65000);
    expect(formatTime(65)).toBe("01:05");
    expect(formatTime(3600)).toBe("60:00");
  });
  it("handles invalid JSON, corrupt grids, and unavailable storage", () => {
    const storage = memoryStorage();
    storage.setItem(SESSION_KEY, "{");
    expect(readSession(storage).game).toBeNull();
    storage.setItem(
      SESSION_KEY,
      JSON.stringify({ ...sample(), board: [[99]] }),
    );
    expect(readSession(storage).warning).not.toBe("");
    expect(
      saveSession(sample(), {
        setItem() {
          throw new Error("Quota");
        },
      }),
    ).toBe(false);
  });
  it("matches the documented score example and keeps a completion floor", () => {
    expect(estimatedScore(sample(), 900)).toBe(2145);
    expect(
      estimatedScore({ ...sample(), hints: 100, mistakes: 100 }, 90000),
    ).toBe(100);
  });
  it("records a completed run once and clears completed session data", () => {
    const storage = memoryStorage();
    const game = sample();
    const result = { score: 2145, elapsedSeconds: 900, hints: 2, mistakes: 3 };
    recordCompletion(game, result, storage);
    recordCompletion(game, result, storage);
    expect(readStatistics(storage)).toHaveLength(1);
    saveSession(game, storage);
    saveSession({ ...game, status: "completed" }, storage);
    expect(storage.getItem(SESSION_KEY)).toBeNull();
  });
});
