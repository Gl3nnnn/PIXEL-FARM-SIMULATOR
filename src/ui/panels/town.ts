import { SEASON_INFO } from '../../data/definitions';
import { audio } from '../../systems/audio';
import { formatNumber } from '../../systems/util';
import type { UIContext } from '../context';
import { button, el, pill, progressBar, section } from '../uiKit';

export function renderTown(ctx: UIContext, root: HTMLElement): void {
  const content = el('div', 'panel-content');
  const render = () => {
    content.innerHTML = '';
    const state = ctx.state;
    const d = state.data;

    const hero = el('div', 'level-card');
    const heroText = el('div');
    heroText.appendChild(el('h3', undefined, 'Valley Town'));
    heroText.appendChild(
      el(
        'p',
        'hint',
        `${SEASON_INFO[d.season].name} ${d.day}, Year ${d.year} · a short walk from the farm gate.`
      )
    );
    hero.appendChild(heroText);
    hero.appendChild(el('div', 'inline-coins', `${formatNumber(d.coins)} coins`));
    content.appendChild(hero);

    const destinations = section('Around Town', 'Every shop and service is a short walk from the square.');
    const grid = el('div', 'card-grid wide');
    const card = (
      title: string,
      desc: string,
      tags: string[],
      action: () => void,
      label: string,
      disabled = false,
      variant: 'primary' | 'gold' | 'secondary' = 'primary'
    ) => {
      const box = el('div', 'build-card');
      const info = el('div', 'shop-info');
      info.appendChild(el('strong', undefined, title));
      info.appendChild(el('span', 'hint', desc));
      if (tags.length > 0) {
        const row = el('div', 'tag-row');
        for (const tag of tags) row.appendChild(pill(tag));
        info.appendChild(row);
      }
      box.appendChild(info);
      const actions = el('div', 'shop-actions');
      actions.appendChild(
        button(label, {
          small: true,
          variant,
          disabled,
          onClick: action
        })
      );
      box.appendChild(actions);
      grid.appendChild(box);
    };

    card('General Store', 'Seeds, supplies, tools and permanent upgrades.', [], () => ctx.openPanel('shop'), 'Enter');
    card('Market', 'Sell your harvest on the daily market.', [], () => ctx.openPanel('market'), 'Enter');
    card(
      'Clinic',
      'A pick-me-up when the day is running long.',
      [`+80 energy · 200g`],
      () => {
        const result = state.clinicRestore(200, 80);
        ctx.toast(result.message ?? '', result.ok ? 'success' : 'error');
        audio.play(result.ok ? 'level' : 'error');
        if (result.ok) ctx.requestSave();
        render();
      },
      'Visit',
      state.energy() >= state.maxEnergy() || d.coins < 200
    );
    card(
      'The Saloon',
      'Hot stew, a warm seat, and faster feet for the rest of the day.',
      ['+40 energy · speed buff · 220g'],
      () => {
        const result = state.buySaloonMeal(220);
        ctx.toast(result.message ?? '', result.ok ? 'success' : 'error');
        audio.play(result.ok ? 'level' : 'error');
        if (result.ok) ctx.requestSave();
        render();
      },
      'Eat',
      d.coins < 220
    );
    card(
      'Town Museum',
      'Donate artifacts found in the old mine and the quarry.',
      [`${d.museum.donated.length} / 6 donated`],
      () => ctx.openPanel('museum'),
      'Visit'
    );
    card(
      'Old Mine',
      'A ladder into the dark. Ore, monsters, and an elevator for the brave.',
      [`Deepest floor ${d.mineRun.maxFloor}`],
      () => ctx.openPanel('mine'),
      'Descend'
    );
    card(
      'Shipping Depot',
      'Leave goods in the bin and the trader sells them overnight.',
      [`${d.shipping.items.length} stacks waiting`],
      () => ctx.openPanel('shipping'),
      'Ship'
    );
    card('Homestead', 'Family, furniture, pets, and the stable.', [], () => ctx.openPanel('home'), 'Visit');
    card('Town Square', 'Catch up with the villagers and their requests.', [], () => ctx.openPanel('people'), 'Mingle');
    destinations.appendChild(grid);
    content.appendChild(destinations);

    const chores = section('Today in Town', 'A quick look at what the town is buzzing about.');
    const hearts = state.npcList().reduce((sum, entry) => sum + entry.hearts, 0);
    chores.appendChild(progressBar(hearts, state.npcList().length * 10, `${hearts} hearts with the valley`, 'xp'));
    chores.appendChild(
      el(
        'p',
        'hint',
        state.festivalAvailable()
          ? 'The festival games are open on the green today!'
          : d.weather === 'rain' || d.weather === 'storm'
            ? 'Rain drums on the shop awnings. The saloon is busy.'
            : 'The square smells of bread and cut grass.'
      )
    );
    content.appendChild(chores);

    const footer = el('div', 'panel-footer');
    footer.appendChild(button('Back to the farm', { onClick: () => ctx.closePanel() }));
    content.appendChild(footer);
  };

  root.appendChild(content);
  render();
  ctx.setPanelRefresh(render);
}
