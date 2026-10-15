package com.example.sudoku.models;

import lombok.Getter;
import java.io.FileWriter;
import java.io.IOException;

@Getter
public class Sudoku {

    // 2D arrays to represent the board
    private SudokuCell[][] board;

    public Sudoku() {
        // creates space for 81 cells
        board = new SudokuCell[9][9];

        for (int row = 0; row < 9;  row++) {
            for (int column = 0; column < 9; column++) {
                // creates a cell at that position, initially empty
                board[row][column] = new SudokuCell(row, column, 0);
            }
        }
    }


    // saves the solved sudoku board to a text file
    public void saveSolution(String filename) throws IOException {

        // creates a file to store the solved sudoku
        FileWriter writer = new FileWriter(filename);

        // go through each row of the sudoku board
        for (int row = 0; row < 9; row++) {

            // go through each column
            for (int column = 0; column < 9; column++) {

                // get the number stored in the current cell
                int number = board[row][column].getValue();

                // write the number into the file
                writer.write(String.valueOf(number));
            }

            // move to the next line after completing one row
            writer.write(System.lineSeparator());
        }
        // close the file after writing the solution
        writer.close();
    }

    // prints the sudoku board
    public void printBoard() {

        // go through each row
        for (int row = 0; row < 9; row++) {
            // go through each column
            for (int column = 0; column < 9; column++) {

                // get the number stored in the current cell
                int number = board[row][column].getValue();

                // print the number followed by a space
                System.out.print(number + " ");

                // add a separator after the 3rd and 6th columns
                if (column == 2 || column == 5) {
                    System.out.print("| ");
                }
            }

            // move to the next line after printing one row
            System.out.println();

            // add a horizontal separator after the 3rd and 6th rows
            if (row == 2 || row == 5) {
                System.out.println("------+-------+------");
            }
        }
    }
}
