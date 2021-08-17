const Monster = {
  monster_id: ' number;',
  monster_info: ' string;',
  size: ' string;',
  race: ' string;',
  type: ' string;',
  element_power: ' number;',
  gif: ' string;',
  main_atb: ' MainAtb;',
  main_stats: ' { [key: string]: string };',
  elementalDamage: ' ElementalDamage;',
  skills: ' Skills;',
  drops: ' Drop[];',
  maps: ' Map[];',
};

const Drop = {
  name: 'string',
  img: 'string',
  rate: 'number',
}

const ElementalDamage = {
  neutral: 'number',
  poison: 'number',
  earth: 'number',
  shadow: 'number',
  water: 'number',
  undead: 'number',
  fire: 'number',
  holy: 'number',
  wind: 'number',
  ghost: 'number',
}

const MainAtb = {
  agi: 'number',
  int: 'number',
  luk: 'number',
  vit: 'number',
  dex: 'number',
}

const Map = {
  amount: 'number',
  frequency: 'string',
  name: 'string',
  number: 'number',
  type: 'string',
  img: 'string',
}

const Skills = {
  mode: 'string[]',
  spell: 'Spell[]',
  summon: 'Summon',
}

const Spell = {
  level: 'number',
  name: 'string',
}

const Summon = {
  
}

export const monsterOldTimes = {
  _id: '60da8a7fcad5cc4e6e1a53cc',
  monster_id: 1001,
  monster_info: 'scorpion',
  size: 'small',
  race: 'insect',
  type: 'fire',
  element_power: 1,
  gif: 'http://db.irowiki.org/image/monster/1001.png',
  main_atb: {
    agi: 24,
    int: 5,
    luk: 5,
    vit: 24,
    dex: 52,
  },
  main_stats: {
    hp: '1,109',
    level: '24',
    def: '30 + 24',
    m_def: '0 + 17',
    attack: '80 ~ 135 (1)',
    magic_attack: '5 ~ 6',
    aspd: '121.8',
    move_speed: '200 ms',
    base_exp: '287',
    base_exp_per_hp: '0.259',
    job_exp: '176',
    job_exp_per_hp: '0.159',
    exp_ratio: '1.631 : 1',
    from_average: '-0.041 / +0.009',
    flee: '151',
    crit_shield: '1%',
    hit: '68',
    defense_rating: '0.54',
  },
  elementalDamage: {
    neutral: 100,
    poison: 125,
    earth: 50,
    shadow: 100,
    water: 150,
    undead: 100,
    fire: 25,
    holy: 100,
    wind: 100,
    ghost: 100,
  },
  skills: {
    mode: ['aggressive', 'changes_target_if_attacked'],
    spell: [
      {
        level: 1,
        name: 'fire_attack',
      },
      {
        level: 3,
        name: 'poison',
      },
    ],
    summon: {},
  },
  drops: [
    {
      name: 'red_blood',
      img: 'http://db.irowiki.org/image/item/990.png',
      rate: 0.97,
    },
    {
      name: 'scorpion_tail',
      img: 'http://db.irowiki.org/image/item/904.png',
      rate: 82.44,
    },
    {
      name: 'rough_elunium',
      img: 'http://db.irowiki.org/image/item/757.png',
      rate: 0.77,
    },
    {
      name: 'solid_shell',
      img: 'http://db.irowiki.org/image/item/943.png',
      rate: 3.13,
    },
    {
      name: 'fine_grit',
      img: 'http://db.irowiki.org/image/item/7041.png',
      rate: 1.45,
    },
    {
      name: 'yellow_herb',
      img: 'http://db.irowiki.org/image/item/508.png',
      rate: 2.93,
    },
    {
      name: 'rusty_iron',
      img: 'http://db.irowiki.org/image/item/625.png',
      rate: 0.25,
    },
    {
      name: 'scorpion_card',
      img: 'http://db.irowiki.org/image/item/4068.png',
      rate: 0.03,
    },
  ],
  maps: [
    {
      amount: 80,
      frequency: 'instantly',
      name: 'sograt_desert',
      number: 8,
      type: 'field',
      img: 'http://db.irowiki.org/image/oldmap/thumb/moc_fild08.png',
    },
    {
      amount: 10,
      frequency: 'instantly',
      name: 'sograt_desert',
      number: 15,
      type: 'field',
      img: 'http://db.irowiki.org/image/oldmap/thumb/moc_fild15.png',
    },
    {
      amount: 5,
      frequency: 'instantly',
      name: 'sograt_desert',
      number: 17,
      type: 'field',
      img: 'http://db.irowiki.org/image/map/thumb/moc_fild17.png',
    },
  ],
};

export default {
  Monster,
  Drop,
  ElementalDamage,
  MainAtb,
  Map,
  Skills,
  Spell,
  Summon
}
