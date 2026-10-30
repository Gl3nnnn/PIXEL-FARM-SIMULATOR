import { ITEMS, QUALITY_LABEL, QUALITY_MULTIPLIER } from '../../data/definitions';
import { audio } from '../../systems/audio';
import { formatNumber } from '../../systems/util';
import type { InventoryStack, Quality } from '../../types';
import type { UIContext } from '../context';
import {
  button,
  el,
  emptyState,
  iconImg,
  itemCell,
  itemLabel,
  pill,
  progressBar
} from '../uiKit';

const TYPE_ORDER: Record<string, number> = {
  tool: 0,
  seed: 1,
  fertilizer: 2,
  feed: 3,
  crop: 4,
  product: 5,
  fish: 6,
  ore: 7,
  material: 8,
  crafted: 9
};

const QUALITY_ORDER: Record<Quality, number> = { gold: 0, silver: 1, normal: 2 };

/** Groups stacks by type, then name, then quality. Empty slots move to the end. */
function sortInventory(inventory: Array<InventoryStack | null>): void {
  const stacks = inventory.filter((stack): stack is InventoryStack => stack !== null);
  const typeRank = (itemId: string): number => TYPE_ORDER[ITEMS[itemId]?.type ?? ''] ?? 99;
  const nameOf = (itemId: string): string => ITEMS[itemId]?.name ?? itemId;
  stacks.sort(
    (a, b) =>
      typeRank(a.itemId) - typeRank(b.itemId) ||
      nameOf(a.itemId).localeCompare(nameOf(b.itemId)) ||
      QUALITY_ORDER[a.quality] - QUALITY_ORDER[b.quality]
  );
  const sorted: Array<InventoryStack | null> = [...stacks];
  while (sorted.length < inventory.length) sorted.push(null);
  inventory.splice(0, inventory.length, ...sorted);
}

export function renderInventory(ctx: UIContext, root: HTMLElement): void {
  const content = el('div', 'panel-content');
  let selected = -1;
  let query = '';
  // One entry per backpack slot, so typing in the search dims slots without redrawing the panel.
  let slotEls: HTMLElement[] = [];
  let slotNames: string[] = [];

  const applyFilter = (): void => {
    const q = query.trim().toLowerCase();
    slotEls.forEach((slot, i) => {
      const name = slotNames[i] ?? '';
      slot.style.opacity = !q || name.includes(q) ? '' : '0.25';
    });
  };

  const render = () => {
    content.innerHTML = '';
    const state = ctx.state;
    const used = state.data.inventory.filter(Boolean).length;
    const bagValue = state.data.inventory.reduce((sum, stack) => {
      const def = stack ? ITEMS[stack.itemId] : undefined;
      if (!stack || !def || def.type === 'tool') return sum;
      return sum + state.sellPrice(stack.itemId, stack.quality) * stack.qty;
    }, 0);

    const toolbar = el('div', 'panel-toolbar');
    toolbar.appendChild(el('p', 'hint', `${used} / ${state.capacity()} slots used · Drag items to reorganise.`));
    toolbar.appendChild(el('div', 'inline-coins', `${formatNumber(state.data.coins)} coins`));
    content.appendChild(toolbar);
    content.appendChild(progressBar(used, state.capacity(), `${used}/${state.capacity()}`, 'bag'));

    const searchBar = el('div', 'panel-toolbar');
    const search = document.createElement('input');
    search.type = 'search';
    search.placeholder = 'Search your backpack…';
    search.setAttribute('aria-label', 'Search your backpack');
    search.value = query;
    search.addEventListener('input', () => {
      query = search.value;
      applyFilter();
    });
    searchBar.appendChild(search);
    searchBar.appendChild(
      button('Sort', {
        small: true,
        variant: 'secondary',
        onClick: () => {
          sortInventory(state.data.inventory);
          selected = -1;
          state.emitChange();
          audio.play('click');
          render();
        }
      })
    );
    searchBar.appendChild(pill(`Bag value ${formatNumber(bagValue)}g`, 'gold'));
    content.appendChild(searchBar);

    const layout = el('div', 'inventory-layout');
    const grid = el('div', 'inventory-grid');
    slotEls = [];
    slotNames = [];
    for (let i = 0; i < state.capacity(); i++) {
      const stack = state.data.inventory[i] ?? null;
      const slot = el('button', `inv-slot${selected === i ? ' selected' : ''}`);
      slot.type = 'button';
      slotEls.push(slot);
      slotNames.push('');
      if (stack) {
        const def = ITEMS[stack.itemId];
        const label = def ? itemLabel(stack.itemId, stack.quality) : stack.itemId;
        const lockNote = stack.locked ? ' (locked)' : '';
        slot.title = `${label}${lockNote}`;
        slot.setAttribute('aria-label', `${label} ×${stack.qty}${lockNote}`);
        slotNames[i] = label.toLowerCase();
        slot.appendChild(itemCell(stack.itemId, ctx.icon(stack.itemId), stack.qty, stack.quality));
        slot.draggable = true;
        slot.addEventListener('dragstart', (e) => {
          e.dataTransfer?.setData('text/plain', String(i));
          slot.classList.add('dragging');
        });
        slot.addEventListener('dragend', () => slot.classList.remove('dragging'));
      } else {
        slot.setAttribute('aria-label', 'Empty slot');
        slot.classList.add('empty');
      }
      slot.addEventListener('dragover', (e) => {
        e.preventDefault();
        slot.classList.add('drop-target');
      });
      slot.addEventListener('dragleave', () => slot.classList.remove('drop-target'));
      slot.addEventListener('drop', (e) => {
        e.preventDefault();
        slot.classList.remove('drop-target');
        const from = Number(e.dataTransfer?.getData('text/plain'));
        if (!Number.isFinite(from) || from < 0 || from >= state.data.inventory.length) return;
        if (from === i) return;
        const a = state.data.inventory[from];
        const b = state.data.inventory[i] ?? null;
        // Only merge stacks with the same lock state, so a lock is never lost by accident.
        if (a && b && a.itemId === b.itemId && a.quality === b.quality && !!a.locked === !!b.locked) {
          const def = ITEMS[a.itemId];
          if (def && a.qty + b.qty <= def.stack) {
            a.qty += b.qty;
            state.data.inventory[i] = null;
            state.emitChange();
            selected = from;
            render();
            return;
          }
        }
        state.data.inventory[from] = b;
        state.data.inventory[i] = a;
        state.emitChange();
        selected = i;
        render();
      });
      slot.addEventListener('click', () => {
        selected = i;
        if (stack) {
          const def = ITEMS[stack.itemId];
          if (def && ['hoe', 'watering_can', 'fertilizer', 'seed'].includes(def.type)) {
            state.selectItem(stack.itemId);
            ctx.toast(`${def.name} equipped.`, 'success');
          }
        }
        audio.play('click');
        render();
      });
      grid.appendChild(slot);
    }
    layout.appendChild(grid);

    const detail = el('div', 'inventory-detail');
    const stack = selected >= 0 ? state.data.inventory[selected] : null;
    if (!stack) {
      detail.appendChild(emptyState('Select an item to see details.'));
    } else {
      const def = ITEMS[stack.itemId];
      if (def) {
        const top = el('div', 'detail-top');
        top.appendChild(iconImg(ctx.icon(stack.itemId), 56, def.name));
        const info = el('div');
        info.appendChild(el('h3', undefined, itemLabel(stack.itemId, stack.quality)));
        info.appendChild(el('p', 'hint', def.desc));
        if (stack.quality !== 'normal') {
          info.appendChild(
            pill(`${QUALITY_LABEL[stack.quality]} quality · ×${QUALITY_MULTIPLIER[stack.quality]} value`, stack.quality)
          );
        }
        if (stack.locked) {
          info.appendChild(pill('Locked · kept out of sales', 'warn'));
        }
        top.appendChild(info);
        detail.appendChild(top);
        const actions = el('div', 'panel-footer');
        const usable = ['hoe', 'watering_can', 'fertilizer', 'seed'].includes(def.type);
        if (usable) {
          const equipped = state.selectedItem() === stack.itemId;
          actions.appendChild(
            button(equipped ? 'Equipped in hotbar' : 'Equip in hotbar', {
              variant: equipped ? 'secondary' : 'primary',
              disabled: equipped,
              onClick: () => {
                state.selectItem(stack.itemId);
                ctx.toast(`${def.name} equipped.`, 'success');
                audio.play('click');
                ctx.closePanel();
              }
            })
          );
        }
        if (def.type !== 'tool') {
          actions.appendChild(
            button(stack.locked ? 'Unlock' : 'Lock from sales', {
              variant: 'secondary',
              onClick: () => {
                stack.locked = !stack.locked;
                state.emitChange();
                ctx.requestSave();
                audio.play('click');
                render();
              }
            })
          );
          actions.appendChild(
            button(`Sell 1 (${state.sellPrice(stack.itemId, stack.quality)}g)`, {
              variant: 'gold',
              disabled: stack.locked === true,
              onClick: () => {
                const result = state.sellStack(selected, 1);
                ctx.toast(result.message ?? '', result.ok ? 'success' : 'error');
                audio.play(result.ok ? 'coin' : 'error');
                if (result.ok) ctx.requestSave();
                if (!state.data.inventory[selected]) selected = -1;
                render();
              }
            })
          );
        }
        detail.appendChild(actions);
      }
    }
    layout.appendChild(detail);
    content.appendChild(layout);

    const footer = el('div', 'panel-footer');
    footer.appendChild(button('Close', { onClick: () => ctx.closePanel() }));
    content.appendChild(footer);

    const tips = el('p', 'hint center');
    tips.textContent = 'Tip: press 1–0 to pick hotbar items. Tools never break.';
    content.appendChild(tips);
    applyFilter();
  };

  root.appendChild(content);
  render();
  ctx.setPanelRefresh(render);
}
