package com.example.sudoku.controllers;

import com.example.sudoku.dto.*;
import com.example.sudoku.models.Difficulty;
import com.example.sudoku.services.*;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/puzzles")
public class SudokuController {
    private final PuzzleCatalogService catalog;
    private final SudokuGameService games;
    private final SolutionExportService exports;

    public SudokuController(PuzzleCatalogService catalog, SudokuGameService games, SolutionExportService exports) {
        this.catalog = catalog;
        this.games = games;
        this.exports = exports;
    }

    @GetMapping
    public List<PuzzleResponse> list(@RequestParam(required = false) Difficulty difficulty) { return catalog.list(difficulty); }

    @GetMapping("/{id}")
    public PuzzleResponse puzzle(@PathVariable String id) { return catalog.response(catalog.get(id)); }

    @PostMapping("/{id}/validation")
    public ValidationResponse validate(@PathVariable String id, @Valid @RequestBody BoardRequest request) {
        return games.validate(id, request.board());
    }

    @PostMapping("/{id}/hints")
    public HintResponse hint(@PathVariable String id, @Valid @RequestBody HintRequest request) { return games.hint(id, request); }

    @PostMapping("/{id}/completion")
    public CompletionResponse complete(@PathVariable String id, @Valid @RequestBody CompletionRequest request) {
        return games.complete(id, request);
    }

    @PostMapping("/{id}/solution-export")
    public ResponseEntity<byte[]> export(@PathVariable String id, @Valid @RequestBody BoardRequest request) throws IOException {
        byte[] file = exports.export(id, request.board());
        return ResponseEntity.ok().contentType(MediaType.TEXT_PLAIN)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(id + ".solution.txt").build().toString())
                .body(file);
    }
}
