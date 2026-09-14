export type SectionKey =
  | 'pigments'
  | 'brushes'
  | 'paper'
  | 'vinyl'
  | 'gear'
  | 'backroom';

export type Section = {
  key: SectionKey;
  name: string;
  short: string;
  icon: string;
  color: string;
  /** Back room isn't a scoring section - it only ever holds break items. */
  scoring: boolean;
};

export const SECTIONS: Section[] = [
  { key: 'pigments', name: 'Pigments', short: 'Pigments', icon: '🎨', color: '#C4553B', scoring: true },
  { key: 'brushes', name: 'Brushes & Blades', short: 'Brushes', icon: '🖌️', color: '#9A6B3F', scoring: true },
  { key: 'paper', name: 'Paper & Canvas', short: 'Paper', icon: '📄', color: '#5F7A8C', scoring: true },
  { key: 'vinyl', name: 'Vinyl & Tape', short: 'Vinyl', icon: '💿', color: '#4A4458', scoring: true },
  { key: 'gear', name: 'Cables & Gear', short: 'Gear', icon: '🎛️', color: '#3E6B5A', scoring: true },
  { key: 'backroom', name: 'Back Room', short: 'Back Room', icon: '☕', color: '#A8742A', scoring: false },
];

export const SECTION_BY_KEY: Record<SectionKey, Section> = Object.fromEntries(
  SECTIONS.map((s) => [s.key, s]),
) as Record<SectionKey, Section>;

export const SCORING_SECTIONS = SECTIONS.filter((s) => s.scoring).map((s) => s.key);
