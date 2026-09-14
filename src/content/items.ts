import type { SectionKey } from './sections';

export type Hue = 'warm' | 'cool' | 'earth' | 'neutral' | 'metallic';

export type Item = {
  key: string;
  name: string;
  icon: string;
  section: SectionKey;
  hue: Hue | null;
  /** Payout in cents, before the combo multiplier. */
  value: number;
  rarity: 'common' | 'premium';
  /** Stamina restored when shelved correctly. Back room items only. */
  stamina: number;
};

const COMMON_VALUE = 200;
const PREMIUM_VALUE = 800;

/** [key, name, icon, hue, premium?] */
type Row = [string, string, string, Hue | null, true?];

function build(section: SectionKey, rows: Row[]): Item[] {
  return rows.map(([key, name, icon, hue, premium]) => ({
    key,
    name,
    icon,
    section,
    hue,
    value: premium ? PREMIUM_VALUE : COMMON_VALUE,
    rarity: premium ? ('premium' as const) : ('common' as const),
    stamina: 0,
  }));
}

const PIGMENTS = build('pigments', [
  ['cadmium-red', 'Cadmium Red', '🔴', 'warm'],
  ['alizarin-crimson', 'Alizarin Crimson', '🟥', 'warm'],
  ['vermilion', 'Vermilion', '🟧', 'warm'],
  ['cadmium-orange', 'Cadmium Orange', '🟠', 'warm'],
  ['naples-yellow', 'Naples Yellow', '🟡', 'warm'],
  ['cadmium-yellow', 'Cadmium Yellow', '🟨', 'warm'],
  ['lemon-yellow', 'Lemon Yellow', '🟡', 'warm'],
  ['yellow-ochre', 'Yellow Ochre', '🟫', 'earth'],
  ['raw-sienna', 'Raw Sienna', '🟤', 'earth'],
  ['burnt-sienna', 'Burnt Sienna', '🟫', 'earth'],
  ['raw-umber', 'Raw Umber', '🟤', 'earth'],
  ['burnt-umber', 'Burnt Umber', '🟫', 'earth'],
  ['venetian-red', 'Venetian Red', '🟥', 'earth'],
  ['sap-green', 'Sap Green', '🟢', 'cool'],
  ['viridian', 'Viridian', '🟩', 'cool'],
  ['phthalo-green', 'Phthalo Green', '🟢', 'cool'],
  ['terre-verte', 'Terre Verte', '🟩', 'earth'],
  ['cerulean-blue', 'Cerulean Blue', '🔵', 'cool'],
  ['cobalt-blue', 'Cobalt Blue', '🟦', 'cool'],
  ['ultramarine', 'Ultramarine', '🔵', 'cool'],
  ['prussian-blue', 'Prussian Blue', '🟦', 'cool'],
  ['phthalo-blue', 'Phthalo Blue', '🔵', 'cool'],
  ['indigo', 'Indigo', '🟦', 'cool'],
  ['dioxazine-purple', 'Dioxazine Purple', '🟣', 'cool'],
  ['quinacridone-magenta', 'Quinacridone Magenta', '🟪', 'cool'],
  ['paynes-grey', "Payne's Grey", '⚫', 'neutral'],
  ['ivory-black', 'Ivory Black', '⬛', 'neutral'],
  ['mars-black', 'Mars Black', '⬛', 'neutral'],
  ['titanium-white', 'Titanium White', '⬜', 'neutral'],
  ['zinc-white', 'Zinc White', '⚪', 'neutral'],
  ['gold-leaf', 'Gold Leaf', '🥇', 'metallic', true],
  ['silver-leaf', 'Silver Leaf', '🥈', 'metallic', true],
  ['iridescent-medium', 'Iridescent Medium', '✨', 'metallic', true],
  ['lapis-lazuli', 'Lapis Lazuli', '💎', 'cool', true],
  ['gum-arabic', 'Gum Arabic', '🫙', null],
  ['linseed-oil', 'Linseed Oil', '🧴', null],
  ['gesso', 'Gesso', '🪣', 'neutral'],
  ['matte-medium', 'Matte Medium', '🫙', null],
  ['india-ink', 'India Ink', '🖤', 'neutral'],
  ['walnut-ink', 'Walnut Ink', '🟤', 'earth'],
]);

const BRUSHES = build('brushes', [
  ['round-2', 'Round No. 2', '🖌️', null],
  ['round-6', 'Round No. 6', '🖌️', null],
  ['round-12', 'Round No. 12', '🖌️', null],
  ['flat-4', 'Flat No. 4', '🖌️', null],
  ['flat-10', 'Flat No. 10', '🖌️', null],
  ['filbert-8', 'Filbert No. 8', '🖌️', null],
  ['fan-brush', 'Fan Brush', '🖌️', null],
  ['rigger-brush', 'Rigger Brush', '🖌️', null],
  ['mop-brush', 'Mop Brush', '🖌️', null],
  ['hake-brush', 'Hake Brush', '🖌️', null],
  ['sable-liner', 'Sable Liner', '🖌️', null, true],
  ['squirrel-quill', 'Squirrel Quill', '🪶', null, true],
  ['palette-knife', 'Palette Knife', '🔪', null],
  ['painting-knife', 'Painting Knife', '🔪', null],
  ['scraper', 'Scraper', '🔪', null],
  ['craft-knife', 'Craft Knife', '🔪', null],
  ['scissors', 'Scissors', '✂️', null],
  ['hb-pencil', 'HB Pencil', '✏️', null],
  ['2b-pencil', '2B Pencil', '✏️', null],
  ['6b-pencil', '6B Pencil', '✏️', null],
  ['mechanical-pencil', 'Mechanical Pencil', '✏️', null],
  ['charcoal-stick', 'Charcoal Stick', '⚫', 'neutral'],
  ['compressed-charcoal', 'Compressed Charcoal', '⬛', 'neutral'],
  ['conte-crayon', 'Conté Crayon', '🖍️', 'earth'],
  ['oil-pastel', 'Oil Pastel', '🖍️', 'warm'],
  ['soft-pastel', 'Soft Pastel', '🖍️', 'cool'],
  ['wax-crayon', 'Wax Crayon', '🖍️', 'warm'],
  ['graphite-stick', 'Graphite Stick', '✏️', 'neutral'],
  ['kneaded-eraser', 'Kneaded Eraser', '🧽', null],
  ['vinyl-eraser', 'Vinyl Eraser', '🧽', null],
  ['blending-stump', 'Blending Stump', '🖌️', null],
  ['dip-pen', 'Dip Pen', '🖊️', null],
  ['nib-set', 'Nib Set', '🖊️', null],
  ['fineliner', 'Fineliner', '🖊️', null],
  ['brush-pen', 'Brush Pen', '🖊️', null],
  ['marker-set', 'Marker Set', '🖍️', null],
  ['ruling-pen', 'Ruling Pen', '📏', null],
  ['metal-ruler', 'Metal Ruler', '📏', null],
  ['brush-washer', 'Brush Washer', '🪣', null],
  ['airbrush', 'Airbrush', '💨', null, true],
]);

const PAPER = build('paper', [
  ['hot-press-300', 'Hot Press 300gsm', '📄', null],
  ['cold-press-300', 'Cold Press 300gsm', '📄', null],
  ['rough-300', 'Rough 300gsm', '📄', null],
  ['bristol-board', 'Bristol Board', '📄', null],
  ['newsprint-pad', 'Newsprint Pad', '📃', null],
  ['cartridge-pad', 'Cartridge Pad', '🗒️', null],
  ['tracing-paper', 'Tracing Paper', '📃', null],
  ['vellum', 'Vellum', '📜', null],
  ['rice-paper', 'Rice Paper', '📜', null],
  ['washi-sheet', 'Washi Sheet', '📜', null],
  ['kraft-pad', 'Kraft Pad', '📒', 'earth'],
  ['black-card', 'Black Card', '⬛', 'neutral'],
  ['watercolour-block', 'Watercolour Block', '📘', null],
  ['sketchbook-a5', 'A5 Sketchbook', '📔', null],
  ['sketchbook-a3', 'A3 Sketchbook', '📓', null],
  ['hardbound-journal', 'Hardbound Journal', '📕', null],
  ['accordion-book', 'Accordion Book', '📖', null],
  ['gridded-pad', 'Gridded Pad', '🗒️', null],
  ['dot-grid-pad', 'Dot Grid Pad', '🗒️', null],
  ['toned-grey-pad', 'Toned Grey Pad', '📃', 'neutral'],
  ['toned-tan-pad', 'Toned Tan Pad', '📃', 'earth'],
  ['pastel-paper', 'Pastel Paper', '📄', null],
  ['printmaking-paper', 'Printmaking Paper', '📄', null],
  ['cotton-rag', 'Cotton Rag Sheet', '📄', null, true],
  ['handmade-deckle', 'Handmade Deckle Sheet', '📜', null, true],
  ['stretched-canvas-s', 'Stretched Canvas 8"', '🖼️', null],
  ['stretched-canvas-m', 'Stretched Canvas 16"', '🖼️', null],
  ['stretched-canvas-l', 'Stretched Canvas 36"', '🖼️', null, true],
  ['canvas-roll', 'Canvas Roll', '🧻', null],
  ['canvas-panel', 'Canvas Panel', '🖼️', null],
  ['linen-panel', 'Linen Panel', '🖼️', null, true],
  ['wood-cradle', 'Wood Cradle Board', '🪵', 'earth'],
  ['stretcher-bars', 'Stretcher Bars', '📏', 'earth'],
  ['mount-board', 'Mount Board', '🖼️', null],
  ['foam-board', 'Foam Board', '⬜', 'neutral'],
  ['acetate-sheet', 'Acetate Sheet', '📃', null],
  ['masking-tape', 'Masking Tape', '🏷️', null],
  ['glassine', 'Glassine Sheet', '📃', null],
  ['portfolio-case', 'Portfolio Case', '💼', null],
  ['drawing-board', 'Drawing Board', '🪵', 'earth'],
]);

const VINYL = build('vinyl', [
  ['7-inch-single', '7" Single', '💿', null],
  ['10-inch-ep', '10" EP', '💿', null],
  ['12-inch-lp', '12" LP', '💿', null],
  ['180g-pressing', '180g Pressing', '💿', null, true],
  ['picture-disc', 'Picture Disc', '📀', null, true],
  ['coloured-vinyl', 'Coloured Vinyl', '🟠', 'warm'],
  ['clear-vinyl', 'Clear Vinyl', '⚪', 'neutral'],
  ['white-label', 'White Label', '⬜', 'neutral'],
  ['test-pressing', 'Test Pressing', '💿', null, true],
  ['dub-plate', 'Dub Plate', '💿', null, true],
  ['acetate-disc', 'Acetate Disc', '💿', null],
  ['cassette-c60', 'C60 Cassette', '📼', null],
  ['cassette-c90', 'C90 Cassette', '📼', null],
  ['chrome-tape', 'Chrome Tape', '📼', null],
  ['metal-tape', 'Metal Tape', '📼', 'metallic'],
  ['reel-to-reel', 'Reel-to-Reel Tape', '📼', null, true],
  ['dat-tape', 'DAT Tape', '📼', null],
  ['minidisc', 'MiniDisc', '💽', null],
  ['cd-r', 'CD-R', '📀', null],
  ['jewel-case', 'Jewel Case', '📀', null],
  ['gatefold-sleeve', 'Gatefold Sleeve', '📁', null],
  ['inner-sleeve', 'Inner Sleeve', '📁', null],
  ['poly-outer', 'Poly Outer', '📁', null],
  ['record-crate', 'Record Crate', '📦', null],
  ['45-adapter', '45 Adapter', '⭕', null],
  ['slipmat', 'Slipmat', '⬛', 'neutral'],
  ['lacquer-master', 'Lacquer Master', '💿', null, true],
  ['flexi-disc', 'Flexi Disc', '💿', null],
  ['box-set', 'Box Set', '📦', null, true],
  ['zine-insert', 'Zine Insert', '📄', null],
  ['lyric-sheet', 'Lyric Sheet', '📄', null],
  ['obi-strip', 'Obi Strip', '🏷️', null],
  ['record-brush', 'Record Brush', '🖌️', null],
  ['vinyl-cleaner', 'Vinyl Cleaner', '🧴', null],
  ['sleeve-sticker', 'Sleeve Sticker', '🏷️', null],
  ['promo-copy', 'Promo Copy', '💿', null],
  ['bootleg-lp', 'Bootleg LP', '💿', null],
  ['field-recording-tape', 'Field Recording Tape', '📼', null],
  ['demo-cassette', 'Demo Cassette', '📼', null],
  ['shellac-78', 'Shellac 78', '💿', null, true],
]);

const GEAR = build('gear', [
  ['xlr-cable', 'XLR Cable', '🔌', null],
  ['trs-cable', 'TRS Cable', '🔌', null],
  ['ts-instrument-cable', 'TS Instrument Cable', '🔌', null],
  ['rca-pair', 'RCA Pair', '🔌', null],
  ['midi-cable', 'MIDI Cable', '🔌', null],
  ['usb-c-cable', 'USB-C Cable', '🔌', null],
  ['patch-cable', 'Patch Cable', '🔌', null],
  ['speakon-cable', 'Speakon Cable', '🔌', null],
  ['di-box', 'DI Box', '🧰', null],
  ['phantom-supply', 'Phantom Supply', '🔋', null],
  ['condenser-mic', 'Condenser Mic', '🎤', null, true],
  ['dynamic-mic', 'Dynamic Mic', '🎤', null],
  ['ribbon-mic', 'Ribbon Mic', '🎤', null, true],
  ['shotgun-mic', 'Shotgun Mic', '🎤', null],
  ['pop-filter', 'Pop Filter', '⭕', null],
  ['mic-stand', 'Mic Stand', '🎙️', null],
  ['shock-mount', 'Shock Mount', '🔗', null],
  ['closed-back-cans', 'Closed-Back Headphones', '🎧', null],
  ['open-back-cans', 'Open-Back Headphones', '🎧', null],
  ['iem-set', 'In-Ear Monitors', '🎧', null],
  ['studio-monitor', 'Studio Monitor', '🔊', null, true],
  ['subwoofer', 'Subwoofer', '🔊', null, true],
  ['monitor-stand', 'Monitor Stand', '🪵', 'earth'],
  ['audio-interface', 'Audio Interface', '🎛️', null, true],
  ['preamp', 'Preamp', '🎛️', null, true],
  ['compressor-unit', 'Compressor', '🎚️', null, true],
  ['eq-unit', 'EQ Unit', '🎚️', null],
  ['reverb-pedal', 'Reverb Pedal', '🎛️', null],
  ['drum-machine', 'Drum Machine', '🥁', null, true],
  ['sampler', 'Sampler', '🎹', null, true],
  ['synth-module', 'Synth Module', '🎹', null, true],
  ['midi-keyboard', 'MIDI Keyboard', '🎹', null],
  ['turntable', 'Turntable', '💿', null, true],
  ['stylus', 'Stylus', '📍', null],
  ['mixer-4ch', '4-Channel Mixer', '🎚️', null, true],
  ['cable-tester', 'Cable Tester', '🧰', null],
  ['gaff-tape', 'Gaff Tape', '🏷️', null],
  ['cable-ties', 'Cable Ties', '🔗', null],
  ['power-strip', 'Power Strip', '🔌', null],
  ['acoustic-panel', 'Acoustic Panel', '⬜', 'neutral'],
]);

/** Break items live in the back room and restore stamina when shelved right. */
const BACKROOM: Item[] = (
  [
    ['black-coffee', 'Black Coffee', '☕', 12],
    ['flat-white', 'Flat White', '☕', 14],
    ['espresso', 'Espresso', '☕', 10],
    ['cold-brew', 'Cold Brew', '🧋', 16],
    ['energy-drink', 'Energy Drink', '🥤', 20],
    ['green-tea', 'Green Tea', '🍵', 10],
    ['sandwich', 'Sandwich', '🥪', 8],
    ['banana', 'Banana', '🍌', 8],
    ['granola-bar', 'Granola Bar', '🍫', 8],
    ['instant-noodles', 'Instant Noodles', '🍜', 12],
    ['leftover-pizza', 'Leftover Pizza', '🍕', 14],
    ['water-bottle', 'Water', '💧', 6],
  ] as [string, string, string, number][]
).map(([key, name, icon, stamina]) => ({
  key,
  name,
  icon,
  section: 'backroom' as SectionKey,
  hue: null,
  value: 100,
  rarity: 'common' as const,
  stamina,
}));

export const ITEMS: Item[] = [
  ...PIGMENTS,
  ...BRUSHES,
  ...PAPER,
  ...VINYL,
  ...GEAR,
  ...BACKROOM,
];

export const ITEM_BY_KEY: Record<string, Item> = Object.fromEntries(
  ITEMS.map((i) => [i.key, i]),
);

export const ITEMS_BY_SECTION: Record<SectionKey, Item[]> = ITEMS.reduce(
  (acc, item) => {
    (acc[item.section] ||= []).push(item);
    return acc;
  },
  {} as Record<SectionKey, Item[]>,
);

export function itemByKey(key: string): Item {
  const item = ITEM_BY_KEY[key];
  if (!item) throw new Error(`Unknown item: ${key}`);
  return item;
}
