import type { ItemDef, Quality } from '../types';
import { ITEMS, QUALITY_LABEL } from '../data/definitions';
import { formatNumber } from '../systems/util';

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export interface ButtonOptions {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'gold';
  small?: boolean;
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
}

export function button(label: string, options: ButtonOptions = {}): HTMLButtonElement {
  const btn = el('button', `btn ${options.variant ?? 'secondary'}${options.small ? ' small' : ''}`);
  btn.type = 'button';
  btn.textContent = label;
  if (options.title) btn.title = options.title;
  if (options.disabled) btn.disabled = true;
  if (options.onClick) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      options.onClick?.();
    });
  }
  return btn;
}

export function iconImg(src: string, size = 40, alt = ''): HTMLImageElement {
  const img = el('img', 'item-icon');
  img.src = src;
  img.width = size;
  img.height = size;
  img.alt = alt;
  img.draggable = false;
  return img;
}

export function itemCell(itemId: string, iconSrc: string, qty?: number, quality: Quality = 'normal'): HTMLElement {
  const def = ITEMS[itemId];
  const wrap = el('div', 'item-cell');
  const img = iconImg(iconSrc, 42, def?.name ?? itemId);
  wrap.appendChild(img);
  if (quality !== 'normal') {
    const badge = el('span', `quality-badge ${quality}`, quality === 'gold' ? 'G' : 'S');
    wrap.appendChild(badge);
  }
  if (qty !== undefined) {
    const count = el('span', 'item-qty', `×${formatNumber(qty)}`);
    wrap.appendChild(count);
  }
  return wrap;
}

export function itemLabel(itemId: string, quality: Quality = 'normal'): string {
  const def: ItemDef | undefined = ITEMS[itemId];
  if (!def) return itemId;
  return quality === 'normal' ? def.name : `${QUALITY_LABEL[quality]} ${def.name}`;
}

export function panelHeader(title: string, subtitle?: string): HTMLElement {
  const head = el('div', 'panel-head');
  const h2 = el('h2', 'panel-title', title);
  head.appendChild(h2);
  if (subtitle) head.appendChild(el('p', 'panel-subtitle', subtitle));
  return head;
}

export function section(title: string, hint?: string): HTMLElement {
  const wrap = el('section', 'ui-section');
  const row = el('div', 'section-head');
  row.appendChild(el('h3', undefined, title));
  if (hint) row.appendChild(el('span', 'hint', hint));
  wrap.appendChild(row);
  return wrap;
}

export function progressBar(value: number, max: number, label?: string, className = ''): HTMLElement {
  const wrap = el('div', `progress ${className}`.trim());
  const fill = el('div', 'progress-fill');
  fill.style.width = `${Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))}%`;
  wrap.appendChild(fill);
  if (label) {
    const text = el('span', 'progress-label', label);
    wrap.appendChild(text);
  }
  return wrap;
}

export function emptyState(text: string): HTMLElement {
  return el('p', 'empty-state', text);
}

export function pill(text: string, className = ''): HTMLElement {
  return el('span', `pill ${className}`.trim(), text);
}

export function confirmDialog(
  root: HTMLElement,
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void,
  danger = false
): void {
  const overlay = el('div', 'confirm-overlay');
  const box = el('div', 'confirm-box');
  box.appendChild(el('h3', undefined, title));
  box.appendChild(el('p', undefined, message));
  const actions = el('div', 'confirm-actions');
  const cancel = button('Cancel', {
    onClick: () => overlay.remove()
  });
  const ok = button(confirmLabel, {
    variant: danger ? 'danger' : 'primary',
    onClick: () => {
      overlay.remove();
      onConfirm();
    }
  });
  actions.append(cancel, ok);
  box.appendChild(actions);
  overlay.appendChild(box);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  root.appendChild(overlay);
}

export function tooltip(text: string): HTMLElement {
  const tip = el('span', 'tooltip', text);
  return tip;
}

export function statRow(label: string, value: string): HTMLElement {
  const row = el('div', 'stat-row');
  row.appendChild(el('span', 'stat-label', label));
  row.appendChild(el('span', 'stat-value', value));
  return row;
}

export function tabs(
  labels: string[],
  initial: number,
  onChange: (index: number) => void
): HTMLElement {
  const wrap = el('div', 'tabs');
  labels.forEach((label, i) => {
    const btn = button(label, {
      variant: i === initial ? 'primary' : 'ghost',
      small: true,
      onClick: () => {
        wrap.querySelectorAll('button').forEach((b) => {
          b.classList.remove('primary');
          b.classList.add('ghost');
        });
        const target = wrap.children[i] as HTMLButtonElement;
        target.classList.remove('ghost');
        target.classList.add('primary');
        onChange(i);
      }
    });
    wrap.appendChild(btn);
  });
  return wrap;
}
