import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import matter from "gray-matter";

const locales = ["pl", "en", "de", "uk"];
const expectedValues = [120, 300, 60, 50];

const readTrackRecord = (locale) => {
  const source = readFileSync(
    new URL(`../content/${locale}/075-doswiadczenie.md`, import.meta.url),
    "utf8",
  );

  return matter(source).data;
};

test("every locale exposes the same four track-record totals", () => {
  const reference = readTrackRecord("pl");

  assert.equal(reference.id, "doswiadczenie");
  assert.equal(reference.ticker, undefined);
  assert.deepEqual(reference.stats.map((stat) => stat.value), expectedValues);

  for (const locale of locales) {
    const trackRecord = readTrackRecord(locale);

    assert.deepEqual(Object.keys(trackRecord), Object.keys(reference));
    assert.deepEqual(trackRecord.stats.map((stat) => stat.value), expectedValues);
    assert.ok(trackRecord.stats.every((stat) => stat.suffix === "+"));
    assert.equal(trackRecord.stats.length, 4);
    assert.equal(trackRecord.ticker, undefined);
  }
});

test("the track record replays its ordered count-up whenever the section re-enters view", () => {
  const component = readFileSync(new URL("./VenuePage.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const animatedStat = component.match(
    /const AnimatedStat[\s\S]*?(?=const TrackRecordSection)/,
  )?.[0];
  const trackRecordSection = component.match(
    /const TrackRecordSection[\s\S]*?(?=export const VenuePage)/,
  )?.[0];

  assert.ok(animatedStat);
  assert.ok(trackRecordSection);
  assert.match(trackRecordSection, /useInView\([^,]+,\s*\{\s*once:\s*false/);
  assert.match(trackRecordSection, /isActive=\{isInView\}/);
  assert.doesNotMatch(trackRecordSection, /track-record__ticker/);
  assert.doesNotMatch(animatedStat, /useInView/);
  assert.match(animatedStat, /useMotionValue\(reduceMotion \? props\.value : 0\)/);
  assert.match(animatedStat, /useTransform\([^,]+,\s*\(latest\) => Math\.round\(latest\)\)/);
  assert.match(animatedStat, /if \(!props\.isActive\)\s*\{[\s\S]*?count\.set\(0\)/);
  assert.match(animatedStat, /count\.set\(0\);[\s\S]*?animate\([^,]+,\s*props\.value,/);
  assert.match(animatedStat, /animate\([^,]+,\s*props\.value,/);
  assert.match(animatedStat, /delay:\s*props\.delay/);
  assert.match(animatedStat, /animate=\{[\s\S]*?props\.isActive/);
  assert.doesNotMatch(animatedStat, /whileInView|viewport=/);
  assert.doesNotMatch(animatedStat, /useState|setDisplayValue|requestAnimationFrame|cancelAnimationFrame/);
  assert.match(component, /className="track-record"/);
  assert.match(component, /trackRecord\.stats\.map/);
  assert.doesNotMatch(styles, /\.track-record__ticker/);
});
