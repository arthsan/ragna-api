export const monsterRestart = {
  _id: '61198a97a2c24eaee905e3f5',
  monster_id: 1001,
  monster_info: 'scorpion',
  size: 'small',
  race: 'insect',
  type: 'fire',
  element_power: 1,
  gif: 'http://db.irowiki.org/image/monster/1001.png',
  main_atb: {
    agi: 15,
    int: 5,
    luk: 5,
    vit: 10,
    dex: 19,
  },
  main_stats: {
    level: '24',
    def: '16 + 10',
    hp: '1,109',
    m_def: '5 + 10',
    attack: '33 ~ 40',
    range: '(1)',
    aspd: '121.8',
    move_speed: '200 ms',
    base_exp: '287',
    base_exp_per_hp: '0.259',
    job_exp: '176',
    job_exp_per_hp: '0.159',
    hit: '239',
    flee: '213',
  },
  elementalDamage: {
    neutral: 100,
    poison: 125,
    earth: 90,
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
      rate: '0.11~1',
    },
    {
      name: 'scorpion_tail',
      img: 'http://db.irowiki.org/image/item/904.png',
      rate: '25~75',
    },
    {
      name: 'rough_elunium',
      img: 'http://db.irowiki.org/image/item/757.png',
      rate: '0.11~1',
    },
    {
      name: 'solid_shell',
      img: 'http://db.irowiki.org/image/item/943.png',
      rate: '1~5',
    },
    {
      name: 'fine_grit',
      img: 'http://db.irowiki.org/image/item/7041.png',
      rate: '1~5',
    },
    {
      name: 'yellow_herb',
      img: 'http://db.irowiki.org/image/item/508.png',
      rate: '1~5',
    },
    {
      name: 'rusty_iron',
      img: 'http://db.irowiki.org/image/item/625.png',
      rate: '0.11~1',
    },
    {
      name: 'scorpion_card',
      img: 'http://db.irowiki.org/image/item/4068.png',
      rate: 0.01,
    },
  ],
  maps: [
    {
      amount: 0,
      frequency: '',
      name: 'sograt_desert',
      number: 8,
      type: 'field',
      img: 'http://db.irowiki.org/image/oldmap/thumb/moc_fild08.png',
    },
    {
      amount: 0,
      frequency: '',
      name: 'sograt_desert',
      number: 14,
      type: 'field',
      img: 'http://db.irowiki.org/image/oldmap/thumb/moc_fild14.png',
    },
    {
      amount: 0,
      frequency: '',
      name: 'sograt_desert',
      number: 15,
      type: 'field',
      img: 'http://db.irowiki.org/image/oldmap/thumb/moc_fild15.png',
    },
  ],
};