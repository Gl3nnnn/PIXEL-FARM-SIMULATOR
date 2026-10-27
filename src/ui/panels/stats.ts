import { SEASON_INFO, xpProgress } from '../../data/definitions';
import { functionalBuildingCount } from '../../systems/quests';
import { formatNumber } from '../../systems/util';
import type { UIContext } from '../context';
import { el, progressBar, section, statRow } from '../uiKit';

export function renderStats(ctx: UIContext, root: HTMLElement): void {
  const content = el('div', 'panel-content');
  const state = ctx.state;
  const d = state.data;
  const xp = xpProgress(state.totalXp());
  const levelCard = el('div', 'level-card');
  const left = el('div');
  left.appendChild(el('h3', undefined, `Farmer Level ${xp.level}`));
  left.appendChild(el('p', 'hint', `${formatNumber(xp.into)} / ${formatNumber(xp.need)} XP to next level`));
  levelCard.appendChild(left);
  levelCard.appendChild(progressBar(xp.into, xp.need, undefined, 'xp'));
  content.appendChild(levelCard);

  const skills = section('Skills');
  const skillGrid = el('div', 'two-col');
  (['farming', 'animal', 'crafting', 'business', 'fishing', 'mining'] as const).forEach((skill) => {
    const totalXp = d.xp[skill];
    const prog = xpProgress(totalXp);
    const wrap = el('div', 'skill-block');
    wrap.appendChild(
      el(
        'span',
        'stat-label',
        `${skill.charAt(0).toUpperCase() + skill.slice(1)} · level ${prog.level}`
      )
    );
    wrap.appendChild(progressBar(prog.into, prog.need, undefined, `skill-${skill}`));
    wrap.appendChild(el('span', 'hint', `${formatNumber(totalXp)} XP total`));
    skillGrid.appendChild(wrap);
  });
  skills.appendChild(skillGrid);
  content.appendChild(skills);

  const farm = section('Farm');
  farm.appendChild(statRow('Day', `${d.day} · ${SEASON_INFO[d.season].name} · Year ${d.year}`));
  farm.appendChild(statRow('Coins', formatNumber(d.coins)));
  farm.appendChild(statRow('Fields owned', `${d.unlockedPlots} / 6`));
  farm.appendChild(statRow('Buildings', String(functionalBuildingCount(d))));
  farm.appendChild(statRow('Animals', String(d.animals.length)));
  farm.appendChild(statRow('Inventory', `${d.inventory.filter(Boolean).length} / ${state.capacity()}`));
  content.appendChild(farm);

  const life = section('Lifetime totals');
  life.appendChild(statRow('Crops harvested', formatNumber(d.stats.harvests)));
  life.appendChild(statRow('Gold harvests', formatNumber(d.stats.goldHarvests)));
  life.appendChild(statRow('Goods sold', formatNumber(d.stats.cropsSold)));
  life.appendChild(statRow('Products collected', formatNumber(d.stats.productsCollected)));
  life.appendChild(statRow('Coins earned', formatNumber(d.stats.coinsEarned)));
  life.appendChild(statRow('Crops planted', formatNumber(d.stats.planted)));
  life.appendChild(statRow('Tiles watered', formatNumber(d.stats.waters)));
  life.appendChild(statRow('Tiles tilled', formatNumber(d.stats.tills)));
  life.appendChild(statRow('Items crafted', formatNumber(d.stats.crafts)));
  life.appendChild(statRow('Fish caught', formatNumber(d.stats.fishCaught)));
  life.appendChild(statRow('Fishing casts', formatNumber(d.stats.fishingCasts)));
  life.appendChild(statRow('Rocks mined', formatNumber(d.stats.rocksMined)));
  life.appendChild(statRow('Ore collected', formatNumber(d.stats.oresMined)));
  const collection = state.collectionState();
  life.appendChild(statRow('Collection entries', `${collection.total.found} / ${collection.total.total}`));
  life.appendChild(statRow('Festival ribbons', String(d.ribbons.length)));
  life.appendChild(statRow('Days played', formatNumber(d.stats.daysPlayed)));
  content.appendChild(life);

  content.appendChild(el('p', 'hint center', 'Progress saves automatically. Local saves stay on this browser.'));
  const footer = el('div', 'panel-footer');
  const close = el('button', 'btn secondary');
  close.type = 'button';
  close.textContent = 'Close';
  close.addEventListener('click', () => ctx.closePanel());
  footer.appendChild(close);
  content.appendChild(footer);
  root.appendChild(content);
}
