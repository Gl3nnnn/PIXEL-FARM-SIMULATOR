import { BUILDINGS, FURNITURE } from '../../data/definitions';
import { audio } from '../../systems/audio';
import { formatNumber } from '../../systems/util';
import type { UIContext } from '../context';
import { button, el, emptyState, pill, progressBar, section } from '../uiKit';

export function renderHomestead(ctx: UIContext, root: HTMLElement): void {
  const content = el('div', 'panel-content');
  const render = () => {
    content.innerHTML = '';
    const state = ctx.state;
    const d = state.data;
    const family = state.familyState();
    const pet = state.petState();
    const house = state.houseState();

    const hero = el('div', 'level-card');
    const text = el('div');
    text.appendChild(el('h3', undefined, 'The Homestead'));
    text.appendChild(
      el(
        'p',
        'hint',
        family.spouse
          ? `A warm home shared with ${family.spouse}${family.children.length ? ` and ${family.children.length} child${family.children.length === 1 ? '' : 'ren'}` : ''}.`
          : 'A quiet house waiting for a family, a pet, and a little furniture.'
      )
    );
    hero.appendChild(text);
    hero.appendChild(el('div', 'inline-coins', `${formatNumber(d.coins)} coins`));
    content.appendChild(hero);

    // ---------------------------------------------------------------- family
    const familySec = section('Family', 'Marry a villager, then grow your household.');
    if (!family.spouse) {
      familySec.appendChild(emptyState('Build 10 hearts with a romanceable villager in People, then propose.'));
    } else {
      familySec.appendChild(el('p', 'hint', `Spouse: ${family.spouse}`));
      for (const child of family.children) {
        const row = el('div', 'list-row');
        const info = el('div', 'list-info');
        info.appendChild(el('strong', undefined, `${child.name} · ${child.stage}`));
        info.appendChild(el('span', 'hint', `With the family for ${child.ageDays} day${child.ageDays === 1 ? '' : 's'}.`));
        row.appendChild(info);
        familySec.appendChild(row);
      }
      const actions = el('div', 'row-actions');
      actions.appendChild(
        button(family.children.length >= 2 ? 'Full house' : 'Adopt a child (1,200g)', {
          variant: 'primary',
          disabled: !family.canAdopt || d.coins < 1200,
          title: family.canAdopt ? 'Grow your family' : family.reason,
          onClick: () => {
            const result = state.adoptChild();
            ctx.toast(result.message ?? '', result.ok ? 'reward' : 'error');
            audio.play(result.ok ? 'level' : 'error');
            if (result.ok) ctx.requestSave();
            render();
          }
        })
      );
      familySec.appendChild(actions);
      if (!family.canAdopt) familySec.appendChild(el('p', 'hint', family.reason));
    }
    content.appendChild(familySec);

    // ------------------------------------------------------------------- pet
    const petSec = section('Farm Pet', 'A companion who finds things and lifts your luck.');
    if (!pet.type) {
      petSec.appendChild(emptyState('No pet yet. The shelter has a dog and a cat looking for a farm.'));
      const actions = el('div', 'row-actions');
      actions.appendChild(
        button('Adopt a dog (500g)', {
          variant: 'primary',
          disabled: d.coins < 500,
          onClick: () => {
            const result = state.adoptPet('dog');
            ctx.toast(result.message ?? '', result.ok ? 'reward' : 'error');
            audio.play(result.ok ? 'level' : 'error');
            if (result.ok) ctx.requestSave();
            render();
          }
        })
      );
      actions.appendChild(
        button('Adopt a cat (500g)', {
          variant: 'primary',
          disabled: d.coins < 500,
          onClick: () => {
            const result = state.adoptPet('cat');
            ctx.toast(result.message ?? '', result.ok ? 'reward' : 'error');
            audio.play(result.ok ? 'level' : 'error');
            if (result.ok) ctx.requestSave();
            render();
          }
        })
      );
      petSec.appendChild(actions);
    } else {
      const row = el('div', 'list-row');
      const info = el('div', 'list-info');
      info.appendChild(el('strong', undefined, `${pet.name} the ${pet.type}`));
      info.appendChild(el('span', 'hint', `${pet.mood} · luck bonus +${Math.round(pet.bonus * 100)}%`));
      row.appendChild(info);
      const actions = el('div', 'row-actions');
      actions.appendChild(
        button('Pet', {
          small: true,
          variant: 'primary',
          disabled: pet.lastPetDay === state.today,
          onClick: () => {
            const result = state.petPet();
            ctx.toast(result.message ?? '', result.ok ? 'success' : 'error');
            audio.play(result.ok ? 'animal' : 'error');
            if (result.ok) ctx.requestSave();
            render();
          }
        })
      );
      row.appendChild(actions);
      petSec.appendChild(row);
      petSec.appendChild(progressBar(pet.affection, 100, `${pet.affection} / 100 affection`, 'xp'));
    }
    content.appendChild(petSec);

    // ----------------------------------------------------------------- horse
    const horseSec = section('Stable', 'A horse turns a long walk into a short one.');
    const stable = d.buildings.some((b) => BUILDINGS[b.id]?.houses === 'stable');
    const horseRow = el('div', 'list-row');
    const horseInfo = el('div', 'list-info');
    horseInfo.appendChild(el('strong', undefined, d.horseOwned ? 'A horse lives here' : 'The stable is empty'));
    horseInfo.appendChild(
      el(
        'span',
        'hint',
        d.horseOwned
          ? 'You move 35% faster around the farm.'
          : stable
            ? 'A horse costs 1,600 coins.'
            : 'Build a Stable on the farm first.'
      )
    );
    horseRow.appendChild(horseInfo);
    const horseActions = el('div', 'row-actions');
    if (d.horseOwned) horseActions.appendChild(pill('Riding', 'good'));
    else {
      horseActions.appendChild(
        button('Buy horse (1,600g)', {
          variant: 'gold',
          disabled: !stable || d.coins < 1600,
          onClick: () => {
            const result = state.buyHorse();
            ctx.toast(result.message ?? '', result.ok ? 'reward' : 'error');
            audio.play(result.ok ? 'level' : 'error');
            if (result.ok) ctx.requestSave();
            render();
          }
        })
      );
    }
    horseRow.appendChild(horseActions);
    horseSec.appendChild(horseRow);
    content.appendChild(horseSec);

    // -------------------------------------------------------------- furniture
    const decor = section(
      'Furniture',
      'Each piece gives a small permanent bonus. One of each.'
    );
    const bonusRow = el('div', 'tag-row');
    bonusRow.appendChild(pill(`+${house.bonuses.energy} energy`, 'good'));
    bonusRow.appendChild(pill(`+${Math.round(house.bonuses.luck * 100)}% luck`, 'good'));
    bonusRow.appendChild(pill(`+${house.bonuses.capacity} slots`, 'good'));
    bonusRow.appendChild(pill(`+${Math.round(house.bonuses.friendship * 100)}% friendship`, 'good'));
    decor.appendChild(bonusRow);

    const grid = el('div', 'card-grid wide');
    for (const entry of house.items) {
      const card = el('div', 'build-card');
      const body = el('div', 'shop-info');
      body.appendChild(el('strong', undefined, entry.def.name));
      body.appendChild(el('span', 'hint', entry.def.desc));
      const tags = el('div', 'tag-row');
      tags.appendChild(pill(entry.def.bonus));
      if (entry.owned) tags.appendChild(pill('Placed', 'good'));
      body.appendChild(tags);
      card.appendChild(body);
      const actions = el('div', 'shop-actions');
      if (entry.owned) {
        actions.appendChild(pill('Owned', 'good'));
      } else {
        actions.appendChild(el('span', 'price', `${entry.def.cost}g`));
        actions.appendChild(
          button('Place', {
            small: true,
            variant: 'primary',
            disabled: d.coins < entry.def.cost,
            onClick: () => {
              const result = state.buyFurniture(entry.def.id);
              ctx.toast(result.message ?? '', result.ok ? 'reward' : 'error');
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
    decor.appendChild(grid);
    content.appendChild(decor);

    if (FURNITURE.length === 0) decor.appendChild(emptyState('The carpenter has nothing in stock.'));

    const footer = el('div', 'panel-footer');
    footer.appendChild(button('Back to town', { onClick: () => ctx.openPanel('town') }));
    footer.appendChild(button('Close', { onClick: () => ctx.closePanel() }));
    content.appendChild(footer);
  };

  root.appendChild(content);
  render();
  ctx.setPanelRefresh(render);
}
