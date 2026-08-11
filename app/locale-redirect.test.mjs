import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const readExportedPage = (path) => readFileSync(new URL(`../out/${path}`, import.meta.url), "utf8");

const getRedirectScript = () => {
  const html = readExportedPage("index.html");
  const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? "";
  const script = head.match(/<script[^>]*id="locale-redirect"[^>]*>([\s\S]*?)<\/script>/)?.[1];

  assert.ok(script, "root export should contain the locale redirect script inside <head>");
  assert.doesNotMatch(html, /class="locale-redirect(?:__[^\"]*)?"/, "root export should have no visible locale picker");

  return script;
};

const runRedirect = ({ hash = "", languages, pathname = "/", search = "" }) => {
  let destination;
  const location = {
    hash,
    pathname,
    replace: (value) => {
      destination = value;
    },
    search,
  };

  vm.runInNewContext(getRedirectScript(), {
    navigator: {
      language: languages[0] ?? "",
      languages,
    },
    window: { location },
  });

  return destination;
};

test("root locale handoff has no visible intermediate surface", () => {
  getRedirectScript();
});

test("root locale handoff follows browser preferences and preserves the URL suffix", () => {
  assert.equal(
    runRedirect({ hash: "#kontakt", languages: ["fr-FR", "de-DE"], search: "?source=invite" }),
    "/de/?source=invite#kontakt",
  );
  assert.equal(runRedirect({ languages: ["fr-FR"] }), "/pl/");
  assert.equal(runRedirect({ languages: ["uk-UA"] }), "/uk/");
});

test("locale redirect does not run on localized pages", () => {
  assert.equal(runRedirect({ languages: ["de-DE"], pathname: "/en/" }), undefined);
});

test("all localized pages remain in the static export", () => {
  for (const locale of ["pl", "en", "de", "uk"]) {
    assert.equal(existsSync(new URL(`../out/${locale}/index.html`, import.meta.url)), true);
  }
});
