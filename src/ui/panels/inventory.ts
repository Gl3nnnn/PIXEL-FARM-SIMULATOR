import { ITEMS, QUALITY_LABEL, QUALITY_MULTIPLIER } from '../../data/definitions';
import { audio } from '../../systems/audio';
import { formatNumber } from '../../systems/util';
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

export function renderInventory(ctx: UIContext, root: HTMLElement): void {
  const content = el('div', 'panel-content');
  let selected = -1;

  const render = () => {
    content.innerHTML = '';
    const state = ctx.state;
    const used = state.data.inventory.filter(Boolean).length;
    const toolbar = el('div', 'panel-toolbar');
    toolbar.appendChild(el('p', 'hint', `${used} / ${state.capacity()} slots used · Drag items to reorganise.`));
    toolbar.appendChild(el('div', 'inline-coins', `${formatNumber(state.data.coins)} coins`));
    content.appendChild(toolbar);
    content.appendChild(progressBar(used, state.capacity(), `${used}/${state.capacity()}`, 'bag'));

    const layout = el('div', 'inventory-layout');
    const grid = el('div', 'inventory-grid');
    for (let i = 0; i < state.capacity(); i++) {
      const stack = state.data.inventory[i] ?? null;
      const slot = el('button', `inv-slot${selected === i ? ' selected' : ''}`);
      slot.type = 'button';
      if (stack) {
        const def = ITEMS[stack.itemId];
        const label = def ? itemLabel(stack.itemId, stack.quality) : stack.itemId;
        slot.title = label;
        slot.setAttribute('aria-label', `${label} ×${stack.qty}`);
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
        if (a && b && a.itemId === b.itemId && a.quality === b.quality) {
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
            button(`Sell 1 (${state.sellPrice(stack.itemId, stack.quality)}g)`, {
              variant: 'gold',
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
  };

  root.appendChild(content);
  render();
  ctx.setPanelRefresh(render);
}
