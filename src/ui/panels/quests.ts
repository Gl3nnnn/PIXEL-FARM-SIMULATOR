import { ACHIEVEMENTS, DAILY_TEMPLATES, MAIN_QUESTS } from '../../data/definitions';
import { audio } from '../../systems/audio';
import { metricValue } from '../../systems/quests';
import type { UIContext } from '../context';
import {
  button,
  el,
  emptyState,
  panelHeader,
  pill,
  progressBar,
  tabs
} from '../uiKit';

export function renderQuests(ctx: UIContext, root: HTMLElement): void {
  let tab = 0;
  const content = el('div', 'panel-content');

  const render = () => {
    content.innerHTML = '';
    const state = ctx.state;
    content.appendChild(
      panelHeader('Quest Journal', 'Complete objectives to earn coins and experience.')
    );
    content.appendChild(
      tabs(['Daily', 'Main Quests', 'Achievements'], tab, (i) => {
        tab = i;
        render();
      })
    );

    if (tab === 0) {
      const daily = state.data.daily;
      if (!daily) {
        content.appendChild(emptyState('No daily quests available. Sleep to start a new day.'));
      } else {
        for (const entry of daily.list) {
          const template = DAILY_TEMPLATES.find((t) => t.id === entry.id);
          const info = state.dailyState(entry.id);
          if (!template || !info) continue;
          const row = el('div', 'quest-row');
          const text = el('div', 'list-info grow');
          text.appendChild(el('strong', undefined, template.title));
          text.appendChild(el('span', 'hint', template.desc));
          text.appendChild(
            progressBar(info.progress, info.target, `${Math.min(info.progress, info.target)}/${info.target}`)
          );
          row.appendChild(text);
          const actions = el('div', 'row-actions');
          actions.appendChild(pill(`+${entry.coins}g`, 'gold'));
          if (info.claimed) {
            actions.appendChild(pill('Claimed', 'good'));
          } else {
            actions.appendChild(
              button('Claim', {
                small: true,
                variant: 'primary',
                disabled: !info.complete,
                onClick: () => {
                  const result = state.claimDailyQuest(entry.id);
                  ctx.toast(result.message ?? '', result.ok ? 'reward' : 'error');
                  audio.play(result.ok ? 'coin' : 'error');
                  if (result.ok) ctx.requestSave();
                  render();
                }
              })
            );
          }
          row.appendChild(actions);
          content.appendChild(row);
        }
        content.appendChild(el('p', 'hint center', `Daily quests refresh each morning (Day ${daily.day}).`));
      }
    } else if (tab === 1) {
      for (const quest of MAIN_QUESTS) {
        const info = state.mainQuestState(quest);
        const row = el('div', 'quest-row');
        const text = el('div', 'list-info grow');
        text.appendChild(el('strong', undefined, quest.title));
        text.appendChild(el('span', 'hint', quest.desc));
        text.appendChild(
          progressBar(info.progress, quest.target, `${Math.min(info.progress, quest.target)}/${quest.target}`)
        );
        row.appendChild(text);
        const actions = el('div', 'row-actions');
        actions.appendChild(pill(`+${quest.coins}g`, 'gold'));
        if (info.claimed) {
          actions.appendChild(pill('Claimed', 'good'));
        } else {
          actions.appendChild(
            button('Claim', {
              small: true,
              variant: 'primary',
              disabled: !info.complete,
              onClick: () => {
                const result = state.claimMainQuest(quest.id);
                ctx.toast(result.message ?? '', result.ok ? 'reward' : 'error');
                audio.play(result.ok ? 'coin' : 'error');
                if (result.ok) ctx.requestSave();
                render();
              }
            })
          );
        }
        row.appendChild(actions);
        content.appendChild(row);
      }
    } else {
      for (const ach of ACHIEVEMENTS) {
        const unlocked = state.data.achievements.includes(ach.id);
        const progress = metricValue(state.data, ach.metric);
        const row = el('div', `quest-row${unlocked ? ' unlocked' : ''}`);
        const text = el('div', 'list-info grow');
        text.appendChild(el('strong', undefined, ach.title));
        text.appendChild(el('span', 'hint', ach.desc));
        text.appendChild(
          progressBar(
            Math.min(progress, ach.target),
            ach.target,
            `${Math.min(progress, ach.target)}/${ach.target}`
          )
        );
        row.appendChild(text);
        const actions = el('div', 'row-actions');
        actions.appendChild(unlocked ? pill('Unlocked', 'good') : pill(`+${ach.coins}g`));
        row.appendChild(actions);
        content.appendChild(row);
      }
      content.appendChild(el('p', 'hint center', 'Achievements unlock automatically and reward coins instantly.'));
    }

    const footer = el('div', 'panel-footer');
    footer.appendChild(button('Close', { onClick: () => ctx.closePanel() }));
    content.appendChild(footer);
  };

  root.appendChild(content);
  render();
  ctx.setPanelRefresh(render);
}
