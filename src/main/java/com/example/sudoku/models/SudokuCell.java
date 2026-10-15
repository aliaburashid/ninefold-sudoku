package com.example.sudoku.models;

// This class represents a cell of the sudoku board

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@AllArgsConstructor
@Getter
@Setter
public class SudokuCell {
    private int row;
    private int column;
    private int value;

}
