import { SEASON_INFO } from '../data/definitions';
import { audio } from '../systems/audio';
import { SaveManager, loadSettings, saveSettings, SLOT_COUNT } from '../systems/save';
import { formatDate, formatNumber } from '../systems/util';
import type { SaveSlotInfo, Settings } from '../types';
import { button, confirmDialog, el } from './uiKit';

export interface MainMenuHandlers {
  onStart(slot: number, mode: 'new' | 'continue'): Promise<void>;
}

export class MainMenu {
  private handlers: MainMenuHandlers;
  private root: HTMLElement;
  private slots: SaveSlotInfo[] = [];
  private settings: Settings = loadSettings();
  private busy = false;

  constructor(handlers: MainMenuHandlers) {
    this.handlers = handlers;
    this.root = el('div', 'menu-screen');
    this.root.id = 'menu-screen';
  }

  async mount(): Promise<void> {
    const uiRoot = document.getElementById('ui-root');
    if (!uiRoot) return;
    uiRoot.appendChild(this.root);
    this.render();
    await this.refreshSlots();
  }

  destroy(): void {
    this.root.remove();
  }

  private async refreshSlots(): Promise<void> {
    try {
      this.slots = await SaveManager.listSlots();
    } catch {
      this.slots = Array.from({ length: SLOT_COUNT }, (_, i) => ({ slot: i + 1, exists: false }));
    }
    this.render();
  }

  private async start(slot: number, mode: 'new' | 'continue'): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.root.querySelectorAll('button').forEach((b) => {
      (b as HTMLButtonElement).disabled = true;
    });
    const status = this.root.querySelector('.menu-status');
    if (status) status.textContent = 'Loading your farm…';
    audio.init();
    audio.play('click');
    try {
      await this.handlers.onStart(slot, mode);
    } catch (err) {
      this.busy = false;
      this.root.querySelectorAll('button').forEach((b) => {
        (b as HTMLButtonElement).disabled = false;
      });
      if (status) status.textContent = `Could not start game: ${String(err)}`;
    }
  }

  private render(): void {
    this.root.innerHTML = '';
    const hasSaves = this.slots.some((s) => s.exists);
    const last = SaveManager.lastSlot();
    const lastInfo = last ? this.slots.find((s) => s.slot === last && s.exists) : undefined;

    const backdrop = el('div', 'menu-scrim');
    this.root.appendChild(backdrop);

    const panel = el('div', 'menu-panel main-menu-panel');
    const hero = el('div', 'menu-hero');
    const logo = el('div', 'game-logo');
    logo.appendChild(el('span', 'logo-line1', 'PIXEL FARM'));
    logo.appendChild(el('span', 'logo-line2', 'SIMULATOR'));
    hero.appendChild(logo);
    hero.appendChild(el('p', 'menu-tagline', 'From a small farm to a farming empire'));
    hero.appendChild(el('p', 'menu-badge', 'A cosy farming simulation · spring to winter · solo play'));
    panel.appendChild(hero);

    const buttons = el('div', 'menu-buttons');
    const continueBtn = button('Continue', {
      variant: 'primary',
      disabled: !hasSaves,
      title: hasSaves ? 'Load your most recent save' : 'No save found yet',
      onClick: () => {
        if (lastInfo) void this.start(lastInfo.slot, 'continue');
        else this.showSlots('continue');
      }
    });
    continueBtn.classList.add('menu-btn-main');
    buttons.appendChild(continueBtn);
    buttons.appendChild(
      button('New Game', {
        onClick: () => this.showSlots('new')
      })
    );
    buttons.appendChild(
      button('Load Game', {
        disabled: !hasSaves,
        onClick: () => this.showSlots('continue')
      })
    );
    buttons.appendChild(
      button('How to Play', {
        onClick: () => this.showHelp()
      })
    );
    buttons.appendChild(
      button('Settings', {
        onClick: () => this.showSettings()
      })
    );
    panel.appendChild(buttons);

    if (lastInfo) {
      const save = el('div', 'menu-save-preview');
      save.innerHTML = `Last save · ${SEASON_INFO[lastInfo.season ?? 'spring'].name} ${lastInfo.day ?? 1}, Year ${lastInfo.year ?? 1} · ${formatNumber(lastInfo.coins ?? 0)} coins`;
      panel.appendChild(save);
    }

    if (!SaveManager.available()) {
      const warn = el('div', 'notice warn');
      warn.textContent =
        'Browser storage is unavailable. You can play, but progress cannot be saved in this browser.';
      panel.appendChild(warn);
    }

    const status = el('p', 'menu-status');
    status.textContent = 'Local saves are stored on this device only.';
    panel.appendChild(status);
    panel.appendChild(el('p', 'menu-footer', 'Original pixel art · Phaser + TypeScript · v2.0'));

    this.root.appendChild(panel);
    this.bindBackground();
  }

  private bindBackground(): void {
    const canvas = document.querySelector('#game-container canvas');
    if (canvas) {
      canvas.addEventListener('pointerdown', () => audio.init(), { once: true });
    }
    this.root.addEventListener('pointerdown', () => audio.resume(), { once: true });
  }

  private modal(title: string, subtitle?: string): { backdrop: HTMLElement; body: HTMLElement; box: HTMLElement } {
    const backdrop = el('div', 'menu-modal-backdrop');
    const box = el('div', 'menu-panel menu-modal');
    const head = el('div', 'panel-head');
    head.appendChild(el('h2', 'panel-title', title));
    if (subtitle) head.appendChild(el('p', 'panel-subtitle', subtitle));
    const body = el('div', 'panel-body');
    box.append(head, body);
    backdrop.appendChild(box);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.remove();
    });
    this.root.appendChild(backdrop);
    return { backdrop, body, box };
  }

  private showSlots(mode: 'new' | 'continue'): void {
    audio.play('click');
    const { body, backdrop } = this.modal(
      mode === 'new' ? 'Start a new farm' : 'Load a farm',
      mode === 'new'
        ? 'Choose a slot. Starting a new game will ask before overwriting an existing save.'
        : 'Pick one of your local saves.'
    );

    const grid = el('div', 'slot-grid');
    for (const info of this.slots) {
      const card = el('div', 'slot-card');
      const head = el('div', 'slot-head');
      head.appendChild(el('span', 'slot-number', `Save ${info.slot}`));
      head.appendChild(
        el('span', `pill ${info.exists ? 'good' : ''}`, info.exists ? 'Occupied' : 'Empty')
      );
      card.appendChild(head);
      if (info.exists) {
        card.appendChild(
          el(
            'p',
            'slot-meta',
            `${SEASON_INFO[info.season ?? 'spring'].name} ${info.day ?? 1}, Year ${info.year ?? 1}`
          )
        );
        card.appendChild(el('p', 'hint', `${formatNumber(info.coins ?? 0)} coins · ${formatDate(info.savedAt ?? Date.now())}`));
      } else {
        card.appendChild(el('p', 'slot-meta', 'A brand new farm awaits.'));
        card.appendChild(el('p', 'hint', '400 starting coins · starter seeds · cozy farmhouse'));
      }
      const actions = el('div', 'slot-actions');
      if (mode === 'new') {
        actions.appendChild(
          button(info.exists ? 'Overwrite & start' : 'Start here', {
            variant: info.exists ? 'danger' : 'primary',
            small: true,
            onClick: () => {
              if (info.exists) {
                confirmDialog(
                  this.root,
                  'Overwrite this save?',
                  `Save ${info.slot} contains a farm from ${SEASON_INFO[info.season ?? 'spring'].name} ${info.day ?? 1}, Year ${info.year ?? 1}. This cannot be undone.`,
                  'Overwrite',
                  () => {
                    backdrop.remove();
                    void this.start(info.slot, 'new');
                  },
                  true
                );
              } else {
                backdrop.remove();
                void this.start(info.slot, 'new');
              }
            }
          })
        );
      } else if (info.exists) {
        actions.appendChild(
          button('Load', {
            variant: 'primary',
            small: true,
            onClick: () => {
              backdrop.remove();
              void this.start(info.slot, 'continue');
            }
          })
        );
      }
      if (info.exists) {
        actions.appendChild(
          button('Delete', {
            variant: 'ghost',
            small: true,
            onClick: () => {
              confirmDialog(
                this.root,
                'Delete this save?',
                'This permanently deletes the save from this browser.',
                'Delete forever',
                () => {
                  void (async () => {
                    try {
                      await SaveManager.remove(info.slot);
                      audio.play('error');
                      backdrop.remove();
                      await this.refreshSlots();
                      this.showSlots(mode);
                    } catch {
                      /* ignore */
                    }
                  })();
                },
                true
              );
            }
          })
        );
      }
      card.appendChild(actions);
      grid.appendChild(card);
    }
    body.appendChild(grid);

    const footer = el('div', 'panel-footer');
    footer.appendChild(button('Back', { onClick: () => backdrop.remove() }));
    body.appendChild(footer);
  }

  private showHelp(): void {
    audio.play('click');
    const { body, backdrop } = this.modal('How to Play', 'A quick guide to farm life.');
    body.innerHTML = `
      <div class="help-grid">
        <div class="help-card">
          <h3>1. Work the land</h3>
          <p>Select the Hoe in the hotbar and click field tiles to till soil. Choose seeds (keys 1–0) and click the tilled soil to plant. Water crops with the Watering Can.</p>
        </div>
        <div class="help-card">
          <h3>2. End the day</h3>
          <p>Press Sleep in the top bar. Watered crops grow overnight. Rain waters everything for free. Crops left dry for three days will wilt.</p>
        </div>
        <div class="help-card">
          <h3>3. Sell and grow</h3>
          <p>Harvest mature crops by clicking them, then sell at the Market. Buy better seeds, build a coop or barn, and raise animals for daily products.</p>
        </div>
        <div class="help-card">
          <h3>4. Build an empire</h3>
          <p>Use the Build menu for workshops, greenhouses, sheds and sprinklers. Expand into new fields, complete quests, and unlock achievements.</p>
        </div>
      </div>
      <div class="controls-help">
        <h3>Controls</h3>
        <p><b>Move</b> WASD / arrows · <b>Use tool</b> click world · <b>Hotbar</b> 1–0</p>
        <p><b>Shop</b> H · <b>Market</b> M · <b>Bag</b> I · <b>Build</b> B · <b>Quests</b> Q · <b>Pause</b> Esc</p>
        <p>On mobile, use the joystick and the USE button.</p>
      </div>
    `;
    const footer = el('div', 'panel-footer');
    footer.appendChild(button('Got it', { variant: 'primary', onClick: () => backdrop.remove() }));
    body.appendChild(footer);
  }

  private showSettings(): void {
    audio.play('click');
    const { body, backdrop } = this.modal('Settings', 'Sound preferences are stored on this device.');
    const render = () => {
      body.innerHTML = '';
      const makeToggle = (label: string, value: boolean, onChange: (next: boolean) => void) => {
        const row = el('div', 'setting-row');
        row.appendChild(el('span', undefined, label));
        row.appendChild(
          button(value ? 'ON' : 'OFF', {
            small: true,
            variant: value ? 'primary' : 'secondary',
            onClick: () => {
              onChange(!value);
              audio.play('click');
              render();
            }
          })
        );
        return row;
      };
      body.appendChild(
        makeToggle('Sound effects', this.settings.sfx, (next) => {
          this.settings.sfx = next;
          audio.setSfx(next);
        })
      );
      body.appendChild(
        makeToggle('Music', this.settings.music, (next) => {
          this.settings.music = next;
          audio.setMusic(next);
        })
      );
      const volRow = el('div', 'setting-row');
      volRow.appendChild(el('span', undefined, `Volume ${Math.round(this.settings.volume * 100)}%`));
      const range = el('input', 'volume-range');
      range.type = 'range';
      range.min = '0';
      range.max = '100';
      range.value = String(Math.round(this.settings.volume * 100));
      range.addEventListener('input', () => {
        this.settings.volume = Number(range.value) / 100;
        audio.setVolume(this.settings.volume);
        saveSettings(this.settings);
      });
      volRow.appendChild(range);
      body.appendChild(volRow);
      body.appendChild(
        el('p', 'hint', 'Music and sounds are generated in real time — no audio downloads required.')
      );
      const footer = el('div', 'panel-footer');
      footer.appendChild(
        button('Close', {
          variant: 'primary',
          onClick: () => {
            saveSettings(this.settings);
            backdrop.remove();
          }
        })
      );
      body.appendChild(footer);
    };
    render();
  }
}
