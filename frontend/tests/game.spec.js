import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function start(page, difficulty = "Easy") {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Let’s play/ })).toBeEnabled();
  await page.getByRole("radio", { name: new RegExp(`^${difficulty}`) }).click();
  await page.getByRole("button", { name: /Let’s play/ }).click();
  await expect(page.getByRole("grid", { name: "Sudoku puzzle" })).toBeVisible();
}

async function checkedEntry(page, index, value) {
  const response = page.waitForResponse(
    (response) =>
      response.url().endsWith("/validation") &&
      response.request().method() === "POST",
  );
  await page.locator(".sudoku-cell").nth(index).click();
  await page.keyboard.press(String(value));
  const validation = await (await response).json();
  if (validation.completed)
    await expect(
      page.getByRole("heading", { name: "Look at you flow." }),
    ).toBeVisible();
  else
    await expect(page.locator('[role="grid"]')).toHaveAttribute(
      "aria-busy",
      "false",
    );
}

test("play, protect clues, distinguish conflicts, erase, hint, save, resume, and restart", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await start(page);
  await page.locator(".sudoku-cell").nth(1).click();
  await page.keyboard.press("1");
  await expect(page.locator(".sudoku-cell").nth(1)).toHaveText("5");
  await checkedEntry(page, 0, 5);
  await expect(page.locator(".board-feedback")).toContainText(
    "repeated number",
  );
  await expect(page.locator(".game-counters")).toContainText("1 mistakes");
  await checkedEntry(page, 0, "Backspace");
  await expect(page.locator(".board-feedback")).toContainText("Looking good");
  await page.getByRole("button", { name: /A little hint/ }).click();
  await expect(page.locator(".game-counters")).toContainText("1 hints used");
  await expect(page.locator('[role="grid"]')).toHaveAttribute(
    "aria-busy",
    "false",
  );
  const before = await page.locator(".sudoku-cell").allTextContents();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.reload();
  await page
    .getByRole("button", { name: /Pick up where you left off/ })
    .click();
  await expect(page.locator(".sudoku-cell").first()).toBeVisible();
  expect(await page.locator(".sudoku-cell").allTextContents()).toEqual(before);
  await expect(page.locator(".game-counters")).toContainText("1 hints used");
  await expect(page.locator(".game-counters")).toContainText("1 mistakes");
  await page.getByRole("button", { name: "Restart", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: "Restart puzzle", exact: true })
    .click();
  await expect(page.locator(".game-counters")).toContainText("0 hints used");
  await expect(page.locator(".game-counters")).toContainText("0 mistakes");
  await expect(page.locator(".sudoku-cell").first()).toBeEmpty();
  expect(errors).toEqual([]);
});

test("timer pauses, resumes, survives reload, and does not count closed-tab time", async ({
  page,
}) => {
  await page.clock.install();
  await start(page);
  await page.clock.fastForward(65000);
  await expect(page.getByLabel("Elapsed time")).toHaveText("01:05");
  await page.getByRole("button", { name: "Pause game", exact: true }).click();
  await page.clock.fastForward(120000);
  await expect(page.getByLabel("Elapsed time")).toHaveText("01:05");
  await expect(page.getByRole("grid")).not.toBeVisible();
  await page
    .getByRole("button", { name: "Resume game", exact: true })
    .last()
    .click();
  await expect(page.getByRole("grid")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Pause game", exact: true }),
  ).toBeEnabled();
  await page.clock.fastForward(5000);
  await expect(page.getByLabel("Elapsed time")).toHaveText("01:10");
  await page.getByRole("button", { name: "Pause game", exact: true }).click();
  await page.reload();
  await page.clock.fastForward(300000);
  await page
    .getByRole("button", { name: /Pick up where you left off/ })
    .click();
  await expect(page.getByLabel("Elapsed time")).toHaveText("01:10");
});

test("complete a real Java-verified puzzle, celebrate, export, and record statistics once", async ({
  page,
  request,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const puzzle = await (await request.get("/api/puzzles/easy-01")).json();
  const board = puzzle.original.map((row) => [...row]);
  // Obtain the test solution from Java hints; no solver is implemented in the frontend or tests.
  for (let count = 0; count < 81; count++) {
    if (!board.some((row) => row.includes(0))) break;
    const response = await request.post("/api/puzzles/easy-01/hints", {
      data: { board },
    });
    expect(response.ok()).toBeTruthy();
    const hint = await response.json();
    board[hint.row][hint.column] = hint.value;
  }
  await start(page);
  for (let row = 0; row < 9; row++)
    for (let col = 0; col < 9; col++) {
      if (puzzle.original[row][col] === 0)
        await checkedEntry(page, row * 9 + col, board[row][col]);
    }
  await expect(
    page.getByRole("heading", { name: "Look at you flow." }),
  ).toBeVisible();
  await expect(page.getByLabel(/Final score/)).toBeVisible();
  await expect(page.locator(".victory-art > i")).toHaveCount(20);
  const finalScore = await page.evaluate(
    () => JSON.parse(localStorage.getItem("ninefold.statistics.v1"))[0].score,
  );
  await expect(page.getByLabel(/Final score/)).toHaveText(
    finalScore.toLocaleString(),
  );
  await page.screenshot({
    path: "test-results/ninefold-completion.png",
    fullPage: true,
  });
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export solution", exact: true })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("easy-01.solution.txt");
  const text = await readFile(await download.path(), "utf8");
  expect(text.trim().split("\n")).toHaveLength(9);
  expect(text).toBe(board.map((row) => row.join("")).join("\n") + "\n");
  await page.getByRole("button", { name: /See your progress/ }).click();
  await expect(page.locator(".statistics-overview").first()).toContainText("1");
  const records = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("ninefold.statistics.v1")),
  );
  expect(records).toHaveLength(1);
  expect(records[0].difficulty).toBe("EASY");
});

test("welcome and game layouts fit narrow mobile, tablet, and desktop screens", async ({
  page,
}) => {
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: /Let’s play/ }),
    ).toBeEnabled();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    await page.screenshot({
      path: `test-results/ninefold-home-${width}.png`,
      fullPage: true,
    });
  }
  await start(page);
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    await page.screenshot({
      path: `test-results/ninefold-game-${width}.png`,
      fullPage: true,
    });
  }
});

for (const difficulty of ["Medium", "Hard"]) {
  test(`${difficulty} selection loads its actual rated puzzle`, async ({
    page,
  }) => {
    await start(page, difficulty);
    await expect(page.locator(".game-heading .level-badge")).toContainText(
      difficulty.toLowerCase(),
    );
    const session = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("ninefold.session.v1")),
    );
    expect(session.puzzle.difficulty).toBe(difficulty.toUpperCase());
    expect(session.board).toEqual(session.puzzle.original);
  });
}

test("mobile layout, reduced motion, keyboard navigation, and service failure recovery", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await start(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.locator(".sudoku-cell").first().click();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".sudoku-cell").nth(1)).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await page.route("**/validation", (route) => route.abort());
  await page.keyboard.press("2");
  await expect(page.getByRole("alert")).toContainText("couldn’t reach");
  await page.unroute("**/validation");
  await page.getByRole("button", { name: "Retry entry check" }).click();
  await expect(page.locator('[role="grid"]')).toHaveAttribute(
    "aria-busy",
    "false",
  );
  expect(
    await page.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
