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
import { renderAlmanac } from './panels/almanac';
import { renderStats } from './panels/stats';
import { renderSettings } from './panels/settings';
import { renderFestival } from './panels/festival';
import { renderPeople } from './panels/people';
import { ITEMS, QUALITY_LABEL } from '../data/definitions';
import { npcLine } from '../systems/npcs';
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

const PANEL_META: Record<string, { title: string; subtitle: string }> = {
  shop: { title: 'Store', subtitle: 'Seeds, supplies, tools, and permanent upgrades.' },
  market: { title: 'Market', subtitle: 'Watch the daily trends and sell your goods at the best price.' },
  inventory: { title: 'Backpack', subtitle: 'Organise your tools, seeds, produce, and treasures.' },
  build: { title: 'Build & Expand', subtitle: 'Place buildings, unlock fields, and hire farm helpers.' },
  animals: { title: 'Animals', subtitle: 'Feed, pet, breed, and collect from your livestock.' },
  craft: { title: 'Workshop', subtitle: 'Turn raw goods into valuable products.' },
  quests: { title: 'Quest Journal', subtitle: 'Complete objectives and seasonal contracts for rewards.' },
  almanac: { title: 'Farm Almanac', subtitle: 'Plan crops, livestock, fishing, and your collection.' },
  stats: { title: 'Statistics', subtitle: 'A snapshot of your farming journey and lifetime totals.' },
  festival: { title: 'Festival Day', subtitle: 'Show the judges your finest goods. One entry per year.' },
  people: { title: 'People', subtitle: 'Talk, give gifts, and build friendships with farm visitors.' },
  settings: { title: 'Settings', subtitle: 'Adjust sound and manage your local save.' }
};

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
  private panelSubtitle!: HTMLElement;
  private navMore!: HTMLElement;
  private navMoreButton!: HTMLButtonElement;
  private navMoreMenu!: HTMLElement;
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
  private fishingOverlay: HTMLElement | null = null;
  private fishingTimer: number | null = null;
  private fishingRaf: number | null = null;

  private readonly panelBuilders: Record<string, PanelBuilder> = {
    shop: renderShop,
    market: renderMarket,
    inventory: renderInventory,
    build: renderBuild,
    animals: renderAnimals,
    craft: renderCraft,
    quests: renderQuests,
    almanac: renderAlmanac,
    stats: renderStats,
    festival: renderFestival,
    people: renderPeople,
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
      sleep: () => this.requestSleep(),
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
      const b = button('', {
        small: true,
        variant: 'ghost',
        title: key ? `${label} (${key})` : label,
        onClick: () => {
          audio.play('click');
          this.openPanel(panel);
        }
      });
      b.classList.add('hud-btn');
      b.setAttribute('aria-label', label);
      b.append(el('span', 'hud-btn-label', label));
      if (key) b.appendChild(el('span', 'keycap', key));
      return b;
    };
    right.append(
      mk('Store', 'shop', 'H'),
      mk('Market', 'market', 'M'),
      mk('Bag', 'inventory', 'I'),
      mk('Build', 'build', 'B'),
      mk('Quests', 'quests', 'Q')
    );

    this.navMore = el('div', 'nav-more');
    this.navMoreButton = button('', {
      small: true,
      variant: 'ghost',
      title: 'More panels',
      onClick: () => {
        audio.play('click');
        this.toggleMoreMenu();
      }
    });
    this.navMoreButton.classList.add('hud-btn', 'nav-more-button');
    this.navMoreButton.setAttribute('aria-label', 'More panels');
    this.navMoreButton.setAttribute('aria-expanded', 'false');
    this.navMoreButton.setAttribute('aria-haspopup', 'menu');
    this.navMoreButton.append(el('span', 'hud-btn-label', 'More'));
    this.navMoreMenu = el('div', 'nav-more-menu hidden');
    this.navMoreMenu.setAttribute('role', 'menu');
    const moreItem = (label: string, panel: string, key?: string) => {
      const item = el('button', 'nav-more-item');
      item.type = 'button';
      item.setAttribute('role', 'menuitem');
      item.append(el('span', undefined, label));
      if (key) item.appendChild(el('span', 'keycap', key));
      item.addEventListener('click', () => {
        audio.play('click');
        this.closeMoreMenu();
        this.openPanel(panel);
      });
      this.navMoreMenu.appendChild(item);
    };
    moreItem('Animals', 'animals');
    moreItem('Workshop', 'craft', 'C');
    moreItem('Almanac', 'almanac', 'L');
    moreItem('People', 'people', 'T');
    moreItem('Statistics', 'stats');
    this.navMoreMenu.appendChild(el('div', 'nav-more-sep'));
    const pauseItem = el('button', 'nav-more-item');
    pauseItem.type = 'button';
    pauseItem.setAttribute('role', 'menuitem');
    pauseItem.append(el('span', undefined, 'Pause menu'), el('span', 'keycap', 'Esc'));
    pauseItem.addEventListener('click', () => {
      audio.play('click');
      this.closeMoreMenu();
      this.openPause();
    });
    this.navMoreMenu.appendChild(pauseItem);
    this.navMore.append(this.navMoreButton, this.navMoreMenu);
    right.appendChild(this.navMore);
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
    const heading = el('div', 'panel-topbar-text');
    this.panelTitle = el('h2', 'panel-tab-title');
    this.panelSubtitle = el('p', 'panel-subtitle');
    heading.append(this.panelTitle, this.panelSubtitle);
    const closeBtn = button('✕', {
      small: true,
      variant: 'ghost',
      title: 'Close (Esc)',
      onClick: () => this.closePanel()
    });
    closeBtn.classList.add('panel-close');
    closeBtn.setAttribute('aria-label', 'Close panel');
    panelTop.append(heading, closeBtn);
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
    this.closeFishingGame();
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
    this.closeMoreMenu();
    this.panelLayer.classList.remove('hidden');
    this.panelTitle.textContent = `${SEASON_INFO[summary.season].name} · Day ${summary.day}`;
    this.panelSubtitle.textContent = 'How the night changed your farm.';
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
    const actions = el('div', 'row-actions');
    actions.appendChild(
      button('Start the day', {
        variant: 'primary',
        onClick: () => {
          this.panelLayer.classList.add('hidden');
          this.setPaused(false);
          void this.requestSave();
        }
      })
    );
    if (this.state.festivalAvailable()) {
      actions.appendChild(
        button('Visit festival', {
          variant: 'gold',
          onClick: () => {
            this.closePanel();
            this.openPanel('festival');
          }
        })
      );
    }
    hero.appendChild(actions);
    this.panelContent.appendChild(hero);
    this.setPaused(true);
  }

  private requestSleep(): void {
    const chores = this.state.overnightChores();
    const proceed = (): void => {
      this.closePanel();
      this.closePause();
      this.handlers.sleep();
    };
    if (chores.unwateredCrops === 0 && chores.unfedAnimals === 0) {
      proceed();
      return;
    }
    const parts: string[] = [];
    const effects: string[] = [];
    if (chores.unwateredCrops > 0) {
      parts.push(
        `${chores.unwateredCrops} crop${chores.unwateredCrops === 1 ? ' still needs' : 's still need'} water`
      );
      effects.push('unwatered crops may lose growth');
    }
    if (chores.unfedAnimals > 0) {
      parts.push(
        `${chores.unfedAnimals} animal${chores.unfedAnimals === 1 ? ' is' : 's are'} unfed`
      );
      effects.push('unfed animals lose happiness');
    }
    const warning = effects.join(' and ');
    confirmDialog(
      this.root,
      'End the day?',
      `${parts.join(' and ')}. ${warning.charAt(0).toUpperCase()}${warning.slice(1)}. Sleep anyway?`,
      'Sleep anyway',
      proceed
    );
  }

  private summaryStat(label: string, value: string, kind = ''): HTMLElement {
    const box = el('div', `summary-stat ${kind}`.trim());
    box.appendChild(el('span', 'summary-value', value));
    box.appendChild(el('span', 'hint', label));
    return box;
  }


  openNpcDialogue(id: string): void {
    const entry = this.state.npcList().find((item) => item.npc.id === id);
    if (!entry) return;
    this.panelSubtitle.textContent = 'Talk, give gifts, and build a friendship.';
    if (this.buildMode) this.cancelBuildMode();
    if (this.pauseOpen) this.closePause();
    this.currentPanel = 'npc';
    this.panelRefresh = null;
    this.closeMoreMenu();
    this.panelContent.innerHTML = '';
    this.panelTitle.textContent = `${entry.npc.name} · ${entry.npc.role}`;
    const render = (): void => {
      const current = this.state.npcList().find((item) => item.npc.id === id);
      if (!current) return;
      this.panelContent.innerHTML = '';
      const head = el('div', 'npc-dialogue-head');
      const info = el('div', 'list-info grow');
      info.appendChild(el('h3', undefined, current.npc.name));
      info.appendChild(el('span', 'hint', current.npc.desc));
      const tags = el('div', 'tag-row');
      tags.appendChild(el('span', `pill ${current.status === 'Married' ? 'good' : ''}`, current.status));
      tags.appendChild(el('span', 'pill', `Birthday ${current.birthday}`));
      tags.appendChild(
        el('span', `pill ${current.available ? 'good' : 'warn'}`, current.available ? 'Visiting now' : current.reason)
      );
      info.appendChild(tags);
      head.appendChild(info);
      this.panelContent.appendChild(head);
      this.panelContent.appendChild(
        progressBar(current.hearts, 10, `${current.hearts} / 10 hearts`, 'xp')
      );
      const line = el('p', 'npc-line');
      line.textContent = current.record.met
        ? npcLine(current.npc, this.state.data)
        : `You have not met ${current.npc.name} yet. Say hello when they visit the farm.`;
      this.panelContent.appendChild(line);

      const actions = el('div', 'row-actions');
      actions.appendChild(
        button('Talk', {
          small: true,
          variant: 'primary',
          disabled: !current.available,
          onClick: () => {
            const result = this.state.npcTalk(id);
            this.toast(result.message ?? '', result.ok ? 'success' : 'error');
            audio.play(result.ok ? 'click' : 'error');
            if (result.ok) void this.requestSave();
            render();
          }
        })
      );
      this.panelContent.appendChild(actions);

      const giftSection = el('div', 'gift-section');
      giftSection.appendChild(el('h4', undefined, 'Give a gift'));
      const select = el('select', 'gift-select');
      const seen = new Set<string>();
      for (const stack of this.state.data.inventory) {
        if (!stack) continue;
        const def = ITEMS[stack.itemId];
        if (!def || def.type === 'tool' || seen.has(`${stack.itemId}:${stack.quality}`)) continue;
        seen.add(`${stack.itemId}:${stack.quality}`);
        const option = document.createElement('option');
        option.value = stack.itemId;
        option.textContent = `${QUALITY_LABEL[stack.quality]} ${def.name} ×${stack.qty}`.trim();
        select.appendChild(option);
      }
      if (select.options.length === 0) {
        giftSection.appendChild(el('p', 'hint', 'Nothing suitable to give in your backpack.'));
      } else {
        giftSection.appendChild(select);
        giftSection.appendChild(
          button('Give gift', {
            small: true,
            variant: 'gold',
            disabled: !current.available,
            onClick: () => {
              if (!select.value) return;
              const result = this.state.giftNpc(id, select.value);
              this.toast(result.message ?? '', result.ok ? 'success' : 'error');
              audio.play(result.ok ? 'coin' : 'error');
              if (result.ok) void this.requestSave();
              render();
            }
          })
        );
      }
      this.panelContent.appendChild(giftSection);

      const requestSection = el('div', 'gift-section');
      requestSection.appendChild(el('h4', undefined, 'Weekly request'));
      if (current.request.completed) {
        requestSection.appendChild(el('p', 'hint', 'Request fulfilled. A new request arrives next week.'));
      } else {
        requestSection.appendChild(
          el(
            'p',
            'hint',
            `${current.npc.name} wants ${current.request.qty} x ${current.request.itemName} for ${current.request.coins} coins and ${current.request.xp} XP.`
          )
        );
        const requestActions = el('div', 'row-actions');
        requestActions.appendChild(
          button(current.requestReady ? 'Fulfill request' : `Need ${current.request.qty} x ${current.request.itemName}`, {
            small: true,
            variant: 'gold',
            disabled: !current.available || !current.requestReady,
            onClick: () => {
              const result = this.state.completeNpcRequest(id);
              this.toast(result.message ?? '', result.ok ? 'reward' : 'error');
              audio.play(result.ok ? 'coin' : 'error');
              if (result.ok) void this.requestSave();
              render();
            }
          })
        );
        requestSection.appendChild(requestActions);
      }
      this.panelContent.appendChild(requestSection);

      const footer = el('div', 'panel-footer');
      if (
        current.hearts >= 10 &&
        current.npc.romanceable &&
        !this.state.data.spouseId &&
        this.state.data.spouseId !== id
      ) {
        footer.appendChild(
          button('Propose', {
            variant: 'gold',
            onClick: () => {
              const result = this.state.marryNpc(id);
              this.toast(result.message ?? '', result.ok ? 'reward' : 'error');
              audio.play(result.ok ? 'level' : 'error');
              if (result.ok) void this.requestSave();
              render();
            }
          })
        );
      }
      footer.appendChild(button('Close', { onClick: () => this.closePanel() }));
      this.panelContent.appendChild(footer);
    };
    render();
    this.panelRefresh = render;
    this.panelLayer.classList.remove('hidden');
    this.setPaused(true);
    audio.play('click');
  }

  openFishingGame(): void {
    if (!this.state.hasItem('fishing_rod')) {
      this.toast('You need a fishing rod. Buy one at the store.', 'error');
      return;
    }
    const cast = this.state.registerFishingCast();
    if (!cast.ok) {
      this.toast(cast.message ?? 'You cannot fish right now.', 'error');
      return;
    }
    this.closeFishingGame();
    this.state.paused = true;
    audio.play('click');

    const overlay = el('div', 'fishing-overlay');
    const box = el('div', 'fishing-box');
    const title = el('h3', undefined, 'Fishing');
    const status = el('p', 'fishing-status', cast.baitUsed ? 'Bait in the water. Waiting for a bite…' : 'Waiting for a bite…');
    const track = el('div', 'fishing-track');
    const zone = el('div', 'fishing-zone');
    const marker = el('div', 'fishing-marker');
    const zoneWidth = cast.baitUsed ? 28 : 18;
    const zoneLeft = 12 + Math.random() * (88 - zoneWidth - 12);
    zone.style.left = `${zoneLeft}%`;
    zone.style.width = `${zoneWidth}%`;
    track.append(zone, marker);
    let finished = false;
    const reel = button('Reel!', {
      variant: 'gold',
      disabled: true,
      onClick: () => {
        if (finished) {
          this.closeFishingGame();
          return;
        }
        if (!biting) {
          finish(false, 'You reeled too early. The fish got away.');
          return;
        }
        const markerPos = currentMarker();
        const hit = markerPos >= zoneLeft && markerPos <= zoneLeft + zoneWidth;
        finish(hit, hit ? '' : 'The fish slipped off the hook.');
      }
    });
    const result = el('p', 'hint center');
    box.append(title, status, track, reel, result);
    overlay.appendChild(box);
    this.root.appendChild(overlay);
    this.fishingOverlay = overlay;

    let biting = false;
    let phaseStart = 0;
    const currentMarker = (): number => {
      const elapsed = performance.now() - phaseStart;
      const cycle = 1150 + (cast.baitUsed ? 180 : 0);
      const t = (elapsed % cycle) / cycle;
      const wave = (1 - Math.cos(t * Math.PI * 2)) / 2;
      return 6 + wave * 88;
    };
    const tick = (): void => {
      if (!biting) return;
      marker.style.left = `${currentMarker()}%`;
      this.fishingRaf = window.requestAnimationFrame(tick);
    };
    this.fishingTimer = window.setTimeout(() => {
      if (!this.fishingOverlay) return;
      biting = true;
      phaseStart = performance.now();
      status.textContent = 'Bite! Reel when the marker is in the green zone!';
      reel.disabled = false;
      audio.play('click');
      tick();
    }, 900 + Math.random() * 900);

    const finish = (success: boolean, failure: string): void => {
      if (!this.fishingOverlay || finished) return;
      finished = true;
      biting = false;
      if (this.fishingRaf !== null) window.cancelAnimationFrame(this.fishingRaf);
      this.fishingRaf = null;
      if (this.fishingTimer !== null) window.clearTimeout(this.fishingTimer);
      this.fishingTimer = null;
      reel.disabled = true;
      if (success) {
        const caught = this.state.catchFish();
        if (caught.ok) {
          status.textContent = `Caught a ${caught.name}!`;
          result.textContent = `${caught.message ?? ''} +10 fishing XP.`;
          audio.play('harvest');
          void this.requestSave();
        } else {
          status.textContent = 'The line went slack.';
          result.textContent = caught.message ?? 'You could not land the fish.';
          audio.play('error');
        }
      } else {
        status.textContent = 'It got away.';
        result.textContent = failure;
        audio.play('error');
      }
      reel.textContent = 'Close';
      reel.disabled = false;
    };
  }

  closeFishingGame(): void {
    if (this.fishingTimer !== null) window.clearTimeout(this.fishingTimer);
    if (this.fishingRaf !== null) window.cancelAnimationFrame(this.fishingRaf);
    this.fishingTimer = null;
    this.fishingRaf = null;
    this.fishingOverlay?.remove();
    this.fishingOverlay = null;
    this.setPaused(false);
  }


  // ---------------------------------------------------------------- panels

  openPanel(id: string): void {
    const builder = this.panelBuilders[id];
    if (!builder) return;
    if (this.buildMode) this.cancelBuildMode();
    if (this.pauseOpen) this.closePause();
    this.currentPanel = id;
    this.panelRefresh = null;
    this.closeMoreMenu();
    const meta = PANEL_META[id];
    this.panelTitle.textContent = meta?.title ?? id;
    this.panelSubtitle.textContent = meta?.subtitle ?? '';
    this.panelContent.innerHTML = '';
    builder(this.ctx, this.panelContent);
    this.panelLayer.classList.remove('hidden');
    this.setPaused(true);
    audio.play('click');
  }

  closePanel(): void {
    this.closeMoreMenu();
    this.panelLayer.classList.add('hidden');
    this.panelContent.innerHTML = '';
    this.panelRefresh = null;
    this.currentPanel = null;
    if (!this.pauseOpen) this.setPaused(false);
  }

  private toggleMoreMenu(): void {
    const open = this.navMoreMenu.classList.contains('hidden');
    this.navMoreMenu.classList.toggle('hidden', !open);
    this.navMoreButton.setAttribute('aria-expanded', String(open));
  }

  private closeMoreMenu(): void {
    if (!this.navMoreMenu) return;
    this.navMoreMenu.classList.add('hidden');
    this.navMoreButton.setAttribute('aria-expanded', 'false');
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
    this.buildName.textContent = `Placing ${def.name} (${def.cost}g) — click or tap the ground. On touch, tap twice to confirm. Right-click or Cancel to stop.`;
    this.buildBanner.classList.remove('hidden');
    this.toast('Placement mode: choose a valid spot on the ground.', 'info');
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
    this.closeMoreMenu();
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
      <p><b>Hotbar</b> 1–0 · <b>Shop</b> H · <b>Market</b> M · <b>Bag</b> I · <b>Build</b> B · <b>Craft</b> C</p>
      <p><b>Quests</b> Q · <b>Almanac</b> L</p>
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

    const closeMoreOnOutside = (event: PointerEvent): void => {
      if (!this.navMoreMenu.classList.contains('hidden') && !this.navMore.contains(event.target as Node)) {
        this.closeMoreMenu();
      }
    };
    document.addEventListener('pointerdown', closeMoreOnOutside);
    this.unsubs.push(() => document.removeEventListener('pointerdown', closeMoreOnOutside));
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) {
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      if (!this.navMoreMenu.classList.contains('hidden')) {
        this.closeMoreMenu();
      } else if (!this.panelLayer.classList.contains('hidden')) {
        this.closePanel();
      } else if (this.pauseOpen) {
        this.closePause();
      } else if (this.buildMode) {
        this.cancelBuildMode();
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
      l: 'almanac',
      t: 'people',
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
