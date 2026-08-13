import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const readExportedPage = (path) => readFileSync(new URL(`../out/${path}`, import.meta.url), "utf8");
const eventPaths = {
  pl: ["", "komunie/", "imprezy-firmowe/", "uroczystosci-rodzinne/"],
  en: ["en/", "en/first-communions/", "en/corporate-events/", "en/family-celebrations/"],
  de: ["de/", "de/kommunionen/", "de/firmenfeiern/", "de/familienfeiern/"],
  uk: ["uk/", "uk/pershe-prychastia/", "uk/korporatyvni-podii/", "uk/simeini-sviata/"],
};

test("root export renders the Polish page without a locale redirect", () => {
  const html = readExportedPage("index.html");

  assert.match(html, /<html[^>]*lang="pl"/);
  assert.match(html, /<main\b/);
  assert.doesNotMatch(html, /id="locale-redirect"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/stara-stolarnia\.pl\/"/);
});

test("Polish links use root while the other languages keep prefixed paths", () => {
  const html = readExportedPage("index.html");

  assert.match(
    html,
    /<link rel="alternate" hrefLang="pl" href="https:\/\/stara-stolarnia\.pl\/"/,
  );

  for (const locale of ["en", "de", "uk"]) {
    assert.match(
      html,
      new RegExp(
        `<link rel="alternate" hrefLang="${locale}" href="https://stara-stolarnia\\.pl/${locale}/"`,
      ),
    );
    assert.equal(existsSync(new URL(`../out/${locale}/index.html`, import.meta.url)), true);
  }

  assert.equal(existsSync(new URL("../out/pl/index.html", import.meta.url)), false);
});

test("legacy Polish paths permanently redirect to their root equivalents on Vercel", () => {
  const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));

  assert.deepEqual(config.redirects, [
    {
      source: "/pl/:path*",
      destination: "/:path*",
      permanent: true,
    },
  ]);
});

test("every event and locale has an indexable static page listed in the sitemap", () => {
  const sitemap = readExportedPage("sitemap.xml");

  for (const paths of Object.values(eventPaths)) {
    for (const path of paths) {
      assert.equal(existsSync(new URL(`../out/${path}index.html`, import.meta.url)), true, path);
      assert.match(sitemap, new RegExp(`<loc>https://stara-stolarnia\\.pl/${path}`));
    }
  }

  assert.equal(sitemap.match(/<url>/g)?.length, 16);
  assert.doesNotMatch(sitemap, /\/pl\//);
});

test("event landing pages expose unique metadata, locale alternates and server-rendered content", () => {
  const communionHtml = readExportedPage("komunie/index.html");

  assert.match(communionHtml, /<title>Komunie pod Wrocławiem \| Stara Stolarnia<\/title>/);
  assert.match(communionHtml, /<meta name="description" content="Organizacja komunii/);
  assert.match(communionHtml, /<link rel="canonical" href="https:\/\/stara-stolarnia\.pl\/komunie\/"/);
  assert.match(communionHtml, /hrefLang="en" href="https:\/\/stara-stolarnia\.pl\/en\/first-communions\/"/);
  assert.match(communionHtml, /hrefLang="x-default" href="https:\/\/stara-stolarnia\.pl\/komunie\/"/);
  assert.match(communionHtml, /<h1>.*Ważny dzień dziecka\..*<\/h1>/s);
  assert.match(communionHtml, /Pierwsza Komunia to ważne przeżycie dla dziecka/);
  assert.doesNotMatch(communionHtml, /<meta name="keywords"/);
});

test("pages publish local business and service structured data plus crawlable internal links", () => {
  const html = readExportedPage("index.html");
  const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];

  assert.ok(jsonLd);

  const structuredData = JSON.parse(jsonLd);
  const types = structuredData["@graph"].map((entry) => entry["@type"]);

  assert.ok(types.some((type) => Array.isArray(type) && type.includes("LocalBusiness")));
  assert.ok(types.includes("Service"));
  assert.ok(types.includes("WebPage"));
  assert.equal(structuredData["@graph"][0].address.addressLocality, "Byków");

  for (const path of eventPaths.pl) {
    assert.match(html, new RegExp(`href="/${path}"`));
  }
});

test("search and answer-engine crawlers are explicitly allowed", () => {
  const robots = readExportedPage("robots.txt");

  for (const userAgent of ["Googlebot", "Bingbot", "OAI-SearchBot"]) {
    assert.match(robots, new RegExp(`User-Agent: ${userAgent}`));
  }

  assert.match(robots, /User-Agent: \*\nAllow: \//);
  assert.match(robots, /Sitemap: https:\/\/stara-stolarnia\.pl\/sitemap\.xml/);
});
