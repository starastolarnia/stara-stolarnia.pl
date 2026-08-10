import assert from "node:assert/strict";
import test from "node:test";

import {
  getHeroLightDelay,
  getHeroLightRestingOpacity,
  HERO_LIGHT_DELAY_STEP_SECONDS,
  HERO_LIGHT_MASK,
  HERO_LIGHT_ROWS,
} from "./hero-lights.ts";

const [frontRow, middleRow, rearRow] = HERO_LIGHT_ROWS;

test("all rows keep one uninterrupted 100 ms lighting sequence", () => {
  const lights = HERO_LIGHT_ROWS.flat();

  for (const [index] of lights.entries()) {
    if (index === 0) {
      continue;
    }

    const delayStepMilliseconds = Math.round(
      (getHeroLightDelay(index) - getHeroLightDelay(index - 1)) * 1000,
    );

    assert.equal(delayStepMilliseconds, HERO_LIGHT_DELAY_STEP_SECONDS * 1000);
  }
});

test("rear-row bulbs keep a clearly visible glow close to the middle row", () => {
  const smallestMiddleRadius = Math.min(...middleRow.map((light) => light.radius));
  const smallestMiddleOpacity = Math.min(
    ...middleRow.map((light) => getHeroLightRestingOpacity(light.radius)),
  );
  const minimumRadius = smallestMiddleRadius * 0.85;
  const minimumOpacity = smallestMiddleOpacity * 0.9;

  assert.equal(frontRow.length, 4);
  assert.equal(middleRow.length, 8);
  assert.equal(rearRow.length, 18);

  for (const light of rearRow) {
    assert.ok(
      light.radius >= minimumRadius,
      `rear light at (${light.x}, ${light.y}) has radius ${light.radius}; expected at least ${minimumRadius}`,
    );
    assert.ok(
      getHeroLightRestingOpacity(light.radius) >= minimumOpacity,
      `rear light at (${light.x}, ${light.y}) is too dim`,
    );
  }
});

test("the desktop glow mask stays in the source image coordinate system", () => {
  assert.deepEqual(HERO_LIGHT_MASK, {
    width: 2400,
    height: 1800,
    preserveAspectRatio: "xMidYMid slice",
  });

  for (const light of HERO_LIGHT_ROWS.flat()) {
    assert.ok(light.x >= 0 && light.x <= HERO_LIGHT_MASK.width);
    assert.ok(light.y >= 0 && light.y <= HERO_LIGHT_MASK.height);
  }
});
