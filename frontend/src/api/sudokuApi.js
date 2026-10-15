import { request } from "./client";

export const sudokuApi = {
  catalog: () => request("/puzzles"),
  puzzle: (id) => request(`/puzzles/${id}`),
  validate: (id, board, signal) =>
    request(`/puzzles/${id}/validation`, { board }, { signal }),
  hint: (id, board, selected) =>
    request(`/puzzles/${id}/hints`, {
      board,
      row: selected?.row,
      column: selected?.column,
    }),
  complete: (id, board, elapsedSeconds, hints, mistakes) =>
    request(`/puzzles/${id}/completion`, {
      board,
      elapsedSeconds,
      hints,
      mistakes,
    }),
  export: (id, board) =>
    request(`/puzzles/${id}/solution-export`, { board }, { download: true }),
};
