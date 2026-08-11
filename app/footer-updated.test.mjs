import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

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
