import {
  ANIMALS,
  CROPS,
  FESTIVAL_RIBBONS,
  FISH,
  ITEMS,
  SEASON_INFO
} from '../../data/definitions';
import { animalEconomics, cropEconomics } from '../../systems/almanac';
import { isCollected } from '../../systems/collections';
import { fishSeasonLabel, fishValue } from '../../systems/fishing';
import { formatNumber } from '../../systems/util';
import type { UIContext } from '../context';
import {
  button,
  el,
  iconImg,
  panelHeader,
  pill,
  progressBar,
  tabs
} from '../uiKit';

function money(value: number): string {
  return `${formatNumber(Math.round(value))}g`;
}

function rate(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `~${rounded.toFixed(1).replace(/\.0$/, '')}g/day`;
}

function metric(label: string, value: string): HTMLElement {
  const box = el('div', 'almanac-metric');
  box.appendChild(el('span', 'hint', label));
  box.appendChild(el('strong', undefined, value));
  return box;
}

function profit(label: string, value: string, detail?: string): HTMLElement {
  const box = el('div', 'almanac-profit');
  box.appendChild(el('span', 'hint', label));
  box.appendChild(el('strong', undefined, value));
  if (detail) box.appendChild(el('span', 'hint', detail));
  return box;
}

export function renderAlmanac(ctx: UIContext, root: HTMLElement): void {
  let tab = 0;
  const content = el('div', 'panel-content');

  const render = () => {
    content.innerHTML = '';
    const state = ctx.state;
    const d = state.data;
    const head = panelHeader(
      'Farm Almanac',
      'Plan crops, livestock and fishing, then complete your collection.'
    );
    head.appendChild(
      el(
        'p',
        'hint',
        `${SEASON_INFO[d.season].name} ${d.day}, Year ${d.year} · ${
          state.hasGreenhouse() ? 'Greenhouse active: all crops can be planted.' : 'Seasonal restrictions apply.'
        }`
      )
    );
    content.appendChild(head);
    content.appendChild(
      tabs(['Crops', 'Livestock', 'Fish', 'Collection'], tab, (i) => {
        tab = i;
        render();
      })
    );

    if (tab === 0) {
      const grid = el('div', 'card-grid wide');
      const crops = Object.values(CROPS)
        .map((crop) => ({
          crop,
          economics: cropEconomics(crop),
          plantable: state.canPlantCrop(crop.id)
        }))
        .sort(
          (a, b) =>
            Number(b.plantable) - Number(a.plantable) ||
            b.economics.firstHarvestProfitPerDay - a.economics.firstHarvestProfitPerDay
        );

      for (const { crop, economics, plantable } of crops) {
        const card = el('div', 'shop-card almanac-card');
        const top = el('div', 'almanac-top');
        top.appendChild(iconImg(ctx.icon(crop.harvestId), 44, crop.name));
        const info = el('div', 'shop-info grow');
        info.appendChild(el('strong', undefined, crop.name));
        info.appendChild(el('span', 'hint', crop.desc));
        const tags = el('div', 'tag-row');
        for (const season of crop.seasons) {
          tags.appendChild(pill(SEASON_INFO[season].name, `season-${season}`));
        }
        tags.appendChild(
          plantable ? pill('Plantable now', 'good') : pill('Out of season', 'warn')
        );
        info.appendChild(tags);
        top.appendChild(info);
        card.appendChild(top);

        const facts = el('div', 'almanac-metrics');
        facts.appendChild(metric('Growth', `${crop.growthDays}d`));
        facts.appendChild(metric('Yield', `${crop.yieldMin}-${crop.yieldMax}`));
        facts.appendChild(metric('Seed', money(economics.seedCost)));
        facts.appendChild(metric('Sell', money(economics.sellPrice)));
        card.appendChild(facts);

        card.appendChild(
          profit(
            'First harvest',
            rate(economics.firstHarvestProfitPerDay),
            `${money(economics.firstHarvestProfit)} net over ${crop.growthDays} days`
          )
        );
        if (economics.regrowProfitPerDay !== null) {
          card.appendChild(
            profit(
              'Regrow',
              rate(economics.regrowProfitPerDay),
              `no seed cost, every ${crop.regrowDays} days`
            )
          );
        } else {
          card.appendChild(el('p', 'hint', 'Replant after harvest.'));
        }
        grid.appendChild(card);
      }

      content.appendChild(grid);
      content.appendChild(
        el(
          'p',
          'hint center',
          'Estimates use base sell prices, normal quality, and average yield. Market trends and quality bonuses can increase returns.'
        )
      );
    } else if (tab === 1) {
      const grid = el('div', 'card-grid wide');
      for (const animal of Object.values(ANIMALS)) {
        const economics = animalEconomics(animal);
        const product = ITEMS[animal.productId];
        const owned = state.data.animals.filter((a) => a.species === animal.id).length;
        const card = el('div', 'shop-card almanac-card');
        const top = el('div', 'almanac-top');
        top.appendChild(iconImg(ctx.icon(animal.productId), 44, product?.name ?? animal.productId));
        const info = el('div', 'shop-info grow');
        info.appendChild(el('strong', undefined, animal.name));
        info.appendChild(el('span', 'hint', animal.desc));
        const tags = el('div', 'tag-row');
        tags.appendChild(pill(animal.housing === 'coop' ? 'Coop' : 'Barn'));
        tags.appendChild(pill(`Owned ${owned}`, owned > 0 ? 'good' : ''));
        info.appendChild(tags);
        top.appendChild(info);
        card.appendChild(top);

        const facts = el('div', 'almanac-metrics');
        facts.appendChild(metric('Price', money(animal.price)));
        facts.appendChild(metric('Matures', `${animal.maturityDays}d`));
        facts.appendChild(metric('Product', money(economics.productSellPrice)));
        facts.appendChild(metric('Feed', money(economics.feedCost)));
        card.appendChild(facts);

        card.appendChild(
          profit(
            'Potential daily net',
            rate(economics.netPerDay),
            `after maturity, ${product?.name ?? 'product'} minus feed`
          )
        );
        grid.appendChild(card);
      }

      content.appendChild(grid);
      content.appendChild(
        el(
          'p',
          'hint center',
          'Livestock produce after maturity when fed and kept happy. Base product prices are shown.'
        )
      );
    } else if (tab === 2) {
      const grid = el('div', 'card-grid wide');
      for (const fish of Object.values(FISH)) {
        const item = ITEMS[fish.itemId];
        const caught = isCollected(state.data, fish.itemId);
        const card = el('div', 'shop-card almanac-card');
        const top = el('div', 'almanac-top');
        top.appendChild(iconImg(ctx.icon(fish.itemId), 44, fish.name));
        const info = el('div', 'shop-info grow');
        info.appendChild(el('strong', undefined, fish.name));
        info.appendChild(el('span', 'hint', fish.desc));
        const tags = el('div', 'tag-row');
        tags.appendChild(pill(fishSeasonLabel(fish)));
        tags.appendChild(pill(fish.weathers.join(' / ')));
        tags.appendChild(caught ? pill('Caught', 'good') : pill('Not caught', 'warn'));
        info.appendChild(tags);
        top.appendChild(info);
        card.appendChild(top);

        const facts = el('div', 'almanac-metrics');
        facts.appendChild(metric('Hours', `${fish.minHour}:00-${fish.maxHour}:00`));
        facts.appendChild(metric('Value', money(fishValue(fish))));
        facts.appendChild(metric('Rarity', `${Math.round(fish.rarity * 100)}%`));
        facts.appendChild(metric('Bait', 'Improves reel zone'));
        card.appendChild(facts);
        grid.appendChild(card);
      }
      content.appendChild(grid);
      content.appendChild(
        el(
          'p',
          'hint center',
          'Fish appear only in the listed seasons, weather and hours. Select the Fishing Rod and click the pond edge.'
        )
      );
    } else {
      const collection = state.collectionState();
      const summary = el('div', 'level-card');
      const summaryText = el('div');
      summaryText.appendChild(el('h3', undefined, 'Collection Album'));
      summaryText.appendChild(
        el(
          'p',
          'hint',
          `${collection.total.found} / ${collection.total.total} entries discovered across all albums.`
        )
      );
      if (collection.total.found >= collection.total.total) {
        const curator = el('div', 'tag-row');
        curator.appendChild(pill('Farm Curator', 'gold'));
        summaryText.appendChild(curator);
      }
      summary.appendChild(summaryText);
      summary.appendChild(
        progressBar(collection.total.found, collection.total.total, undefined, 'xp')
      );
      content.appendChild(summary);

      for (const set of collection.sets) {
        const sec = el('section', 'ui-section');
        const head = el('div', 'section-head');
        head.appendChild(el('h3', undefined, set.def.name));
        head.appendChild(el('span', 'hint', `${set.found} / ${set.total} · ${set.def.desc}`));
        sec.appendChild(head);
        sec.appendChild(progressBar(set.found, set.total, undefined, 'xp'));

        const itemGrid = el('div', 'collection-grid');
        for (const item of set.items) {
          const def = ITEMS[item.itemId];
          const cell = el('div', `collection-cell${item.found ? ' found' : ' missing'}`);
          cell.appendChild(iconImg(ctx.icon(item.itemId), 34, def?.name ?? item.itemId));
          cell.appendChild(el('span', 'hint', def?.name ?? item.itemId));
          if (item.qualities.length > 0) {
            const stamps = el('div', 'tag-row');
            for (const quality of ['normal', 'silver', 'gold'] as const) {
              if (item.qualities.includes(quality)) {
                stamps.appendChild(pill(quality === 'normal' ? 'Base' : quality, quality));
              }
            }
            cell.appendChild(stamps);
          }
          itemGrid.appendChild(cell);
        }
        sec.appendChild(itemGrid);

        const milestones = el('div', 'collection-milestones');
        for (const milestone of set.milestones) {
          const row = el('div', 'list-row compact');
          const info = el('div', 'list-info');
          info.appendChild(el('strong', undefined, `${milestone.def.count} entries`));
          info.appendChild(el('span', 'hint', `+${milestone.def.coins} coins · ${milestone.def.xp} XP`));
          row.appendChild(info);
          const actions = el('div', 'row-actions');
          if (milestone.claimed) {
            actions.appendChild(pill('Claimed', 'good'));
          } else {
            actions.appendChild(
              button(milestone.ready ? 'Claim' : `${set.found}/${milestone.def.count}`, {
                small: true,
                variant: 'gold',
                disabled: !milestone.ready,
                onClick: () => {
                  const result = state.claimCollectionMilestone(set.def.id, milestone.def.id);
                  ctx.toast(result.message ?? '', result.ok ? 'reward' : 'error');
                  if (result.ok) ctx.requestSave();
                  render();
                }
              })
            );
          }
          row.appendChild(actions);
          milestones.appendChild(row);
        }
        sec.appendChild(milestones);
        content.appendChild(sec);
      }

      const ribbonSec = el('section', 'ui-section');
      const ribbonHead = el('div', 'section-head');
      ribbonHead.appendChild(el('h3', undefined, 'Festival Ribbons'));
      ribbonHead.appendChild(el('span', 'hint', 'Awards from the Day 28 judging contests.'));
      ribbonSec.appendChild(ribbonHead);
      const ribbonGrid = el('div', 'tag-row');
      for (const ribbon of FESTIVAL_RIBBONS) {
        ribbonGrid.appendChild(
          pill(ribbon.name, collection.ribbons.includes(ribbon.id) ? ribbon.tier : 'warn')
        );
      }
      ribbonSec.appendChild(ribbonGrid);
      content.appendChild(ribbonSec);
    }

    const footer = el('div', 'panel-footer');
    footer.appendChild(button('Close', { onClick: () => ctx.closePanel() }));
    content.appendChild(footer);
  };

  root.appendChild(content);
  render();
  ctx.setPanelRefresh(render);
}
