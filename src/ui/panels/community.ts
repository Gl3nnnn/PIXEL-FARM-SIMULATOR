import { BUFFS, BUNDLE_SETS, ENERGY_ACTIONS, ITEMS, LETTERS, PROFESSIONS } from '../../data/definitions';
import type { SkillKey } from '../../types';
import type { UIContext } from '../context';
import { button, el, emptyState, iconImg, itemLabel, pill, progressBar, section } from '../uiKit';

const SKILLS: SkillKey[] = ['farming', 'animal', 'crafting', 'business', 'fishing', 'mining'];

const SKILL_LABEL: Record<SkillKey, string> = {
  farming: 'Farming',
  animal: 'Animals',
  crafting: 'Crafting',
  business: 'Business',
  fishing: 'Fishing',
  mining: 'Mining'
};

/** Community: energy, professions, bundles and the mailbox. */
export function renderCommunity(ctx: UIContext, root: HTMLElement): void {
  const tabs = el('div', 'tabs');
  const body = el('div', 'community-body');
  const labels = ['Energy', 'Professions', 'Bundles', 'Mail'];
  let active = 0;

  const paint = () => {
    tabs.querySelectorAll('button').forEach((b, i) => {
      b.classList.toggle('primary', i === active);
      b.classList.toggle('ghost', i !== active);
    });
    body.innerHTML = '';
    if (active === 0) renderEnergy(ctx, body);
    else if (active === 1) renderProfessions(ctx, body);
    else if (active === 2) renderBundles(ctx, body);
    else renderMail(ctx, body);
  };

  labels.forEach((label, i) => {
    tabs.appendChild(
      button(label, {
        small: true,
        variant: i === 0 ? 'primary' : 'ghost',
        onClick: () => {
          active = i;
          paint();
        }
      })
    );
  });

  root.append(tabs, body);
  paint();
  ctx.setPanelRefresh(() => paint());
}

// ------------------------------------------------------------------- energy

function renderEnergy(ctx: UIContext, root: HTMLElement): void {
  const state = ctx.state;
  const max = state.maxEnergy();
  const now = state.energy();

  const head = section('Your energy today', `${now} / ${max}`);
  head.appendChild(progressBar(now, max, undefined, 'energy-bar'));
  head.appendChild(
    el(
      'p',
      'hint',
      'Every job on the farm uses a little energy. Sleep refills it to full. When you run low, eat a cooked dish for a boost.'
    )
  );
  root.appendChild(head);

  const costs = section('What work costs', 'after your professions');
  const grid = el('div', 'energy-cost-grid');
  for (const action of ENERGY_ACTIONS) {
    const cell = el('div', 'energy-cost');
    cell.append(
      el('span', 'energy-cost-label', action.label),
      el('span', 'pill', String(state.energyCost(action.key)))
    );
    grid.appendChild(cell);
  }
  costs.appendChild(grid);
  root.appendChild(costs);

  const activeBuffs = state.activeBuffs();
  const buffSection = section("Today's boosts", activeBuffs.length ? '' : 'none yet');
  if (activeBuffs.length === 0) {
    buffSection.appendChild(emptyState('Eat a cooked dish from your backpack to get a boost for the day.'));
  } else {
    for (const buff of activeBuffs) {
      const row = el('div', 'buff-row');
      row.append(pill(buff.name, 'good'), el('span', 'hint', buff.desc));
      buffSection.appendChild(row);
    }
  }
  root.appendChild(buffSection);

  const meals = section('Eat something', 'cooked dishes in your backpack');
  const cooked = BUFFS.map((b) => b.itemId).filter((id, i, all) => all.indexOf(id) === i && state.hasItem(id));
  if (cooked.length === 0) {
    meals.appendChild(emptyState('No cooked dishes in your backpack. Cook some at the Workshop.'));
  }
  for (const itemId of cooked) {
    const buff = BUFFS.find((b) => b.itemId === itemId)!;
    const row = el('div', 'list-row');
    const left = el('div', 'list-row-main');
    left.append(
      iconImg(ctx.icon(itemId), 34, itemLabel(itemId)),
      el('span', undefined, `${itemLabel(itemId)} ×${state.countItem(itemId)}`),
      el('span', 'hint', buff.desc)
    );
    row.append(
      left,
      button('Eat', {
        small: true,
        variant: 'primary',
        onClick: () => {
          const res = state.eat(itemId);
          ctx.toast(res.message ?? '', res.ok ? 'success' : 'error');
          ctx.requestSave();
          ctx.refresh();
          renderEnergyTab(ctx, root);
        }
      })
    );
    meals.appendChild(row);
  }
  root.appendChild(meals);
}

/** Re-paints only the energy tab, keeping the tab row untouched. */
function renderEnergyTab(ctx: UIContext, root: HTMLElement): void {
  root.innerHTML = '';
  renderEnergy(ctx, root);
}

// -------------------------------------------------------------- professions

function renderProfessions(ctx: UIContext, root: HTMLElement): void {
  const state = ctx.state;
  root.appendChild(
    el(
      'p',
      'hint',
      'At skill level 5 and 10 you pick a profession. One choice per skill, and it lasts forever.'
    )
  );

  for (const skill of SKILLS) {
    const level = state.skillLevel(skill);
    const wrap = section(SKILL_LABEL[skill], `level ${level}`);
    const picks = state.data.professions?.[skill] ?? [];
    for (const milestone of [5, 10]) {
      for (const choice of state.professionChoices(skill, milestone)) {
        const takenThisTier = picks.some(
          (id) => choice.def.level === PROFESSIONS.find((p) => p.id === id)?.level
        );
        if (takenThisTier && !choice.chosen) continue;
        const row = el('div', 'profession-row');
        const info = el('div', 'profession-info');
        const title = el('div', 'profession-title');
        title.append(
          el('span', undefined, choice.def.name),
          pill(`level ${milestone}`, choice.unlocked ? 'good' : '')
        );
        info.append(title, el('p', 'hint', choice.def.desc));
        row.appendChild(info);

        if (choice.chosen) {
          row.appendChild(pill('Your profession', 'good'));
        } else if (takenThisTier) {
          continue;
        } else if (choice.unlocked) {
          row.appendChild(
            button('Choose', {
              small: true,
              variant: 'primary',
              onClick: () => {
                const res = state.chooseProfession(choice.def.id);
                ctx.toast(res.message ?? '', res.ok ? 'success' : 'error');
                ctx.requestSave();
                ctx.refresh();
                root.innerHTML = '';
                renderProfessions(ctx, root);
              }
            })
          );
        } else {
          row.appendChild(
            button(`Needs ${SKILL_LABEL[skill]} ${milestone}`, { small: true, disabled: true })
          );
        }
        wrap.appendChild(row);
      }
    }
    root.appendChild(wrap);
  }
}

// ----------------------------------------------------------------- bundles

function renderBundles(ctx: UIContext, root: HTMLElement): void {
  const state = ctx.state;
  const done = state.bundlesCompleted();
  root.appendChild(
    el(
      'p',
      'hint',
      `Bring the village its favourite goods. ${done} of ${BUNDLE_SETS.length} bundles complete.`
    )
  );

  for (const bundleDef of BUNDLE_SETS) {
    const info = state.bundleState(bundleDef.id);
    if (!info) continue;
    const wrap = el('div', `bundle-card${info.claimed ? ' done' : ''}`);
    const head = el('div', 'bundle-head');
    head.appendChild(el('h3', undefined, info.def.name));
    head.appendChild(
      pill(
        info.claimed ? 'Complete' : info.complete ? 'Ready to claim' : 'In progress',
        info.claimed || info.complete ? 'good' : ''
      )
    );
    wrap.append(head, el('p', 'hint', info.def.desc));

    for (const req of info.requirements) {
      const row = el('div', 'bundle-row');
      row.append(iconImg(ctx.icon(req.itemId), 30, itemLabel(req.itemId)));
      row.appendChild(el('span', 'bundle-item', itemLabel(req.itemId)));
      row.appendChild(el('span', 'bundle-count', `${req.donated}/${req.qty}`));
      if (req.done || info.claimed) {
        row.appendChild(pill('Filled', 'good'));
      } else {
        const canGive = state.hasItem(req.itemId);
        row.appendChild(
          button(canGive ? 'Donate' : 'Need more', {
            small: true,
            variant: canGive ? 'primary' : 'secondary',
            disabled: !canGive,
            onClick: () => {
              const res = state.donateToBundle(info.def.id, req.itemId);
              ctx.toast(res.message ?? '', res.ok ? 'success' : 'error');
              ctx.requestSave();
              ctx.refresh();
              root.innerHTML = '';
              renderBundles(ctx, root);
            }
          })
        );
      }
      wrap.appendChild(row);
    }

    const footer = el('div', 'bundle-footer');
    footer.appendChild(
      el('span', 'hint', `Reward: ${info.def.coins} coins and ${info.def.xp} XP`)
    );
    footer.appendChild(
      button(info.claimed ? 'Claimed' : 'Claim reward', {
        small: true,
        variant: info.complete && !info.claimed ? 'gold' : 'secondary',
        disabled: !info.complete || info.claimed,
        onClick: () => {
          const res = state.claimBundle(info.def.id);
          ctx.toast(res.message ?? '', res.ok ? 'reward' : 'error');
          ctx.requestSave();
          ctx.refresh();
          root.innerHTML = '';
          renderBundles(ctx, root);
        }
      })
    );
    wrap.appendChild(footer);
    root.appendChild(wrap);
  }
}

// -------------------------------------------------------------------- mail

function renderMail(ctx: UIContext, root: HTMLElement): void {
  const state = ctx.state;
  const mail = state.data.mail ?? [];
  if (mail.length === 0) {
    root.appendChild(emptyState('The mailbox is empty. Letters arrive as your farm grows.'));
    return;
  }
  const unread = state.unreadMail();
  root.appendChild(el('p', 'hint', `${unread} unread letter${unread === 1 ? '' : 's'}.`));

  for (const entry of [...mail].reverse()) {
    const def = LETTERS.find((l) => l.id === entry.id);
    if (!def) continue;
    const card = el('div', `mail-card${entry.read ? '' : ' unread'}`);
    const head = el('div', 'mail-head');
    head.append(el('strong', undefined, def.subject), el('span', 'hint', def.from));
    if (!entry.read) head.appendChild(pill('New', 'good'));
    card.appendChild(head);
    card.appendChild(el('p', 'mail-body', def.body));

    const footer = el('div', 'bundle-footer');
    const extras: string[] = [];
    if (def.coins > 0) extras.push(`${def.coins} coins`);
    if (def.itemId) extras.push(`${def.itemQty ?? 1} × ${ITEMS[def.itemId]?.name ?? def.itemId}`);
    footer.appendChild(el('span', 'hint', extras.length ? `Enclosed: ${extras.join(' and ')}` : ''));
    if (entry.claimed) {
      footer.appendChild(pill('Taken', 'good'));
    } else if (extras.length > 0) {
      footer.appendChild(
        button('Take', {
          small: true,
          variant: 'primary',
          onClick: () => {
            const res = state.claimLetter(def.id);
            ctx.toast(res.message ?? '', res.ok ? 'reward' : 'error');
            ctx.requestSave();
            ctx.refresh();
            root.innerHTML = '';
            renderMail(ctx, root);
          }
        })
      );
    } else if (!entry.read) {
      footer.appendChild(
        button('Read', {
          small: true,
          variant: 'ghost',
          onClick: () => {
            const res = state.markLetterRead(def.id);
            ctx.toast(res.message ?? '', 'info');
            ctx.requestSave();
            ctx.refresh();
            root.innerHTML = '';
            renderMail(ctx, root);
          }
        })
      );
    }
    card.appendChild(footer);
    root.appendChild(card);
  }
}
