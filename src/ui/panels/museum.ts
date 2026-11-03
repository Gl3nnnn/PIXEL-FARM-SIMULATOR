import { ITEMS } from '../../data/definitions';
import { audio } from '../../systems/audio';
import { formatNumber } from '../../systems/util';
import type { UIContext } from '../context';
import { button, el, iconImg, pill, progressBar, section } from '../uiKit';

export function renderMuseum(ctx: UIContext, root: HTMLElement): void {
  const content = el('div', 'panel-content');
  const render = () => {
    content.innerHTML = '';
    const state = ctx.state;
    const info = state.museumState();

    const hero = el('div', 'level-card');
    const text = el('div');
    text.appendChild(el('h3', undefined, 'Town Museum'));
    text.appendChild(
      el(
        'p',
        'hint',
        'The curator pays for artifacts pulled from the old mine, the quarry, and the deep seams.'
      )
    );
    hero.appendChild(text);
    hero.appendChild(el('div', 'inline-coins', `${info.donated.length} / ${info.total} donated`));
    content.appendChild(hero);
    content.appendChild(
      progressBar(info.donated.length, info.total, `${info.donated.length} of ${info.total} artifacts`, 'xp')
    );

    const artifacts = section('Collection', 'Find artifacts while mining, then bring them here.');
    const grid = el('div', 'card-grid wide');
    for (const entry of info.artifacts) {
      const card = el('div', 'build-card');
      const preview = el('div', 'preview-frame build-preview');
      preview.appendChild(iconImg(ctx.icon(entry.item.id), 46, entry.item.name));
      card.appendChild(preview);
      const body = el('div', 'shop-info');
      body.appendChild(el('strong', undefined, entry.item.name));
      body.appendChild(el('span', 'hint', entry.item.desc));
      const tags = el('div', 'tag-row');
      if (entry.donated) tags.appendChild(pill('On display', 'good'));
      else if (entry.held > 0) tags.appendChild(pill(`In backpack ×${entry.held}`, 'gold'));
      else tags.appendChild(pill('Not found', 'warn'));
      body.appendChild(tags);
      card.appendChild(body);
      if (!entry.donated) {
        const actions = el('div', 'shop-actions');
        actions.appendChild(
          button('Donate', {
            small: true,
            variant: 'primary',
            disabled: entry.held < 1,
            onClick: () => {
              const result = state.donateArtifact(entry.item.id);
              ctx.toast(result.message ?? '', result.ok ? 'success' : 'error');
              audio.play(result.ok ? 'level' : 'error');
              if (result.ok) ctx.requestSave();
              render();
            }
          })
        );
        card.appendChild(actions);
      }
      grid.appendChild(card);
    }
    artifacts.appendChild(grid);
    content.appendChild(artifacts);

    const rewards = section('Curator Rewards', 'Milestones unlock as the collection grows.');
    for (const reward of info.rewards) {
      const row = el('div', 'list-row');
      const body = el('div', 'list-info');
      body.appendChild(el('strong', undefined, `${reward.def.count} artifacts · ${reward.def.desc}`));
      body.appendChild(
        el(
          'span',
          'hint',
          `${formatNumber(reward.def.coins)} coins · ${reward.def.xp} XP${
            reward.def.itemId ? ` · ${ITEMS[reward.def.itemId]?.name ?? reward.def.itemId}` : ''
          }`
        )
      );
      row.appendChild(body);
      const actions = el('div', 'row-actions');
      if (reward.claimed) actions.appendChild(pill('Claimed', 'good'));
      else if (!reward.unlocked) actions.appendChild(pill(`Need ${reward.def.count}`, 'warn'));
      else {
        actions.appendChild(
          button('Claim', {
            small: true,
            variant: 'gold',
            onClick: () => {
              const result = state.claimMuseumReward(reward.def.id);
              ctx.toast(result.message ?? '', result.ok ? 'reward' : 'error');
              audio.play(result.ok ? 'level' : 'error');
              if (result.ok) ctx.requestSave();
              render();
            }
          })
        );
      }
      row.appendChild(actions);
      rewards.appendChild(row);
    }
    if (info.next) {
      rewards.appendChild(
        el('p', 'hint', `Next milestone: ${info.next.count} artifacts for ${info.next.coins} coins.`)
      );
    }
    content.appendChild(rewards);

    const footer = el('div', 'panel-footer');
    footer.appendChild(button('Back to town', { onClick: () => ctx.openPanel('town') }));
    footer.appendChild(button('Close', { onClick: () => ctx.closePanel() }));
    content.appendChild(footer);
  };

  root.appendChild(content);
  render();
  ctx.setPanelRefresh(render);
}
