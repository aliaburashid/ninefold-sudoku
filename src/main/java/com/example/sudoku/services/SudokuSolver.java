package com.example.sudoku.services;

import com.example.sudoku.models.Sudoku;


public class SudokuSolver {

    // check if the number already exists in the same row
    public boolean isValidRow(Sudoku sudokuBoard, int row, int number) {

        // go through all 9 columns in this row
        for (int column = 0; column < 9; column++) {

            // get the number stored in the current cell
            int cellValue = sudokuBoard.getBoard()[row][column].getValue();

            // if the number already exists, we cannot place it
            if (cellValue == number) {
                return false;
            }
        }

        // the number was not found, so it is allowed in this row
        return true;
    }



    // check if the number already exists in the same column
    public boolean isValidColumn(Sudoku sudokuBoard, int column, int number) {

        // go through all 9 rows in this column
        for (int row = 0; row < 9; row++) {

            // get the number stored in the current cell
            int cellValue = sudokuBoard.getBoard()[row][column].getValue();

            // if the number already exists, it cannot be placed
            if (cellValue == number) {
                return false;
            }
        }

        // the number was not found in this column
        return true;
    }


    // check if a number already exists in the same 3x3 box
    public boolean isValidBox(Sudoku sudokuBoard, int row, int column, int number) {

        // find the starting row and column of the 3x3 box
        int startRow = 0;
        int startColumn = 0;

        // find the first row of the box
        if (row >= 6) {
            startRow = 6;
        } else if (row >= 3) {
            startRow = 3;
        }

        // find the first column of the box
        if (column >= 6) {
            startColumn = 6;
        } else if (column >= 3) {
            startColumn = 3;
        }

        // check all 9 cells inside the box
        // goes through all three rows, starting from startRow = 0
        // when boxRow reaches 3, the loop stops
        // startRow + 3 as each Sudoku box contains 3 rows
        for (int boxRow = startRow; boxRow < startRow + 3; boxRow++) {
            // check the 3 columns inside the box
            for (int boxColumn = startColumn; boxColumn < startColumn + 3; boxColumn++) {

                // get the number in the current cell
                int cellValue = sudokuBoard.getBoard()[boxRow][boxColumn].getValue();

                // if the number is already there, it is not allowed
                if (cellValue == number) {
                    return false;
                }
            }
        }
        return true;

    }

    // check if a number can be placed in a specific cell
    public boolean isValidPlacement(Sudoku sudokuBoard, int row, int column, int number) {

        // the number must be valid in the row, column and 3x3 box
        return isValidRow(sudokuBoard, row, number)
                && isValidColumn(sudokuBoard, column, number)
                && isValidBox(sudokuBoard, row, column, number);
    }

    // check if a cell is empty
    // solver must never overwrite the original numbers from the puzzle file
    // this method distinguish between cells that are already filled and cells that need solving
    public boolean isEmptyCell(Sudoku sudokuBoard, int row, int column) {

        // get the number stored in this cell
        int cellValue = sudokuBoard.getBoard()[row][column].getValue();

        // return true if the cell contains 0
        return cellValue == 0;
    }


    // Possible values in an empty cell
    // Count how many numbers can be placed in an empty cell
    public int countValidNumbers(Sudoku sudokuBoard, int row, int column) {
        // start with 0 possible numbers
        int count = 0;

        // try numbers from 1 to 9
        for (int number = 1; number <= 9; number++) {
            // check if the number follows all Sudoku rules
            if (isValidPlacement(sudokuBoard, row, column, number)) {
                count++;
            }
        }
        // return the total number of possible numbers
        return count;
    }

    // MRV (Minimum Remaining Values) heuristic
    // find the empty cell with the fewest valid numbers
    public int[] findMRVCell(Sudoku sudokuBoard) {

        // store the position of the best empty cell
        int[] bestCell = null;

        // start with 10 because it's larger than every possible count
        int fewestOptions = 10;

        // go through every row
        for (int row = 0; row < 9; row++) {

            // go through every column
            for (int column = 0; column < 9; column++) {

                // only check empty cells
                if (isEmptyCell(sudokuBoard, row, column)) {

                    // count how many numbers can fit here
                    int options = countValidNumbers(sudokuBoard, row, column);

                    // if this cell has fewer options, remember it
                    if (options < fewestOptions) {
                        fewestOptions = options;
                        // save the position of the empty cell with the fewest possible numbers
                        bestCell = new int[]{row, column};
                    }
                }
            }
        }

        // return the position of the best empty cell
        return bestCell;
    }

    // check if the original Sudoku numbers follow all Sudoku rules
    public boolean isValidBoard(Sudoku sudokuBoard) {

        // go through every row
        for (int row = 0; row < 9; row++) {

            // go through every column
            for (int column = 0; column < 9; column++) {

                // get the number already stored in this cell
                int number = sudokuBoard.getBoard()[row][column].getValue();

                // skip empty cells because 0 represents an empty cell
                if (number == 0) {
                    continue;
                }

                // temporarily remove the number so it doesn't compare with itself
                sudokuBoard.getBoard()[row][column].setValue(0);

                // check the number against the row, column and 3x3 box
                boolean isValid = isValidPlacement(sudokuBoard, row, column, number);

                // restore the original number
                sudokuBoard.getBoard()[row][column].setValue(number);

                // if the number breaks any Sudoku rule, the board is invalid
                if (!isValid) {
                    return false;
                }
            }
        }

        // all existing numbers follow the Sudoku rules
        return true;

    }


    // The security guard
    // check whether the original Sudoku has any duplicate numbers
    // it does this only once
    public boolean solveSudoku(Sudoku sudokuBoard) {

        // check if the original Sudoku board is valid before solving
        if (!isValidBoard(sudokuBoard)) {
            return false;
        }

        // start solving using DFS + Backtracking + MRV
        return solveWithBacktracking(sudokuBoard);
    }

    // THIS IS WHERE THE SUDOKU SOLVER START FILLING IN EMPTY CELLS
    // solve Sudoku using DFS + Backtracking + MRV
    // only SudokuSolver itself needs to call this method
    private boolean solveWithBacktracking(Sudoku sudokuBoard) {

        // call findMRVCell() to get the position of the best empty cell
        int [] selectedCell = findMRVCell(sudokuBoard);

        // if there are no empty cells left, the sudoku is solved
        if (selectedCell == null) {
            return true;
        }

        // get the position of that selected cell
        int row = selectedCell[0];
        int column = selectedCell[1];

        // try numbers from 1 to 9 in the selected cell
        for (int number = 1; number <= 9; number++) {

            // check if the numbers follows the Sudoku rules
            if (isValidPlacement(sudokuBoard, row, column, number)) {

                // place the valid number in the selected cell
                sudokuBoard.getBoard()[row][column].setValue(number);

                // DFS: call the same method "RECURSION" to solve the remaining cell
                if (solveWithBacktracking(sudokuBoard)) {
                    // if successfully fills the entire sudoku
                    return true;
                } else {
                    // Backtracking: undo the number if it leads to a dead end
                    sudokuBoard.getBoard()[row][column].setValue(0);
                }
            }
        }
        // all numbers from 1 to 9 have been tried
        // none led to a solution
        return false;
    }


}