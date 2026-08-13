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
  assert.deepEqual(reference.stats.map((stat) => stat.value), expectedValues);

  for (const locale of locales) {
    const trackRecord = readTrackRecord(locale);

    assert.deepEqual(Object.keys(trackRecord), Object.keys(reference));
    assert.deepEqual(trackRecord.stats.map((stat) => stat.value), expectedValues);
    assert.ok(trackRecord.stats.every((stat) => stat.suffix === "+"));
    assert.equal(trackRecord.stats.length, 4);
    assert.ok(trackRecord.ticker.length >= 4);
  }
});

test("the track record counts once in view and resolves immediately for reduced motion", () => {
  const component = readFileSync(new URL("./VenuePage.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const animatedStat = component.match(
    /const AnimatedStat[\s\S]*?(?=const TrackRecordSection)/,
  )?.[0];

  assert.ok(animatedStat);
  assert.match(animatedStat, /useInView\([^,]+,\s*\{\s*once:\s*true/);
  assert.match(animatedStat, /useMotionValue\(reduceMotion \? props\.value : 0\)/);
  assert.match(animatedStat, /useTransform\([^,]+,\s*\(latest\) => Math\.round\(latest\)\)/);
  assert.match(animatedStat, /animate\([^,]+,\s*props\.value,/);
  assert.doesNotMatch(animatedStat, /useState|setDisplayValue|requestAnimationFrame|cancelAnimationFrame/);
  assert.match(component, /className="track-record"/);
  assert.match(component, /trackRecord\.stats\.map/);
  assert.match(styles, /\.track-record__ticker-track\s*\{[^}]*animation:/s);
  assert.match(styles, /@media \(prefers-reduced-motion:reduce\)[\s\S]*?\.track-record__ticker-track\s*\{[^}]*animation:\s*none/s);
});
