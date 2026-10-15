package com.example.sudoku.exception;

import org.springframework.http.HttpStatus;

public class GameRequestException extends RuntimeException {
    private final HttpStatus status;

    public GameRequestException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() { return status; }
}
