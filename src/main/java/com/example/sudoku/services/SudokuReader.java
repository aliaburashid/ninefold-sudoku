package com.example.sudoku.services;

import com.example.sudoku.exception.InvalidCharacterException;
import com.example.sudoku.exception.SudokuFileNotFoundException;
import com.example.sudoku.models.Sudoku;

import java.io.File;
import java.io.FileNotFoundException;
import java.util.Scanner;

public class SudokuReader {

    public Sudoku readPuzzleFile(String filename)
            throws SudokuFileNotFoundException, InvalidCharacterException {

        // create an empty Sudoku board
        Sudoku sudokuBoard = new Sudoku();

        try {
            // open the text file, and read it's content one line at a time
            Scanner scanner = new Scanner(new File(filename));

            try {
                // go through the 9 rows
                for (int row = 0; row < 9; row++) {

                    // make sure there is another row to read
                    if (!scanner.hasNextLine()) {
                        throw new IllegalArgumentException("Missing Sudoku rows");
                    }

                    // read one row from the file
                    // example: puzzleRow = "530070000";
                    String puzzleRow = scanner.nextLine();

                    // check the row length
                    // each row must have exactly 9 characters
                    if (puzzleRow.length() != 9) {
                        throw new IllegalArgumentException("Each row must have 9 digits");
                    }

                    // go through the 9 columns in this row
                    // first loop selects a row, and the second loop goes through every character in that row
                    for (int col = 0; col < 9; col++) {

                        // get the character at the current column position
                        // example: puzzleRow.charAt(0); // '5' and puzzleRow.charAt(1); // '3'.... so on
                        char digit = puzzleRow.charAt(col);

                        // check for invalid characters
                        if (digit < '0' || digit > '9') {
                            throw new InvalidCharacterException("Invalid character: " + digit);
                        }

                        // convert the character into a number as SudokuCell class stores its value as an int
                        int number = Character.getNumericValue(digit);

                        // store the number in the Sudoku board
                        sudokuBoard.getBoard()[row][col].setValue(number);
                    }
                }

                // after the loop has read nine rows
                // we check whether another line exists leading to "extra rows"
                if (scanner.hasNextLine()) {
                    throw new IllegalArgumentException("Too many Sudoku rows");
                }

            } finally {
                // close the file even if an error happens
                scanner.close();
            }

        } catch (FileNotFoundException e) {
            // throw custom exception if the file doesn't exist
            throw new SudokuFileNotFoundException(
                    "Could not find puzzle file: " + filename
            );
        }

        // return board with numbers
        return sudokuBoard;
    }
}