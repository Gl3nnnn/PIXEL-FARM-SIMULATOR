import Phaser from 'phaser';
import './styles/main.css';
import { BootScene } from './game/scenes/BootScene';
import { MenuScene } from './game/scenes/MenuScene';
import { GameScene } from './game/scenes/GameScene';
import { audio } from './systems/audio';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: 'game-container',
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  backgroundColor: '#4f8c3a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [BootScene, MenuScene, GameScene]
};

function hideBootScreen(): void {
  const boot = document.getElementById('boot-screen');
  if (!boot) return;
  boot.classList.add('boot-done');
  window.setTimeout(() => boot.remove(), 450);
}

function showFatal(message: string): void {
  const boot = document.getElementById('boot-screen');
  if (!boot) return;
  const hint = boot.querySelector('.boot-hint');
  if (hint) {
    hint.textContent = message;
    hint.classList.add('boot-error');
  }
  const bar = boot.querySelector('.boot-bar');
  if (bar) bar.remove();
}

try {
  const game = new Phaser.Game(config);
  game.events.once(Phaser.Core.Events.READY, hideBootScreen);
  window.setTimeout(hideBootScreen, 8000);
  if (import.meta.env.DEV) {
    (window as unknown as { __farmGame?: Phaser.Game }).__farmGame = game;
  }
} catch (error) {
  showFatal('The game could not start. Try a modern browser with WebGL enabled.');
  console.error(error);
}

window.addEventListener('error', (event) => {
  if (document.getElementById('boot-screen')) {
    showFatal(`Startup error: ${event.message}`);
  }
});

window.addEventListener(
  'pointerdown',
  () => {
    audio.init();
    void audio.resume();
  },
  { once: true }
);
