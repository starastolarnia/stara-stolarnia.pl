import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");
const venuePage = readFileSync(new URL("../components/VenuePage.tsx", import.meta.url), "utf8");

const getRule = (selector) => {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rule = css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`))?.[1];

  assert.ok(rule, `${selector} rule should exist`);

  return rule;
};

test("footer uses equal side columns and centers its update in the flexible middle", () => {
  const rule = getRule(".footer__updated");

  assert.match(rule, /width:\s*100%;/);
  assert.doesNotMatch(rule, /(?:^|[;\n])\s*(?:position|left|transform):/);
  assert.match(
    css,
    /@media \(min-width:\s*48rem\)[\s\S]*?\.footer__inner\s*\{[^}]*grid-template-columns:\s*minmax\(0,1fr\) minmax\(0,2fr\) minmax\(0,1fr\);/s,
  );
  assert.match(
    css,
    /@media \(min-width:\s*48rem\)[\s\S]*?\.footer__updated\s*\{[^}]*grid-column:\s*2/s,
  );
});

test("footer extends the track-record surface by exactly 100px with only its logo in gold", () => {
  const footerRule = getRule(".footer");

  assert.match(footerRule, /color:\s*var\(--white\);/);
  assert.match(footerRule, /background-color:\s*var\(--track-record-background\);/);
  assert.match(footerRule, /background-image:\s*var\(--track-record-pattern\);/);
  assert.match(footerRule, /background-size:\s*var\(--track-record-pattern-size\);/);
  assert.match(
    footerRule,
    /padding-block:\s*calc\(3\.5rem \+ 50px\) calc\(2rem \+ 50px\)/,
  );
  assert.match(
    css,
    /@media \(min-width:\s*48rem\)[\s\S]*?\.footer\s*\{[^}]*padding-block:\s*calc\(3rem \+ 50px\)/s,
  );
  assert.match(getRule(".footer .logo"), /color:\s*var\(--track-record-gold\);/);
  assert.match(getRule(".footer__updated"), /color:\s*inherit;/);
});

test("footer places Facebook directly below the logo and keeps only the partner on the right", () => {
  const footer = venuePage.match(/<footer className="footer">[\s\S]*?<\/footer>/)?.[0];
  const brand = footer?.match(/<div className="footer__brand">[\s\S]*?<\/div>/)?.[0];
  const rightColumn = footer?.match(/<div className="footer__links">[\s\S]*?<\/div>/)?.[0];

  assert.ok(footer);
  assert.ok(brand);
  assert.ok(rightColumn);
  assert.match(brand, /<Logo brand=\{site\.brand\}/);
  assert.match(brand, /className="footer__facebook"/);
  assert.match(brand, /\{site\.facebookLabel\}/);
  assert.doesNotMatch(rightColumn, /facebookHref|facebookLabel/);
  assert.match(rightColumn, /className="footer__partner"/);
  assert.match(getRule(".footer__brand"), /display:\s*grid/);
  assert.match(getRule(".footer__facebook"), /border-bottom:\s*1px solid/);
});
