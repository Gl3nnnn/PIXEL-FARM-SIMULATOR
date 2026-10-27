import { ITEMS, QUALITY_LABEL } from '../../data/definitions';
import { audio } from '../../systems/audio';
import { formatNumber } from '../../systems/util';
import type { UIContext } from '../context';
import { button, el, emptyState, iconImg, panelHeader, section } from '../uiKit';

export function renderMarket(ctx: UIContext, root: HTMLElement): void {
  const content = el('div', 'panel-content');
  const render = () => {
    content.innerHTML = '';
    const state = ctx.state;
    const head = panelHeader('Market', 'Sell harvested goods and crafted products.');
    head.appendChild(el('div', 'inline-coins', `${formatNumber(state.data.coins)} coins`));
    content.appendChild(head);

    const sec = section('Your goods', 'Silver and gold quality items sell for more.');
    const list = el('div', 'list');
    let any = false;
    state.data.inventory.forEach((stack, index) => {
      if (!stack) return;
      const def = ITEMS[stack.itemId];
      if (!def || def.type === 'tool') return;
      any = true;
      const unit = state.sellPrice(stack.itemId, stack.quality);
      const row = el('div', 'list-row');
      row.appendChild(iconImg(ctx.icon(stack.itemId), 36, def.name));
      const info = el('div', 'list-info');
      const name = stack.quality === 'normal' ? def.name : `${QUALITY_LABEL[stack.quality]} ${def.name}`;
      info.appendChild(el('strong', undefined, name));
      info.appendChild(el('span', 'hint', `${unit}g each · ×${stack.qty}`));
      row.appendChild(info);
      const actions = el('div', 'row-actions');
      actions.appendChild(
        button('Sell 1', {
          small: true,
          onClick: () => {
            const result = state.sellStack(index, 1);
            ctx.toast(result.message ?? '', result.ok ? 'success' : 'error');
            audio.play(result.ok ? 'coin' : 'error');
            if (result.ok) ctx.requestSave();
            render();
          }
        })
      );
      actions.appendChild(
        button(`Sell all (${formatNumber(unit * stack.qty)}g)`, {
          small: true,
          variant: 'gold',
          onClick: () => {
            const result = state.sellStack(index, stack.qty);
            ctx.toast(result.message ?? '', result.ok ? 'success' : 'error');
            audio.play(result.ok ? 'coin' : 'error');
            if (result.ok) ctx.requestSave();
            render();
          }
        })
      );
      row.appendChild(actions);
      list.appendChild(row);
    });
    if (!any) list.appendChild(emptyState('Nothing to sell yet. Harvest some crops first!'));
    sec.appendChild(list);
    content.appendChild(sec);

    const footer = el('div', 'panel-footer');
    footer.appendChild(
      button('Sell everything', {
        variant: 'gold',
        disabled: !any,
        onClick: () => {
          const result = state.sellAll();
          ctx.toast(result.message ?? '', result.ok ? 'success' : 'error');
          audio.play(result.ok ? 'coin' : 'error');
          if (result.ok) ctx.requestSave();
          render();
        }
      })
    );
    footer.appendChild(
      button('Close', {
        onClick: () => ctx.closePanel()
      })
    );
    content.appendChild(footer);
  };

  root.appendChild(content);
  render();
  ctx.setPanelRefresh(render);
}
