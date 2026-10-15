package com.example.sudoku.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CompletionRequest(@NotNull int[][] board,
                                @NotNull @Min(0) @Max(31536000) Integer elapsedSeconds,
                                @NotNull @Min(0) @Max(10000) Integer hints,
                                @NotNull @Min(0) @Max(100000) Integer mistakes) { }
