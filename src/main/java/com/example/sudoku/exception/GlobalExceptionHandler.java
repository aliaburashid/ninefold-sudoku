package com.example.sudoku.exception;

import com.example.sudoku.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import java.time.Instant;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(GameRequestException.class)
    public ResponseEntity<ErrorResponse> handleGame(GameRequestException error, HttpServletRequest request) {
        return response(error.getStatus(), error.getMessage(), request);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentNotValidException.class,
            MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ErrorResponse> handleInput(Exception error, HttpServletRequest request) {
        return response(HttpStatus.BAD_REQUEST,
                "Check the request: use a 9 by 9 integer board and nonnegative game statistics.", request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception error, HttpServletRequest request) {
        if (error instanceof org.springframework.web.ErrorResponse frameworkError) {
            return response(HttpStatus.valueOf(frameworkError.getStatusCode().value()),
                    frameworkError.getBody().getTitle(), request);
        }
        log.error("Sudoku API request failed", error);
        return response(HttpStatus.INTERNAL_SERVER_ERROR, "The game server could not complete this request.", request);
    }

    private ResponseEntity<ErrorResponse> response(HttpStatus status, String message, HttpServletRequest request) {
        return ResponseEntity.status(status).body(new ErrorResponse(Instant.now(), status.value(),
                status.name(), message, request.getRequestURI()));
    }
}
