# Pixel Farm Simulator

A complete 2D pixel-art farming game built with TypeScript, Phaser 3, and Vite. Grow crops, raise animals, place buildings, craft goods, complete quests, and build a farming empire across the seasons.

## Play

Once GitHub Pages is enabled, the game is available at:

`https://gl3nnnn.github.io/PIXEL-FARM-SIMULATOR/`

## Features

- 10 crops with season restrictions, growth stages, watering, fertilizing, and regrowth
- 5 animals with feeding, petting, happiness, health, and daily products
- 11 placeable buildings, farm expansions, and backpack upgrades
- Crafting recipes, a general store, and a market with daily price changes
- 28-day seasons, weather (sun, rain, storm), day/night lighting, and lightning
- Main quests, daily quests, achievements, farming levels, and unlock progression
- Three local save slots backed by IndexedDB, with autosave and v1 save migration
- Desktop keyboard/mouse controls plus touch joystick and USE button
- Procedural pixel art and synthesized audio with zero external asset downloads

## Controls

| Action | Input |
| --- | --- |
| Move | WASD / arrow keys / touch joystick |
| Use selected tool or seed | Click a tile / USE button |
| Select hotbar slot | Number keys `1`-`0` or click a slot |
| Shop / Market / Bag | `H` / `M` / `I` |
| Build / Quests | `B` / `Q` |
| Pause | `Esc` |
| Sleep and advance the day | Sleep button in the HUD |

Select the hoe and click grass or field soil to till, pick a seed to plant, then water it before sleeping. Mature crops can be harvested by clicking them. Rain waters every tilled tile overnight.

## Development

Requires Node.js 20 or newer.

```bash
npm ci
npm run dev
```

The dev server runs at `http://localhost:3000`.

```bash
npm run typecheck
npm run test:run
npm run build
npm run preview
```

The production build is written to `dist/`.

## Deployment

The workflow in `.github/workflows/deploy.yml` runs type checking, tests, and the production build on every push to `main`, then deploys `dist/` to GitHub Pages.

If the workflow fails at the **Setup Pages** step with `Get Pages site failed`, open the repository's **Settings > Pages** and set **Source** to **GitHub Actions** once. The workflow includes `enablement: true`, but the default `GITHUB_TOKEN` may not have permission to create the Pages site for the first time.

The Vite base path is `/PIXEL-FARM-SIMULATOR/`. Set the `BASE_PATH` environment variable if you deploy under a different path.

## Project Structure

```text
src/
  data/definitions.ts   Items, crops, animals, buildings, recipes, quests
  game/scenes/          Boot, menu, and gameplay scenes
  game/textures.ts      Procedural pixel-art texture generation
  systems/              Game rules, world generation, saves, quests, audio
  ui/                   HUD, panels, menu, and shared UI helpers
  styles/main.css       Responsive game and menu styling
tests/                  Vitest unit tests for the simulation systems
```

## Tech Stack

- TypeScript
- Phaser 3
- Vite
- Vitest
- IndexedDB

## License

MIT
