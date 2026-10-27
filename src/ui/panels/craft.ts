import { ITEMS, RECIPES } from '../../data/definitions';
import { audio } from '../../systems/audio';
import { formatNumber } from '../../systems/util';
import type { UIContext } from '../context';
import {
  button,
  el,
  emptyState,
  iconImg,
  panelHeader,
  pill,
  section
} from '../uiKit';

export function renderCraft(ctx: UIContext, root: HTMLElement): void {
  const content = el('div', 'panel-content');
  const render = () => {
    content.innerHTML = '';
    const state = ctx.state;
    const head = panelHeader('Workshop', 'Turn raw goods into valuable products.');
    head.appendChild(el('div', 'inline-coins', `${formatNumber(state.data.coins)} coins`));
    content.appendChild(head);

    if (!state.hasWorkshop()) {
      const warn = el('div', 'notice warn');
      warn.textContent = 'You need a Workshop to craft goods. Build one from the Build menu.';
      content.appendChild(warn);
    }

    const sec = section('Recipes', 'Each craft grants crafting XP and increases your profits.');
    const grid = el('div', 'card-grid wide');
    for (const recipe of RECIPES) {
      const out = ITEMS[recipe.output.itemId];
      const locked = state.level < recipe.unlockLevel;
      const card = el('div', 'craft-card');
      card.appendChild(iconImg(ctx.icon(recipe.output.itemId), 44, out?.name ?? recipe.id));
      const info = el('div', 'shop-info grow');
      info.appendChild(el('strong', undefined, recipe.name));
      info.appendChild(el('span', 'hint', recipe.desc));
      const ingredients = el('div', 'ingredient-row');
      for (const input of recipe.inputs) {
        const have = state.countItem(input.itemId);
        const line = el('span', `ingredient${have >= input.qty ? '' : ' missing'}`);
        line.appendChild(iconImg(ctx.icon(input.itemId), 22, ITEMS[input.itemId]?.name ?? input.itemId));
        line.appendChild(el('span', undefined, `${have}/${input.qty}`));
        ingredients.appendChild(line);
      }
      info.appendChild(ingredients);
      const tags = el('div', 'tag-row');
      tags.appendChild(pill(`Sells ${out?.sell ?? 0}g`, 'good'));
      if (recipe.coins > 0) tags.appendChild(pill(`+${recipe.coins}g fee`));
      if (locked) tags.appendChild(pill(`Level ${recipe.unlockLevel}`, 'warn'));
      if (!state.hasWorkshop()) tags.appendChild(pill('Workshop required', 'warn'));
      info.appendChild(tags);
      card.appendChild(info);
      const actions = el('div', 'row-actions');
      const missing = recipe.inputs.some((i) => state.countItem(i.itemId) < i.qty);
      actions.appendChild(
        button('Craft', {
          small: true,
          variant: 'primary',
          disabled: locked || !state.hasWorkshop() || missing || state.data.coins < recipe.coins,
          onClick: () => {
            const result = state.craft(recipe.id);
            ctx.toast(result.message ?? '', result.ok ? 'success' : 'error');
            audio.play(result.ok ? 'craft' : 'error');
            if (result.ok) ctx.requestSave();
            render();
          }
        })
      );
      card.appendChild(actions);
      grid.appendChild(card);
    }
    sec.appendChild(grid);
    if (RECIPES.length === 0) sec.appendChild(emptyState('No recipes available.'));
    content.appendChild(sec);

    const footer = el('div', 'panel-footer');
    footer.appendChild(button('Close', { onClick: () => ctx.closePanel() }));
    content.appendChild(footer);
  };

  root.appendChild(content);
  render();
  ctx.setPanelRefresh(render);
}
