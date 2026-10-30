export const GAME_VERSION = '2.1.0';

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2.1.0',
    date: '2026-10-30',
    title: 'Backpack and quality-of-life update',
    changes: [
      'Added a version and update board to the main menu.',
      'Backpack now supports search, sorting, item locking, and bulk actions.',
      'Gift preview shows how much a villager will like a gift before giving it.',
      'Added ten gameplay improvements, including a Go to Bed menu option.',
      'Settings validation now keeps reduce-flashing preferences in sync.'
    ]
  },
  {
    version: '2.0.0',
    date: '2026-10-27',
    title: 'Complete farming simulation',
    changes: [
      'Collection album, helper automation, seasonal festivals, fishing, mining, and NPCs.',
      'Improved performance, touch controls, and daily market economy.',
      'Polished HUD, panels, and responsive layout for every screen size.',
      'The game canvas now fills the whole window.'
    ]
  },
  {
    version: '1.0.0',
    date: '2026-10-27',
    title: 'First harvest',
    changes: [
      'Initial release with crops, animals, buildings, crafting, quests, and seasons.',
      'Three save slots with autosave and JSON backup and restore.',
      'Procedural pixel art and synthesized audio with no external assets.'
    ]
  }
];
