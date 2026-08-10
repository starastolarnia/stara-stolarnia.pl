export type HeroLight = {
  x: number;
  y: number;
  radius: number;
};

export const HERO_LIGHT_DELAY_STEP_SECONDS = 0.1;
export const HERO_LIGHT_START_DELAY_SECONDS = 1.4;
export const HERO_LIGHT_MASK = {
  width: 2400,
  height: 1800,
  preserveAspectRatio: "xMidYMid slice",
} as const;

export const HERO_LIGHT_ROWS = [
  [
    { x: 418, y: 443, radius: 112 },
    { x: 1096, y: 438, radius: 92 },
    { x: 1718, y: 425, radius: 104 },
    { x: 2315, y: 392, radius: 76 },
  ],
  [
    { x: 2358, y: 466, radius: 36 },
    { x: 2015, y: 520, radius: 43 },
    { x: 1617, y: 576, radius: 50 },
    { x: 1240, y: 625, radius: 56 },
    { x: 925, y: 650, radius: 50 },
    { x: 637, y: 671, radius: 46 },
    { x: 393, y: 687, radius: 43 },
    { x: 171, y: 707, radius: 38 },
  ],
  [
    { x: 78, y: 788, radius: 40 },
    { x: 154, y: 780, radius: 41 },
    { x: 302, y: 776, radius: 42 },
    { x: 438, y: 768, radius: 42 },
    { x: 566, y: 756, radius: 43 },
    { x: 697, y: 743, radius: 43 },
    { x: 850, y: 732, radius: 44 },
    { x: 1000, y: 728, radius: 44 },
    { x: 1103, y: 731, radius: 45 },
    { x: 1182, y: 717, radius: 45 },
    { x: 1286, y: 704, radius: 46 },
    { x: 1395, y: 690, radius: 46 },
    { x: 1528, y: 675, radius: 47 },
    { x: 1662, y: 657, radius: 47 },
    { x: 1834, y: 633, radius: 48 },
    { x: 2010, y: 608, radius: 48 },
    { x: 2200, y: 578, radius: 49 },
    { x: 2370, y: 550, radius: 49 },
  ],
] as const satisfies readonly (readonly HeroLight[])[];

export const HERO_LIGHTS = HERO_LIGHT_ROWS.flat();

export const getHeroLightDelay = (index: number) =>
  HERO_LIGHT_START_DELAY_SECONDS + index * HERO_LIGHT_DELAY_STEP_SECONDS;

export const getHeroLightRestingOpacity = (radius: number) => {
  const distanceFactor = (radius - 18) / (112 - 18);

  return 0.28 + distanceFactor * 0.44;
};
