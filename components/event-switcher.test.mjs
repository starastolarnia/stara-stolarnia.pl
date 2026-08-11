import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";

import matter from "gray-matter";

const locales = ["pl", "en", "de", "uk"];
const expectedEventKinds = ["weddings", "communions", "corporate", "family"];
const expectedTabLabels = {
  pl: ["Wesele", "Komunia", "Impreza firmowa", "Uroczystość rodzinna"],
  en: ["Wedding", "First Communion", "Corporate event", "Family celebration"],
  de: ["Hochzeit", "Erstkommunion", "Firmenfeier", "Familienfeier"],
  uk: ["Весілля", "Перше причастя", "Корпоративна подія", "Сімейна подія"],
};
const originalWeddingCopy = {
  pl: {
    eyebrow: "Sala weselna na skraju lasu",
    title: "Tu wszystko zaczyna się naturalnie.",
    lead:
      "Drewniane wnętrza, światło wpadające przez wielkie okna i las tuż za progiem. Miejsce na wesele z charakterem, blisko Wrocławia i daleko od miejskiego zgiełku.",
  },
  en: {
    eyebrow: "A wedding venue at the edge of the forest",
    title: "Where everything begins naturally.",
    lead:
      "Timber interiors, daylight streaming through generous windows and the forest just beyond the door. A wedding venue with a character of its own—close to Wrocław, yet far from the rush of the city.",
  },
  de: {
    eyebrow: "Hochzeitslocation am Waldrand",
    title: "Hier beginnt alles ganz natürlich.",
    lead:
      "Warme Holzinterieurs, Licht, das durch große Fenster fällt, und der Wald direkt vor der Tür. Ein Hochzeitsort mit eigenem Charakter – nah bei Breslau und doch weit weg vom Trubel der Stadt.",
  },
  uk: {
    eyebrow: "Весільна зала на узліссі",
    title: "Тут усе починається природно.",
    lead:
      "Дерев’яний інтер’єр, світло з великих вікон і ліс одразу за порогом. Весільний простір із власним характером — поруч із Вроцлавом і далеко від міського гамору.",
  },
};
const readHero = (locale) => {
  const source = readFileSync(
    new URL(`../content/${locale}/010-poczatek.md`, import.meta.url),
    "utf8",
  );

  return matter(source).data;
};
const readEventProfiles = (locale) => {
  const source = readFileSync(
    new URL(`../content/${locale}/090-rodzaje-uroczystosci.md`, import.meta.url),
    "utf8",
  );

  return matter(source).data.profiles;
};
const getValueShape = (value) => {
  if (Array.isArray(value)) {
    return value.map(getValueShape);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, getValueShape(child)]));
  }

  return typeof value;
};

test("every locale exposes the same four event modes in the requested order", () => {
  const referenceFields = Object.keys(readHero("pl").events.weddings);

  for (const locale of locales) {
    const hero = readHero(locale);

    assert.deepEqual(Object.keys(hero.events), expectedEventKinds);
    assert.deepEqual(
      expectedEventKinds.map((eventKind) => hero.events[eventKind].tabLabel),
      expectedTabLabels[locale],
    );

    for (const eventKind of expectedEventKinds) {
      const event = hero.events[eventKind];

      assert.deepEqual(Object.keys(event), referenceFields);
      assert.ok(event.tabLabel);
      assert.ok(event.eyebrow);
      assert.ok(event.title);
      assert.ok(event.lead);
      assert.ok(event.primaryLabel);
      assert.ok(event.imageAlt);
    }
  }
});

test("every locale has the same content files, frontmatter shape and Markdown structure", () => {
  const referenceFiles = readdirSync(new URL("../content/pl", import.meta.url))
    .filter((file) => file.endsWith(".md"))
    .sort();

  for (const locale of locales) {
    const localeDirectory = new URL(`../content/${locale}/`, import.meta.url);
    const localeFiles = readdirSync(localeDirectory)
      .filter((file) => file.endsWith(".md"))
      .sort();

    assert.deepEqual(localeFiles, referenceFiles, `${locale} should expose the complete content set`);

    for (const file of referenceFiles) {
      const reference = matter(readFileSync(new URL(`../content/pl/${file}`, import.meta.url), "utf8"));
      const localized = matter(readFileSync(new URL(file, localeDirectory), "utf8"));
      const referenceParagraphs = reference.content.trim()
        ? reference.content.trim().split(/\n\s*\n/u).length
        : 0;
      const localizedParagraphs = localized.content.trim()
        ? localized.content.trim().split(/\n\s*\n/u).length
        : 0;

      assert.deepEqual(getValueShape(localized.data), getValueShape(reference.data), `${locale}/${file} frontmatter`);
      assert.equal(localizedParagraphs, referenceParagraphs, `${locale}/${file} Markdown structure`);
    }
  }
});

test("weddings preserve the original responsive hero and every locale uses the same media", () => {
  const referenceMedia = expectedEventKinds.map((eventKind) => {
    const event = readHero("pl").events[eventKind];

    return [event.desktopImage, event.mobileImage];
  });

  assert.deepEqual(referenceMedia[0], [
    "/images/hero-forest.webp",
    "/images/hero-forest-mobile.webp",
  ]);

  for (const locale of locales) {
    const media = expectedEventKinds.map((eventKind) => {
      const event = readHero(locale).events[eventKind];

      return [event.desktopImage, event.mobileImage];
    });

    assert.deepEqual(media, referenceMedia);
  }

  for (const media of referenceMedia) {
    for (const image of media) {
      assert.equal(existsSync(new URL(`../public${image}`, import.meta.url)), true, `${image} should exist`);
    }
  }
});

test("weddings preserve the original hero copy in every locale", () => {
  for (const locale of locales) {
    const wedding = readHero(locale).events.weddings;

    assert.deepEqual(
      {
        eyebrow: wedding.eyebrow,
        title: wedding.title,
        lead: wedding.lead,
      },
      originalWeddingCopy[locale],
    );
  }
});

test("the event selector uses one draggable CSS capsule inside the header surface", () => {
  const component = readFileSync(new URL("./VenuePage.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(component, /role=\{isEventSelector \? "tablist" : undefined\}/);
  assert.match(component, /role=\{isEventSelector \? "tab" : undefined\}/);
  assert.match(component, /role="tabpanel"/);
  assert.match(component, /aria-selected=\{isEventSelector \? isActive : undefined\}/);
  assert.match(component, /drag="x"/);
  assert.doesNotMatch(component, /LiquidGlass|liquid-glass-react/);
  assert.match(component, /className="segmented-control__thumb-content"/);
  assert.match(component, /className="event-dropdown__trigger"/);
  assert.doesNotMatch(component, /createPortal|ResizeObserver|STATIC_GLASS_POINTER|globalMousePos/);
  assert.match(component, /className="event-switcher-frame"/);
  assert.doesNotMatch(component, /<span>\{activeEvent\.tabLabel\}<\/span>/);
  assert.match(component, /activeKind === "weddings" \? <HeroLights \/>/);
  assert.match(component, /animate=\{\{ x: `\$\{props\.activeIndex \* 100\}%` \}\}/);
  assert.doesNotMatch(component, /animate=\{\{ left:/);
  assert.match(component, /ArrowLeft/);
  assert.match(component, /ArrowRight/);
  assert.doesNotMatch(styles, /\.event-switcher__tab--active\s*\{[^}]*color:\s*transparent/s);
  assert.match(styles, /--event-switcher-height:\s*2\.5rem;/);
  assert.match(styles, /\.event-switcher\s*\{[^}]*background:\s*transparent;/s);
  assert.match(styles, /\.event-switcher__tab\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;/s);
  assert.match(styles, /\.event-switcher__thumb\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;[^}]*opacity:\s*1;/s);
  assert.doesNotMatch(styles, /\.event-switcher__tab:hover\s*\{[^}]*(?:transform|scale|background|box-shadow|border)/s);
  assert.doesNotMatch(styles, /\.event-switcher__tab--active\s*\{[^}]*(?:transform|scale|background|box-shadow|border)/s);
  assert.match(styles, /\.event-switcher-frame\s*\{[^}]*overflow:\s*hidden;?/s);
  assert.doesNotMatch(component, /className="event-switcher__surface"/);
  assert.match(styles, /\.segmented-control__thumb-content\s*\{[^}]*backdrop-filter:\s*blur\(12px\);[^}]*border-radius:\s*99px;/s);
  assert.match(styles, /\.segmented-control__thumb-content,\.event-dropdown__trigger-shell\s*\{[^}]*opacity:\s*1!important/s);
  assert.match(styles, /\.event-switcher-frame\s*\{[^}]*min-height:\s*var\(--event-switcher-height\);/s);
  assert.match(styles, /@media \(min-width:\s*68rem\)[\s\S]*?\.event-switcher-frame\s*\{[^}]*max-width:\s*none;/s);
});

test("the primary hero action remains a direct, fully clickable link", () => {
  const component = readFileSync(new URL("./VenuePage.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(component, /<a className="hero__primary-button" href=\{props\.contactHref\}>/);
  assert.doesNotMatch(component, /hero__primary-surface|site-header__cta-surface/);
  assert.match(styles, /\.hero__primary-button\s*\{[^}]*height:\s*3\.125rem;/s);
});

test("display headings keep complete sentences together before balancing their lines", () => {
  const component = readFileSync(new URL("./VenuePage.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(component, /const EDITORIAL_SENTENCE_BOUNDARY = \/\(\?<\=\[\.\!\?\]\)\\s\+\/u;/);
  assert.match(component, /const sentences = props\.text\.split\(EDITORIAL_SENTENCE_BOUNDARY\);/);
  assert.match(component, /className="editorial-heading__sentence"/);
  assert.match(component, /<EditorialHeading level=\{1\} text=\{activeEvent\.title\} \/>/);
  assert.equal(component.match(/<EditorialHeading level=\{2\}/g)?.length, 5);
  assert.match(styles, /\.editorial-heading__sentence\s*\{[^}]*text-wrap:\s*pretty;[^}]*display:\s*block/s);
  assert.match(styles, /@media \(min-width:\s*48rem\)[\s\S]*?\.editorial-heading__sentence\s*\{[^}]*text-wrap:\s*balance/s);
  assert.match(styles, /\.hero h1\s*\{[^}]*max-width:\s*17ch;/s);
  assert.doesNotMatch(styles, /\.hero h1\s*\{[^}]*max-width:\s*9ch/s);
});

test("section heading measures follow their grid columns instead of arbitrary ch caps", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const sharedHeadingRule =
    styles.match(
      /\.story__heading h2,\.feature__content h2,\.gallery__heading h2,\.contact h2\s*\{[^}]*\}/s,
    )?.[0] ?? "";

  assert.match(sharedHeadingRule, /max-width:\s*100%;/s);
  assert.doesNotMatch(
    styles,
    /\.(?:story__heading|feature__content|gallery__heading|contact) h2\s*\{[^}]*max-width:\s*(?:10|12|16)ch;/s,
  );
  assert.match(styles, /\.offer__intro h2\s*\{[^}]*max-width:\s*28ch;/s);
});

test("both dropdowns share materials and motion while keeping their approved corner treatment", () => {
  const component = readFileSync(new URL("./VenuePage.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.equal(component.match(/initial=\{FLOATING_DROPDOWN_INITIAL\}/g)?.length, 2);
  assert.equal(component.match(/animate=\{FLOATING_DROPDOWN_VISIBLE\}/g)?.length, 2);
  assert.equal(component.match(/exit=\{FLOATING_DROPDOWN_EXIT\}/g)?.length, 2);
  assert.equal(component.match(/transition=\{FLOATING_DROPDOWN_TRANSITION\}/g)?.length, 2);
  assert.match(component, /<motion\.nav[\s\S]*?className="language-switcher__menu"/);
  assert.match(styles, /\.event-dropdown__menu,\.language-switcher__menu\s*\{[^}]*backdrop-filter:\s*blur\(14px\);[^}]*background:\s*#fffffff2;[^}]*padding:\s*clamp\(\.35rem,1\.6vw,\.5rem\);[^}]*gap:\s*2px;[^}]*top:\s*calc\(100% \+ clamp\(\.5rem,2vw,1rem\)\);[^}]*box-shadow:\s*0 \.75rem 2\.5rem #10161012/s);
  assert.match(styles, /\.event-dropdown__option,\.language-switcher__menu a\s*\{[^}]*min-height:\s*clamp\(2\.5rem,11vw,3rem\);[^}]*padding:\s*clamp\(\.55rem,2\.5vw,\.75rem\) clamp\(\.8rem,3\.5vw,1\.1875rem\);[^}]*font-size:\s*var\(--header-control-font-size\);[^}]*font-weight:\s*650/s);
  assert.match(styles, /\.event-dropdown__trigger-shell\s*\{[^}]*border-radius:\s*\.875rem;/s);
  assert.match(styles, /\.event-dropdown__menu\s*\{[^}]*border-radius:\s*\.875rem;/s);
  assert.match(styles, /\.event-dropdown__option\s*\{[^}]*border-radius:\s*\.875rem/s);
  assert.match(styles, /\.language-switcher__menu\s*\{[^}]*border-radius:\s*0;/s);
  assert.match(styles, /\.language-switcher__menu a\s*\{[^}]*border-radius:\s*0;/s);
  assert.match(styles, /\.event-dropdown__option\.event-dropdown__option--active,\.language-switcher__menu \.language-switcher__option--active\s*\{[^}]*background:\s*#33463a12/s);
});

test("dropdown panels prioritize legibility and two-pixel row separation", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const sharedDropdownRule =
    styles.match(/\.event-dropdown__menu,\.language-switcher__menu\s*\{[^}]*\}/s)?.[0] ?? "";
  const mobileDropdownRule =
    styles.match(/\.site-header__mobile-event-selector \.event-dropdown__menu\s*\{[^}]*\}/s)?.[0] ??
    "";

  assert.match(sharedDropdownRule, /background:\s*#fffffff2;/s);
  assert.match(sharedDropdownRule, /gap:\s*2px;/s);
  assert.doesNotMatch(mobileDropdownRule, /background:/s);
});

test("reviewed translations avoid known literal calques and colloquial farewell labels", () => {
  const polishProfiles = JSON.stringify(readEventProfiles("pl"));
  const englishProfiles = JSON.stringify(readEventProfiles("en"));
  const germanProfiles = JSON.stringify(readEventProfiles("de"));

  assert.doesNotMatch(polishProfiles, /styp/iu);
  assert.doesNotMatch(englishProfiles, /team integration|integration events/iu);
  assert.doesNotMatch(germanProfiles, /zugänglich für Generationen|ab—/iu);
});

test("every non-wedding event has a complete, translated page profile", () => {
  const expectedProfileKinds = expectedEventKinds.slice(1);
  const expectedProfileFields = [
    "navigation",
    "marquee",
    "footerText",
    "story",
    "features",
    "offer",
    "gallery",
    "contact",
  ];

  for (const locale of locales) {
    const profiles = readEventProfiles(locale);

    assert.deepEqual(Object.keys(profiles), expectedProfileKinds);

    for (const eventKind of expectedProfileKinds) {
      const profile = profiles[eventKind];

      assert.deepEqual(Object.keys(profile), expectedProfileFields);
      assert.equal(profile.features.length, 3);
      assert.equal(profile.offer.points.length, 6);
      assert.equal(profile.gallery.images.length, 6);
      assert.equal(profile.story.body.length, 2);
      assert.equal(profile.navigation.length, 5);
      assert.ok(profile.contact.emailSubject);
    }
  }
});

test("profiles address the real context of each event instead of reusing wedding copy", () => {
  const requiredContext = {
    pl: {
      communions: [/dzieck/iu, /maj/iu, /parking/iu, /jedzeni|kuchni|menu/iu],
      corporate: [/rocznic/iu, /nagrod/iu, /wigili/iu, /integrac/iu],
      family: [/chrzcin/iu, /urodzin/iu, /rocznic/iu, /styp|pożegna/iu],
    },
    en: {
      communions: [/child/iu, /may/iu, /parking/iu, /food|menu|kitchen/iu],
      corporate: [/anniversar/iu, /award/iu, /christmas/iu, /team/iu],
      family: [/christening/iu, /birthday/iu, /anniversar/iu, /wake|farewell/iu],
    },
    de: {
      communions: [/kind/iu, /mai/iu, /parkpl/iu, /essen|menü|küche/iu],
      corporate: [/jubiläum/iu, /auszeichnung/iu, /weihnachtsfeier/iu, /team/iu],
      family: [/taufe/iu, /geburtstag/iu, /hochzeitstag|jubiläum/iu, /trauerfeier|abschied/iu],
    },
    uk: {
      communions: [/дитин/iu, /трав/iu, /паркуван/iu, /їж|меню|кух/iu],
      corporate: [/річниц/iu, /нагород/iu, /різдв/iu, /команд/iu],
      family: [/хрест/iu, /день народжен/iu, /річниц/iu, /прощаль|похорон/iu],
    },
  };

  for (const locale of locales) {
    const profiles = readEventProfiles(locale);

    for (const eventKind of expectedEventKinds.slice(1)) {
      const copy = JSON.stringify(profiles[eventKind]);

      for (const pattern of requiredContext[locale][eventKind]) {
        assert.match(copy, pattern, `${locale}/${eventKind} is missing ${pattern}`);
      }
    }
  }
});

test("the active event controls the complete page below the hero", () => {
  const component = readFileSync(new URL("./VenuePage.tsx", import.meta.url), "utf8");

  assert.match(component, /const \[selection, setSelection\] = useState<HeroSelection>/);
  assert.match(component, /const activeProfile = content\.eventProfiles\[activeKind\]/);
  assert.match(component, /<AnimatePresence initial=\{false\} mode="wait"/);
  assert.match(component, /className="event-page-content"/);
  assert.match(component, /key=\{activeKind\}/);
});

test("the desktop header follows the reference geometry and sequences both draggable menus", () => {
  const component = readFileSync(new URL("./VenuePage.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(component, /className="site-header__center"/);
  assert.match(component, /<EventSwitcher/);
  assert.match(component, /<EventDropdown/);
  assert.match(component, /className="site-header__scrolled-controls"/);
  assert.match(component, /<EventDropdown[\s\S]*<EventNavigation/);
  assert.match(component, /aria-expanded=\{props\.isOpen\}/);
  assert.match(component, /role="menu"/);
  assert.match(component, /role="menuitemradio"/);
  assert.match(component, /className="event-navigation"/);
  assert.match(component, /isScrolled \? \(/);
  assert.match(component, /const HEADER_SCROLL_THRESHOLD_PX = 100;/);
  assert.match(component, /const PAGE_ENTRANCE_DELAY_SECONDS = 0\.25;/);
  assert.match(component, /const PAGE_ENTRANCE_DURATION_SECONDS = 1\.05;/);
  assert.match(component, /delay:\s*reduceMotion \? 0 : PAGE_ENTRANCE_DELAY_SECONDS/);
  assert.match(component, /duration:\s*reduceMotion \? 0 : PAGE_ENTRANCE_DURATION_SECONDS/);
  assert.equal((component.match(/delay:\s*PAGE_ENTRANCE_DELAY_SECONDS/g) ?? []).length, 1);
  assert.equal((component.match(/duration:\s*PAGE_ENTRANCE_DURATION_SECONDS/g) ?? []).length, 1);
  assert.match(component, /className="site-header__cta"/);
  assert.match(component, /href=\{site\.ctaHref\}/);
  assert.match(component, /LayoutGroup/);
  assert.match(component, /layoutId=\{props\.sharedThumbLayoutId\}/);
  assert.match(component, /sharedThumbLayoutId=\{EVENT_SELECTION_LAYOUT_ID\}/);
  assert.equal((component.match(/<DraggableSegmentedControl/g) ?? []).length, 2);
  assert.equal((component.match(/drag="x"/g) ?? []).length, 1);
  assert.equal((component.match(/dragControls=\{dragControls\}/g) ?? []).length, 1);
  assert.equal((component.match(/dragListener=\{false\}/g) ?? []).length, 1);
  assert.match(component, /"segmented-control__thumb event-navigation__thumb"/);
  assert.match(component, /const EVENT_SELECTION_LABEL_FADE_SECONDS = 0\.18;/);
  assert.match(component, /const EVENT_NAVIGATION_REVEAL_DELAY_SECONDS = 0\.1;/);
  assert.match(component, /delay:\s*reduceMotion \? 0 : EVENT_NAVIGATION_REVEAL_DELAY_SECONDS/);
  assert.match(component, /className="segmented-control__items"/);
  assert.doesNotMatch(component, /layoutId=\{isActive \? EVENT_SELECTION_LAYOUT_ID : undefined\}/);
  assert.match(component, /<LayoutGroup id="header-event-selection">[\s\S]*?<AnimatePresence initial=\{false\} mode="sync">/);
  assert.match(component, /const PROGRAMMATIC_NAVIGATION_FALLBACK_MS = 1600;/);
  assert.match(component, /if \(navigationTargetRef\.current !== null\) \{[\s\S]*?setActiveNavigationIndex\(navigationTargetRef\.current\);[\s\S]*?return;/s);
  assert.match(component, /window\.addEventListener\("scrollend", releaseNavigationTarget\)/);
  assert.doesNotMatch(component, /className="event-switcher-frame"[\s\S]{0,180}initial=\{reduceMotion \? false : \{ opacity: 0, y:/);
  assert.doesNotMatch(component, /className="site-header__scrolled-controls"[\s\S]{0,180}initial=\{\{ opacity: 0, y:/);
  assert.match(styles, /--header-max-width:\s*80\.5rem;/);
  assert.match(styles, /\.site-header\s*\{[^}]*top:\s*var\(--header-top\);[^}]*width:\s*min\(calc\(100% - 1rem\),var\(--header-max-width\)\);[^}]*background:\s*#ffffffb3;[^}]*border-radius:\s*calc\(var\(--header-height\)\/2\);/s);
  assert.match(styles, /\.site-header__center\s*\{/s);
  assert.match(styles, /\.site-header__cta\s*\{[^}]*height:\s*var\(--event-switcher-height\);[^}]*border-radius:\s*\.875rem;/s);
  assert.doesNotMatch(styles, /\.site-header--scrolled[^}]*\{[^}]*(?:background|backdrop-filter)/s);
  assert.match(styles, /\.event-dropdown__trigger\s*\{[^}]*height:\s*var\(--event-switcher-height\);[^}]*border:\s*0;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;/s);
  assert.doesNotMatch(styles, /\.event-dropdown__trigger\s*\{[^}]*(?:border-radius|transform:\s*scale)/s);
  assert.match(component, /className="event-dropdown__trigger-shell"/);
  assert.match(styles, /\.site-header__scrolled-controls\s*\{[^}]*grid-template-columns:/s);
  assert.doesNotMatch(styles, /\.event-switcher__thumb\s*\{[^}]*overflow:\s*hidden;/s);
  assert.match(styles, /\.logo__stara\s*\{[^}]*font-weight:\s*6\d\d;?/s);
  assert.match(styles, /\.logo__stolarnia\s*\{[^}]*font-weight:\s*6\d\d;?/s);
  assert.match(styles, /grid-template-columns:\s*7\.75rem minmax\(0,1fr\) 10rem 2\.75rem;/s);
  assert.match(styles, /column-gap:\s*2rem;/s);
  assert.match(styles, /@media \(min-width:\s*68rem\)[\s\S]*?--header-height:\s*5\.5rem;[\s\S]*?--header-top:\s*1\.25rem;/s);
  assert.match(styles, /@media \(min-width:\s*68rem\)[\s\S]*?\.site-header__inner\s*\{[^}]*padding:\s*1\.5rem 3\.4375rem;/s);
  assert.match(styles, /\.event-navigation__track\s*\{[^}]*grid-template-columns:\s*repeat\(5,minmax\(0,1fr\)\);/s);
  assert.match(styles, /\.event-navigation__thumb\s*\{[^}]*z-index:\s*1;[^}]*pointer-events:\s*none;[^}]*width:\s*20%;/s);
  assert.match(styles, /\.event-navigation__link\s*\{[^}]*color:\s*var\(--ink-soft\);[^}]*font-size:\s*clamp\(\.58rem,2vw,\.72rem\);[^}]*font-weight:\s*600;/s);
  assert.match(styles, /\.event-navigation__link--active\s*\{[^}]*font-weight:\s*700/s);
});

test("small screens use a scaled top bar with an event dropdown and a three-line menu button", () => {
  const component = readFileSync(new URL("./VenuePage.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(component, /className="site-header__mobile-event-selector"[\s\S]*?<EventDropdown/);
  assert.match(component, /menuId="event-dropdown-menu-mobile"/);
  assert.match(component, /className="site-header__desktop-event-selector"[\s\S]*?<LayoutGroup/);
  assert.match(component, /className="menu-button"[\s\S]*?<span \/>\s*<span \/>\s*<span \/>/s);
  assert.match(styles, /--header-height:\s*clamp\(3rem,13vw,3\.5rem\);/);
  assert.match(styles, /--event-switcher-height:\s*clamp\(2\.125rem,10vw,2\.5rem\);/);
  assert.match(styles, /--header-control-font-size:\s*clamp\(\.625rem,2\.5vw,\.72rem\);/);
  assert.match(styles, /\.site-header__desktop-event-selector\s*\{[^}]*display:\s*none/s);
  assert.match(styles, /\.site-header__mobile-event-selector \.event-dropdown__trigger-shell\s*\{[^}]*background:\s*transparent;[^}]*border:\s*0;[^}]*border-radius:\s*calc\(var\(--header-height\)\/2\);[^}]*box-shadow:\s*none/s);
  assert.match(styles, /\.site-header__mobile-event-selector \.event-dropdown__menu\s*\{[^}]*width:\s*min\(15rem,calc\(100vw - 1rem\)\);[^}]*border-radius:\s*calc\(var\(--header-height\)\/2\)/s);
  assert.match(styles, /\.site-header--open \.menu-button span:nth-child\(2\)\s*\{[^}]*opacity:\s*0/s);
  assert.match(styles, /@media \(min-width:68rem\)[\s\S]*?\.site-header__mobile-event-selector\s*\{[^}]*display:\s*none[\s\S]*?\.site-header__desktop-event-selector\s*\{[^}]*display:\s*block/s);
});

test("the contact section uses an inset balanced layout with a wider headline and horizontal details", () => {
  const component = readFileSync(new URL("./VenuePage.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(component, /className="contact__inner shell"/);
  assert.match(styles, /\.contact__inner\s*\{[^}]*grid-template-columns:/s);
  assert.match(styles, /\.story__heading h2,\.feature__content h2,\.gallery__heading h2,\.contact h2\s*\{[^}]*max-width:\s*100%;/s);
  assert.match(styles, /\.contact__image\s*\{[^}]*aspect-ratio:/s);
  assert.match(styles, /\.contact__details\s*\{[^}]*grid-template-columns:\s*repeat\(3,/s);
  assert.match(styles, /\.contact__details span\s*\{[^}]*font-size:\s*0\.7rem;/s);
  assert.match(styles, /\.contact__details a:not\(\.text-link\),[\s\S]*?\.contact__details p\s*\{[^}]*font-size:\s*clamp\(1\.3rem, 4vw, 1\.55rem\);/s);
  assert.match(styles, /@media \(min-width:\s*48rem\)[\s\S]*?\.contact__details a:not\(\.text-link\),[\s\S]*?font-size:\s*clamp\(1\.2rem,\s*1\.45vw,\s*1\.45rem\);?/s);
  assert.match(styles, /\.contact__details \.text-link\s*\{[^}]*font-size:\s*0\.8rem;/s);
});

test("semantic heading scales use the approved compact values", () => {
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(styles, /h2\s*\{[^}]*font-size:\s*clamp\(2\.04rem, 7\.2vw, 2\.88rem\);[^}]*font-weight:\s*700;[^}]*line-height:\s*1\.02;/s);
  assert.match(styles, /\.hero h1\s*\{[^}]*max-width:\s*min\(17ch,100%\);[^}]*font-size:\s*clamp\(2\.75rem,13\.5vw,4\.25rem\);[^}]*line-height:\s*\.88/s);
  assert.match(styles, /\.offer-point h3\s*\{[^}]*font-size:\s*1\.24rem;/s);
  assert.match(styles, /\.offer__intro h2\s*\{[^}]*max-width:\s*28ch;/s);
  assert.match(styles, /@media \(min-width:\s*48rem\)[\s\S]*?h2\s*\{[^}]*font-size:\s*clamp\(2\.88rem,\s*5\.04vw,\s*3\.08rem\);?[^}]*font-weight:\s*700;[^}]*line-height:\s*1\.02/s);
  assert.match(styles, /@media \(min-width:\s*48rem\)[\s\S]*?\.hero h1\s*\{[^}]*font-size:\s*clamp\(4\.75rem,9vw,6\.96rem\);[^}]*line-height:\s*\.82/s);
  assert.match(styles, /@media \(min-width:\s*48rem\)[\s\S]*?\.offer-point h3\s*\{[^}]*font-size:\s*1\.52rem;?/s);
  assert.match(styles, /@media \(min-width:\s*48rem\)[\s\S]*?\.offer__inner\s*\{[^}]*grid-template-columns:\s*minmax\(0,1\.15fr\) minmax\(26rem,\.85fr\);/s);
});
