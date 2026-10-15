package com.example.sudoku.dto;

import jakarta.validation.constraints.NotNull;

public record BoardRequest(@NotNull(message = "A board is required") int[][] board) { }
