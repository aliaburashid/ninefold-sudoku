package com.example.sudoku.dto;

public record HintResponse(int row, int column, int value, String explanation) { }
