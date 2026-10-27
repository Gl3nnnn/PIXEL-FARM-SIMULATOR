# Pixel Farm Simulator - From Small Farm to Farming Empire

A complete, playable 2D pixel-art farming simulation game built with TypeScript, Phaser 3, and Vite.

## Features

- **Farming**: Plant, water, and harvest crops across different seasons
- **Crops**: 10 different crop types with unique growth cycles
- **Economy**: Buy seeds, sell crops, manage coins
- **Tools**: Hoe, watering can for farm management
- **Time System**: Day/night cycle with seasonal progression
- **Inventory**: Hotbar system for quick access to items
- **Save System**: Local progress saving (in development)
- **Mobile Support**: Responsive design for desktop and mobile

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
`ash
git clone https://github.com/YOUR_USERNAME/pixel-farm-simulator.git
cd pixel-farm-simulator
`

2. Install dependencies:
`ash
npm install
`

3. Start development server:
`ash
npm run dev
`

4. Open your browser to http://localhost:3000

### Building for Production

`ash
npm run build
`

The built files will be in the dist directory.

### Testing

`ash
npm run test
`

## How to Play

- **Movement**: Use WASD or Arrow Keys
- **Interact**: Click on tiles to use selected tool
- **Tools**: Use number keys or click hotbar slots to switch tools
- **Advance Day**: Press SPACE to advance to next day
- **Planting**: Select seeds from hotbar, click on tilled soil
- **Watering**: Use watering can on crops/tilled soil
- **Tilling**: Use hoe on grass to till soil
- **Harvesting**: Click on mature crops (fully grown) to harvest

## Deployment to GitHub Pages

1. Update the ase path in ite.config.ts if your repo name is different
2. Push to GitHub
3. Enable GitHub Pages in repository settings (Source: GitHub Actions)
4. The workflow will automatically build and deploy

## Tech Stack

- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Phaser 3](https://phaser.io/) - HTML5 game framework
- [Vite](https://vitejs.dev/) - Build tool and dev server
- [Vitest](https://vitest.dev/) - Unit testing

## License

MIT License - see LICENSE file for details
