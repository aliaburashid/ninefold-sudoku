package com.example.sudoku.dto;

public record CompletionResponse(boolean completed, int score, int basePoints, int timeBonus,
                                 int hintDeduction, int mistakeDeduction, int elapsedSeconds,
                                 int hints, int mistakes) { }
