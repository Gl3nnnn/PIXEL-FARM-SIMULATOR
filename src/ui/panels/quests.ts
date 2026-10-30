import { ACHIEVEMENTS, DAILY_TEMPLATES, MAIN_QUESTS } from '../../data/definitions';
import { audio } from '../../systems/audio';
import { readSeasonalContract } from '../../systems/festivals';
import { metricValue } from '../../systems/quests';
import type { UIContext } from '../context';
import {
  button,
  el,
  emptyState,
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
    const dailyReady: string[] = [];
    for (const entry of state.data.daily?.list ?? []) {
      const info = state.dailyState(entry.id);
      if (info?.complete && !info.claimed) dailyReady.push(entry.id);
    }
    const mainReady: string[] = [];
    for (const quest of MAIN_QUESTS) {
      const info = state.mainQuestState(quest);
      if (info.complete && !info.claimed) mainReady.push(quest.id);
    }
    content.appendChild(
      tabs(
        [
          'Seasonal',
          dailyReady.length > 0 ? `Daily (${dailyReady.length})` : 'Daily',
          mainReady.length > 0 ? `Main Quests (${mainReady.length})` : 'Main Quests',
          'Achievements'
        ],
        tab,
        (i) => {
        tab = i;
        render();
      })
    );

    if (tab === 1 || tab === 2) {
      const daily = tab === 1;
      const readyIds = daily ? dailyReady : mainReady;
      const bar = el('div', 'panel-toolbar');
      bar.appendChild(
        el(
          'p',
          'hint',
          readyIds.length > 0
            ? `${readyIds.length} reward${readyIds.length === 1 ? '' : 's'} ready to claim.`
            : 'No rewards ready yet.'
        )
      );
      bar.appendChild(
        button('Claim all ready', {
          small: true,
          variant: 'primary',
          disabled: readyIds.length === 0,
          onClick: () => {
            let count = 0;
            for (const id of readyIds) {
              const result = daily ? state.claimDailyQuest(id) : state.claimMainQuest(id);
              if (result.ok) count += 1;
            }
            ctx.toast(`Claimed ${count} reward${count === 1 ? '' : 's'}.`, count > 0 ? 'reward' : 'error');
            audio.play(count > 0 ? 'coin' : 'error');
            if (count > 0) ctx.requestSave();
            render();
          }
        })
      );
      content.appendChild(bar);
    }

    if (tab === 0) {
      const seasonal = state.data.seasonal;
      const board = state.seasonalBoardState();
      if (!seasonal || !board) {
        content.appendChild(emptyState('No seasonal contracts available. Sleep to refresh the board.'));
      } else {
        const festivalHead = el('div', 'festival-head');
        const festivalInfo = el('div', 'list-info grow');
        festivalInfo.appendChild(el('strong', undefined, `${board.name} · Year ${board.year}`));
        festivalInfo.appendChild(el('span', 'hint', board.desc));
        festivalHead.appendChild(festivalInfo);
        const countdown = el('div', 'row-actions');
        countdown.appendChild(pill(`${board.daysLeft} days left`, 'gold'));
        countdown.appendChild(pill(`${board.claimedCount}/${board.total} claimed`, 'good'));
        festivalHead.appendChild(countdown);
        content.appendChild(festivalHead);

        for (const entry of seasonal.list) {
          const contract = readSeasonalContract(seasonal.season, entry.id);
          const info = state.seasonalContractState(entry.id);
          if (!contract || !info) continue;
          const row = el(
            'div',
            `quest-row${info.claimed ? ' claimed' : info.complete ? ' complete' : ''}`
          );
          const text = el('div', 'list-info grow');
          text.appendChild(el('strong', undefined, contract.title));
          text.appendChild(el('span', 'hint', contract.desc));
          text.appendChild(
            progressBar(
              info.progress,
              info.target,
              `${Math.min(info.progress, info.target)}/${info.target}`
            )
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
                  const result = state.claimSeasonalContract(entry.id);
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

        const bonus = el(
          'div',
          `quest-row festival-bonus${board.bonusClaimed ? ' claimed' : board.bonusReady ? ' complete' : ''}`
        );
        const bonusText = el('div', 'list-info grow');
        bonusText.appendChild(el('strong', undefined, 'Festival Bonus'));
        bonusText.appendChild(
          el(
            'span',
            'hint',
            `Complete all three contracts for +${board.bonusCoins}g and +${board.bonusXp} XP.`
          )
        );
        bonusText.appendChild(
          progressBar(
            board.claimedCount,
            board.total,
            `${board.claimedCount}/${board.total} contracts claimed`
          )
        );
        bonus.appendChild(bonusText);
        const bonusActions = el('div', 'row-actions');
        bonusActions.appendChild(pill(`+${board.bonusCoins}g`, 'gold'));
        if (board.bonusClaimed) {
          bonusActions.appendChild(pill('Festival complete', 'good'));
        } else {
          bonusActions.appendChild(
            button('Claim bonus', {
              small: true,
              variant: 'primary',
              disabled: !board.bonusReady,
              onClick: () => {
                const result = state.claimSeasonalBonus();
                ctx.toast(result.message ?? '', result.ok ? 'reward' : 'error');
                audio.play(result.ok ? 'coin' : 'error');
                if (result.ok) ctx.requestSave();
                render();
              }
            })
          );
        }
        bonus.appendChild(bonusActions);
        content.appendChild(bonus);
        if (state.festivalAvailable()) {
          const contest = state.festivalState();
          const festivalRow = el('div', 'quest-row festival-bonus complete');
          const festivalText = el('div', 'list-info grow');
          festivalText.appendChild(el('strong', undefined, contest?.contest.name ?? 'Festival Day'));
          festivalText.appendChild(
            el(
              'span',
              'hint',
              contest?.festival.submitted
                ? `Final score ${contest.festival.score} · ${contest.festival.tier} ribbon`
                : 'The judging stand is open today only.'
            )
          );
          festivalRow.appendChild(festivalText);
          const festivalActions = el('div', 'row-actions');
          festivalActions.appendChild(
            button(contest?.festival.submitted ? 'View results' : 'Visit festival', {
              small: true,
              variant: 'gold',
              onClick: () => ctx.openPanel('festival')
            })
          );
          festivalRow.appendChild(festivalActions);
          content.appendChild(festivalRow);
        }
        content.appendChild(
          el(
            'p',
            'hint center',
            'Seasonal contracts track progress from the start of the season and reset when the season changes.'
          )
        );
      }
    } else if (tab === 1) {
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
    } else if (tab === 2) {
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
