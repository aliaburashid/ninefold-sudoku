package com.example.sudoku.services;

import com.example.sudoku.dto.PuzzleResponse;
import com.example.sudoku.exception.GameRequestException;
import com.example.sudoku.models.Difficulty;
import com.example.sudoku.models.PuzzleDefinition;
import com.example.sudoku.models.Sudoku;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.*;

@Service
public class PuzzleCatalogService {
    private static final Logger log = LoggerFactory.getLogger(PuzzleCatalogService.class);
    private final Map<String, PuzzleDefinition> puzzles = new TreeMap<>();
    private final SudokuReader reader;
    private final SudokuSolver solver;

    public PuzzleCatalogService(SudokuReader reader, SudokuSolver solver) throws Exception {
        this.reader = reader;
        this.solver = solver;
        Resource[] resources = new PathMatchingResourcePatternResolver()
                .getResources("classpath*:puzzles/web/*/*.txt");
        for (Resource resource : resources) {
            try {
                PuzzleDefinition puzzle = load(resource);
                if (puzzles.putIfAbsent(puzzle.id(), puzzle) != null) {
                    throw new IllegalArgumentException("Duplicate puzzle ID");
                }
            } catch (Exception error) {
                // A bad catalog entry must not hide the other playable puzzles.
                log.warn("Skipping catalog puzzle {}: {}", resource.getFilename(), error.getMessage());
            }
        }
        log.info("Ninefold catalog: {} playable puzzles", puzzles.size());
    }

    private PuzzleDefinition load(Resource resource) throws Exception {
        String filename = Objects.requireNonNull(resource.getFilename());
        String id = filename.substring(0, filename.length() - 4);
        if (!id.matches("(easy|medium|hard)-[a-zA-Z0-9-]+")) {
            throw new IllegalArgumentException("Use an easy-, medium-, or hard- filename prefix");
        }
        Difficulty difficulty = Difficulty.valueOf(id.substring(0, id.indexOf('-')).toUpperCase(Locale.ROOT));
        Properties metadata = new Properties();
        try (InputStream input = resource.createRelative(id + ".properties").getInputStream()) {
            metadata.load(input);
        }
        double rating = Double.parseDouble(required(metadata, "rating"));
        if (!difficulty.includesRating(rating)) throw new IllegalArgumentException("Difficulty does not match rating");

        // The original reader accepts filesystem paths. Extract only when a resource is inside a JAR.
        Path temporaryFile = null;
        Sudoku sudoku;
        try {
            Path file;
            if (resource.isFile()) {
                file = resource.getFile().toPath();
            } else {
                temporaryFile = Files.createTempFile("ninefold-puzzle-", ".txt");
                try (InputStream input = resource.getInputStream()) {
                    Files.copy(input, temporaryFile, StandardCopyOption.REPLACE_EXISTING);
                }
                file = temporaryFile;
            }
            sudoku = reader.readPuzzleFile(file.toString());
        } finally {
            if (temporaryFile != null) Files.deleteIfExists(temporaryFile);
        }
        int[][] original = toGrid(sudoku);
        if (!solver.solveSudoku(sudoku)) throw new IllegalArgumentException("Puzzle is invalid or unsolvable");
        return new PuzzleDefinition(id, required(metadata, "title"), difficulty, rating,
                required(metadata, "source"), required(metadata, "sourceUrl"), required(metadata, "sourceId"),
                original, toGrid(sudoku));
    }

    private String required(Properties metadata, String name) {
        String value = metadata.getProperty(name);
        if (value == null || value.isBlank()) throw new IllegalArgumentException("Missing metadata: " + name);
        return value;
    }

    public List<PuzzleResponse> list(Difficulty difficulty) {
        return puzzles.values().stream().filter(p -> difficulty == null || p.difficulty() == difficulty)
                .map(this::response).toList();
    }

    public PuzzleDefinition get(String id) {
        PuzzleDefinition puzzle = puzzles.get(id);
        if (puzzle == null) throw new GameRequestException(HttpStatus.NOT_FOUND, "That puzzle is not in the playable catalog.");
        return puzzle;
    }

    public PuzzleResponse response(PuzzleDefinition puzzle) {
        int clues = (int) Arrays.stream(puzzle.original()).flatMapToInt(Arrays::stream).filter(n -> n != 0).count();
        return new PuzzleResponse(puzzle.id(), puzzle.title(), puzzle.difficulty(), puzzle.rating(), clues,
                puzzle.source(), puzzle.sourceUrl(), copyGrid(puzzle.original()));
    }

    public static int[][] copyGrid(int[][] grid) {
        return Arrays.stream(grid).map(int[]::clone).toArray(int[][]::new);
    }

    public static int[][] toGrid(Sudoku sudoku) {
        int[][] grid = new int[9][9];
        for (int row = 0; row < 9; row++) for (int column = 0; column < 9; column++) {
            grid[row][column] = sudoku.getBoard()[row][column].getValue();
        }
        return grid;
    }
}
