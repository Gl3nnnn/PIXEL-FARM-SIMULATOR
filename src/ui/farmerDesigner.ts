import {
  APPEARANCE_DEFAULT,
  HAIR_COLORS,
  HAT_COLORS,
  SHIRT_COLORS,
  SKIN_TONES
} from '../data/definitions';
import type { AppearanceSave } from '../types';
import { applyAppearance } from '../game/textures';
import { button, el } from './uiKit';

/** What texture key the preview image reads its pixels from. */
const PREVIEW_KEY = 'player_down_0';

export interface FarmerDesignerOptions {
  scene: Phaser.Scene;
  /** Called with the finished look, or with null if the player backs out. */
  onDone: (look: AppearanceSave | null) => void;
}

type LookKey = keyof AppearanceSave;

/**
 * A small screen shown before a brand-new farm starts, so the farmer can pick
 * their skin, hair, shirt and hat. The same textures the game walks around in
 * are redrawn live, so the preview is exactly what you will look like.
 */
export class FarmerDesigner {
  private look: AppearanceSave = { ...APPEARANCE_DEFAULT };
  private root: HTMLElement | null = null;
  private preview: HTMLImageElement | null = null;
  private readonly scene: Phaser.Scene;
  private readonly onDone: (look: AppearanceSave | null) => void;

  constructor(options: FarmerDesignerOptions) {
    this.scene = options.scene;
    this.onDone = options.onDone;
  }

  mount(): void {
    applyAppearance(this.scene, this.look);
    const overlay = el('div', 'farmer-designer');
    const card = el('div', 'farmer-card');

    card.appendChild(el('h2', undefined, 'Design your farmer'));

    const stage = el('div', 'farmer-stage');
    this.preview = el('img', 'farmer-preview');
    this.preview.alt = 'Your farmer';
    this.preview.width = 96;
    this.preview.height = 144;
    stage.appendChild(this.preview);
    card.appendChild(stage);

    card.appendChild(this.row('Skin', 'skin', SKIN_TONES));
    card.appendChild(this.row('Hair', 'hair', HAIR_COLORS));
    card.appendChild(this.row('Shirt', 'shirt', SHIRT_COLORS));

    const hatRow = this.row('Hat', 'hat', HAT_COLORS);
    hatRow.appendChild(
      button('No hat', {
        small: true,
        variant: 'secondary',
        onClick: () => {
          this.look.hat = -1;
          this.refresh();
        }
      })
    );
    card.appendChild(hatRow);

    const actions = el('div', 'farmer-actions');
    actions.appendChild(
      button('Back', {
        variant: 'secondary',
        onClick: () => this.close(null)
      })
    );
    actions.appendChild(
      button('Start farming', {
        variant: 'primary',
        onClick: () => this.close({ ...this.look })
      })
    );
    card.appendChild(actions);

    overlay.appendChild(card);
    document.body.appendChild(overlay);
    this.root = overlay;
    this.refresh();
  }

  private row(label: string, key: LookKey, colors: string[]): HTMLElement {
    const row = el('div', 'farmer-row');
    row.appendChild(el('span', 'farmer-label', label));
    const swatches = el('div', 'farmer-swatches');
    colors.forEach((color, index) => {
      const dot = el('button', 'farmer-swatch');
      dot.type = 'button';
      dot.style.background = color;
      dot.dataset.key = key;
      dot.dataset.index = String(index);
      dot.title = `${label} ${index + 1}`;
      dot.setAttribute('aria-label', `${label} ${index + 1}`);
      dot.addEventListener('click', () => {
        this.look[key] = index;
        this.refresh();
      });
      swatches.appendChild(dot);
    });
    row.appendChild(swatches);
    return row;
  }

  /** Redraw the sprite textures, then show the new frames in the preview. */
  private refresh(): void {
    applyAppearance(this.scene, this.look);
    if (!this.preview) return;
    try {
      this.preview.src = this.scene.textures.exists(PREVIEW_KEY)
        ? this.scene.textures.getBase64(PREVIEW_KEY)
        : '';
    } catch {
      this.preview.src = '';
    }
    const swatches = Array.from(this.root?.querySelectorAll<HTMLElement>('.farmer-swatch') ?? []);
    for (const dot of swatches) {
      const key = dot.dataset.key as LookKey | undefined;
      const index = Number(dot.dataset.index ?? '-1');
      dot.classList.toggle('is-picked', key !== undefined && this.look[key] === index);
    }
  }

  private close(look: AppearanceSave | null): void {
    this.root?.remove();
    this.root = null;
    this.preview = null;
    this.onDone(look);
  }
}
