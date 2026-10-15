package com.example.sudoku.config;

import com.example.sudoku.services.SudokuReader;
import com.example.sudoku.services.SudokuSolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.MapperFeature;

@Configuration
public class SudokuConfiguration {
    // Register the existing classes without changing their source or console usage.
    @Bean
    public SudokuReader sudokuReader() { return new SudokuReader(); }

    @Bean
    public SudokuSolver sudokuSolver() { return new SudokuSolver(); }

    @Bean
    public JsonMapperBuilderCustomizer strictIntegerRequests() {
        // JSON decimals, strings, and null cells must not silently turn into integers or zeros.
        return builder -> builder.disable(DeserializationFeature.ACCEPT_FLOAT_AS_INT)
                .disable(MapperFeature.ALLOW_COERCION_OF_SCALARS)
                .enable(DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES);
    }
}
