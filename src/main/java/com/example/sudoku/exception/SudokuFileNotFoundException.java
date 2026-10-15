package com.example.sudoku.exception;

// To check if the game file exists
public class SudokuFileNotFoundException extends Exception {

    public SudokuFileNotFoundException(String message) {
        super(message);
    }
}
