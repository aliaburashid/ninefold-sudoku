package com.example.sudoku.services;

import com.example.sudoku.exception.GameRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.Arrays;
import java.util.stream.Collectors;

@Service
public class SolutionExportService {
    private final SudokuGameService games;
    private final Path directory;

    public SolutionExportService(SudokuGameService games,
            @Value("${ninefold.export-directory:generated-solutions}") String directory) {
        this.games = games;
        this.directory = Path.of(directory).toAbsolutePath().normalize();
    }

    public byte[] export(String id, int[][] board) throws IOException {
        if (!games.validate(id, board).completed()) {
            throw new GameRequestException(HttpStatus.UNPROCESSABLE_ENTITY, "Complete the puzzle correctly before exporting its solution.");
        }
        String contents = Arrays.stream(board).map(row -> Arrays.stream(row).mapToObj(String::valueOf)
                .collect(Collectors.joining())).collect(Collectors.joining("\n")) + "\n";
        byte[] bytes = contents.getBytes(StandardCharsets.UTF_8);
        Files.createDirectories(directory);
        // CREATE_NEW preserves both original puzzles and any previously exported solution.
        Path target = directory.resolve(id + ".solution.txt").normalize();
        if (!target.getParent().equals(directory)) throw new GameRequestException(HttpStatus.BAD_REQUEST, "Invalid puzzle ID.");
        try {
            Files.write(target, bytes, StandardOpenOption.CREATE_NEW);
        } catch (FileAlreadyExistsException exists) {
            if (!Arrays.equals(Files.readAllBytes(target), bytes)) {
                throw new GameRequestException(HttpStatus.CONFLICT, "A different solution export already exists; no file was overwritten.");
            }
        }
        return bytes;
    }
}
