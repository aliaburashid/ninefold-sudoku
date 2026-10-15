package com.example.sudoku.dto;

import com.example.sudoku.models.Difficulty;

public record PuzzleResponse(String id, String title, Difficulty difficulty, double rating,
                             int clueCount, String source, String sourceUrl, int[][] original) { }
