"""Offline import/QA tool; gameplay always uses the existing Java SudokuSolver.

Run: python3 scripts/verify_catalog.py
Counts solutions up to two, rejecting ambiguous and unsolvable catalog entries.
"""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]


def solution_count(board):
    best = None
    choices = None
    for row in range(9):
        for col in range(9):
            if board[row][col] != 0:
                continue
            used = set(board[row]) | {board[r][col] for r in range(9)}
            used |= {board[r][c] for r in range(row // 3 * 3, row // 3 * 3 + 3)
                     for c in range(col // 3 * 3, col // 3 * 3 + 3)}
            candidates = set(range(1, 10)) - used
            if not candidates:
                return 0
            if choices is None or len(candidates) < len(choices):
                best, choices = (row, col), candidates
    if best is None:
        return 1
    row, col = best
    total = 0
    for number in choices:
        board[row][col] = number
        total += solution_count(board)
        if total >= 2:
            break
    board[row][col] = 0
    return min(total, 2)


def verify(path):
    rows = path.read_text().splitlines()
    assert len(rows) == 9 and all(len(row) == 9 for row in rows), f'{path}: invalid shape'
    assert all('0' <= ch <= '9' for row in rows for ch in row), f'{path}: invalid digit'
    board = [[int(ch) for ch in row] for row in rows]
    groups = board + [list(col) for col in zip(*board)] + [
        [board[r+i][c+j] for i in range(3) for j in range(3)]
        for r in (0, 3, 6) for c in (0, 3, 6)]
    assert all(len([n for n in group if n]) == len({n for n in group if n}) for group in groups), f'{path}: duplicate clues'
    properties = dict(line.split('=', 1) for line in path.with_suffix('.properties').read_text().splitlines() if '=' in line)
    low, high = {'easy': (1, 1.5), 'medium': (1.5, 2.5), 'hard': (2.5, 5)}[path.parent.name]
    assert low <= float(properties['rating']) < high, f'{path}: rating does not match difficulty'
    digits = ''.join(rows)
    assert hashlib.sha1(digits.encode()).hexdigest().startswith(properties['sourceId']), f'{path}: source fingerprint mismatch'
    count = solution_count(board)
    assert count == 1, f'{path}: expected one solution, found {count}'
    print(f'{path.relative_to(ROOT)}: unique solution verified; rating {properties["rating"]}')
    return {'id': path.stem, 'solutions': count, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}


if __name__ == '__main__':
    paths = sorted((ROOT / 'src/main/resources/puzzles/web').glob('*/*.txt'))
    assert paths, 'No catalog puzzles found'
    for difficulty in ('easy', 'medium', 'hard'):
        assert sum(path.parent.name == difficulty for path in paths) >= 3
    results = [verify(path) for path in paths]
    print(f'PASS: {len(results)} rated puzzles, each with exactly one solution.')
