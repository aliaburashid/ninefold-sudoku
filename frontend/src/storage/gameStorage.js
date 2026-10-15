export const SESSION_KEY = "ninefold.session.v1";
export const STATS_KEY = "ninefold.statistics.v1";

export function elapsedMilliseconds(game, now = Date.now()) {
  return Math.max(
    0,
    game.elapsedMs + (game.startedAt ? Math.max(0, now - game.startedAt) : 0),
  );
}

export function readSession(storage = localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(SESSION_KEY) || "null");
    if (!saved) return { game: null, warning: "" };
    const isGrid = (grid) =>
      Array.isArray(grid) &&
      grid.length === 9 &&
      grid.every(
        (row) =>
          Array.isArray(row) &&
          row.length === 9 &&
          row.every(
            (value) => Number.isInteger(value) && value >= 0 && value <= 9,
          ),
      );
    if (
      saved.version !== 1 ||
      typeof saved.puzzle?.id !== "string" ||
      !isGrid(saved.board) ||
      !isGrid(saved.puzzle.original) ||
      !["EASY", "MEDIUM", "HARD"].includes(saved.puzzle.difficulty) ||
      ![saved.elapsedMs, saved.hints, saved.mistakes].every(
        (n) => Number.isFinite(n) && n >= 0,
      ) ||
      !Number.isInteger(saved.hints) ||
      !Number.isInteger(saved.mistakes) ||
      typeof saved.runId !== "string"
    ) {
      return {
        game: null,
        warning:
          "Your saved game could not be read. You can start a fresh puzzle.",
      };
    }
    return {
      game: { ...saved, startedAt: null, status: "paused" },
      warning: "",
    };
  } catch {
    return {
      game: null,
      warning:
        "Saved games are unavailable in this browser. You can still play.",
    };
  }
}

export function saveSession(game, storage = localStorage) {
  try {
    if (!game || game.status === "completed") storage.removeItem(SESSION_KEY);
    else
      storage.setItem(
        SESSION_KEY,
        JSON.stringify({
          ...game,
          version: 1,
          elapsedMs: elapsedMilliseconds(game),
          startedAt: null,
          status: "paused",
        }),
      );
    return true;
  } catch {
    return false;
  }
}

export function readStatistics(storage = localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(STATS_KEY) || "[]");
    return Array.isArray(saved)
      ? saved.filter(
          (item) =>
            item &&
            typeof item.runId === "string" &&
            ["EASY", "MEDIUM", "HARD"].includes(item.difficulty) &&
            Number.isFinite(item.score) &&
            Number.isFinite(item.elapsedSeconds) &&
            item.score >= 0 &&
            item.elapsedSeconds >= 0,
        )
      : [];
  } catch {
    return [];
  }
}

export function recordCompletion(game, result, storage = localStorage) {
  const history = readStatistics(storage);
  if (history.some((item) => item.runId === game.runId)) return history;
  const next = [
    ...history,
    {
      runId: game.runId,
      puzzleId: game.puzzle.id,
      difficulty: game.puzzle.difficulty,
      score: result.score,
      elapsedSeconds: result.elapsedSeconds,
      hints: result.hints,
      mistakes: result.mistakes,
      completedAt: new Date().toISOString(),
    },
  ];
  storage.setItem(STATS_KEY, JSON.stringify(next));
  return next;
}
