export const GAME_VERSION = '2.8.0';

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2.8.0',
    date: '2026-11-04',
    title: 'A day that has an end',
    changes: [
      'Energy: every job now costs a little energy, and sleep refills it. Running out means the day is done.',
      'Professions: at skill level 5 and 10 you pick one of two paths per skill, such as Tiller or Rancher.',
      'Wild plants appear on open ground each morning and can be picked up for early income.',
      'Crows now eat unprotected crops overnight. A Scarecrow keeps them off the fields around it.',
      'Cooking matters: eating a dish gives a day of faster walking, better harvests or a burst of energy.',
      'Community bundles: bring the village its favourite goods for coins, XP and rare rewards.',
      'A mailbox with letters that arrive as your farm grows, each with a little gift inside.',
      'New Community panel (U) holds the energy bar, professions, bundles and mail.'
    ]
  },
  {
    version: '2.7.0',
    date: '2026-11-03',
    title: 'Orchards and new faces',
    changes: [
      'Thirty-four new crops, including fruit trees that keep fruiting: pear, peach, apple, cherry, lemon, lime, cocoa and more.',
      'New herbs and spices for the southern fields: mint, rosemary, cardamom, turmeric, cassava, taro and mushrooms.',
      'Twenty new animals, from eels and kiwis to bison, highland cows and corgis.',
      'Two bigger homes: the Big Ranch holds eight large animals and the Farm Pond holds eight water animals.'
    ]
  },
  {
    version: '2.6.0',
    date: '2026-11-03',
    title: 'Room to grow',
    changes: [
      'The farm is now much bigger, with open land below the old fields to build on.',
      'Five new fields to buy: Willow, Terrace, Lakeside, Orchard and Sunrise.',
      'Three new ponds for fishing, plus a second quarry with nine more rocks to mine.',
      'New roads across the southern land, so every field and pond is easy to reach.'
    ]
  },
  {
    version: '2.5.0',
    date: '2026-11-03',
    title: 'A much bigger farm',
    changes: [
      'Fifty new crops to grow, from quick radishes to rare saffron and watermelons.',
      'Fifty new animals with their own products, from bees and rabbits to camels and zebras.',
      'Seven new animal homes and many new buildings, including a Stable, Apiary, Aviary and Great Pasture.',
      'Fifty new farm tools that make tilling, watering, walking, fishing, mining and carrying easier.',
      'A new Tools tab in the shop shows every tool, its job and its price.'
    ]
  },
  {
    version: '2.4.2',
    date: '2026-11-02',
    title: 'Conversations at your pace',
    changes: [
      'NPC conversations no longer advance automatically.',
      'After you greet a visitor, press Continue when you are ready to hear their reply.'
    ]
  },
  {
    version: '2.4.1',
    date: '2026-11-02',
    title: 'Cleaner NPC conversations',
    changes: [
      'NPC dialogue stays quiet until you press Talk instead of showing a greeting automatically.',
      'Conversations play out one speaker at a time, with the active avatar highlighted and the listener dimmed.'
    ]
  },
  {
    version: '2.4.0',
    date: '2026-11-02',
    title: 'Shop and building previews',
    changes: [
      'Shop upgrades now show their tool artwork, including new boots and backpack icons.',
      'Build cards preview the building sprite before you place it on the farm.',
      'Animal cards and animal lists show the animal itself instead of its product.'
    ]
  },
  {
    version: '2.3.3',
    date: '2026-11-01',
    title: 'Consistent modal sizing',
    changes: [
      'Game panels now keep a consistent height when switching tabs, with scrolling inside the panel instead of resizing the whole modal.',
      'Scrollbars reserve their space so panel content no longer shifts sideways between tabs.'
    ]
  },
  {
    version: '2.3.2',
    date: '2026-11-01',
    title: 'Face-to-face NPC chats',
    changes: [
      'Talking to a visitor now opens a side-by-side conversation with player and visitor avatars.',
      'Chat responses stay in the NPC speech bubble instead of disappearing as a toast, and the Talk button shows Talked today after your daily chat.'
    ]
  },
  {
    version: '2.3.1',
    date: '2026-11-01',
    title: 'Request-only NPC donations',
    changes: [
      'NPCs now only accept the item requested for their weekly donation instead of any backpack item.',
      'The donation button shows Not available with a missing-item count until you have enough of the requested item.'
    ]
  },
  {
    version: '2.3.0',
    date: '2026-11-01',
    title: 'Living farm graphics pass',
    changes: [
      'Rebuilt the farm ground with seasonal grass fields, path fringes, pond shores, reeds, lily pads, and scattered natural details.',
      'Added layered time-of-day lighting, warm window glows, fireflies, vignette, and stronger rain and storm moods.',
      'Added soft shadows and ambient motion for buildings, trees, crops, animals, villagers, birds, and butterflies.',
      'Added rain splashes, puddles, snowfall, falling leaves, water ripples, harvest sparkles, floating rewards, and tool feedback.',
      'Polished the HUD, hotbar, toasts, and panels with pixel-style typography and richer framing.',
      'Batched the static grass layer so the larger, more detailed farm stays smooth.'
    ]
  },
  {
    version: '2.2.0',
    date: '2026-10-30',
    title: 'Main menu makeover',
    changes: [
      'Rebuilt the menu backdrop with layered hills, winding paths, a pond, crop fields, and a fuller farmstead.',
      'Added swaying trees and flowers, wandering animals, butterflies, birds, drifting clouds, and chimney smoke.',
      'Added time-of-day lighting with sunrise, daylight, dusk, moonlight, stars, and fireflies.',
      'Refined the parchment menu, buttons, hover feedback, and update notes scrolling.'
    ]
  },
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
