package com.example.sudoku;

import com.example.sudoku.dto.*;
import com.example.sudoku.models.*;
import com.example.sudoku.services.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Collectors;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class NinefoldApiTests {
    @TempDir static Path exports;
    @Autowired MockMvc mvc;
    @Autowired PuzzleCatalogService catalog;
    @Autowired SudokuGameService games;
    @Autowired SudokuSolver solver;

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("ninefold.export-directory", () -> exports.toString());
    }

    private PuzzleDefinition puzzle() { return catalog.get("easy-01"); }
    private String boardJson(int[][] board) { return "{\"board\":" + Arrays.deepToString(board) + "}"; }

    @Test void catalogHasThreeVerifiedPlayablePuzzlesPerDifficultyAndNoInvalidFixtures() throws Exception {
        for (Difficulty difficulty : Difficulty.values()) {
            assertTrue(catalog.list(difficulty).size() >= 3);
            for (PuzzleResponse puzzle : catalog.list(difficulty)) {
                assertTrue(difficulty.includesRating(puzzle.rating()));
                assertTrue(solver.isValidBoard(games.checkedBoard(puzzle.id(), puzzle.original())));
            }
        }
        mvc.perform(get("/api/puzzles")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(9))
                .andExpect(jsonPath("$[0].solution").doesNotExist());
        mvc.perform(get("/api/puzzles?difficulty=EASY")).andExpect(jsonPath("$.length()").value(3));
        mvc.perform(get("/api/puzzles/invalidPuzzle")).andExpect(status().isNotFound());
        mvc.perform(get("/api/puzzles/easy-01/validation")).andExpect(status().isMethodNotAllowed());
    }

    @Test void rejectsMalformedBoardAndChangedOriginalClues() throws Exception {
        mvc.perform(post("/api/puzzles/easy-01/validation").contentType("application/json").content("{\"board\":[[0]]}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.path").value("/api/puzzles/easy-01/validation"));
        int[][] board = PuzzleCatalogService.copyGrid(puzzle().original());
        board[0][0] = 10;
        mvc.perform(post("/api/puzzles/easy-01/validation").contentType("application/json").content(boardJson(board)))
                .andExpect(status().isBadRequest());
        board = PuzzleCatalogService.copyGrid(puzzle().original());
        board[0][1] = 0;
        mvc.perform(post("/api/puzzles/easy-01/validation").contentType("application/json").content(boardJson(board)))
                .andExpect(status().isUnprocessableEntity());
        mvc.perform(post("/api/puzzles/easy-01/completion").contentType("application/json").content("{}"))
                .andExpect(status().isBadRequest());
        for (String invalid : List.of("2.5", "\"2\"", "null", "true")) {
            String json = boardJson(puzzle().original()).replaceFirst("0", invalid);
            mvc.perform(post("/api/puzzles/easy-01/validation").contentType("application/json").content(json))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test void distinguishesRuleConflictsFromNonConflictingWrongAnswers() throws Exception {
        int[][] duplicate = PuzzleCatalogService.copyGrid(puzzle().original());
        duplicate[0][0] = 5;
        ValidationResponse response = games.validate(puzzle().id(), duplicate);
        assertFalse(response.ruleValid());
        assertTrue(response.conflicts().stream().anyMatch(group -> group.type().equals("row")));
        assertTrue(response.conflicts().stream().anyMatch(group -> group.type().equals("box")));
        assertTrue(response.incorrectCells().contains(new CellPosition(0, 0)));

        int[][] wrong = legalWrongEntry();
        ValidationResponse wrongResponse = games.validate(puzzle().id(), wrong);
        assertTrue(wrongResponse.ruleValid());
        assertFalse(wrongResponse.incorrectCells().isEmpty());
        assertFalse(wrongResponse.completed());
        mvc.perform(post("/api/puzzles/easy-01/hints").contentType("application/json").content(boardJson(wrong)))
                .andExpect(status().isConflict());
    }

    private int[][] legalWrongEntry() {
        int[][] original = puzzle().original();
        for (int row = 0; row < 9; row++) for (int col = 0; col < 9; col++) {
            if (original[row][col] != 0) continue;
            for (int value = 1; value <= 9; value++) {
                if (value != puzzle().solution()[row][col] && solver.isValidPlacement(games.checkedBoard(puzzle().id(), original), row, col, value)) {
                    int[][] wrong = PuzzleCatalogService.copyGrid(original);
                    wrong[row][col] = value;
                    return wrong;
                }
            }
        }
        throw new AssertionError("Expected a locally legal wrong candidate in this fixture");
    }

    @Test void hintsAreLegalProtectCluesAndDoNotMutateTheInput() throws Exception {
        int[][] original = PuzzleCatalogService.copyGrid(puzzle().original());
        HintResponse hint = games.hint(puzzle().id(), new HintRequest(original, 0, 1)); // selected clue: choose an empty cell instead
        assertEquals(0, original[hint.row()][hint.column()]);
        assertEquals(puzzle().solution()[hint.row()][hint.column()], hint.value());
        assertTrue(solver.isValidPlacement(games.checkedBoard(puzzle().id(), original), hint.row(), hint.column(), hint.value()));
        assertArrayEquals(puzzle().original(), original);
        mvc.perform(post("/api/puzzles/easy-01/hints").contentType("application/json").content(boardJson(original)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.value").isNumber());
        mvc.perform(post("/api/puzzles/easy-01/hints").contentType("application/json")
                        .content("{\"board\":" + Arrays.deepToString(original) + ",\"row\":9,\"column\":0}"))
                .andExpect(status().isBadRequest());
    }

    @Test void refusesPrematureCompletionAndVerifiesCompletedBoardAndScore() throws Exception {
        assertFalse(games.validate(puzzle().id(), puzzle().original()).completed());
        assertTrue(games.validate(puzzle().id(), puzzle().solution()).completed());
        mvc.perform(post("/api/puzzles/easy-01/completion").contentType("application/json")
                        .content("{\"board\":" + Arrays.deepToString(puzzle().original()) + ",\"elapsedSeconds\":900,\"hints\":2,\"mistakes\":3}"))
                .andExpect(status().isUnprocessableEntity());
        mvc.perform(post("/api/puzzles/easy-01/completion").contentType("application/json")
                        .content("{\"board\":" + Arrays.deepToString(puzzle().solution()) + ",\"elapsedSeconds\":900,\"hints\":2,\"mistakes\":3}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.score").value(1145))
                .andExpect(jsonPath("$.timeBonus").value(420));
        CompletionResponse minimum = games.complete(puzzle().id(), new CompletionRequest(puzzle().solution(), 100000, 100, 100));
        assertEquals(100, minimum.score());
    }

    @Test void exportWritesSeparateNineLineFileAndIsSafeToRepeat() throws Exception {
        mvc.perform(post("/api/puzzles/easy-01/solution-export").contentType("application/json").content(boardJson(puzzle().original())))
                .andExpect(status().isUnprocessableEntity());
        Path originalPath = Path.of("src/main/resources/puzzles/web/easy/easy-01.txt");
        byte[] original = Files.readAllBytes(originalPath);
        for (int request = 0; request < 2; request++) {
            mvc.perform(post("/api/puzzles/easy-01/solution-export").contentType("application/json").content(boardJson(puzzle().solution())))
                    .andExpect(status().isOk()).andExpect(header().string("Content-Disposition", "attachment; filename=\"easy-01.solution.txt\""));
        }
        assertArrayEquals(original, Files.readAllBytes(originalPath));
        List<String> rows = Files.readAllLines(exports.resolve("easy-01.solution.txt"));
        assertEquals(9, rows.size());
        assertTrue(rows.stream().allMatch(row -> row.matches("[1-9]{9}")));
        Files.writeString(exports.resolve("easy-01.solution.txt"), "Keep this existing output");
        mvc.perform(post("/api/puzzles/easy-01/solution-export").contentType("application/json").content(boardJson(puzzle().solution())))
                .andExpect(status().isConflict());
        assertEquals("Keep this existing output", Files.readString(exports.resolve("easy-01.solution.txt")));
    }
}
