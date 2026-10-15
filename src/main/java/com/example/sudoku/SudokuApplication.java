package com.example.sudoku;

import com.example.sudoku.exception.InvalidCharacterException;
import com.example.sudoku.exception.SudokuFileNotFoundException;
import com.example.sudoku.models.Sudoku;
import com.example.sudoku.services.SudokuReader;
import com.example.sudoku.services.SudokuSolver;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;
import java.io.IOException;

@SpringBootApplication
public class SudokuApplication {

	public static void main(String[] args) {
		SpringApplication.run(SudokuApplication.class, args);

		// create a SudokuReader object to read the puzzle file
		SudokuReader reader = new SudokuReader();

		// create a SudokuSolver object to solve puzzles
		SudokuSolver sudokuSolver = new SudokuSolver();

		// get the folder containing all Sudoku puzzle files
		File puzzleFolder = new File("src/main/resources/puzzles");

		// get all files inside the folder
		File[] puzzleFiles = puzzleFolder.listFiles();

		// check if the folder exists and contains accessible files
		if (puzzleFiles == null) {
			System.out.println("Puzzle folder not found or cannot be read.");
			return;
		}

		// loop through all the files in the puzzles folder
		for (File puzzleFile : puzzleFiles) {
			// Only read .txt files
			if (puzzleFile.isFile()
					&& puzzleFile.getName().endsWith(".txt")
					&& !puzzleFile.getName().endsWith(".solution.txt")) {
				try {
					System.out.println("\n==================================");
					System.out.println("Reading: " + puzzleFile.getName());
					System.out.println("==================================\n");

					// read the current puzzle file
					Sudoku sudokuBoard = reader.readPuzzleFile(puzzleFile.getPath());

					System.out.println("Sudoku file loaded successfully!");
					System.out.println();

					// print the original Sudoku board
					System.out.println("Original Sudoku:");
					sudokuBoard.printBoard();
					System.out.println();

					// check if the original Sudoku clues are valid
					boolean isValid = sudokuSolver.isValidBoard(sudokuBoard);

					// print the validation result
					System.out.println("Is the original Sudoku valid? " + isValid);
					System.out.println();

					// solve the current Sudoku puzzle
					if (isValid) {

						boolean isSolved = sudokuSolver.solveSudoku(sudokuBoard);

						// check if the Sudoku was solved
						if (isSolved) {
							System.out.println("Sudoku solved successfully!");
							System.out.println();
							sudokuBoard.printBoard();

							// create the filename for the solved puzzle
							String solutionFilename = puzzleFile.getName().replace(".txt", ".solution.txt");

							// save the solved sudoku board to a text file
							sudokuBoard.saveSolution("src/main/resources/puzzles/" + solutionFilename);

						} else {
							System.out.println("No solution found for this Sudoku.");
						}

					} else {
						System.out.println("Invalid Sudoku puzzle. Cannot solve.");
					}
				} catch (SudokuFileNotFoundException | InvalidCharacterException | IllegalArgumentException | IOException e) {

					// display the error and continue to the next file
					System.out.println("Error in " + puzzleFile.getName()
							+ ": " + e.getMessage());
				}
			}
		}
	}
}