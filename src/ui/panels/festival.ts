import { ITEMS, QUALITY_LABEL, SEASON_INFO } from '../../data/definitions';
import { audio } from '../../systems/audio';
import { festivalTierLabel } from '../../systems/festivals';
import type { UIContext } from '../context';
import { button, el, emptyState, iconImg, panelHeader, pill, progressBar, section } from '../uiKit';

export function renderFestival(ctx: UIContext, root: HTMLElement): void {
  const content = el('div', 'panel-content');
  const render = () => {
    content.innerHTML = '';
    const state = ctx.state;
    const info = state.festivalState();
    content.appendChild(
      panelHeader('Festival Day', 'Show the judges your finest goods. One entry per year.')
    );
    if (!info) {
      content.appendChild(
        emptyState('The judging stand is only open on Day 28 of each season.')
      );
      const footer = el('div', 'panel-footer');
      footer.appendChild(button('Close', { onClick: () => ctx.closePanel() }));
      content.appendChild(footer);
      return;
    }
    const { contest, festival, selection } = info;
    const card = el('div', 'festival-card');
    card.appendChild(el('h3', undefined, contest.name));
    card.appendChild(
      el(
        'p',
        'hint',
        `${SEASON_INFO[festival.season].name} ${state.data.day}, Year ${festival.year} · ${contest.desc}`
      )
    );
    const tags = el('div', 'tag-row');
    tags.appendChild(pill(`${contest.count} ${contest.itemType} items`, 'gold'));
    tags.appendChild(pill(`Theme: ${contest.themeBonuses.map((id) => ITEMS[id]?.name ?? id).join(', ')}`));
    card.appendChild(tags);
    content.appendChild(card);

    if (festival.submitted) {
      const result = section('Judging Result');
      result.appendChild(
        el(
          'p',
          'festival-score',
          `Score ${festival.score} · ${festivalTierLabel(festival.tier)}`
        )
      );
      result.appendChild(
        progressBar(
          Math.min(festival.score, contest.gold),
          contest.gold,
          `Gold at ${contest.gold}`,
          'xp'
        )
      );
      const rewards = el('div', 'tag-row');
      rewards.appendChild(pill(`Bronze ${contest.bronze}`, festival.tier === 'bronze' ? 'bronze' : ''));
      rewards.appendChild(pill(`Silver ${contest.silver}`, festival.tier === 'silver' ? 'silver' : ''));
      rewards.appendChild(pill(`Gold ${contest.gold}`, festival.tier === 'gold' ? 'gold' : ''));
      result.appendChild(rewards);
      if (festival.tier !== 'none') {
        if (festival.claimed) {
          result.appendChild(pill('Prize claimed', 'good'));
        } else {
          result.appendChild(
            button(`Claim ${contest.coins}g prize`, {
              variant: 'gold',
              onClick: () => {
                const claim = state.claimFestivalReward();
                ctx.toast(claim.message ?? '', claim.ok ? 'reward' : 'error');
                audio.play(claim.ok ? 'level' : 'error');
                if (claim.ok) ctx.requestSave();
                render();
              }
            })
          );
        }
      } else {
        result.appendChild(el('p', 'hint', 'No ribbon this year. Better luck next season.'));
      }
      content.appendChild(result);
    } else {
      const entry = section('Your Best Entry', 'The judges automatically take your highest-value eligible goods.');
      if (selection.candidates.length === 0) {
        entry.appendChild(
          emptyState(
            `You have no eligible ${contest.itemType} items. Bring ${contest.count} to the stand.`
          )
        );
      } else {
        const list = el('div', 'festival-entry-list');
        for (const candidate of selection.candidates) {
          const row = el('div', 'list-row compact');
          row.appendChild(iconImg(ctx.icon(candidate.itemId), 34, ITEMS[candidate.itemId]?.name ?? candidate.itemId));
          const label = el('div', 'list-info grow');
          label.appendChild(
            el(
              'strong',
              undefined,
              `${candidate.take} × ${QUALITY_LABEL[candidate.quality]} ${ITEMS[candidate.itemId]?.name ?? candidate.itemId}`.trim()
            )
          );
          label.appendChild(el('span', 'hint', `${candidate.unitScore}g judging value each`));
          row.appendChild(label);
          list.appendChild(row);
        }
        entry.appendChild(list);
      }
      entry.appendChild(
        el(
          'p',
          'hint',
          selection.totalItems >= contest.count
            ? `Projected score: ${selection.score}. Tiers: bronze ${contest.bronze}, silver ${contest.silver}, gold ${contest.gold}.`
            : `Need ${contest.count - selection.totalItems} more eligible item${contest.count - selection.totalItems === 1 ? '' : 's'}.`
        )
      );
      entry.appendChild(
        button('Submit to judges', {
          variant: 'gold',
          disabled: selection.totalItems < contest.count,
          onClick: () => {
            const result = state.submitFestival();
            ctx.toast(result.message ?? '', result.ok ? 'reward' : 'error');
            audio.play(result.ok ? 'level' : 'error');
            if (result.ok) ctx.requestSave();
            render();
          }
        })
      );
      content.appendChild(entry);
    }

    const footer = el('div', 'panel-footer');
    footer.appendChild(button('Close', { onClick: () => ctx.closePanel() }));
    content.appendChild(footer);
  };
  root.appendChild(content);
  render();
  ctx.setPanelRefresh(render);
}
