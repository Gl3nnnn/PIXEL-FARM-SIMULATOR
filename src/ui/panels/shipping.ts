import { ITEMS } from '../../data/definitions';
import { audio } from '../../systems/audio';
import { formatNumber } from '../../systems/util';
import type { UIContext } from '../context';
import { button, el, emptyState, iconImg, pill, section } from '../uiKit';

export function renderShipping(ctx: UIContext, root: HTMLElement): void {
  const content = el('div', 'panel-content');
  const render = () => {
    content.innerHTML = '';
    const state = ctx.state;
    const info = state.shippingState();

    const hero = el('div', 'level-card');
    const text = el('div');
    text.appendChild(el('h3', undefined, 'Shipping Bin'));
    text.appendChild(
      el(
        'p',
        'hint',
        info.bin
          ? 'Anything left here is sold overnight at the market price. Sleep to collect.'
          : 'Build a Shipping Bin on the farm to send goods to market overnight.'
      )
    );
    hero.appendChild(text);
    hero.appendChild(el('div', 'inline-coins', `${formatNumber(info.value)} coins waiting`));
    content.appendChild(hero);

    const send = section('Backpack', 'Move goods into the bin. Locked items stay with you.');
    if (!info.bin) {
      send.appendChild(emptyState('No shipping bin on the farm yet. Build one from the Build menu.'));
    } else {
      let any = false;
      for (let i = 0; i < state.data.inventory.length; i++) {
        const stack = state.data.inventory[i];
        if (!stack) continue;
        const def = ITEMS[stack.itemId];
        if (!def || def.type === 'tool') continue;
        any = true;
        const row = el('div', 'list-row compact');
        row.appendChild(iconImg(ctx.icon(stack.itemId), 34, def.name));
        const label = el('div', 'list-info grow');
        label.appendChild(el('strong', undefined, `${def.name} ×${formatNumber(stack.qty)}`));
        label.appendChild(
          el('span', 'hint', `${formatNumber(state.sellPrice(stack.itemId, stack.quality))}g each · ${stack.quality}`)
        );
        row.appendChild(label);
        const actions = el('div', 'row-actions');
        if (stack.locked) actions.appendChild(pill('Locked', 'warn'));
        actions.appendChild(
          button('Ship 1', {
            small: true,
            disabled: stack.locked,
            onClick: () => {
              const result = state.queueForShipping(i, 1);
              ctx.toast(result.message ?? '', result.ok ? 'success' : 'error');
              audio.play(result.ok ? 'click' : 'error');
              if (result.ok) ctx.requestSave();
              render();
            }
          })
        );
        actions.appendChild(
          button('Ship all', {
            small: true,
            variant: 'primary',
            disabled: stack.locked,
            onClick: () => {
              const result = state.queueForShipping(i, stack.qty);
              ctx.toast(result.message ?? '', result.ok ? 'success' : 'error');
              audio.play(result.ok ? 'click' : 'error');
              if (result.ok) ctx.requestSave();
              render();
            }
          })
        );
        row.appendChild(actions);
        send.appendChild(row);
      }
      if (!any) send.appendChild(emptyState('Your backpack has nothing to ship.'));
      if (any) {
        const actions = el('div', 'row-actions');
        actions.appendChild(
          button('Ship everything', {
            variant: 'gold',
            onClick: () => {
              const result = state.shipAll();
              ctx.toast(result.message ?? '', result.ok ? 'success' : 'error');
              audio.play(result.ok ? 'level' : 'error');
              if (result.ok) ctx.requestSave();
              render();
            }
          })
        );
        send.appendChild(actions);
      }
    }
    content.appendChild(send);

    const waiting = section('Waiting for the Trader', 'These goods sell when you sleep.');
    if (info.items.length === 0) {
      waiting.appendChild(emptyState('The bin is empty.'));
    } else {
      for (let i = 0; i < info.items.length; i++) {
        const stack = info.items[i];
        const def = ITEMS[stack.itemId];
        if (!def) continue;
        const row = el('div', 'list-row compact');
        row.appendChild(iconImg(ctx.icon(stack.itemId), 34, def.name));
        const label = el('div', 'list-info grow');
        label.appendChild(el('strong', undefined, `${def.name} ×${formatNumber(stack.qty)}`));
        label.appendChild(
          el('span', 'hint', `${formatNumber(state.sellPrice(stack.itemId, stack.quality) * stack.qty)}g estimated`)
        );
        row.appendChild(label);
        row.appendChild(
          button('Take one', {
            small: true,
            onClick: () => {
              const result = state.takeBackShipping(i);
              ctx.toast(result.message ?? '', result.ok ? 'success' : 'error');
              audio.play(result.ok ? 'click' : 'error');
              if (result.ok) ctx.requestSave();
              render();
            }
          })
        );
        waiting.appendChild(row);
      }
    }
    content.appendChild(waiting);

    // The storehouse shelf: anything valuable that left the farm by mistake can
    // be bought back here for a fee, so nothing is lost for good.
    const lost = state.lostItemState();
    const shelf = section(
      'Lost and found',
      `The storehouse keeps valuable goods for ${lost.keepDays} days. Hand back a small fee to reclaim them.`
    );
    if (lost.items.length === 0) {
      shelf.appendChild(emptyState('The shelf is empty. Nothing of yours has gone missing.'));
    } else {
      for (const entry of lost.items) {
        if (!entry.def) continue;
        const row = el('div', 'list-row compact');
        row.appendChild(iconImg(ctx.icon(entry.entry.itemId), 34, entry.def.name));
        const label = el('div', 'list-info grow');
        label.appendChild(el('strong', undefined, `${entry.def.name} ×${formatNumber(entry.entry.qty)}`));
        label.appendChild(
          el('span', 'hint', `Reclaim for ${formatNumber(entry.fee)}g · ${entry.daysLeft} days left`)
        );
        row.appendChild(label);
        row.appendChild(
          button('Reclaim', {
            small: true,
            variant: 'gold',
            disabled: state.data.coins < entry.fee,
            onClick: () => {
              const result = state.reclaimLostItem(entry.index);
              ctx.toast(result.message ?? '', result.ok ? 'success' : 'error');
              audio.play(result.ok ? 'click' : 'error');
              if (result.ok) ctx.requestSave();
              render();
            }
          })
        );
        shelf.appendChild(row);
      }
    }
    content.appendChild(shelf);

    const footer = el('div', 'panel-footer');
    footer.appendChild(button('Back to town', { onClick: () => ctx.openPanel('town') }));
    footer.appendChild(button('Close', { onClick: () => ctx.closePanel() }));
    content.appendChild(footer);
  };

  root.appendChild(content);
  render();
  ctx.setPanelRefresh(render);
}
