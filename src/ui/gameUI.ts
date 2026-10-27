import { BUILDINGS, SEASON_INFO, WEATHER_INFO, xpProgress } from '../data/definitions';
import { audio } from '../systems/audio';
import type { GameState } from '../systems/gameState';
import { formatNumber, formatTime } from '../systems/util';
import type { DaySummary } from '../types';
import { iconKeyFor } from '../game/textures';
import type { PanelBuilder, UIContext } from './context';
import { button, confirmDialog, el, iconImg, progressBar } from './uiKit';
import { renderShop } from './panels/shop';
import { renderMarket } from './panels/market';
import { renderInventory } from './panels/inventory';
import { renderBuild } from './panels/build';
import { renderAnimals } from './panels/animals';
import { renderCraft } from './panels/craft';
import { renderQuests } from './panels/quests';
import { renderStats } from './panels/stats';
import { renderSettings } from './panels/settings';
import type Phaser from 'phaser';

export interface GameUIHandlers {
  save(): Promise<void> | void;
  sleep(): void;
  exitToMenu(): void;
  beginBuild(buildingId: string | null): void;
  actionButton(): void;
}

interface TutorialStep {
  text: string;
  hint: string;
  check: (ui: GameUI) => boolean;
}

export class GameUI {
  private scene: Phaser.Scene;
  readonly state: GameState;
  private handlers: GameUIHandlers;
  private root!: HTMLElement;
  private hud!: HTMLElement;
  private hotbar!: HTMLElement;
  private coinsEl!: HTMLElement;
  private dateEl!: HTMLElement;
  private clockEl!: HTMLElement;
  private weatherEl!: HTMLElement;
  private levelEl!: HTMLElement;
  private levelBar!: HTMLElement;
  private saveEl!: HTMLElement;
  private toastStack!: HTMLElement;
  private tutorialCard!: HTMLElement;
  private panelLayer!: HTMLElement;
  private panelContent!: HTMLElement;
  private panelTitle!: HTMLElement;
  private pauseLayer!: HTMLElement;
  private buildBanner!: HTMLElement;
  private buildName!: HTMLElement;
  private selectedToolEl!: HTMLElement;
  private joystickBase!: HTMLElement;
  private joystickStick!: HTMLElement;
  private panelRefresh: (() => void) | null = null;
  private currentPanel: string | null = null;
  private pauseOpen = false;
  private iconCache = new Map<string, string>();
  private joystick = { x: 0, y: 0 };
  private moveAccum = 0;
  private clockTimer: number | null = null;
  private tutorialMoved = false;
  private unsubs: Array<() => void> = [];
  private buildMode = false;

  private readonly panelBuilders: Record<string, PanelBuilder> = {
    shop: renderShop,
    market: renderMarket,
    inventory: renderInventory,
    build: renderBuild,
    animals: renderAnimals,
    craft: renderCraft,
    quests: renderQuests,
    stats: renderStats,
    settings: renderSettings
  };

  private readonly ctx: UIContext;

  private readonly tutorialSteps: TutorialStep[] = [
    { text: 'Walk around your farm', hint: 'Use WASD / arrow keys (or the joystick).', check: (ui) => ui.tutorialMoved },
    { text: 'Till some soil', hint: 'Select the Hoe and click a field tile.', check: (ui) => ui.state.data.stats.tills > 0 },
    { text: 'Plant a seed', hint: 'Pick a seed from the hotbar and click tilled soil.', check: (ui) => ui.state.data.stats.planted > 0 },
    { text: 'Water your crop', hint: 'Select the Watering Can and click the planted tile.', check: (ui) => ui.state.data.stats.waters > 0 },
    { text: 'Sleep to end the day', hint: 'Press the Sleep button, then check your crop.', check: (ui) => ui.state.data.stats.daysPlayed > 0 },
    { text: 'Harvest a mature crop', hint: 'Click a fully grown crop to harvest it.', check: (ui) => ui.state.data.stats.harvests > 0 },
    { text: 'Sell your harvest', hint: 'Open the Market and sell something.', check: (ui) => ui.state.data.stats.cropsSold > 0 }
  ];

  constructor(scene: Phaser.Scene, state: GameState, handlers: GameUIHandlers) {
    this.scene = scene;
    this.state = state;
    this.handlers = handlers;
    this.ctx = {
      state,
      icon: (id) => this.icon(id),
      toast: (msg, kind) => this.toast(msg, kind),
      refresh: () => this.refresh(),
      closePanel: () => this.closePanel(),
      requestSave: () => void this.requestSave(),
      sleep: () => {
        this.closePanel();
        this.closePause();
        this.handlers.sleep();
      },
      beginBuild: (id) => this.beginBuild(id),
      exitToMenu: () => this.confirmExit(),
      openPanel: (id) => this.openPanel(id),
      isBuildMode: () => this.buildMode,
      setPanelRefresh: (fn) => {
        this.panelRefresh = fn;
      }
    };
  }

  mount(): void {
    this.root = el('div', 'game-ui');
    this.root.id = 'game-ui';

    this.hud = el('div', 'hud');
    const top = el('div', 'hud-top');
    const left = el('div', 'hud-cluster farm-stats');
    this.coinsEl = el('div', 'hud-chip coins');
    this.dateEl = el('div', 'hud-chip date');
    this.clockEl = el('div', 'hud-chip clock');
    this.weatherEl = el('div', 'hud-chip weather');
    left.append(this.coinsEl, this.dateEl, this.clockEl, this.weatherEl);

    const middle = el('div', 'hud-cluster level-cluster');
    const levelTop = el('div', 'level-top');
    this.levelEl = el('span', 'level-label');
    levelTop.appendChild(this.levelEl);
    const xpWrap = el('div', 'level-bar');
    this.levelBar = el('div', 'level-fill');
    xpWrap.appendChild(this.levelBar);
    middle.append(levelTop, xpWrap);

    const right = el('div', 'hud-cluster hud-buttons');
    const mk = (label: string, panel: string, key?: string) => {
      const b = button(label, {
        small: true,
        variant: 'ghost',
        title: key ? `${label} (${key})` : label,
        onClick: () => {
          audio.play('click');
          this.openPanel(panel);
        }
      });
      b.classList.add('hud-btn');
      return b;
    };
    right.append(
      mk('Shop', 'shop', 'H'),
      mk('Market', 'market', 'M'),
      mk('Bag', 'inventory', 'I'),
      mk('Build', 'build', 'B'),
      mk('Animals', 'animals'),
      mk('Craft', 'craft'),
      mk('Quests', 'quests', 'Q'),
      mk('Stats', 'stats')
    );
    right.appendChild(
      button('Sleep', {
        small: true,
        variant: 'primary',
        title: 'Sleep until the next morning',
        onClick: () => {
          this.ctx.sleep();
        }
      })
    );
    const pauseBtn = button('Pause', {
      small: true,
      variant: 'secondary',
      title: 'Pause menu (Esc)',
      onClick: () => this.openPause()
    });
    right.appendChild(pauseBtn);
    top.append(left, middle, right);
    this.hud.appendChild(top);

    this.saveEl = el('div', 'save-status', 'Saved locally');
    this.hud.appendChild(this.saveEl);

    this.buildBanner = el('div', 'build-banner hidden');
    this.buildName = el('span');
    const cancelBuild = button('Cancel', {
      small: true,
      variant: 'danger',
      onClick: () => this.cancelBuildMode()
    });
    this.buildBanner.append(this.buildName, cancelBuild);
    this.hud.appendChild(this.buildBanner);

    const bottom = el('div', 'hud-bottom');
    this.selectedToolEl = el('div', 'selected-tool');
    this.hotbar = el('div', 'hotbar');
    bottom.append(this.selectedToolEl, this.hotbar);
    this.hud.appendChild(bottom);

    this.toastStack = el('div', 'toast-stack');
    this.hud.appendChild(this.toastStack);

    this.tutorialCard = el('div', 'tutorial-card hidden');
    this.hud.appendChild(this.tutorialCard);

    const touch = el('div', 'touch-controls');
    this.joystickBase = el('div', 'joystick');
    this.joystickStick = el('div', 'joystick-stick');
    this.joystickBase.appendChild(this.joystickStick);
    const actionBtn = el('button', 'action-btn');
    actionBtn.type = 'button';
    actionBtn.textContent = 'USE';
    actionBtn.setAttribute('aria-label', 'Use selected tool');
    actionBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      audio.resume();
      this.handlers.actionButton();
    });
    touch.append(this.joystickBase, actionBtn);
    this.hud.appendChild(touch);
    this.setupJoystick();

    this.panelLayer = el('div', 'panel-layer hidden');
    const panel = el('div', 'panel');
    const panelTop = el('div', 'panel-topbar');
    this.panelTitle = el('h2', 'panel-tab-title');
    const closeBtn = button('✕', {
      small: true,
      variant: 'ghost',
      title: 'Close (Esc)',
      onClick: () => this.closePanel()
    });
    closeBtn.setAttribute('aria-label', 'Close panel');
    panelTop.append(this.panelTitle, closeBtn);
    this.panelContent = el('div', 'panel-body');
    panel.append(panelTop, this.panelContent);
    this.panelLayer.appendChild(panel);
    this.panelLayer.addEventListener('click', (e) => {
      if (e.target === this.panelLayer) this.closePanel();
    });
    this.hud.appendChild(this.panelLayer);

    this.pauseLayer = el('div', 'panel-layer hidden');
    this.hud.appendChild(this.pauseLayer);

    this.root.appendChild(this.hud);
    const uiRoot = document.getElementById('ui-root');
    if (uiRoot) uiRoot.appendChild(this.root);

    this.bindEvents();
    this.refresh();
    this.updateTutorial();

    this.clockTimer = window.setInterval(() => this.refreshClock(), 500);
  }

  destroy(): void {
    if (this.clockTimer !== null) window.clearInterval(this.clockTimer);
    this.unsubs.forEach((fn) => fn());
    this.unsubs = [];
    this.root.remove();
    this.state.paused = false;
  }

  // ------------------------------------------------------------- public API

  icon(itemId: string): string {
    if (this.iconCache.has(itemId)) return this.iconCache.get(itemId)!;
    let url = '';
    try {
      const key = iconKeyFor(itemId);
      url = this.scene.textures.exists(key) ? this.scene.textures.getBase64(key) : '';
    } catch {
      url = '';
    }
    this.iconCache.set(itemId, url);
    return url;
  }

  toast(message: string, kind: 'info' | 'success' | 'error' | 'reward' = 'info'): void {
    if (!message) return;
    const node = el('div', `toast ${kind}`);
    node.textContent = message;
    this.toastStack.appendChild(node);
    window.setTimeout(() => {
      node.classList.add('leaving');
      window.setTimeout(() => node.remove(), 320);
    }, 3200);
  }

  setSaveStatus(text: string): void {
    if (this.saveEl) this.saveEl.textContent = text;
  }

  noteMovement(distance: number): void {
    if (this.state.data.tutorialDone) return;
    this.moveAccum += distance;
    if (this.moveAccum > 40 && !this.tutorialMoved) {
      this.tutorialMoved = true;
      this.updateTutorial();
    }
  }

  buildPlaced(): void {
    this.buildMode = false;
    this.buildBanner.classList.add('hidden');
  }

  cancelBuildMode(): void {
    this.handlers.beginBuild(null);
    this.buildPlaced();
    this.toast('Placement cancelled.', 'info');
  }

  notify(message: string, kind: 'info' | 'success' | 'error' | 'reward' = 'info'): void {
    this.toast(message, kind);
  }

  async requestSave(): Promise<void> {
    this.setSaveStatus('Saving…');
    try {
      await this.handlers.save();
      this.setSaveStatus(`Saved ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    } catch {
      this.setSaveStatus('Save failed');
      this.toast('Could not save. Browser storage may be unavailable.', 'error');
    }
  }

  showDaySummary(summary: DaySummary): void {
    this.closePanel();
    this.closePause();
    this.panelLayer.classList.remove('hidden');
    this.panelTitle.textContent = `${SEASON_INFO[summary.season].name} · Day ${summary.day}`;
    this.panelContent.innerHTML = '';
    const hero = el('div', 'day-summary');
    hero.appendChild(el('h3', undefined, `Year ${summary.year} · ${WEATHER_INFO[summary.weather].name}`));
    const stats = el('div', 'summary-grid');
    stats.appendChild(this.summaryStat('Crops grown', String(summary.grown)));
    stats.appendChild(this.summaryStat('Animals ready', String(summary.products)));
    if (summary.wilted > 0) stats.appendChild(this.summaryStat('Crops lost', String(summary.wilted), 'bad'));
    hero.appendChild(stats);
    for (const msg of summary.messages) {
      hero.appendChild(el('p', 'summary-message', msg));
    }
    hero.appendChild(
      el(
        'p',
        'hint',
        'Watered crops grew overnight. Remember to feed animals each day and water new plants.'
      )
    );
    hero.appendChild(
      button('Start the day', {
        variant: 'primary',
        onClick: () => {
          this.panelLayer.classList.add('hidden');
          this.setPaused(false);
          void this.requestSave();
        }
      })
    );
    this.panelContent.appendChild(hero);
    this.setPaused(true);
  }

  private summaryStat(label: string, value: string, kind = ''): HTMLElement {
    const box = el('div', `summary-stat ${kind}`.trim());
    box.appendChild(el('span', 'summary-value', value));
    box.appendChild(el('span', 'hint', label));
    return box;
  }

  // ---------------------------------------------------------------- panels

  openPanel(id: string): void {
    const builder = this.panelBuilders[id];
    if (!builder) return;
    if (this.buildMode) this.cancelBuildMode();
    if (this.pauseOpen) this.closePause();
    this.currentPanel = id;
    this.panelRefresh = null;
    this.panelContent.innerHTML = '';
    this.panelTitle.textContent =
      id === 'shop'
        ? 'Store'
        : id === 'market'
          ? 'Market'
          : id === 'inventory'
            ? 'Backpack'
            : id === 'build'
              ? 'Build'
              : id === 'animals'
                ? 'Animals'
                : id === 'craft'
                  ? 'Workshop'
                  : id === 'quests'
                    ? 'Quests'
                    : id === 'stats'
                      ? 'Statistics'
                      : 'Settings';
    builder(this.ctx, this.panelContent);
    this.panelLayer.classList.remove('hidden');
    this.setPaused(true);
    audio.play('click');
  }

  closePanel(): void {
    this.panelLayer.classList.add('hidden');
    this.panelContent.innerHTML = '';
    this.panelRefresh = null;
    this.currentPanel = null;
    if (!this.pauseOpen) this.setPaused(false);
  }

  private setPaused(paused: boolean): void {
    this.state.paused = paused || this.pauseOpen || this.currentPanel !== null;
  }

  private refresh(): void {
    if (!this.root) return;
    this.refreshHud();
    if (this.panelRefresh && !this.panelLayer.classList.contains('hidden')) {
      this.panelRefresh();
    }
  }

  private refreshHud(): void {
    const d = this.state.data;
    this.coinsEl.innerHTML = `<span class="chip-label">Coins</span><strong>${formatNumber(d.coins)}</strong>`;
    this.dateEl.innerHTML = `<span class="chip-label">Date</span><strong>${SEASON_INFO[d.season].name} ${d.day}, Y${d.year}</strong>`;
    this.clockEl.innerHTML = `<span class="chip-label">Time</span><strong>${formatTime(d.minute)}</strong>`;
    this.weatherEl.innerHTML = `<span class="chip-label">Weather</span><strong>${WEATHER_INFO[d.weather].name}</strong>`;
    const xp = xpProgress(this.state.totalXp());
    this.levelEl.textContent = `Farmer Lv ${xp.level}`;
    this.levelBar.style.width = `${Math.max(2, Math.min(100, (xp.into / Math.max(1, xp.need)) * 100))}%`;
    this.renderHotbar();
    this.updateTutorial();
  }

  private refreshClock(): void {
    const d = this.state.data;
    if (this.clockEl) {
      this.clockEl.innerHTML = `<span class="chip-label">Time</span><strong>${formatTime(d.minute)}</strong>`;
    }
    if (this.dateEl) {
      this.dateEl.innerHTML = `<span class="chip-label">Date</span><strong>${SEASON_INFO[d.season].name} ${d.day}, Y${d.year}</strong>`;
    }
    if (this.weatherEl) {
      this.weatherEl.innerHTML = `<span class="chip-label">Weather</span><strong>${WEATHER_INFO[d.weather].name}</strong>`;
    }
  }

  private renderHotbar(): void {
    if (!this.hotbar) return;
    const items = this.state.hotbarItems();
    const selected = this.state.selectedItem();
    this.hotbar.innerHTML = '';
    items.forEach((itemId, index) => {
      const slot = el('button', `hotbar-slot${itemId === selected ? ' active' : ''}`);
      slot.type = 'button';
      slot.setAttribute('aria-label', itemId);
      const keyLabel = el('span', 'slot-key', index === 9 ? '0' : String(index + 1));
      slot.appendChild(keyLabel);
      if (itemId === 'hoe' || itemId === 'watering_can' || itemId === 'fertilizer') {
        slot.appendChild(iconImg(this.icon(itemId), 34, itemId));
      } else {
        slot.appendChild(iconImg(this.icon(itemId), 34, itemId));
        const qty = el('span', 'slot-qty', String(this.state.countItem(itemId)));
        slot.appendChild(qty);
      }
      slot.addEventListener('click', () => {
        this.state.selectItem(itemId);
        audio.play('click');
      });
      this.hotbar.appendChild(slot);
    });
    while (this.hotbar.children.length < 10) {
      const empty = el('div', 'hotbar-slot empty');
      this.hotbar.appendChild(empty);
    }
    this.updateSelectedTool();
  }

  private updateSelectedTool(): void {
    const item = this.state.selectedItem();
    const labels: Record<string, string> = {
      hoe: 'Hoe · Till soil',
      watering_can: 'Watering Can · Water crops',
      fertilizer: 'Fertilizer · Improve soil'
    };
    const nice = labels[item] ?? 'Seeds · Plant on tilled soil';
    this.selectedToolEl.innerHTML = `<span class="chip-label">Tool</span><strong>${nice}</strong>`;
  }

  private beginBuild(buildingId: string | null): void {
    if (!buildingId) {
      this.handlers.beginBuild(null);
      this.buildPlaced();
      return;
    }
    const def = BUILDINGS[buildingId];
    if (!def) return;
    this.buildMode = true;
    this.handlers.beginBuild(buildingId);
    this.buildName.textContent = `Placing ${def.name} (${def.cost}g) — click the ground. Right-click or Cancel to stop.`;
    this.buildBanner.classList.remove('hidden');
    this.toast('Placement mode: click a valid spot on the ground.', 'info');
  }

  // ---------------------------------------------------------------- tutorial

  private updateTutorial(): void {
    const d = this.state.data;
    this.tutorialCard.classList.toggle('hidden', d.tutorialDone);
    if (d.tutorialDone) return;
    const step = this.tutorialSteps[d.tutorialStep];
    if (!step) {
      this.state.finishTutorial();
      this.toast('Tutorial complete! +75 coins bonus.', 'reward');
      this.tutorialCard.classList.add('hidden');
      return;
    }
    if (step.check(this)) {
      const next = d.tutorialStep + 1;
      this.state.setTutorialStep(next);
      audio.play('click');
      this.updateTutorial();
      if (next >= this.tutorialSteps.length) {
        this.state.finishTutorial();
        this.toast('Tutorial complete! +75 coins bonus.', 'reward');
        this.tutorialCard.classList.add('hidden');
      }
      return;
    }
    this.tutorialCard.innerHTML = '';
    const head = el('div', 'tutorial-head');
    head.appendChild(el('span', 'tutorial-step', `Task ${d.tutorialStep + 1}/${this.tutorialSteps.length}`));
    const skip = button('Skip', {
      small: true,
      variant: 'ghost',
      onClick: () => {
        this.state.finishTutorial();
        this.updateTutorial();
      }
    });
    head.appendChild(skip);
    this.tutorialCard.appendChild(head);
    this.tutorialCard.appendChild(el('p', 'tutorial-text', step.text));
    this.tutorialCard.appendChild(el('p', 'hint', step.hint));
    this.tutorialCard.appendChild(progressBar(d.tutorialStep, this.tutorialSteps.length));
    this.tutorialCard.classList.remove('hidden');
  }

  // ------------------------------------------------------------------ pause

  openPause(): void {
    if (this.pauseOpen) return;
    if (this.currentPanel) this.closePanel();
    this.pauseOpen = true;
    this.panelLayer.classList.add('hidden');
    this.pauseLayer.classList.remove('hidden');
    this.pauseLayer.innerHTML = '';
    const box = el('div', 'panel pause-panel');
    const head = el('div', 'panel-head');
    head.appendChild(el('h2', 'panel-title', 'Paused'));
    head.appendChild(el('p', 'panel-subtitle', 'The farm is waiting for you.'));
    box.appendChild(head);
    const body = el('div', 'panel-body');
    const actions = el('div', 'pause-actions');
    actions.appendChild(
      button('Resume', {
        variant: 'primary',
        onClick: () => this.closePause()
      })
    );
    actions.appendChild(
      button('Save game', {
        onClick: () => {
          void this.requestSave();
        }
      })
    );
    actions.appendChild(
      button('Settings', {
        onClick: () => {
          this.closePause();
          this.openPanel('settings');
        }
      })
    );
    actions.appendChild(
      button('Main menu', {
        variant: 'danger',
        onClick: () => this.confirmExit()
      })
    );
    body.appendChild(actions);

    const xp = xpProgress(this.state.totalXp());
    const stats = el('div', 'pause-stats');
    stats.appendChild(el('span', undefined, `Farmer level ${xp.level}`));
    stats.appendChild(el('span', undefined, `${formatNumber(this.state.data.coins)} coins`));
    stats.appendChild(
      el('span', undefined, `${SEASON_INFO[this.state.data.season].name} ${this.state.data.day}, Year ${this.state.data.year}`)
    );
    body.appendChild(stats);

    const controls = el('div', 'controls-help');
    controls.innerHTML = `
      <h3>Controls</h3>
      <p><b>Move</b> WASD / arrow keys · <b>Use</b> click the world</p>
      <p><b>Hotbar</b> 1–0 · <b>Shop</b> H · <b>Market</b> M · <b>Bag</b> I · <b>Build</b> B · <b>Quests</b> Q</p>
      <p><b>Pause</b> Esc · <b>Sleep</b> button in the HUD</p>
      <p class="hint">Mobile: joystick and USE button appear on touch screens.</p>
    `;
    body.appendChild(controls);
    body.appendChild(
      el(
        'p',
        'hint',
        'Saves are stored locally in this browser. They do not transfer between devices.'
      )
    );
    box.appendChild(body);
    this.pauseLayer.appendChild(box);
    this.state.paused = true;
    audio.play('click');
  }

  closePause(): void {
    if (!this.pauseOpen) return;
    this.pauseOpen = false;
    this.pauseLayer.classList.add('hidden');
    this.pauseLayer.innerHTML = '';
    this.state.paused = this.currentPanel !== null;
  }

  private confirmExit(): void {
    confirmDialog(
      this.root,
      'Return to main menu?',
      'Your progress will be saved first. Local saves stay on this device.',
      'Save & exit',
      () => {
        void (async () => {
          await this.requestSave();
          this.handlers.exitToMenu();
        })();
      }
    );
  }

  // ------------------------------------------------------------------ input

  private bindEvents(): void {
    this.unsubs.push(
      this.state.emitter.on('change', () => this.refresh()),
      this.state.emitter.on('levelup', (payload) => {
        const p = payload as { type: string; level: number; skill?: string };
        if (p.type === 'farmer') {
          this.toast(`Farmer level ${p.level}! New possibilities unlocked.`, 'reward');
          audio.play('level');
        } else {
          this.toast(`${p.skill ?? 'Skill'} level ${p.level}!`, 'reward');
          audio.play('level');
        }
      }),
      this.state.emitter.on('achievement', (payload) => {
        const p = payload as { quest: { title: string; coins: number } };
        this.toast(`Achievement: ${p.quest.title} (+${p.quest.coins} coins)`, 'reward');
        audio.play('level');
      }),
      this.state.emitter.on('selection', () => this.renderHotbar()),
      this.state.emitter.on('tutorial', () => this.updateTutorial()),
      this.state.emitter.on('tutorialDone', () => {
        this.tutorialCard.classList.add('hidden');
        this.refresh();
      })
    );

    window.addEventListener('keydown', this.onKeyDown);
    this.unsubs.push(() => window.removeEventListener('keydown', this.onKeyDown));
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) {
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      if (!this.panelLayer.classList.contains('hidden')) {
        this.closePanel();
      } else if (this.pauseOpen) {
        this.closePause();
      } else {
        this.openPause();
      }
      return;
    }
    if (e.key >= '0' && e.key <= '9') {
      const index = e.key === '0' ? 9 : Number(e.key) - 1;
      const items = this.state.hotbarItems();
      if (items[index]) {
        this.state.selectItem(items[index]);
        audio.play('click');
      }
      return;
    }
    const keys: Record<string, string> = {
      h: 'shop',
      m: 'market',
      i: 'inventory',
      b: 'build',
      q: 'quests',
      c: 'craft'
    };
    const panel = keys[e.key.toLowerCase()];
    if (panel && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      this.openPanel(panel);
    }
  };

  private setupJoystick(): void {
    let active = false;
    let pointerId = -1;
    const rectCenter = () => {
      const r = this.joystickBase.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    };
    const move = (clientX: number, clientY: number) => {
      const { cx, cy } = rectCenter();
      let dx = clientX - cx;
      let dy = clientY - cy;
      const max = 38;
      const len = Math.hypot(dx, dy);
      if (len > max) {
        dx = (dx / len) * max;
        dy = (dy / len) * max;
      }
      this.joystick = { x: dx / max, y: dy / max };
      this.joystickStick.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    const reset = () => {
      active = false;
      pointerId = -1;
      this.joystick = { x: 0, y: 0 };
      this.joystickStick.style.transform = 'translate(0, 0)';
    };
    this.joystickBase.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      active = true;
      pointerId = e.pointerId;
      this.joystickBase.setPointerCapture(e.pointerId);
      move(e.clientX, e.clientY);
    });
    this.joystickBase.addEventListener('pointermove', (e) => {
      if (!active || e.pointerId !== pointerId) return;
      move(e.clientX, e.clientY);
    });
    this.joystickBase.addEventListener('pointerup', reset);
    this.joystickBase.addEventListener('pointercancel', reset);
  }

  getJoystick(): { x: number; y: number } {
    return this.joystick;
  }

  isPanelOpen(): boolean {
    return this.currentPanel !== null || this.pauseOpen || !this.panelLayer.classList.contains('hidden');
  }

  isBuildMode(): boolean {
    return this.buildMode;
  }
}
