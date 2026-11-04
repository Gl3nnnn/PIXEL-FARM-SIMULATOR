import { MINE_MAX_FLOOR, WEAPONS } from '../../data/definitions';
import { audio } from '../../systems/audio';
import { formatNumber } from '../../systems/util';
import type { UIContext } from '../context';
import { button, el, pill, progressBar, section } from '../uiKit';

export function renderMine(ctx: UIContext, root: HTMLElement): void {
  const content = el('div', 'panel-content');
  let log = '';

  const act = (result: { ok: boolean; message?: string }) => {
    log = result.message ?? '';
    ctx.toast(log, result.ok ? 'success' : 'error');
    audio.play(result.ok ? 'harvest' : 'error');
    if (result.ok) ctx.requestSave();
    render();
  };

  const render = () => {
    content.innerHTML = '';
    const state = ctx.state;
    const info = state.mineState();
    const run = info.run;

    const header = el('div', 'level-card');
    const left = el('div');
    left.appendChild(el('h3', undefined, `Old Mine · Floor ${info.floor?.number ?? run.floor}`));
    left.appendChild(
      el(
        'p',
        'hint',
        `Deepest floor ${run.maxFloor} / ${MINE_MAX_FLOOR} · ${run.monstersDefeated} monsters defeated`
      )
    );
    header.appendChild(left);
    header.appendChild(progressBar(run.hp, run.maxHp, `HP ${run.hp} / ${run.maxHp}`, 'hp'));
    header.appendChild(progressBar(state.energy(), state.maxEnergy(), 'Energy', 'xp'));
    content.appendChild(header);

    if (info.weapon) {
      const row = el('div', 'tag-row');
      row.appendChild(pill(`Weapon: ${info.weapon.name} (${info.weapon.damage} dmg)`, 'gold'));
      row.appendChild(pill(`Mining level ${state.skillLevel('mining')}`));
      content.appendChild(row);
    }

    if (!info.active) {
      const entry = section('Mine Entrance', 'Bring a pickaxe and a weapon. The dark is patient.');
      entry.appendChild(
        el(
          'p',
          'hint',
          state.hasItem('pickaxe')
            ? 'A cold draft rises from the shaft. The elevator waits for floors you have unlocked.'
            : 'You need a pickaxe before you can dig here.'
        )
      );
      const actions = el('div', 'row-actions');
      actions.appendChild(
        button(`Enter floor ${run.floor}`, {
          variant: 'primary',
          disabled: !state.hasItem('pickaxe'),
          onClick: () => act(state.enterMine(run.floor))
        })
      );
      actions.appendChild(button('Back to town', { onClick: () => ctx.openPanel('town') }));
      entry.appendChild(actions);
      content.appendChild(entry);

      if (run.elevator.length > 0) {
        const elevator = section('Elevator', 'Checkpoints unlocked every five floors.');
        const row = el('div', 'tag-row');
        for (const stop of run.elevator) {
          row.appendChild(
            button(`Floor ${stop}`, {
              small: true,
              variant: stop === run.floor ? 'primary' : 'secondary',
              disabled: stop > run.maxFloor,
              onClick: () => act(state.useElevator(stop))
            })
          );
        }
        elevator.appendChild(row);
        content.appendChild(elevator);
      }
    } else if (info.floor) {
      const floor = info.floor;
      const board = section(
        `Floor ${floor.number}`,
        'Click a neighbouring tile to move, mine, or fight. Reach the ladder to go deeper.'
      );
      const grid = el('div', 'mine-grid');
      for (let y = 0; y < floor.tiles.length; y++) {
        for (let x = 0; x < floor.tiles[y].length; x++) {
          const type = floor.tiles[y][x];
          const rock = floor.rocks.find((entry) => entry.x === x && entry.y === y);
          const monster = floor.monsters.find((entry) => entry.x === x && entry.y === y);
          const isPlayer = floor.player.x === x && floor.player.y === y;
          let tileType: string = type;
          if (isPlayer) tileType = 'player';
          else if (monster) tileType = 'monster';
          else if (rock) tileType = 'rock';

          const tile = el('button', `mine-tile ${tileType}`);
          tile.type = 'button';
          let label = '';
          let title = '';
          if (isPlayer) {
            label = 'P';
            title = 'You';
          } else if (monster) {
            label = 'M';
            title = `${monster.def.name} · ${monster.hp}/${monster.maxHp} HP`;
          } else if (rock) {
            label = 'R';
            title = `${rock.kind} rock · ${rock.hp}/${rock.maxHp} hits`;
          } else if (type === 'ladder') {
            label = 'L';
            title = 'Ladder down';
          } else if (type === 'wall') {
            title = 'Rock wall';
          }
          tile.textContent = label;
          tile.title = title;
          if (type === 'wall') tile.disabled = true;
          else if (!isPlayer) {
            tile.addEventListener('click', () => {
              const dx = x - floor.player.x;
              const dy = y - floor.player.y;
              if (Math.abs(dx) + Math.abs(dy) !== 1) {
                ctx.toast('Move one tile at a time.', 'info');
                return;
              }
              const result = state.mineStep(dx, dy);
              act(result);
            });
          }
          grid.appendChild(tile);
        }
      }
      board.appendChild(grid);

      const controls = el('div', 'row-actions mine-controls');
      const move = (label: string, dx: number, dy: number) => {
        const b = button(label, {
          small: true,
          onClick: () => {
            const result = state.mineStep(dx, dy);
            act(result);
          }
        });
        controls.appendChild(b);
      };
      move('↑', 0, -1);
      move('↓', 0, 1);
      move('←', -1, 0);
      move('→', 1, 0);
      board.appendChild(controls);

      const onLadder = floor.player.x === floor.ladder.x && floor.player.y === floor.ladder.y;
      const deeper = el('div', 'row-actions');
      deeper.appendChild(
        button(onLadder ? 'Descend' : 'Find the ladder', {
          variant: 'gold',
          disabled: !onLadder,
          onClick: () => act(state.descendMine())
        })
      );
      deeper.appendChild(
        button('Leave the mine', {
          variant: 'secondary',
          onClick: () => act(state.returnToSurface())
        })
      );
      board.appendChild(deeper);
      content.appendChild(board);
    }

    if (log) {
      content.appendChild(el('p', 'hint center mine-log', log));
    }

    // The bottom of the mine holds a treasure room worth one last trip down.
    const summit = state.summitState();
    const treasury = section(
      'The treasure room',
      `Something was left behind on floor ${summit.maxFloor}.`
    );
    const treasuryRow = el('div', 'list-row compact');
    const treasuryInfo = el('div', 'list-info grow');
    treasuryInfo.appendChild(el('strong', undefined, 'The Old Miner Treasury'));
    treasuryInfo.appendChild(
      el(
        'span',
        'hint',
        summit.claimed
          ? 'You have already carried it all home.'
          : summit.reached
            ? `${formatNumber(summit.coins)} coins and the ${summit.itemName} are waiting for you.`
            : `Reach floor ${summit.maxFloor} to open it. The deepest floor so far is ${run.maxFloor}.`
      )
    );
    treasuryRow.appendChild(treasuryInfo);
    if (summit.claimed) {
      treasuryRow.appendChild(pill('Claimed', 'good'));
    } else {
      treasuryRow.appendChild(
        button('Open the vault', {
          small: true,
          variant: 'gold',
          disabled: !summit.reached,
          onClick: () => act(state.claimSummit())
        })
      );
    }
    treasury.appendChild(treasuryRow);
    content.appendChild(treasury);

    const shop = section('Blacksmith', 'Better steel makes the deeper floors survivable.');
    const grid = el('div', 'card-grid wide');
    for (const weapon of WEAPONS) {
      const owned = run.weapons.includes(weapon.id);
      const card = el('div', 'build-card');
      const body = el('div', 'shop-info');
      body.appendChild(el('strong', undefined, weapon.name));
      body.appendChild(el('span', 'hint', `${weapon.damage} damage · ${weapon.desc}`));
      const tags = el('div', 'tag-row');
      if (owned) tags.appendChild(pill('Owned', 'good'));
      if (run.weapon === weapon.id) tags.appendChild(pill('Equipped', 'gold'));
      if (state.level < weapon.unlockLevel) tags.appendChild(pill(`Level ${weapon.unlockLevel}`, 'warn'));
      body.appendChild(tags);
      card.appendChild(body);
      const actions = el('div', 'shop-actions');
      if (owned) {
        actions.appendChild(
          button('Equip', {
            small: true,
            disabled: run.weapon === weapon.id,
            onClick: () => act(state.equipWeapon(weapon.id))
          })
        );
      } else {
        actions.appendChild(el('span', 'price', `${weapon.price}g`));
        actions.appendChild(
          button('Buy', {
            small: true,
            variant: 'primary',
            disabled: state.level < weapon.unlockLevel || state.data.coins < weapon.price,
            onClick: () => act(state.buyWeapon(weapon.id))
          })
        );
      }
      card.appendChild(actions);
      grid.appendChild(card);
    }
    shop.appendChild(grid);
    content.appendChild(shop);

    const footer = el('div', 'panel-footer');
    footer.appendChild(button('Back to town', { onClick: () => ctx.openPanel('town') }));
    footer.appendChild(button('Close', { onClick: () => ctx.closePanel() }));
    content.appendChild(footer);
  };

  root.appendChild(content);
  render();
  ctx.setPanelRefresh(render);
}
