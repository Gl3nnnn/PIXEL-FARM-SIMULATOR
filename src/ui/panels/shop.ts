import { CROPS, ITEMS, SEASON_INFO, SEED_IDS, UPGRADES, cropForSeed, levelFromXp } from '../../data/definitions';
import { audio } from '../../systems/audio';
import { formatNumber } from '../../systems/util';
import type { UIContext } from '../context';
import {
  button,
  el,
  emptyState,
  iconImg,
  itemLabel,
  panelHeader,
  pill,
  section,
  tabs
} from '../uiKit';

export function renderShop(ctx: UIContext, root: HTMLElement): void {
  let tab = 0;
  const content = el('div', 'panel-content');

  const render = () => {
    content.innerHTML = '';
    const state = ctx.state;
    const head = panelHeader('General Store', 'Seeds, supplies and farm upgrades.');
    const coins = el('div', 'inline-coins', `${formatNumber(state.data.coins)} coins`);
    head.appendChild(coins);
    content.appendChild(head);
    content.appendChild(tabs(['Seeds', 'Supplies', 'Upgrades'], tab, (i) => {
      tab = i;
      render();
    }));

    if (tab === 0) {
      const sec = section('Seeds', 'Season restrictions apply unless you own a greenhouse.');
      const grid = el('div', 'card-grid');
      for (const seedId of SEED_IDS) {
        const item = ITEMS[seedId];
        const crop = cropForSeed(seedId);
        if (!item || !crop) continue;
        const card = el('div', 'shop-card');
        card.appendChild(iconImg(ctx.icon(seedId), 40, item.name));
        const info = el('div', 'shop-info');
        info.appendChild(el('strong', undefined, item.name));
        info.appendChild(el('span', 'hint', `${crop.growthDays} days · ${crop.regrowDays ? 'regrows' : 'replant'}`));
        const tags = el('div', 'tag-row');
        for (const season of crop.seasons) {
          tags.appendChild(pill(SEASON_INFO[season].name, `season-${season}`));
        }
        if (!state.canPlantCrop(crop.id)) tags.appendChild(pill('Out of season', 'warn'));
        info.appendChild(tags);
        card.appendChild(info);
        const actions = el('div', 'shop-actions');
        actions.appendChild(el('span', 'price', `${item.price}g`));
        for (const qty of [1, 5, 10]) {
          const btn = button(`+${qty}`, {
            small: true,
            disabled: state.data.coins < item.price * qty,
            onClick: () => {
              const result = state.buyItem(seedId, qty);
              ctx.toast(result.message ?? '', result.ok ? 'success' : 'error');
              audio.play(result.ok ? 'coin' : 'error');
              if (result.ok) ctx.requestSave();
              render();
            }
          });
          actions.appendChild(btn);
        }
        card.appendChild(actions);
        grid.appendChild(card);
      }
      sec.appendChild(grid);
      content.appendChild(sec);
    } else if (tab === 1) {
      const sec = section('Supplies', 'Feed, bait and the tools you need at the pond and quarry.');
      const grid = el('div', 'card-grid');
      for (const id of ['feed', 'fertilizer', 'bait', 'fishing_rod', 'pickaxe']) {
        const item = ITEMS[id];
        const card = el('div', 'shop-card');
        card.appendChild(iconImg(ctx.icon(id), 40, item.name));
        const info = el('div', 'shop-info');
        info.appendChild(el('strong', undefined, item.name));
        info.appendChild(el('span', 'hint', item.desc));
        info.appendChild(el('span', 'hint', `In inventory: ${state.countItem(id)}`));
        card.appendChild(info);
        const actions = el('div', 'shop-actions');
        actions.appendChild(el('span', 'price', `${item.price}g`));
        for (const qty of item.stack <= 1 ? [1] : [1, 5, 10]) {
          actions.appendChild(
            button(`+${qty}`, {
              small: true,
              disabled: state.data.coins < item.price * qty,
              onClick: () => {
                const result = state.buyItem(id, qty);
                ctx.toast(result.message ?? '', result.ok ? 'success' : 'error');
                audio.play(result.ok ? 'coin' : 'error');
                if (result.ok) ctx.requestSave();
                render();
              }
            })
          );
        }
        card.appendChild(actions);
        grid.appendChild(card);
      }
      sec.appendChild(grid);
      content.appendChild(sec);
    } else {
      const sec = section('Tool Upgrades', 'Permanent improvements to your daily work.');
      const grid = el('div', 'card-grid wide');
      for (const up of UPGRADES) {
        const level = state.data.upgrades[up.id] ?? 0;
        const maxed = level >= up.maxLevel;
        const cost = up.baseCost * (level + 1);
        const locked = state.level < up.unlockLevel;
        const card = el('div', 'shop-card column');
        const info = el('div', 'shop-info');
        info.appendChild(el('strong', undefined, up.name));
        info.appendChild(el('span', 'hint', up.desc));
        info.appendChild(el('span', 'hint', `Level ${level} / ${up.maxLevel}`));
        if (locked) info.appendChild(pill(`Farmer level ${up.unlockLevel} required`, 'warn'));
        card.appendChild(info);
        const actions = el('div', 'shop-actions');
        if (maxed) {
          actions.appendChild(pill('Maxed out', 'good'));
        } else {
          actions.appendChild(el('span', 'price', `${cost}g`));
          actions.appendChild(
            button('Upgrade', {
              small: true,
              variant: 'primary',
              disabled: locked || state.data.coins < cost,
              onClick: () => {
                const result = state.upgradeTool(up.id);
                ctx.toast(result.message ?? '', result.ok ? 'success' : 'error');
                audio.play(result.ok ? 'level' : 'error');
                if (result.ok) ctx.requestSave();
                render();
              }
            })
          );
        }
        card.appendChild(actions);
        grid.appendChild(card);
      }
      sec.appendChild(grid);
      content.appendChild(sec);
    }

    const hp = el('p', 'hint center');
    hp.textContent = `Farming level ${levelFromXp(state.data.xp.farming)} · Farmer level ${state.level}`;
    content.appendChild(hp);
  };

  root.appendChild(content);
  render();
  ctx.setPanelRefresh(render);
}
