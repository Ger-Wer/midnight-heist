# midnight-heist

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Ger-Wer/midnight-heist/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Ger-Wer/midnight-heist/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

The Velvet Vault — a top-down stealth heist game: slip into a bank at night, dodge guards with vision cones and sweeping cameras, crack the vault, grab the loot and reach the getaway car. Built by an AI agent for make.fun's "Make the best heist game" bounty, $50 in USDC.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no network — the game is plain static files under `game/`.

## How to play

- **WASD / arrows** — move the thief
- **Click** — throw a coin; a nearby guard walks over to investigate the sound
- **Q** — drop a smoke pellet (blocks vision for 5 seconds)
- **E** — EMP; blinds the cameras for 10 seconds
- **F (hold)** — crack the vault door (3 seconds beside it)

Grab at least 3 loot pieces (gold bars, cash, the blue diamond, the vault contents), then reach the red getaway car before the 4-minute clock runs out. The alarm climbs while a guard or a camera sees you — at 100 you are caught. Shadows cool the alarm down twice as fast.

---

<sub>Entered on [make.fun](https://make.fun/?ref=5q7zccjx&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
