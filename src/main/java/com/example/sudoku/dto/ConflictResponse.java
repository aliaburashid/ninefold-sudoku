package com.example.sudoku.dto;

import java.util.List;

public record ConflictResponse(String type, int index, List<CellPosition> cells) { }
