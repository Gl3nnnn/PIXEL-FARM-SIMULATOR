import {
  ACCESSORIES,
  APPEARANCE_DEFAULT,
  BOOT_COLORS,
  BUILDS,
  EYE_COLORS,
  EYE_STYLES,
  FACE_DETAILS,
  FACIAL_HAIR,
  HAIR_COLORS,
  HAIR_STYLES,
  HAT_COLORS,
  HAT_STYLES,
  OUTFIT_STYLES,
  PANTS_COLORS,
  PRONOUNS,
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
type ColorKey = Exclude<LookKey, 'name'>;
type ChoiceKey =
  | 'eyeStyle'
  | 'face'
  | 'facialHair'
  | 'build'
  | 'pronouns'
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
      face: 0,
      facialHair: 1,
      build: 2,
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
      face: 0,
      facialHair: 4,
      build: 2,
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
      face: 0,
      facialHair: 1,
      build: 2,
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
      build: 0,
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

type StepId = 'look' | 'face' | 'hair' | 'headwear' | 'outfit' | 'extras';

interface DesignerStep {
  id: StepId;
  label: string;
  title: string;
  hint: string;
}

const STEPS: DesignerStep[] = [
  {
    id: 'look',
    label: 'You',
    title: 'Make this farmer yours',
    hint: 'Add a name and pronouns, choose a build, then pick a preset or skip ahead.'
  },
  {
    id: 'face',
    label: 'Face',
    title: 'Face and expression',
    hint: 'Choose skin, eye colour, eye shape, a face detail and facial hair.'
  },
  {
    id: 'hair',
    label: 'Hair',
    title: 'Hair',
    hint: 'Pick a cut and a colour.'
  },
  {
    id: 'headwear',
    label: 'Headwear',
    title: 'Headwear',
    hint: 'Try a hat, a cap, a headscarf or a turban.'
  },
  {
    id: 'outfit',
    label: 'Outfit',
    title: 'Clothes',
    hint: 'Choose the outfit style, shirt colour and pattern, then pants and boots.'
  },
  {
    id: 'extras',
    label: 'Extras',
    title: 'Finishing touches',
    hint: 'Add one small accessory - glasses, jewellery, a hearing aid or an eyepatch.'
  }
];

/**
 * A small screen shown before a brand-new farm starts. It walks through the
 * look one step at a time so each screen stays readable, while the live
 * sprite preview stays in view the whole way through.
 */
export class FarmerDesigner {
  private look: AppearanceSave = { ...APPEARANCE_DEFAULT };
  private root: HTMLElement | null = null;
  private card: HTMLElement | null = null;
  private preview: HTMLImageElement | null = null;
  private previewDir: PreviewDir = 'down';
  private previewFrame = 0;
  private previewTimer: number | null = null;
  private animated = true;
  private animateButton: HTMLButtonElement | null = null;
  private stepNav: HTMLElement | null = null;
  private stepPanel: HTMLElement | null = null;
  private stepButtons: HTMLButtonElement[] = [];
  private stepIndex = 0;
  private prevButton: HTMLButtonElement | null = null;
  private nextButton: HTMLButtonElement | null = null;
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

    this.stepNav = el('div', 'farmer-step-nav');
    card.appendChild(this.stepNav);
    this.buildStepNav();

    this.stepPanel = el('div', 'farmer-step-panel');
    card.appendChild(this.stepPanel);

    const actions = el('div', 'farmer-actions');
    actions.appendChild(
      button('Cancel', {
        variant: 'ghost',
        onClick: () => this.close(null)
      })
    );
    this.prevButton = button('Previous', {
      variant: 'secondary',
      onClick: () => this.goToStep(this.stepIndex - 1)
    });
    this.prevButton.classList.add('farmer-prev');
    actions.appendChild(this.prevButton);
    this.nextButton = button('Next', {
      variant: 'primary',
      onClick: () => this.advance()
    });
    this.nextButton.classList.add('farmer-next');
    actions.appendChild(this.nextButton);
    card.appendChild(actions);

    overlay.appendChild(card);
    document.body.appendChild(overlay);
    this.root = overlay;
    this.card = card;

    this.renderStep();
    this.refresh();
    this.setAnimated(this.animated);
  }

  private buildStepNav(): void {
    if (!this.stepNav) return;
    this.stepNav.innerHTML = '';
    this.stepButtons = STEPS.map((step, index) => {
      const dot = el('button', 'farmer-step-dot');
      dot.type = 'button';
      dot.textContent = step.label;
      dot.setAttribute('aria-label', `Step ${index + 1}: ${step.title}`);
      dot.addEventListener('click', () => this.goToStep(index));
      this.stepNav!.appendChild(dot);
      return dot;
    });
  }

  private renderStep(): void {
    if (!this.stepPanel) return;
    const step = STEPS[this.stepIndex];
    this.stepPanel.innerHTML = '';

    const head = el('div', 'farmer-step-head');
    head.appendChild(
      el('span', 'farmer-step-count', `Step ${this.stepIndex + 1} of ${STEPS.length}`)
    );
    head.appendChild(el('h3', 'farmer-step-title', step.title));
    head.appendChild(el('p', 'farmer-step-hint', step.hint));
    this.stepPanel.appendChild(head);

    const body = el('div', 'farmer-step-body');
    if (step.id === 'look') {
      const nameRow = el('div', 'farmer-row');
      nameRow.appendChild(el('span', 'farmer-label', 'Name'));
      const nameInput = el('input', 'farmer-name-input');
      nameInput.type = 'text';
      nameInput.maxLength = 16;
      nameInput.value = this.look.name;
      nameInput.placeholder = 'Your name';
      nameInput.setAttribute('aria-label', 'Your name');
      nameInput.addEventListener('input', () => {
        this.look.name = nameInput.value.slice(0, 16);
      });
      nameInput.addEventListener('keydown', (event) => event.stopPropagation());
      nameRow.appendChild(nameInput);
      body.appendChild(nameRow);
      body.appendChild(this.choiceRow('Pronouns', 'pronouns', PRONOUNS));
      body.appendChild(this.choiceRow('Build', 'build', BUILDS));

      const presets = el('div', 'farmer-presets');
      for (const preset of PRESETS) {
        const chip = el('button', 'farmer-choice farmer-preset');
        chip.type = 'button';
        chip.textContent = preset.label;
        chip.addEventListener('click', () => this.applyPreset(preset));
        presets.appendChild(chip);
      }
      body.appendChild(presets);
    } else if (step.id === 'face') {
      body.appendChild(this.row('Skin', 'skin', SKIN_TONES));
      body.appendChild(this.row('Eye colour', 'eye', EYE_COLORS));
      body.appendChild(this.choiceRow('Eye shape', 'eyeStyle', EYE_STYLES));
      body.appendChild(this.choiceRow('Detail', 'face', FACE_DETAILS));
      body.appendChild(this.choiceRow('Facial hair', 'facialHair', FACIAL_HAIR));
    } else if (step.id === 'hair') {
      body.appendChild(this.choiceRow('Style', 'hairStyle', HAIR_STYLES));
      body.appendChild(this.row('Colour', 'hair', HAIR_COLORS));
    } else if (step.id === 'headwear') {
      body.appendChild(this.choiceRow('Hat', 'hatStyle', HAT_STYLES));
      body.appendChild(
        this.row('Hat colour', 'hat', HAT_COLORS, () => {
          if (this.look.hatStyle === 0) this.look.hatStyle = 1;
        })
      );
    } else if (step.id === 'outfit') {
      body.appendChild(this.choiceRow('Style', 'outfit', OUTFIT_STYLES));
      body.appendChild(this.row('Shirt', 'shirt', SHIRT_COLORS));
      body.appendChild(this.choiceRow('Pattern', 'pattern', SHIRT_PATTERNS));
      body.appendChild(this.row('Pants', 'pants', PANTS_COLORS));
      body.appendChild(this.row('Boots', 'boots', BOOT_COLORS));
    } else {
      body.appendChild(this.choiceRow('Accessory', 'accessory', ACCESSORIES));
    }
    this.stepPanel.appendChild(body);

    this.syncStepChrome();
    this.syncMarks();
    if (this.card) this.card.scrollTop = 0;
  }

  private syncStepChrome(): void {
    this.stepButtons.forEach((dot, index) => {
      dot.classList.toggle('is-active', index === this.stepIndex);
      dot.classList.toggle('is-done', index < this.stepIndex);
    });
    if (this.prevButton) {
      this.prevButton.style.display = this.stepIndex === 0 ? 'none' : '';
    }
    if (this.nextButton) {
      this.nextButton.textContent = this.stepIndex === STEPS.length - 1 ? 'Start farming' : 'Next';
    }
  }

  private goToStep(index: number): void {
    const next = Math.max(0, Math.min(STEPS.length - 1, index));
    if (next === this.stepIndex) return;
    this.stepIndex = next;
    this.renderStep();
  }

  private advance(): void {
    if (this.stepIndex === STEPS.length - 1) {
      this.close({ ...this.look });
      return;
    }
    this.goToStep(this.stepIndex + 1);
  }

  private row(label: string, key: ColorKey, colors: string[], onPick?: () => void): HTMLElement {
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
    const name = this.look.name;
    const pronouns = this.look.pronouns;
    this.look = { ...APPEARANCE_DEFAULT, ...preset.look, name, pronouns };
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
      facialHair: pick(FACIAL_HAIR.length),
      build: pick(BUILDS.length),
      name: this.look.name,
      pronouns: this.look.pronouns,
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
    this.syncMarks();
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

  private syncMarks(): void {
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
    if (this.previewTimer !== null) {
      window.clearInterval(this.previewTimer);
      this.previewTimer = null;
    }
    this.root?.remove();
    this.root = null;
    this.card = null;
    this.preview = null;
    this.animateButton = null;
    this.stepNav = null;
    this.stepPanel = null;
    this.stepButtons = [];
    this.prevButton = null;
    this.nextButton = null;
    this.onDone(look);
  }
}
