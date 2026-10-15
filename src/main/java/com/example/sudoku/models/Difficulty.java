package com.example.sudoku.models;

public enum Difficulty {
    EASY(1000), MEDIUM(2000), HARD(3000);

    private final int baseScore;

    Difficulty(int baseScore) { this.baseScore = baseScore; }

    public int getBaseScore() { return baseScore; }

    public boolean includesRating(double rating) {
        return switch (this) {
            case EASY -> rating >= 1 && rating < 1.5;
            case MEDIUM -> rating >= 1.5 && rating < 2.5;
            case HARD -> rating >= 2.5 && rating < 5;
        };
    }
}
