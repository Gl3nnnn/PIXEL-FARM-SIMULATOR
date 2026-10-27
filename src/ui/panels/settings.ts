import { audio } from '../../systems/audio';
import { saveSettings } from '../../systems/save';
import type { UIContext } from '../context';
import { button, el, panelHeader, section } from '../uiKit';

export function renderSettings(ctx: UIContext, root: HTMLElement): void {
  const content = el('div', 'panel-content');
  content.appendChild(panelHeader('Settings', 'Adjust sound and manage your save.'));

  const audioSec = section('Audio');
  const makeToggle = (
    label: string,
    value: boolean,
    onChange: (next: boolean) => void
  ): HTMLElement => {
    const row = el('div', 'setting-row');
    row.appendChild(el('span', undefined, label));
    const btn = button(value ? 'ON' : 'OFF', {
      small: true,
      variant: value ? 'primary' : 'secondary',
      onClick: () => {
        onChange(!value);
        audio.play('click');
        renderAll();
      }
    });
    row.appendChild(btn);
    return row;
  };

  const renderAll = () => {
    content.innerHTML = '';
    content.appendChild(panelHeader('Settings', 'Adjust sound and manage your save.'));
    const audioBox = section('Audio');
    audioBox.appendChild(
      makeToggle('Sound effects', audio.settings.sfx, (next) => {
        audio.setSfx(next);
        audio.play('click');
      })
    );
    audioBox.appendChild(
      makeToggle('Music', audio.settings.music, (next) => {
        audio.setMusic(next);
      })
    );
    const volRow = el('div', 'setting-row');
    volRow.appendChild(el('span', undefined, `Volume ${Math.round(audio.settings.volume * 100)}%`));
    const range = el('input', 'volume-range');
    range.type = 'range';
    range.min = '0';
    range.max = '100';
    range.value = String(Math.round(audio.settings.volume * 100));
    range.addEventListener('change', () => {
      audio.setVolume(Number(range.value) / 100);
      saveSettings(audio.settings);
      renderAll();
    });
    volRow.appendChild(range);
    audioBox.appendChild(volRow);
    content.appendChild(audioBox);

    const saveSec = section('Save', 'This game saves locally in this browser.');
    const saveRow = el('div', 'setting-row');
    saveRow.appendChild(el('span', undefined, 'Save your progress now'));
    saveRow.appendChild(
      button('Save game', {
        small: true,
        variant: 'primary',
        onClick: () => {
          ctx.requestSave();
          ctx.toast('Game saved.', 'success');
        }
      })
    );
    saveSec.appendChild(saveRow);
    saveSec.appendChild(
      el(
        'p',
        'hint',
        'Saves are stored on this device only. They do not sync between browsers or devices.'
      )
    );
    content.appendChild(saveSec);

    const danger = section('Session');
    const exitRow = el('div', 'setting-row');
    exitRow.appendChild(el('span', undefined, 'Return to the main menu'));
    exitRow.appendChild(
      button('Main menu', {
        small: true,
        variant: 'danger',
        onClick: () => {
          ctx.exitToMenu();
        }
      })
    );
    danger.appendChild(exitRow);
    content.appendChild(danger);

    const footer = el('div', 'panel-footer');
    footer.appendChild(button('Close', { onClick: () => ctx.closePanel() }));
    content.appendChild(footer);
  };

  root.appendChild(content);
  renderAll();
  ctx.setPanelRefresh(renderAll);
}
