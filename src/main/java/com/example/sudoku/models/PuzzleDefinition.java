package com.example.sudoku.models;

// Internal catalog data. Solutions are never serialized by a controller.
public record PuzzleDefinition(String id, String title, Difficulty difficulty, double rating,
                               String source, String sourceUrl, String sourceId,
                               int[][] original, int[][] solution) { }
