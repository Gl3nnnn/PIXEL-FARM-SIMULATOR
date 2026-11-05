# Pixel Farm Simulator

A complete 2D pixel-art farming game built with TypeScript, Phaser 3, and Vite. Grow crops, raise animals, place buildings, craft goods, complete quests, and build a farming empire across the seasons.

## Play

Once GitHub Pages is enabled, the game is available at:

`https://gl3nnnn.github.io/PIXEL-FARM-SIMULATOR/`

## Features

- 94 crops with season restrictions, growth stages, watering, fertilizing, and regrowth
- 75 animals with feeding, petting, happiness, health, and daily products
- 9 kinds of animal housing, 50 farm tools with real bonuses, and 60+ placeable buildings plus the upgradable farmhouse, farm expansions, and backpack upgrades
- Crafting recipes, a general store, and a market with deterministic daily price trends
- 28-day seasons, weather (sun, rain, storm, snow, wind, fog), day/night lighting, and lightning
- Main quests, daily quests, achievements, six skills, and unlock progression
- **Energy**: farm work spends energy, sleep refills it, and cooked dishes restore or buff it
- **Professions**: pick one of two paths per skill at level 5 and again at level 10
- **Foraging**: seasonal wild plants appear on open ground each morning and can be picked up
- **Prologue**: a new farm opens with "The Valley That Waited", a four-chapter story with a unique animated scene for each chapter, before you design your farmer
- **Design your farmer**: step through You, Face, Hair, Headwear, Outfit and Extras to set a name, pronouns and body build, then pick from ten skin tones, eye colour and shape, face details, separate facial hair, sixteen hair styles, outfit styles, shirt patterns, pants, boots, hats such as a headscarf or turban, and accessories from glasses styles to a hearing aid or eyepatch, with quick presets, a live front/back/side preview, a walking animation and a Surprise me button; your name and pronouns then show on the HUD
- **TV forecast**: each morning rolls the luck of the day, which really moves harvest quality and festival prizes
- **Welcome back**: come back after three days away and your neighbours leave a gift in the mailbox
- **Guided first week**: seven letters arrive one per day at the start, each teaching one thing - seeds, watering, sleeping, a coop, the mine, the map and the menus
- **Lost and found**: the Shipping panel buys back valuable goods that left the farm by mistake, for a small fee, for 28 days
- **Farm evaluation**: the old farmer visits at the start of year two and lights up to four candles for what you have built
- **Crows**: birds eat unprotected crops overnight unless a Scarecrow stands nearby
- **Community bundles**: eight donation bundles with coins, XP and rare item rewards, plus a mailbox that delivers letters with gifts as you level up
- Seasonal festival board with three themed contracts, plus Day 28 judging contests and ribbons
- Farm Almanac with crop economics, livestock returns, fish records, and a collection album
- Helper's Cottage automation: auto-feed, auto-collect, auto-harvest, and auto-replant
- Eight seasonal fish, bait, a fishing minigame with a relaxed pace option, and three fish recipes
- A 64 × 48 tile farm laid out like a farmstead: a road grid, three fenced rows of fields (12 to unlock, every one with an upright rail fence and one gate facing its lane), two ponds to fish, and two quarries with 22 rock nodes
- Five visitors with weekly schedules, requests, gifts, birthdays, hearts, romance, and marriage
- **Old Mine**: 120 floors of procedural rock, ore, monsters, four weapons, a blacksmith, an elevator every five floors, and a treasure room waiting at the bottom
- **Town hub**: clinic, saloon, museum, mine entrance, shipping, and homestead all reachable from one panel
- **Shipping Bin**: leave goods overnight and the trader sells them at market price
- **Museum**: six artifacts to donate, with three curator reward milestones
- **Homestead**: adoption and growing children, a dog or cat with affection and luck bonuses, a rideable horse, and ten furniture pieces with permanent perks
- NPC daily schedule labels and heart events with one-time coin rewards
- Seasonal festival minigame with a luck-based prize crate
- Three local save slots backed by IndexedDB, with autosave, v1-v11 migration, and JSON backup/restore
- Desktop keyboard/mouse controls plus touch joystick and USE button
- Procedural pixel art and synthesized audio with zero external asset downloads

## Controls

| Action | Input |
| --- | --- |
| Move | WASD / arrow keys / touch joystick |
| Use selected tool or seed | Click a tile / USE button |
| Select hotbar slot | Number keys `1`-`0` or click a slot |
| Shop / Market / Bag | `H` / `M` / `I` |
| Build / Quests / Almanac / People | `B` / `Q` / `L` / `T` |
| Community (energy, professions, bundles, mail) | `U` |
| Town / Old Mine / Shipping / Homestead | `Y` / `N` / `V` / `O` |
| Museum | `X` or from the Town panel |
| Fish / mine | Select the fishing rod or pickaxe, then click water or a quarry rock |
| Map / home | Press **P** for the minimap, then click a spot to walk there · press **H** to return to the farmhouse |
| Field harvest | Stand by a field gate and press **R** to harvest every ripe crop on that field |
| Enter the shipping bin or farmhouse | Click the building on the farm |
| Pause | `Esc` |
| Sleep and advance the day | Sleep button in the HUD |

Select the hoe and click grass or field soil to till, pick a seed to plant, then water it before sleeping. Mature crops can be harvested by clicking them. Rain waters every tilled tile overnight. On touch screens, tap a valid build spot once to preview it and again to confirm.

Open the **Quest Journal** for seasonal contracts. Each season has three themed contracts, progress is tracked from the start of that season, and claiming all three unlocks a festival bonus. The board resets when the season changes. On **Day 28**, a separate judging festival opens: bring eligible crops or crafted goods for a bronze, silver, or gold ribbon. Open the **Farm Almanac** with `L` for crop economics, fish records, collection milestones, and earned ribbons.

Buy the **Fishing Rod** and **Pickaxe** at the store, then use the hotbar to fish at the pond edge or mine quarry rocks. Bait widens the fishing minigame's catch zone. The **Helper's Cottage** unlocks overnight automation helpers after farmer level 6. Visitors appear on weekly schedules; talk, give gifts, and build hearts with `T` or by clicking a visitor.

Every job spends **energy**, shown in the top bar. When it runs low, sleep to refill it, or eat a cooked dish. Skills reach level 5 and 10 to unlock **professions**, chosen in the **Community** panel with `U`. The same panel holds the **community bundles** (donate goods for coins, XP and rare rewards) and your **mailbox**. Wild plants appear on open ground each morning; click one to pick it up. After your first few days, **crows** start eating young crops overnight - a **Scarecrow** keeps them away from the fields around it.

## Save Backups

Saves stay in this browser unless you export them. Open **Load Game** and choose **Export** on an occupied slot to download a JSON backup. Use **Import save** to restore a backup into any slot; occupied slots require confirmation before being replaced. Backups are compatible with older v1-v10 saves and are validated before import.

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
