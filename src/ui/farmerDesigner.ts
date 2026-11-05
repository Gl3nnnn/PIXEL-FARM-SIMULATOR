import {
  ACCESSORIES,
  APPEARANCE_DEFAULT,
  BOOT_COLORS,
  EYE_COLORS,
  EYE_STYLES,
  FACE_DETAILS,
  HAIR_COLORS,
  HAIR_STYLES,
  HAT_COLORS,
  HAT_STYLES,
  OUTFIT_STYLES,
  PANTS_COLORS,
  SHIRT_COLORS,
  SHIRT_PATTERNS,
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
type ChoiceKey =
  | 'eyeStyle'
  | 'face'
  | 'hairStyle'
  | 'pattern'
  | 'outfit'
  | 'hatStyle'
  | 'accessory';
type PreviewDir = 'down' | 'up' | 'left' | 'right';

const PREVIEW_DIRS: Array<{ key: PreviewDir; label: string }> = [
  { key: 'down', label: 'Front' },
  { key: 'up', label: 'Back' },
  { key: 'left', label: 'Left' },
  { key: 'right', label: 'Right' }
];

interface Preset {
  label: string;
  look: Partial<AppearanceSave>;
}

const PRESETS: Preset[] = [
  { label: 'Classic', look: { ...APPEARANCE_DEFAULT } },
  {
    label: 'Sunny',
    look: {
      skin: 1,
      hairStyle: 6,
      hair: 4,
      eye: 1,
      eyeStyle: 1,
      face: 1,
      shirt: 3,
      pattern: 1,
      outfit: 3,
      pants: 1,
      hat: 0,
      hatStyle: 4,
      accessory: 6
    }
  },
  {
    label: 'Ranger',
    look: {
      skin: 3,
      hairStyle: 9,
      hair: 2,
      eye: 2,
      eyeStyle: 2,
      face: 4,
      shirt: 2,
      pattern: 3,
      outfit: 2,
      pants: 2,
      boots: 1,
      hat: 2,
      hatStyle: 2,
      accessory: 8
    }
  },
  {
    label: 'Cozy',
    look: {
      skin: 0,
      hairStyle: 7,
      hair: 1,
      eye: 0,
      eyeStyle: 2,
      face: 2,
      shirt: 1,
      pattern: 2,
      outfit: 1,
      pants: 3,
      boots: 4,
      hat: 4,
      hatStyle: 3,
      accessory: 3
    }
  },
  {
    label: 'Wild',
    look: {
      skin: 4,
      hairStyle: 8,
      hair: 5,
      eye: 4,
      eyeStyle: 3,
      face: 3,
      shirt: 4,
      pattern: 4,
      outfit: 0,
      pants: 4,
      boots: 2,
      hat: 5,
      hatStyle: 0,
      accessory: 5
    }
  },
  {
    label: 'Miner',
    look: {
      skin: 2,
      hairStyle: 0,
      hair: 5,
      eye: 0,
      eyeStyle: 2,
      face: 4,
      shirt: 5,
      pattern: 0,
      outfit: 2,
      pants: 3,
      boots: 1,
      hat: 2,
      hatStyle: 2,
      accessory: 8
    }
  },
  {
    label: 'Artist',
    look: {
      skin: 5,
      hairStyle: 7,
      hair: 3,
      eye: 3,
      eyeStyle: 1,
      face: 1,
      shirt: 4,
      pattern: 1,
      outfit: 1,
      pants: 5,
      boots: 2,
      hat: 3,
      hatStyle: 5,
      accessory: 7
    }
  }
];

/**
 * A small screen shown before a brand-new farm starts, so the farmer can pick
 * their skin, hair, eyes, face detail, outfit, headwear and accessories. The
 * same textures the game walks around in are redrawn live, so the preview is
 * exactly what you will look like.
 */
export class FarmerDesigner {
  private look: AppearanceSave = { ...APPEARANCE_DEFAULT };
  private root: HTMLElement | null = null;
  private preview: HTMLImageElement | null = null;
  private previewDir: PreviewDir = 'down';
  private previewFrame = 0;
  private previewTimer: number | null = null;
  private animated = true;
  private animateButton: HTMLButtonElement | null = null;
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
    const previewWrap = el('div', 'farmer-preview-wrap');
    this.preview = el('img', 'farmer-preview');
    this.preview.alt = 'Your farmer';
    this.preview.width = 112;
    this.preview.height = 168;
    previewWrap.appendChild(this.preview);
    previewWrap.appendChild(el('span', 'farmer-preview-shadow'));
    stage.appendChild(previewWrap);

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
    this.animateButton = button(this.animated ? 'Pause' : 'Walk', {
      small: true,
      variant: this.animated ? 'primary' : 'ghost',
      title: 'Animate the walking preview',
      onClick: () => this.setAnimated(!this.animated)
    });
    this.animateButton.classList.add('farmer-animate-btn');
    tools.appendChild(this.animateButton);
    stage.appendChild(tools);
    card.appendChild(stage);

    card.appendChild(el('div', 'farmer-section', 'Quick looks'));
    const presets = el('div', 'farmer-presets');
    for (const preset of PRESETS) {
      const chip = el('button', 'farmer-choice farmer-preset');
      chip.type = 'button';
      chip.textContent = preset.label;
      chip.addEventListener('click', () => this.applyPreset(preset));
      presets.appendChild(chip);
    }
    card.appendChild(presets);

    card.appendChild(el('div', 'farmer-section', 'Face'));
    card.appendChild(this.row('Skin', 'skin', SKIN_TONES));
    card.appendChild(this.row('Eye colour', 'eye', EYE_COLORS));
    card.appendChild(this.choiceRow('Eye shape', 'eyeStyle', EYE_STYLES));
    card.appendChild(this.choiceRow('Detail', 'face', FACE_DETAILS));

    card.appendChild(el('div', 'farmer-section', 'Hair'));
    card.appendChild(this.choiceRow('Style', 'hairStyle', HAIR_STYLES));
    card.appendChild(this.row('Colour', 'hair', HAIR_COLORS));

    card.appendChild(el('div', 'farmer-section', 'Outfit'));
    card.appendChild(this.choiceRow('Style', 'outfit', OUTFIT_STYLES));
    card.appendChild(this.row('Shirt', 'shirt', SHIRT_COLORS));
    card.appendChild(this.choiceRow('Pattern', 'pattern', SHIRT_PATTERNS));
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
    this.setAnimated(this.animated);
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

  private choiceRow(label: string, key: ChoiceKey, options: string[]): HTMLElement {
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
    this.previewFrame = 0;
    this.root?.querySelectorAll<HTMLElement>('.farmer-view-btn').forEach((view) => {
      const active = view.dataset.dir === dir;
      view.classList.toggle('primary', active);
      view.classList.toggle('ghost', !active);
    });
    this.refresh();
  }

  private setAnimated(on: boolean): void {
    this.animated = on;
    if (this.previewTimer !== null) {
      window.clearInterval(this.previewTimer);
      this.previewTimer = null;
    }
    if (on) {
      this.previewTimer = window.setInterval(() => {
        this.previewFrame = (this.previewFrame + 1) % 3;
        this.syncPreview();
      }, 180);
    } else {
      this.previewFrame = 0;
      this.syncPreview();
    }
    if (this.animateButton) {
      this.animateButton.textContent = on ? 'Pause' : 'Walk';
      this.animateButton.classList.toggle('primary', on);
      this.animateButton.classList.toggle('ghost', !on);
    }
  }

  private applyPreset(preset: Preset): void {
    this.look = { ...APPEARANCE_DEFAULT, ...preset.look };
    this.refresh();
  }

  private randomize(): void {
    const pick = (size: number): number => Math.floor(Math.random() * size);
    this.look = {
      skin: pick(SKIN_TONES.length),
      hairStyle: pick(HAIR_STYLES.length),
      hair: pick(HAIR_COLORS.length),
      eye: pick(EYE_COLORS.length),
      eyeStyle: pick(EYE_STYLES.length),
      face: pick(FACE_DETAILS.length),
      shirt: pick(SHIRT_COLORS.length),
      pattern: pick(SHIRT_PATTERNS.length),
      outfit: pick(OUTFIT_STYLES.length),
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
    this.syncPreview();
    const marks = Array.from(
      this.root?.querySelectorAll<HTMLElement>('.farmer-swatch, .farmer-choice') ?? []
    );
    for (const mark of marks) {
      const key = mark.dataset.key as LookKey | undefined;
      const index = Number(mark.dataset.index ?? '-1');
      mark.classList.toggle('is-picked', key !== undefined && this.look[key] === index);
    }
  }

  /** Update only the image frame, used by the walking animation. */
  private syncPreview(): void {
    if (!this.preview) return;
    const textureKey = `player_${this.previewDir}_${this.previewFrame}`;
    try {
      this.preview.src = this.scene.textures.exists(textureKey)
        ? this.scene.textures.getBase64(textureKey)
        : '';
    } catch {
      this.preview.src = '';
    }
  }

  private close(look: AppearanceSave | null): void {
    if (this.previewTimer !== null) {
      window.clearInterval(this.previewTimer);
      this.previewTimer = null;
    }
    this.root?.remove();
    this.root = null;
    this.preview = null;
    this.animateButton = null;
    this.onDone(look);
  }
}
