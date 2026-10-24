# Repository instructions

## Project shape

This is a dependency-free browser game built from plain HTML, CSS, and JavaScript. `index.html` is the page shell and links `style.css` plus `game.js`; there is no bundler or application framework.

The game runs on the `<canvas id="game">` element with a logical 960 × 540 drawing space. `game.js` owns the world data, player/enemy state, keyboard input, collision and game-state updates, camera, and Canvas rendering. Its `requestAnimationFrame` loop updates gameplay and then draws the scene. `style.css` styles the surrounding page and scales the canvas responsively while preserving its aspect ratio.

## Commands

- There are no package manifest scripts, build, lint, or automated test runner in this repository.
- Check JavaScript syntax with `node --check game.js`.
- To try the game locally, run `python3 -m http.server 8000` from the repository root and open `http://localhost:8000`. Verify movement, jumping, attacking, restarting, and reaching the goal in a browser.

## Project conventions

- Keep the implementation dependency-free and split page structure, presentation, and game behavior across the existing HTML, CSS, and JavaScript files.
- Treat the canvas dimensions in `index.html` as the game's logical coordinate system. World positions, platform/enemy data, physics, and camera calculations in `game.js` use those coordinates; CSS handles display scaling.
- Keep the animation loop organized around `update(delta)` and `render()`. Use elapsed frame time for movement so gameplay speed does not depend on display refresh rate.
- Keep game state and world configuration in `game.js`. Reset mutable player/enemy state in `resetGame()` so restarting restores a fresh run.
- The HTML and JavaScript are connected by the `#game`, `#game-status`, and `#restart` selectors. Keep those IDs in sync when changing the page structure.
- 説明やユーザー向けの文章は日本語で表示してください。ページの文言やゲーム内メッセージを追加・変更する場合も日本語にし、`lang="ja"`を維持してください。
