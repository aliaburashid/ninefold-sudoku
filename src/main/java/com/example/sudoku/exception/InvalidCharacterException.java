package com.example.sudoku.exception;

// To check if invalid character is present inside the game file
public class InvalidCharacterException extends Exception{

    public InvalidCharacterException(String message) {
        super(message);
    }
}
