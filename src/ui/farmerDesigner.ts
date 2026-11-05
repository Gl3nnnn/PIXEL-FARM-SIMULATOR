import {
  ACCESSORIES,
  APPEARANCE_DEFAULT,
  BOOT_COLORS,
  EYE_COLORS,
  HAIR_COLORS,
  HAIR_STYLES,
  HAT_COLORS,
  HAT_STYLES,
  PANTS_COLORS,
  SHIRT_COLORS,
  SKIN_TONES
} from '../data/definitions';
import type { AppearanceSave } from '../types';
import { applyAppearance } from '../game/textures';
import { button, el } from './uiKit';

export interface FarmerDesignerOptions {
  scene: Phaser.Scene;
  /** Called with the finished look, or with null if the player backs out. */
  onDone: (look: AppearanceSave | null) => void;
}

type LookKey = keyof AppearanceSave;
type PreviewDir = 'down' | 'up' | 'left' | 'right';

const PREVIEW_DIRS: Array<{ key: PreviewDir; label: string }> = [
  { key: 'down', label: 'Front' },
  { key: 'up', label: 'Back' },
  { key: 'left', label: 'Left' },
  { key: 'right', label: 'Right' }
];

/**
 * A small screen shown before a brand-new farm starts, so the farmer can pick
 * their skin, hair, eyes, outfit, headwear and accessories. The same textures
 * the game walks around in are redrawn live, so the preview is exactly what
 * you will look like.
 */
export class FarmerDesigner {
  private look: AppearanceSave = { ...APPEARANCE_DEFAULT };
  private root: HTMLElement | null = null;
  private preview: HTMLImageElement | null = null;
  private previewDir: PreviewDir = 'down';
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
    this.preview.width = 112;
    this.preview.height = 168;
    stage.appendChild(this.preview);

    const views = el('div', 'farmer-view-toggle');
    for (const { key, label } of PREVIEW_DIRS) {
      const view = button(label, {
        small: true,
        variant: key === this.previewDir ? 'primary' : 'ghost',
        onClick: () => this.setPreviewDir(key)
      });
      view.classList.add('farmer-view-btn');
      view.dataset.dir = key;
      views.appendChild(view);
    }
    stage.appendChild(views);

    const tools = el('div', 'farmer-preview-tools');
    tools.appendChild(
      button('Surprise me', {
        small: true,
        variant: 'secondary',
        title: 'Pick a random look',
        onClick: () => this.randomize()
      })
    );
    stage.appendChild(tools);
    card.appendChild(stage);

    card.appendChild(el('div', 'farmer-section', 'Face'));
    card.appendChild(this.row('Skin', 'skin', SKIN_TONES));
    card.appendChild(this.row('Eyes', 'eye', EYE_COLORS));

    card.appendChild(el('div', 'farmer-section', 'Hair'));
    card.appendChild(this.choiceRow('Style', 'hairStyle', HAIR_STYLES));
    card.appendChild(this.row('Colour', 'hair', HAIR_COLORS));

    card.appendChild(el('div', 'farmer-section', 'Outfit'));
    card.appendChild(this.row('Shirt', 'shirt', SHIRT_COLORS));
    card.appendChild(this.row('Pants', 'pants', PANTS_COLORS));
    card.appendChild(this.row('Boots', 'boots', BOOT_COLORS));

    card.appendChild(el('div', 'farmer-section', 'Headwear & extras'));
    card.appendChild(this.choiceRow('Hat', 'hatStyle', HAT_STYLES));
    card.appendChild(
      this.row('Hat colour', 'hat', HAT_COLORS, () => {
        if (this.look.hatStyle === 0) this.look.hatStyle = 1;
      })
    );
    card.appendChild(this.choiceRow('Accessory', 'accessory', ACCESSORIES));

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

  private row(label: string, key: LookKey, colors: string[], onPick?: () => void): HTMLElement {
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
        onPick?.();
        this.refresh();
      });
      swatches.appendChild(dot);
    });
    row.appendChild(swatches);
    return row;
  }

  private choiceRow(
    label: string,
    key: 'hairStyle' | 'hatStyle' | 'accessory',
    options: string[]
  ): HTMLElement {
    const row = el('div', 'farmer-row');
    row.appendChild(el('span', 'farmer-label', label));
    const choices = el('div', 'farmer-choices');
    options.forEach((name, index) => {
      const chip = el('button', 'farmer-choice');
      chip.type = 'button';
      chip.textContent = name;
      chip.dataset.key = key;
      chip.dataset.index = String(index);
      chip.addEventListener('click', () => {
        this.look[key] = index;
        if (key === 'hatStyle' && index > 0 && this.look.hat < 0) this.look.hat = 0;
        this.refresh();
      });
      choices.appendChild(chip);
    });
    row.appendChild(choices);
    return row;
  }

  private setPreviewDir(dir: PreviewDir): void {
    this.previewDir = dir;
    this.root?.querySelectorAll<HTMLElement>('.farmer-view-btn').forEach((view) => {
      const active = view.dataset.dir === dir;
      view.classList.toggle('primary', active);
      view.classList.toggle('ghost', !active);
    });
    this.refresh();
  }

  private randomize(): void {
    const pick = (size: number): number => Math.floor(Math.random() * size);
    this.look = {
      skin: pick(SKIN_TONES.length),
      hairStyle: pick(HAIR_STYLES.length),
      hair: pick(HAIR_COLORS.length),
      eye: pick(EYE_COLORS.length),
      shirt: pick(SHIRT_COLORS.length),
      pants: pick(PANTS_COLORS.length),
      boots: pick(BOOT_COLORS.length),
      hat: pick(HAT_COLORS.length),
      hatStyle: pick(HAT_STYLES.length),
      accessory: pick(ACCESSORIES.length)
    };
    this.refresh();
  }

  /** Redraw the sprite textures, then show the new frames in the preview. */
  private refresh(): void {
    applyAppearance(this.scene, this.look);
    if (!this.preview) return;
    const textureKey = `player_${this.previewDir}_0`;
    try {
      this.preview.src = this.scene.textures.exists(textureKey)
        ? this.scene.textures.getBase64(textureKey)
        : '';
    } catch {
      this.preview.src = '';
    }
    const marks = Array.from(
      this.root?.querySelectorAll<HTMLElement>('.farmer-swatch, .farmer-choice') ?? []
    );
    for (const mark of marks) {
      const key = mark.dataset.key as LookKey | undefined;
      const index = Number(mark.dataset.index ?? '-1');
      mark.classList.toggle('is-picked', key !== undefined && this.look[key] === index);
    }
  }

  private close(look: AppearanceSave | null): void {
    this.root?.remove();
    this.root = null;
    this.preview = null;
    this.onDone(look);
  }
}
