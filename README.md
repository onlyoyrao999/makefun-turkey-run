# makefun-turkey-run

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/onlyoyrao999/makefun-turkey-run/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/onlyoyrao999/makefun-turkey-run/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

**Turkey Run** is a turkey escape game: you are the turkey, Thanksgiving is coming, and the farmer is right behind you with a pitchfork. Sprint across the farm, jump hay bales and fences, dodge falling carving knives and the roaring oven, grab corn for points — and run 1500 m to the forest to escape. Three hearts, a farmer who gains on every stumble, a feather shield, a chili rush, and a double jump for the tall oven.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no network — the game is plain static files under `game/`.

Controls: **Space / ↑ / tap** — jump (twice for a double jump), **↓** — duck, **P** — pause, **M** — mute, **R** — restart.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

---

<sub>Entered on [make.fun](https://make.fun/?ref=x2ejakqy&utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>
