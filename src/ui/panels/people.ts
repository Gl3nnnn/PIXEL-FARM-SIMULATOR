import { audio } from '../../systems/audio';
import { NPC_MAX_HEARTS } from '../../systems/npcs';
import type { UIContext } from '../context';
import { button, el, pill, progressBar, section } from '../uiKit';

export function renderPeople(ctx: UIContext, root: HTMLElement): void {
  const content = el('div', 'panel-content');
  const render = () => {
    content.innerHTML = '';
    const state = ctx.state;
    const summary = el('div', 'level-card');
    const text = el('div');
    text.appendChild(
      el(
        'h3',
        undefined,
        state.data.spouseId ? `Married to ${state.spouseName}` : 'Looking for connection'
      )
    );
    text.appendChild(
      el(
        'p',
        'hint',
        state.data.spouseId
          ? 'Your spouse leaves a small gift by the door each morning.'
          : 'Reach 10 hearts with a romanceable visitor before proposing.'
      )
    );
    summary.appendChild(text);
    summary.appendChild(
      progressBar(
        state.npcList().reduce((sum, entry) => sum + entry.hearts, 0),
        state.npcList().length * NPC_MAX_HEARTS,
        'Total hearts',
        'xp'
      )
    );
    content.appendChild(summary);

    const visitors = section('Farm Visitors', 'Visitors appear from 8:00 AM to 6:00 PM on their scheduled days.');
    for (const entry of state.npcList()) {
      const card = el('div', 'npc-card');
      const head = el('div', 'npc-head');
      const info = el('div', 'list-info grow');
      info.appendChild(el('strong', undefined, `${entry.npc.name} · ${entry.npc.role}`));
      info.appendChild(el('span', 'hint', entry.npc.desc));
      const tags = el('div', 'tag-row');
      tags.appendChild(pill(entry.status, entry.status === 'Married' ? 'good' : ''));
      tags.appendChild(pill(`Birthday ${entry.birthday}`, entry.birthdayToday ? 'gold' : ''));
      tags.appendChild(
        pill(
          entry.available ? 'Visiting now' : entry.reason,
          entry.available ? 'good' : 'warn'
        )
      );
      tags.appendChild(
        pill(
          entry.request.completed
            ? 'Weekly request done'
            : `Wants ${entry.request.qty} ${entry.request.itemName}`,
          entry.request.completed ? 'good' : entry.requestReady ? 'gold' : 'warn'
        )
      );
      info.appendChild(tags);
      head.appendChild(info);
      card.appendChild(head);
      card.appendChild(progressBar(entry.hearts, NPC_MAX_HEARTS, `${entry.hearts} / ${NPC_MAX_HEARTS} hearts`, 'xp'));
      const actions = el('div', 'row-actions');
      if (!entry.record.met) actions.appendChild(pill('Not met yet', 'warn'));
      if (entry.hearts >= NPC_MAX_HEARTS && entry.npc.romanceable && !state.data.spouseId) {
        actions.appendChild(
          button('Propose', {
            small: true,
            variant: 'gold',
            onClick: () => {
              const result = state.marryNpc(entry.npc.id);
              ctx.toast(result.message ?? '', result.ok ? 'reward' : 'error');
              audio.play(result.ok ? 'level' : 'error');
              if (result.ok) ctx.requestSave();
              render();
            }
          })
        );
      }
      card.appendChild(actions);
      visitors.appendChild(card);
    }
    content.appendChild(visitors);
    const footer = el('div', 'panel-footer');
    footer.appendChild(button('Close', { onClick: () => ctx.closePanel() }));
    content.appendChild(footer);
  };
  root.appendChild(content);
  render();
  ctx.setPanelRefresh(render);
}
