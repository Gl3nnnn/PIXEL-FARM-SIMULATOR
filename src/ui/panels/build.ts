import { BUILDINGS, PLOTS } from '../../data/definitions';
import { audio } from '../../systems/audio';
import { formatNumber } from '../../systems/util';
import type { UIContext } from '../context';
import { button, el, panelHeader, pill, section } from '../uiKit';

export function renderBuild(ctx: UIContext, root: HTMLElement): void {
  const content = el('div', 'panel-content');
  const render = () => {
    content.innerHTML = '';
    const state = ctx.state;
    const head = panelHeader('Build & Expand', 'Place buildings with a live grid preview.');
    head.appendChild(el('div', 'inline-coins', `${formatNumber(state.data.coins)} coins`));
    content.appendChild(head);

    const owned = (id: string) => state.data.buildings.filter((b) => b.id === id).length;

    const buildingsSec = section('Buildings', 'Select a building, then click the ground to place it.');
    const grid = el('div', 'card-grid wide');
    for (const def of Object.values(BUILDINGS)) {
      if (def.id === 'farmhouse') continue;
      const locked = state.level < def.unlockLevel;
      const count = owned(def.id);
      const card = el('div', 'build-card');
      const info = el('div', 'shop-info');
      info.appendChild(el('strong', undefined, def.name));
      info.appendChild(el('span', 'hint', def.desc));
      const tags = el('div', 'tag-row');
      tags.appendChild(pill(`${def.w}×${def.h}`));
      tags.appendChild(pill(def.kind));
      if (count > 0) tags.appendChild(pill(`owned ${count}`, 'good'));
      if (locked) tags.appendChild(pill(`Level ${def.unlockLevel}`, 'warn'));
      info.appendChild(tags);
      card.appendChild(info);
      const actions = el('div', 'shop-actions');
      actions.appendChild(el('span', 'price', `${def.cost}g`));
      actions.appendChild(
        button('Place', {
          small: true,
          variant: 'primary',
          disabled: locked || state.data.coins < def.cost,
          title: locked ? `Requires farmer level ${def.unlockLevel}` : 'Enter placement mode',
          onClick: () => {
            ctx.closePanel();
            ctx.beginBuild(def.id);
            audio.play('click');
          }
        })
      );
      card.appendChild(actions);
      grid.appendChild(card);
    }
    buildingsSec.appendChild(grid);
    content.appendChild(buildingsSec);

    const landSec = section('Land & Home', 'Unlock new fields to grow your empire.');
    const next = state.nextPlot();
    const landRow = el('div', 'list-row');
    const landInfo = el('div', 'list-info');
    if (next) {
      landInfo.appendChild(el('strong', undefined, `Next field: ${next.name}`));
      landInfo.appendChild(el('span', 'hint', `${next.w}×${next.h} field tiles · costs ${next.cost} coins`));
    } else {
      landInfo.appendChild(el('strong', undefined, 'All fields unlocked'));
      landInfo.appendChild(el('span', 'hint', 'Your farm spans the whole valley.'));
    }
    landRow.appendChild(landInfo);
    const landActions = el('div', 'row-actions');
    landActions.appendChild(
      button(next ? `Buy field (${next.cost}g)` : 'Complete', {
        variant: 'gold',
        disabled: !next || state.data.coins < next.cost,
        onClick: () => {
          const result = state.expandLand();
          ctx.toast(result.message ?? '', result.ok ? 'success' : 'error');
          audio.play(result.ok ? 'level' : 'error');
          if (result.ok) ctx.requestSave();
          render();
        }
      })
    );
    landRow.appendChild(landActions);
    landSec.appendChild(landRow);

    const houseRow = el('div', 'list-row');
    const houseInfo = el('div', 'list-info');
    houseInfo.appendChild(el('strong', undefined, `Farmhouse · level ${state.data.farmhouseLevel}`));
    houseInfo.appendChild(
      el('span', 'hint', `Upgrades add 4 backpack slots per level. Max level 3.`)
    );
    houseRow.appendChild(houseInfo);
    const houseActions = el('div', 'row-actions');
    houseActions.appendChild(
      button(
        state.data.farmhouseLevel >= 3 ? 'Maxed' : `Upgrade (${state.farmhouseUpgradeCost()}g)`,
        {
          variant: 'primary',
          disabled: state.data.farmhouseLevel >= 3 || state.data.coins < state.farmhouseUpgradeCost(),
          onClick: () => {
            const result = state.upgradeFarmhouse();
            ctx.toast(result.message ?? '', result.ok ? 'success' : 'error');
            audio.play(result.ok ? 'level' : 'error');
            if (result.ok) ctx.requestSave();
            render();
          }
        }
      )
    );
    houseRow.appendChild(houseActions);
    landSec.appendChild(houseRow);

    const unlocked = PLOTS.slice(0, state.data.unlockedPlots);
    landSec.appendChild(
      el(
        'p',
        'hint',
        `Fields owned: ${unlocked.map((p) => p.name).join(', ')}`
      )
    );
    content.appendChild(landSec);

    content.appendChild(
      el(
        'p',
        'hint center',
        'Greenhouse: plant any season · Workshop: crafting · Shed: +24 slots · Coop/Barn: animal housing · Well/Sprinkler: auto-water.'
      )
    );
    const footer = el('div', 'panel-footer');
    footer.appendChild(button('Close', { onClick: () => ctx.closePanel() }));
    content.appendChild(footer);
  };

  root.appendChild(content);
  render();
  ctx.setPanelRefresh(render);
}
