package com.example.sudoku.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record HintRequest(@NotNull int[][] board, @Min(0) @Max(8) Integer row,
                          @Min(0) @Max(8) Integer column) { }
