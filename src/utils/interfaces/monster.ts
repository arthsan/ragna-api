export interface Monster {
  _id: string;
  monster_id: number;
  monster_info: string;
  size: string;
  race: string;
  type: string;
  element_power: number;
  gif: string;
  main_atb: MainAtb;
  main_stats: { [key: string]: string };
  elementalDamage: ElementalDamage;
  skills: Skills;
  drops: Drop[];
  maps: Map[];
}

export interface Drop {
  name: string;
  img: string;
  rate: number;
}

export interface ElementalDamage {
  neutral: number;
  poison: number;
  earth: number;
  shadow: number;
  water: number;
  undead: number;
  fire: number;
  holy: number;
  wind: number;
  ghost: number;
}

export interface MainAtb {
  agi: number;
  int: number;
  luk: number;
  vit: number;
  dex: number;
}

export interface Map {
  amount: number;
  frequency: string;
  name: string;
  number: number;
  type: string;
  img: string;
}

export interface Skills {
  mode: string[];
  spell: Spell[];
  summon: Summon;
}

export interface Spell {
  level: number;
  name: string;
}

export interface Summon {}
