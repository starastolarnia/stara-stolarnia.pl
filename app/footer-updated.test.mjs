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

test("footer update is anchored to the physical viewport center", () => {
  const rule = getRule(".footer__updated");

  assert.match(rule, /width:\s*max-content;/);
  assert.match(rule, /max-width:\s*calc\(100vw - 2rem\);/);
  assert.match(rule, /position:\s*relative;/);
  assert.match(rule, /left:\s*50vw;/);
  assert.match(rule, /transform:\s*translateX\(-50%\);/);
  assert.doesNotMatch(rule, /width:\s*var\(--shell\);/);
  assert.doesNotMatch(rule, /margin:\s*[^;]*auto/);
});
