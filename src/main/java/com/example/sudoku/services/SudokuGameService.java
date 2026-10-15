package com.example.sudoku.services;

import com.example.sudoku.dto.*;
import com.example.sudoku.exception.GameRequestException;
import com.example.sudoku.models.PuzzleDefinition;
import com.example.sudoku.models.Sudoku;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class SudokuGameService {
    private final PuzzleCatalogService catalog;
    private final SudokuSolver solver;

    public SudokuGameService(PuzzleCatalogService catalog, SudokuSolver solver) {
        this.catalog = catalog;
        this.solver = solver;
    }

    public Sudoku checkedBoard(String id, int[][] grid) {
        PuzzleDefinition puzzle = catalog.get(id);
        if (grid == null || grid.length != 9) throw badBoard();
        Sudoku board = new Sudoku();
        for (int row = 0; row < 9; row++) {
            if (grid[row] == null || grid[row].length != 9) throw badBoard();
            for (int column = 0; column < 9; column++) {
                int value = grid[row][column];
                if (value < 0 || value > 9) throw badBoard();
                int clue = puzzle.original()[row][column];
                if (clue != 0 && value != clue) {
                    throw new GameRequestException(HttpStatus.UNPROCESSABLE_ENTITY, "Original puzzle clues cannot be changed.");
                }
                board.getBoard()[row][column].setValue(value);
            }
        }
        return board;
    }

    private GameRequestException badBoard() {
        return new GameRequestException(HttpStatus.BAD_REQUEST, "Use exactly 9 rows of 9 integers between 0 and 9.");
    }

    public ValidationResponse validate(String id, int[][] grid) {
        Sudoku board = checkedBoard(id, grid);
        PuzzleDefinition puzzle = catalog.get(id);
        List<CellPosition> incorrect = new ArrayList<>();
        Map<String, ConflictResponse> conflicts = new LinkedHashMap<>();
        int editable = 0, correct = 0, filled = 0;
        for (int row = 0; row < 9; row++) for (int column = 0; column < 9; column++) {
            int value = grid[row][column];
            if (puzzle.original()[row][column] == 0) {
                editable++;
                if (value == puzzle.solution()[row][column]) correct++;
                else if (value != 0) incorrect.add(new CellPosition(row, column));
            }
            if (value == 0) continue;
            filled++;
            board.getBoard()[row][column].setValue(0);
            // Sudoku legality comes from the unchanged Java solver. The loops below only locate feedback.
            if (!solver.isValidRow(board, row, value)) addConflict(conflicts, grid, "row", row, row, column);
            if (!solver.isValidColumn(board, column, value)) addConflict(conflicts, grid, "column", column, row, column);
            if (!solver.isValidBox(board, row, column, value)) addConflict(conflicts, grid, "box", row / 3 * 3 + column / 3, row, column);
            board.getBoard()[row][column].setValue(value);
        }
        boolean complete = filled == 81 && solver.isValidBoard(board);
        return new ValidationResponse(conflicts.isEmpty(), List.copyOf(conflicts.values()), incorrect,
                correct, editable, editable == 0 ? 100 : correct * 100 / editable, complete);
    }

    private void addConflict(Map<String, ConflictResponse> conflicts, int[][] grid, String type,
                             int index, int originRow, int originColumn) {
        String key = type + index + ":" + grid[originRow][originColumn];
        if (conflicts.containsKey(key)) return;
        List<CellPosition> cells = new ArrayList<>();
        for (int row = 0; row < 9; row++) for (int column = 0; column < 9; column++) {
            boolean inGroup = switch (type) {
                case "row" -> row == index;
                case "column" -> column == index;
                default -> row / 3 * 3 + column / 3 == index;
            };
            if (inGroup && grid[row][column] == grid[originRow][originColumn]) cells.add(new CellPosition(row, column));
        }
        conflicts.put(key, new ConflictResponse(type, index, cells));
    }

    public HintResponse hint(String id, HintRequest request) {
        ValidationResponse validation = validate(id, request.board());
        if (!validation.incorrectCells().isEmpty()) {
            throw new GameRequestException(HttpStatus.CONFLICT, "Correct or erase the highlighted entries before revealing a hint.");
        }
        if ((request.row() == null) != (request.column() == null)) {
            throw new GameRequestException(HttpStatus.BAD_REQUEST, "Provide both a hint row and column, or neither.");
        }
        Sudoku board = checkedBoard(id, request.board());
        int[] selected = solver.findMRVCell(board);
        if (selected == null) throw new GameRequestException(HttpStatus.CONFLICT, "This puzzle is already complete.");
        if (request.row() != null && request.board()[request.row()][request.column()] == 0) {
            selected = new int[]{request.row(), request.column()};
        }
        int row = selected[0], column = selected[1];
        int value = catalog.get(id).solution()[row][column];
        if (!solver.isValidPlacement(board, row, column, value)) {
            throw new GameRequestException(HttpStatus.CONFLICT, "Clear conflicting entries before requesting this hint.");
        }
        return new HintResponse(row, column, value,
                "Place " + value + " at row " + (row + 1) + ", column " + (column + 1) + ". This value comes from the verified solution.");
    }

    public CompletionResponse complete(String id, CompletionRequest request) {
        if (!validate(id, request.board()).completed()) {
            throw new GameRequestException(HttpStatus.UNPROCESSABLE_ENTITY, "Finish the board correctly before completing this game.");
        }
        int base = catalog.get(id).difficulty().getBaseScore();
        int bonus = Math.max(0, 600 - request.elapsedSeconds() / 5);
        int hintDeduction = request.hints() * 100;
        int mistakeDeduction = request.mistakes() * 25;
        return new CompletionResponse(true, Math.max(100, base + bonus - hintDeduction - mistakeDeduction),
                base, bonus, hintDeduction, mistakeDeduction, request.elapsedSeconds(), request.hints(), request.mistakes());
    }
}
