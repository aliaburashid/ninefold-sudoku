# Sudoku Solver — Java & Spring Boot

## Project Overview

This project is a Sudoku solver developed using **Java**, with a focus on object-oriented programming, file handling, recursion, algorithms, and exception handling.

The main objective is to read a Sudoku puzzle from a text file, represent it as a 9×9 board, validate the input, solve the puzzle, and save the completed solution.

The project was later extended with a Spring Boot REST API while retaining the original Java solving logic.

## Project Functionality

The Java application supports the following:

- Reading Sudoku puzzles from `.txt` files.
- Representing a 9×9 Sudoku board using Java objects.
- Identifying fixed values and empty cells.
- Validating puzzle input and handling invalid files.
- Solving Sudoku puzzles using a backtracking algorithm.
- Printing the Sudoku board.
- Saving completed solutions to separate `.solution.txt` files.
- Processing multiple puzzle files.

## My Implementation

I organised the application into separate Java classes, each with its own responsibility.

| Class | Responsibility |
|---|---|
| `SudokuCell` | Represents an individual cell in the Sudoku board. |
| `Sudoku` | Stores the 9×9 board and provides methods for displaying and saving it. |
| `SudokuReader` | Reads puzzle data from text files. |
| `SudokuSolver` | Contains the algorithm used to solve the Sudoku puzzle. |
| `SudokuApplication` | Starts the application and coordinates puzzle processing. |
| Custom exception classes | Handle invalid characters and file-related errors. |

This separation makes the program easier to understand, test, and maintain.

## Sudoku Solving Logic

The core of the project is the `SudokuSolver` class.

I used a **recursive backtracking approach** to solve Sudoku puzzles.

The algorithm works by:

1. Finding an empty cell in the Sudoku board.
2. Determining which numbers from 1 to 9 can legally be placed in that cell.
3. Checking the Sudoku rules for the row, column, and 3×3 subgrid.
4. Placing a valid candidate and continuing recursively.
5. Backtracking when a candidate leads to a situation with no valid solution.
6. Continuing until the board is complete.

The implementation also uses the **Minimum Remaining Values (MRV)** strategy to prioritise cells with fewer possible candidates, reducing unnecessary searches.

### Sudoku Rules

Every completed board must satisfy three rules:

- Each row contains the numbers 1–9 without repetition.
- Each column contains the numbers 1–9 without repetition.
- Each 3×3 subgrid contains the numbers 1–9 without repetition.

## File Handling

The application reads Sudoku puzzles from text files and converts their contents into a board representation.

I also implemented solution exporting using Java's `FileWriter`, allowing the completed Sudoku board to be saved as a separate file.

For example:

```text
puzzle1.txt
puzzle1.solution.txt
```

This allows the original puzzle to be preserved while keeping its solution available for review.

## Validation and Exception Handling

The application includes validation and custom exception handling for malformed puzzle files.

Examples of invalid input include:

- Unsupported characters.
- Incorrect row lengths.
- An incorrect number of rows.
- Invalid puzzle configurations.

Handling these cases separately helps prevent invalid data from being processed as a normal Sudoku puzzle.

## Object-Oriented Programming

The project applies several Java programming concepts:

- **Encapsulation:** Board and cell data are represented through classes.
- **Abstraction:** Reading, solving, and saving responsibilities are separated.
- **Methods and objects:** Different classes collaborate to process a puzzle.
- **Recursion:** The solver repeatedly explores possible solutions.
- **Exception handling:** Invalid input is handled using dedicated exceptions.

## Testing

The project includes test puzzles covering both valid and invalid inputs.

The Java backend also includes automated tests for existing functionality and the additional REST API.

## Technologies Used

- Java 17
- Spring Boot
- Maven
- JUnit
- Git and GitHub

## Further Development

After completing the Java solving functionality, I extended the project with a Spring Boot REST API and a React-based interface called **Ninefold**, allowing users to play Sudoku interactively while reusing the Java backend logic.

The original Sudoku implementation remains part of the project.
