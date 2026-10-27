import { ANIMALS, ITEMS } from '../../data/definitions';
import { audio } from '../../systems/audio';
import { formatNumber } from '../../systems/util';
import type { UIContext } from '../context';
import {
  button,
  el,
  emptyState,
  iconImg,
  pill,
  progressBar,
  section
} from '../uiKit';

export function renderAnimals(ctx: UIContext, root: HTMLElement): void {
  const content = el('div', 'panel-content');
  const render = () => {
    content.innerHTML = '';
    const state = ctx.state;
    const coopCap = state.housingCapacity('coop');
    const barnCap = state.housingCapacity('barn');
    const coopUsed = state.animalsInHousing('coop');
    const barnUsed = state.animalsInHousing('barn');
    const status = el('div', 'housing-status panel-toolbar');
    status.appendChild(el('span', 'pill', `Coop ${coopUsed}/${coopCap}`));
    status.appendChild(el('span', 'pill', `Barn ${barnUsed}/${barnCap}`));
    status.appendChild(el('span', 'pill', `Feed ×${state.countItem('feed')}`));
    status.appendChild(el('div', 'inline-coins', `${formatNumber(state.data.coins)} coins`));
    status.appendChild(
      button('Feed all', {
        small: true,
        variant: 'primary',
        disabled: state.data.animals.filter((a) => !a.fed).length === 0 || !state.hasItem('feed'),
        onClick: () => {
          const result = state.feedAll();
          ctx.toast(result.message ?? '', result.ok ? 'success' : 'error');
          audio.play(result.ok ? 'animal' : 'error');
          if (result.ok) ctx.requestSave();
          render();
        }
      })
    );
    content.appendChild(status);

    const buySec = section('Buy animals', 'Animals need the matching building with free space.');
    const buyGrid = el('div', 'card-grid wide');
    for (const def of Object.values(ANIMALS)) {
      const cap = state.housingCapacity(def.housing);
      const used = state.animalsInHousing(def.housing);
      const room = used < cap;
      const card = el('div', 'shop-card');
      card.appendChild(iconImg(ctx.icon(def.productId), 40, def.name));
      const info = el('div', 'shop-info');
      info.appendChild(el('strong', undefined, def.name));
      info.appendChild(el('span', 'hint', def.desc));
      info.appendChild(
        el('span', 'hint', `Produces ${ITEMS[def.productId]?.name ?? def.productId} · matures in ${def.maturityDays} days`)
      );
      const tags = el('div', 'tag-row');
      tags.appendChild(pill(def.housing === 'coop' ? 'Coop' : 'Barn'));
      if (!room) tags.appendChild(pill('No housing space', 'warn'));
      info.appendChild(tags);
      card.appendChild(info);
      const actions = el('div', 'shop-actions');
      actions.appendChild(el('span', 'price', `${def.price}g`));
      actions.appendChild(
        button('Buy', {
          small: true,
          variant: 'primary',
          disabled: !room || state.data.coins < def.price,
          onClick: () => {
            const result = state.buyAnimal(def.id);
            ctx.toast(result.message ?? '', result.ok ? 'success' : 'error');
            audio.play(result.ok ? 'animal' : 'error');
            if (result.ok) ctx.requestSave();
            render();
          }
        })
      );
      card.appendChild(actions);
      buyGrid.appendChild(card);
    }
    buySec.appendChild(buyGrid);
    content.appendChild(buySec);

    const listSec = section('Your animals', 'Feed once per day. Happy, fed animals produce goods.');
    if (state.data.animals.length === 0) {
      listSec.appendChild(emptyState('No animals yet. Build a coop or barn, then buy your first animal.'));
    }
    for (const animal of state.data.animals) {
      const def = ANIMALS[animal.species];
      if (!def) continue;
      const mature = state.animalMature(animal);
      const row = el('div', 'animal-row');
      const portrait = el('div', 'animal-portrait');
      portrait.appendChild(iconImg(ctx.icon(def.productId), 40, def.name));
      row.appendChild(portrait);
      const info = el('div', 'list-info grow');
      const title = el('div', 'row-title');
      title.appendChild(el('strong', undefined, def.name));
      if (!mature) title.appendChild(pill(`Baby · ${animal.ageDays}/${def.maturityDays} days`, 'warn'));
      if (animal.productReady) title.appendChild(pill('Product ready', 'good'));
      if (animal.fed) title.appendChild(pill('Fed', 'good'));
      info.appendChild(title);
      const bars = el('div', 'mini-bars');
      const happyWrap = el('div', 'mini-stat');
      happyWrap.appendChild(el('span', 'hint', `Happiness ${Math.round(animal.happiness)}`));
      happyWrap.appendChild(progressBar(animal.happiness, 100, undefined, 'happy'));
      const healthWrap = el('div', 'mini-stat');
      healthWrap.appendChild(el('span', 'hint', `Health ${Math.round(animal.health)}`));
      healthWrap.appendChild(progressBar(animal.health, 100, undefined, 'health'));
      bars.append(happyWrap, healthWrap);
      info.appendChild(bars);
      row.appendChild(info);
      const actions = el('div', 'row-actions wrap');
      actions.appendChild(
        button(animal.fed ? 'Fed' : 'Feed', {
          small: true,
          disabled: animal.fed || !state.hasItem('feed'),
          onClick: () => {
            const result = state.feedAnimal(animal.uid);
            ctx.toast(result.message ?? '', result.ok ? 'success' : 'error');
            audio.play(result.ok ? 'animal' : 'error');
            if (result.ok) ctx.requestSave();
            render();
          }
        })
      );
      actions.appendChild(
        button(animal.petted ? 'Petted' : 'Pet', {
          small: true,
          disabled: animal.petted,
          onClick: () => {
            const result = state.petAnimal(animal.uid);
            ctx.toast(result.message ?? '', result.ok ? 'success' : 'error');
            audio.play(result.ok ? 'animal' : 'error');
            if (result.ok) ctx.requestSave();
            render();
          }
        })
      );
      actions.appendChild(
        button('Collect', {
          small: true,
          variant: 'gold',
          disabled: !animal.productReady,
          onClick: () => {
            const result = state.collectAnimal(animal.uid);
            ctx.toast(result.message ?? '', result.ok ? 'success' : 'error');
            audio.play(result.ok ? 'harvest' : 'error');
            if (result.ok) ctx.requestSave();
            render();
          }
        })
      );
      row.appendChild(actions);
      listSec.appendChild(row);
    }
    content.appendChild(listSec);

    const breedSec = section('Breeding', 'Two mature, happy animals + 3 feed = a baby.');
    const speciesWithPairs = Object.values(ANIMALS).filter((def) => {
      const group = state.data.animals.filter((a) => a.species === def.id && state.animalMature(a));
      return group.length >= 2;
    });
    if (speciesWithPairs.length === 0) {
      breedSec.appendChild(emptyState('Raise two mature animals of the same species to breed.'));
    } else {
      const breedRow = el('div', 'list-row wrap-actions');
      for (const def of speciesWithPairs) {
        const group = state.data.animals.filter((a) => a.species === def.id && state.animalMature(a));
        const actions = el('div', 'row-actions');
        actions.appendChild(el('span', 'hint', `${def.name} pair`));
        actions.appendChild(
          button('Breed', {
            small: true,
            disabled: !state.hasItem('feed', 3),
            onClick: () => {
              const result = state.breedAnimals(group[0].uid, group[1].uid);
              ctx.toast(result.message ?? '', result.ok ? 'success' : 'error');
              audio.play(result.ok ? 'level' : 'error');
              if (result.ok) ctx.requestSave();
              render();
            }
          })
        );
        breedRow.appendChild(actions);
      }
      breedSec.appendChild(breedRow);
    }
    content.appendChild(breedSec);

    const footer = el('div', 'panel-footer');
    footer.appendChild(button('Close', { onClick: () => ctx.closePanel() }));
    content.appendChild(footer);
  };

  root.appendChild(content);
  render();
  ctx.setPanelRefresh(render);
}
