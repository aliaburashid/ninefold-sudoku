package com.example.sudoku.dto;

import java.util.List;

public record ValidationResponse(boolean ruleValid, List<ConflictResponse> conflicts,
                                 List<CellPosition> incorrectCells, int correctEntries,
                                 int totalEditable, int progress, boolean completed) { }
