package com.example.sudoku;

import com.example.sudoku.exception.*;
import com.example.sudoku.models.Sudoku;
import com.example.sudoku.services.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.*;
import java.security.MessageDigest;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class ExistingBackendRegressionTests {
    @TempDir Path temporary;
    private final SudokuReader reader = new SudokuReader();
    private final SudokuSolver solver = new SudokuSolver();

    @Test void allOriginalJavaFilesAreByteForByteUnchanged() throws Exception {
        for (String line : Files.readAllLines(Path.of("docs/original-java.sha256"))) {
            String[] parts = line.split("  ", 2);
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(Path.of(parts[1])));
            assertEquals(parts[0], HexFormat.of().formatHex(digest), parts[1]);
        }
    }

    @Test void solvesMultipleFilesIndependentlyAndPreservesEveryOriginalClue() throws Exception {
        for (String file : List.of("src/main/resources/puzzles/puzzle1.txt", "src/main/resources/puzzles/web/hard/hard-03.txt")) {
            Sudoku board = reader.readPuzzleFile(file);
            int[][] original = PuzzleCatalogService.toGrid(board);
            assertTrue(solver.solveSudoku(board));
            assertTrue(solver.isValidBoard(board));
            assertNull(solver.findMRVCell(board));
            for (int row = 0; row < 9; row++) for (int col = 0; col < 9; col++) {
                if (original[row][col] != 0) assertEquals(original[row][col], board.getBoard()[row][col].getValue());
            }
        }
    }

    @Test void rejectsMissingFileInvalidCharacterWrongLengthsAndMissingOrExtraRows() throws Exception {
        assertThrows(SudokuFileNotFoundException.class, () -> reader.readPuzzleFile(temporary.resolve("missing.txt").toString()));
        assertThrows(InvalidCharacterException.class, () -> reader.readPuzzleFile("src/main/resources/puzzles/invalidCharacter.txt"));
        assertThrows(IllegalArgumentException.class, () -> reader.readPuzzleFile("src/main/resources/puzzles/invalidRowLength.txt"));
        assertThrows(IllegalArgumentException.class, () -> reader.readPuzzleFile("src/main/resources/puzzles/invalidRows.txt"));
        String valid = Files.readString(Path.of("src/main/resources/puzzles/puzzle1.txt")).strip();
        Path extra = temporary.resolve("extra.txt");
        Files.writeString(extra, valid + "\n000000000\n");
        assertThrows(IllegalArgumentException.class, () -> reader.readPuzzleFile(extra.toString()));
        Path longRow = temporary.resolve("long.txt");
        Files.writeString(longRow, "0" + valid);
        assertThrows(IllegalArgumentException.class, () -> reader.readPuzzleFile(longRow.toString()));
        // A failed read cannot prevent a later independent read.
        assertTrue(solver.solveSudoku(reader.readPuzzleFile("src/main/resources/puzzles/puzzle1.txt")));
    }

    @Test void rejectsDuplicateCluesAndCompletedInvalidBoardsAndAcceptsCompletedValidBoards() throws Exception {
        Sudoku duplicate = reader.readPuzzleFile("src/main/resources/puzzles/invalidPuzzle.txt");
        assertFalse(solver.solveSudoku(duplicate));
        Sudoku valid = reader.readPuzzleFile("src/main/resources/puzzles/puzzle1.txt");
        assertTrue(solver.solveSudoku(valid));
        int[][] solution = PuzzleCatalogService.toGrid(valid);
        assertTrue(solver.solveSudoku(valid));
        assertArrayEquals(solution, PuzzleCatalogService.toGrid(valid));
        valid.getBoard()[0][0].setValue(valid.getBoard()[0][1].getValue());
        assertFalse(solver.solveSudoku(valid));
    }

    @Test void detectsValidButUnsolvablePuzzleAndRestoresFailedChoices() throws Exception {
        Sudoku solved = reader.readPuzzleFile("src/main/resources/puzzles/web/easy/easy-01.txt");
        assertTrue(solver.solveSudoku(solved));
        Sudoku original = reader.readPuzzleFile("src/main/resources/puzzles/web/easy/easy-01.txt");
        boolean found = false;
        outer: for (int row = 0; row < 9; row++) for (int col = 0; col < 9; col++) {
            if (original.getBoard()[row][col].getValue() != 0) continue;
            for (int number = 1; number <= 9; number++) {
                if (number == solved.getBoard()[row][col].getValue() || !solver.isValidPlacement(original, row, col, number)) continue;
                original.getBoard()[row][col].setValue(number);
                int[][] before = PuzzleCatalogService.toGrid(original);
                assertTrue(solver.isValidBoard(original));
                assertFalse(solver.solveSudoku(original));
                assertArrayEquals(before, PuzzleCatalogService.toGrid(original));
                found = true;
                break outer;
            }
        }
        assertTrue(found);
    }
}
