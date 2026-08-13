"use client";

/* eslint-disable @next/next/no-img-element -- Local WebP assets are pre-sized; the hero also needs a responsive picture source. */

import { useEffect, useRef, useState } from "react";
import {
  animate,
  AnimatePresence,
  LayoutGroup,
  motion,
  useDragControls,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import type {
  EventPageProfile,
  FeatureContent,
  PageContent,
  TrackRecordContent,
} from "@/lib/content";
import { EVENT_KINDS } from "@/lib/event-kinds";
import { getLocalePath, LOCALES, SUPPORTED_LOCALES } from "@/lib/i18n";
import {
  getHeroLightDelay,
  getHeroLightRestingOpacity,
  HERO_LIGHT_MASK,
  HERO_LIGHTS,
} from "@/components/hero-lights";
import { type VenueScroll, useVenueScrollModel } from "@/components/venue-scroll.model";

type VenuePageProps = {
  content: PageContent;
};

type EventSelectionProps = Pick<PageContent, "hero"> & {
  onSelect: (requestedIndex: number) => void;
  selection: HeroSelection;
};

type HeaderProps = EventSelectionProps & {
  navigation: EventPageProfile["navigation"];
  onScrollTo: VenueScroll;
  site: PageContent["site"];
};

type HeaderPanel = "events" | "languages" | "menu" | null;

type EventDropdownProps = EventSelectionProps & {
  isOpen: boolean;
  menuId: string;
  onClose: () => void;
  onToggle: () => void;
  sharedThumbLayoutId?: string;
};

type EventNavigationProps = {
  activeIndex: number;
  label: string;
  navigation: EventPageProfile["navigation"];
  onSelect: (requestedIndex: number) => void;
};

type DraggableSegment = {
  id: string;
  label: string;
};

type DraggableSegmentedControlProps = {
  activeIndex: number;
  ariaLabel: string;
  items: DraggableSegment[];
  mode: "events" | "sections";
  onSelect: (requestedIndex: number) => void;
  sharedThumbLayoutId?: string;
};

type LanguageSwitcherProps = {
  currentLocale: PageContent["site"]["locale"];
  isOpen: boolean;
  label: string;
  onToggle: () => void;
};

type LogoProps = {
  brand: string;
};

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

type EditorialHeadingProps = {
  level: 1 | 2;
  text: string;
};

type FeatureSectionProps = {
  feature: FeatureContent;
  index: number;
};

type AnimatedStatProps = TrackRecordContent["stats"][number] & {
  delay: number;
  isActive: boolean;
};

type TrackRecordSectionProps = {
  trackRecord: TrackRecordContent;
};

type EventHeroProps = Pick<EventSelectionProps, "hero" | "selection"> & {
  contactHref: string;
  location: string;
  scrollLabel: string;
  storyId: string;
};

type HeroSelection = {
  activeIndex: number;
  direction: number;
};

const EASE = [0.22, 1, 0.36, 1] as const;
const EVENT_SELECTION_LAYOUT_ID = "event-selection-surface";
const EVENT_SELECTION_LABEL_FADE_SECONDS = 0.18;
const EVENT_SELECTION_TRANSITION_SECONDS = 0.48;
const EVENT_NAVIGATION_REVEAL_DELAY_SECONDS = 0.1;
const PAGE_ENTRANCE_DELAY_SECONDS = 0.25;
const PAGE_ENTRANCE_DURATION_SECONDS = 1.05;
const HEADER_ENTRANCE_OFFSET_PX = -136;
const HEADER_SCROLL_THRESHOLD_PX = 100;
const HEADER_SECTION_OFFSET_PX = 176;
const PROGRAMMATIC_NAVIGATION_FALLBACK_MS = 1600;
const MARQUEE_GROUPS = [0, 1] as const;
const TRACK_RECORD_COUNT_DURATION_SECONDS = 1.4;
const TRACK_RECORD_STAGGER_SECONDS = 0.18;
const TRACK_RECORD_VIEWPORT_AMOUNT = 0.2;
const SITE_TIME_ZONE = "Europe/Warsaw";
const EDITORIAL_SENTENCE_BOUNDARY = /(?<=[.!?])\s+/u;
const FLOATING_DROPDOWN_INITIAL = { opacity: 0, y: -8 } as const;
const FLOATING_DROPDOWN_VISIBLE = { opacity: 1, y: 0 } as const;
const FLOATING_DROPDOWN_EXIT = { opacity: 0, y: -6 } as const;
const FLOATING_DROPDOWN_TRANSITION = { duration: 0.18, ease: EASE } as const;

const Logo = (props: LogoProps) => {
  const { brand } = props;
  const [firstWord, ...remainingWords] = brand.split(" ");

  return (
    <span className="logo" aria-hidden="true">
      <span className="logo__stara">{firstWord}</span>
      <span className="logo__stolarnia">{remainingWords.join(" ")}</span>
    </span>
  );
};

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12h13M14 7l5 5-5 5" />
  </svg>
);

const EditorialHeading = (props: EditorialHeadingProps) => {
  const Heading = props.level === 1 ? "h1" : "h2";
  const sentences = props.text.split(EDITORIAL_SENTENCE_BOUNDARY);

  return (
    <Heading>
      {sentences.map((sentence, index) => (
        <span className="editorial-heading__sentence" key={`${index}-${sentence}`}>
          {sentence}
        </span>
      ))}
    </Heading>
  );
};

const LanguageSwitcher = (props: LanguageSwitcherProps) => (
  <div className="language-switcher">
    <button
      className="language-switcher__button"
      type="button"
      aria-expanded={props.isOpen}
      aria-controls="language-navigation"
      aria-label={props.label}
      onClick={props.onToggle}
    >
      <span className="language-switcher__flag" aria-hidden="true">
        {LOCALES[props.currentLocale].flag}
      </span>
    </button>

    <AnimatePresence>
      {props.isOpen ? (
        <motion.nav
          id="language-navigation"
          className="language-switcher__menu"
          aria-label={props.label}
          initial={FLOATING_DROPDOWN_INITIAL}
          animate={FLOATING_DROPDOWN_VISIBLE}
          exit={FLOATING_DROPDOWN_EXIT}
          transition={FLOATING_DROPDOWN_TRANSITION}
        >
          {SUPPORTED_LOCALES.map((locale) => (
            <a
              className={locale === props.currentLocale ? "language-switcher__option--active" : undefined}
              href={getLocalePath(locale)}
              hrefLang={locale}
              lang={locale}
              aria-current={locale === props.currentLocale ? "page" : undefined}
              key={locale}
            >
              <span aria-hidden="true">{LOCALES[locale].flag}</span>
              <span>{LOCALES[locale].name}</span>
              <i aria-hidden="true" />
            </a>
          ))}
        </motion.nav>
      ) : null}
    </AnimatePresence>
  </div>
);

const HeroLights = () => {
  const reduceMotion = useReducedMotion();

  return (
    <svg
      className="hero-lights"
      viewBox={`0 0 ${HERO_LIGHT_MASK.width} ${HERO_LIGHT_MASK.height}`}
      preserveAspectRatio={HERO_LIGHT_MASK.preserveAspectRatio}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="hero-light-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffe9a6" stopOpacity="0.34" />
          <stop offset="28%" stopColor="#ffd27d" stopOpacity="0.24" />
          <stop offset="62%" stopColor="#ffc267" stopOpacity="0.09" />
          <stop offset="100%" stopColor="#ffb34c" stopOpacity="0" />
        </radialGradient>
      </defs>
      {HERO_LIGHTS.map((light, index) => {
        const delay = getHeroLightDelay(index);
        const restingOpacity = getHeroLightRestingOpacity(light.radius);

        return (
          <motion.circle
            className="hero-lights__glow"
            cx={light.x}
            cy={light.y}
            r={light.radius}
            fill="url(#hero-light-glow)"
            key={`${light.x}-${light.y}`}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: restingOpacity }}
            transition={{
              duration: reduceMotion ? 0 : 0.1,
              delay: reduceMotion ? 0 : delay,
              ease: "linear",
            }}
          />
        );
      })}
    </svg>
  );
};

const DraggableSegmentedControl = (props: DraggableSegmentedControlProps) => {
  const reduceMotion = useReducedMotion();
  const dragControls = useDragControls();
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const gestureRef = useRef<{ handled: boolean; startX: number } | null>(null);

  const selectAndFocusSegment = (nextIndex: number) => {
    const boundedIndex = Math.max(0, Math.min(props.items.length - 1, nextIndex));
    props.onSelect(boundedIndex);
    itemRefs.current[boundedIndex]?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const arrowOffset = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
    const requestedIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? props.items.length - 1
          : index + arrowOffset;

    if (arrowOffset === 0 && event.key !== "Home" && event.key !== "End") {
      return;
    }

    event.preventDefault();
    selectAndFocusSegment(requestedIndex);
  };

  const selectFromDragOffset = (offsetX: number) => {
    const segmentWidth = itemRefs.current[0]?.getBoundingClientRect().width ?? 0;

    if (segmentWidth > 0) {
      props.onSelect(props.activeIndex + Math.round(offsetX / segmentWidth));
    }
  };

  const completePointerGesture = (event: React.PointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;

    if (gesture?.handled) {
      selectFromDragOffset(event.clientX - gesture.startX);
    }

    gestureRef.current = null;
  };

  const isEventSelector = props.mode === "events";
  const trackClassName = isEventSelector
    ? "segmented-control event-switcher"
    : "segmented-control event-navigation__track";
  const thumbClassName = isEventSelector
    ? "segmented-control__thumb event-switcher__thumb"
    : "segmented-control__thumb event-navigation__thumb";

  return (
    <div
      className={trackClassName}
      ref={trackRef}
      role={isEventSelector ? "tablist" : undefined}
      aria-label={props.ariaLabel}
      onPointerDown={(event) => {
        gestureRef.current = { handled: false, startX: event.clientX };
        dragControls.start(event);
      }}
      onPointerMove={(event) => {
        const gesture = gestureRef.current;

        if (gesture && Math.abs(event.clientX - gesture.startX) >= 12) {
          gesture.handled = true;
        }
      }}
      onPointerUp={completePointerGesture}
      onPointerCancel={() => {
        gestureRef.current = null;
      }}
    >
      <motion.div
        className={thumbClassName}
        aria-hidden="true"
        drag="x"
        dragControls={dragControls}
        dragConstraints={trackRef}
        dragElastic={0.04}
        dragListener={false}
        dragMomentum={false}
        dragSnapToOrigin
        animate={{ x: `${props.activeIndex * 100}%` }}
        transition={{
          duration: reduceMotion ? 0 : EVENT_SELECTION_TRANSITION_SECONDS,
          ease: EASE,
        }}
        onDragEnd={(_event, info) => {
          if (gestureRef.current?.handled) {
            selectFromDragOffset(info.offset.x);
          }

          gestureRef.current = null;
        }}
      >
        <motion.span
          className="segmented-control__thumb-content"
          layoutId={props.sharedThumbLayoutId}
          transition={{
            duration: reduceMotion ? 0 : EVENT_SELECTION_TRANSITION_SECONDS,
            ease: EASE,
          }}
        />
      </motion.div>

      <motion.div
        className="segmented-control__items"
        style={{ gridTemplateColumns: `repeat(${props.items.length}, minmax(0, 1fr))` }}
        variants={
          isEventSelector
            ? {
                visible: { opacity: 1 },
                exit: {
                  opacity: 0,
                  transition: {
                    duration: reduceMotion ? 0 : EVENT_SELECTION_LABEL_FADE_SECONDS,
                    ease: EASE,
                  },
                },
              }
            : undefined
        }
      >
        {props.items.map((item, index) => {
          const isActive = index === props.activeIndex;
          const modeClassName = isEventSelector ? "event-switcher__tab" : "event-navigation__link";
          const activeModeClassName = isEventSelector
            ? "event-switcher__tab--active"
            : "event-navigation__link--active";

          return (
            <button
              className={`segmented-control__item ${modeClassName}${
                isActive ? ` segmented-control__item--active ${activeModeClassName}` : ""
              }`}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              type="button"
              role={isEventSelector ? "tab" : undefined}
              id={isEventSelector ? `event-tab-${item.id}` : undefined}
              aria-controls={isEventSelector ? "event-hero-panel" : undefined}
              aria-current={!isEventSelector && isActive ? "location" : undefined}
              aria-selected={isEventSelector ? isActive : undefined}
              tabIndex={isActive ? 0 : -1}
              data-event-index={isEventSelector ? index : undefined}
              key={item.id}
              onClick={() => props.onSelect(index)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {item.label}
            </button>
          );
        })}
      </motion.div>
    </div>
  );
};

const EventSwitcher = (props: EventSelectionProps) => (
  <motion.div className="event-switcher-frame" initial={false}>
    <DraggableSegmentedControl
      activeIndex={props.selection.activeIndex}
      ariaLabel={props.hero.selectorLabel}
      items={EVENT_KINDS.map((eventKind) => ({
        id: eventKind,
        label: props.hero.events[eventKind].tabLabel,
      }))}
      mode="events"
      onSelect={props.onSelect}
      sharedThumbLayoutId={EVENT_SELECTION_LAYOUT_ID}
    />
  </motion.div>
);

const EventDropdown = (props: EventDropdownProps) => {
  const reduceMotion = useReducedMotion();
  const activeKind = EVENT_KINDS[props.selection.activeIndex] ?? EVENT_KINDS[0];

  return (
    <div className="event-dropdown">
      <motion.div
        className="event-dropdown__trigger-shell"
        layoutId={props.sharedThumbLayoutId}
        transition={{
          duration: reduceMotion ? 0 : EVENT_SELECTION_TRANSITION_SECONDS,
          ease: EASE,
        }}
      >
        <motion.button
          className="event-dropdown__trigger"
          type="button"
          aria-expanded={props.isOpen}
          aria-controls={props.menuId}
          aria-label={props.hero.selectorLabel}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: reduceMotion ? 0 : 0.2,
            delay: reduceMotion ? 0 : EVENT_NAVIGATION_REVEAL_DELAY_SECONDS,
            ease: EASE,
          }}
          onClick={props.onToggle}
        >
          <span>{props.hero.events[activeKind].tabLabel}</span>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="m4 6 4 4 4-4" />
          </svg>
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {props.isOpen ? (
          <motion.div
            id={props.menuId}
            className="event-dropdown__menu"
            role="menu"
            aria-label={props.hero.selectorLabel}
            initial={FLOATING_DROPDOWN_INITIAL}
            animate={FLOATING_DROPDOWN_VISIBLE}
            exit={FLOATING_DROPDOWN_EXIT}
            transition={FLOATING_DROPDOWN_TRANSITION}
          >
            {EVENT_KINDS.map((eventKind, index) => {
              const isActive = index === props.selection.activeIndex;

              return (
                <button
                  className={isActive ? "event-dropdown__option event-dropdown__option--active" : "event-dropdown__option"}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  key={eventKind}
                  onClick={() => {
                    props.onSelect(index);
                    props.onClose();
                  }}
                >
                  {props.hero.events[eventKind].tabLabel}
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

const EventNavigation = (props: EventNavigationProps) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.nav
      className="event-navigation"
      aria-label={props.label}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: reduceMotion ? 0 : 0.3,
        delay: reduceMotion ? 0 : EVENT_NAVIGATION_REVEAL_DELAY_SECONDS,
        ease: EASE,
      }}
    >
      <DraggableSegmentedControl
        activeIndex={props.activeIndex}
        ariaLabel={props.label}
        items={props.navigation.map((item) => ({ id: item.href, label: item.label }))}
        mode="sections"
        onSelect={props.onSelect}
      />
    </motion.nav>
  );
};

const EventHero = (props: EventHeroProps) => {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const heroImageY = useTransform(scrollYProgress, [0, 0.22], ["0%", "12%"]);
  const { selection } = props;
  const activeKind = EVENT_KINDS[selection.activeIndex] ?? EVENT_KINDS[0];
  const activeEvent = props.hero.events[activeKind];

  useEffect(() => {
    EVENT_KINDS.forEach((eventKind) => {
      const event = props.hero.events[eventKind];

      [event.desktopImage, event.mobileImage].forEach((source) => {
        const image = new Image();
        image.src = source;
      });
    });
  }, [props.hero.events]);

  return (
    <section className="hero" id="top">
      <motion.div className="hero__media" style={reduceMotion ? undefined : { y: heroImageY }}>
        <div className="hero__visual">
          <AnimatePresence initial={false}>
            <motion.picture
              className="hero__event-picture"
              key={activeKind}
              initial={reduceMotion ? false : { opacity: 0, scale: 1.035 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 1.015 }}
              transition={{ duration: reduceMotion ? 0 : 0.58, ease: EASE }}
            >
              <source media="(max-width: 767px)" srcSet={activeEvent.mobileImage} />
              <img
                src={activeEvent.desktopImage}
                alt={activeEvent.imageAlt}
                fetchPriority={selection.activeIndex === 0 ? "high" : "auto"}
                style={{ objectPosition: activeEvent.imagePosition }}
              />
            </motion.picture>
          </AnimatePresence>
          {activeKind === "weddings" ? <HeroLights /> : null}
        </div>
      </motion.div>
      <div className="hero__veil" />

      <motion.div
        className="hero__content"
        initial={reduceMotion ? false : { opacity: 0, y: 30 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{
          duration: PAGE_ENTRANCE_DURATION_SECONDS,
          delay: PAGE_ENTRANCE_DELAY_SECONDS,
          ease: EASE,
        }}
      >
        <AnimatePresence initial={false} mode="wait" custom={selection.direction}>
          <motion.div
            className="hero__event-copy"
            id="event-hero-panel"
            role="tabpanel"
            aria-labelledby={`event-tab-${activeKind}`}
            key={activeKind}
            custom={selection.direction}
            initial={reduceMotion ? false : { opacity: 0, x: selection.direction * 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: selection.direction * -20 }}
            transition={{ duration: reduceMotion ? 0 : 0.38, ease: EASE }}
          >
            <p className="hero__eyebrow">{activeEvent.eyebrow}</p>
            <EditorialHeading level={1} text={activeEvent.title} />
            <p className="hero__lead">{activeEvent.lead}</p>
            <div className="hero__actions">
              <a className="hero__primary-button" href={props.contactHref}>
                {activeEvent.primaryLabel}
              </a>
              <a className="text-link text-link--light" href={props.hero.secondaryHref}>
                {props.hero.secondaryLabel}
                <ArrowIcon />
              </a>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
      <a className="hero__scroll" href={`#${props.storyId}`}>
        <span>{props.scrollLabel}</span>
        <i />
      </a>
      <p className="hero__location">{props.location}</p>
    </section>
  );
};

const Reveal = (props: RevealProps) => {
  const { children, className, delay = 0 } = props;
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 36 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
};

const Header = (props: HeaderProps) => {
  const { navigation, site } = props;
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeNavigationIndex, setActiveNavigationIndex] = useState(0);
  const [panel, setPanel] = useState<HeaderPanel>(null);
  const headerRef = useRef<HTMLElement>(null);
  const isScrolledRef = useRef(false);
  const activeNavigationIndexRef = useRef(0);
  const navigationOffsetsRef = useRef<number[]>([]);
  const navigationTargetRef = useRef<number | null>(null);
  const navigationReleaseTimerRef = useRef<number | null>(null);
  const isEventDropdownOpen = panel === "events";
  const isMenuOpen = panel === "menu";
  const isLanguageOpen = panel === "languages";

  useMotionValueEvent(scrollY, "change", (value) => {
    const isPastHeroMenuThreshold = value > HEADER_SCROLL_THRESHOLD_PX;

    if (isScrolledRef.current !== isPastHeroMenuThreshold) {
      isScrolledRef.current = isPastHeroMenuThreshold;
      setIsScrolled(isPastHeroMenuThreshold);
    }

    if (!isPastHeroMenuThreshold) {
      if (activeNavigationIndexRef.current !== 0) {
        activeNavigationIndexRef.current = 0;
        setActiveNavigationIndex(0);
      }
      return;
    }

    if (navigationTargetRef.current !== null) {
      if (activeNavigationIndexRef.current !== navigationTargetRef.current) {
        activeNavigationIndexRef.current = navigationTargetRef.current;
        setActiveNavigationIndex(navigationTargetRef.current);
      }
      return;
    }

    const sectionIndex = navigationOffsetsRef.current.reduce(
      (currentIndex, sectionTop, index) =>
        sectionTop <= value + HEADER_SECTION_OFFSET_PX ? index : currentIndex,
      0,
    );

    if (activeNavigationIndexRef.current !== sectionIndex) {
      activeNavigationIndexRef.current = sectionIndex;
      setActiveNavigationIndex(sectionIndex);
    }
  });

  useEffect(() => {
    const refreshNavigationOffsets = () => {
      navigationOffsetsRef.current = navigation.map((item) => {
        const sectionId = item.href.startsWith("#") ? item.href.slice(1) : null;
        const section = sectionId ? document.getElementById(sectionId) : null;

        return section
          ? section.getBoundingClientRect().top + window.scrollY
          : Number.POSITIVE_INFINITY;
      });
    };

    refreshNavigationOffsets();
    window.addEventListener("load", refreshNavigationOffsets);
    window.addEventListener("resize", refreshNavigationOffsets);
    const transitionRefreshTimer = window.setTimeout(
      refreshNavigationOffsets,
      EVENT_SELECTION_TRANSITION_SECONDS * 1000,
    );

    return () => {
      window.removeEventListener("load", refreshNavigationOffsets);
      window.removeEventListener("resize", refreshNavigationOffsets);
      window.clearTimeout(transitionRefreshTimer);
    };
  }, [navigation]);

  useEffect(() => {
    document.documentElement.lang = site.locale;
  }, [site.locale]);

  useEffect(() => {
    const releaseNavigationTarget = () => {
      navigationTargetRef.current = null;

      if (navigationReleaseTimerRef.current !== null) {
        window.clearTimeout(navigationReleaseTimerRef.current);
        navigationReleaseTimerRef.current = null;
      }
    };

    window.addEventListener("scrollend", releaseNavigationTarget);

    return () => {
      window.removeEventListener("scrollend", releaseNavigationTarget);

      if (navigationReleaseTimerRef.current !== null) {
        window.clearTimeout(navigationReleaseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    document.body.dataset.menuOpen = String(isMenuOpen);

    return () => {
      delete document.body.dataset.menuOpen;
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isLanguageOpen && !isEventDropdownOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setPanel(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPanel(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEventDropdownOpen, isLanguageOpen]);

  const closePanels = () => setPanel(null);
  const toggleEventPanel = () =>
    setPanel((currentPanel) => (currentPanel === "events" ? null : "events"));
  const selectNavigationSection = (requestedIndex: number) => {
    const sectionIndex = Math.max(0, Math.min(navigation.length - 1, requestedIndex));
    const item = navigation[sectionIndex];
    const sectionId = item?.href.startsWith("#") ? item.href.slice(1) : null;
    const section = sectionId ? document.getElementById(sectionId) : null;

    if (!item || !section) {
      return;
    }

    navigationTargetRef.current = sectionIndex;

    if (navigationReleaseTimerRef.current !== null) {
      window.clearTimeout(navigationReleaseTimerRef.current);
    }

    navigationReleaseTimerRef.current = window.setTimeout(() => {
      navigationTargetRef.current = null;
      navigationReleaseTimerRef.current = null;
    }, PROGRAMMATIC_NAVIGATION_FALLBACK_MS);

    if (activeNavigationIndexRef.current !== sectionIndex) {
      activeNavigationIndexRef.current = sectionIndex;
      setActiveNavigationIndex(sectionIndex);
    }
    closePanels();
    window.history.replaceState(null, "", item.href);
    props.onScrollTo(section, { immediate: Boolean(reduceMotion) });
  };

  return (
    <motion.header
      ref={headerRef}
      className={`site-header${isScrolled ? " site-header--scrolled" : ""}${
        isMenuOpen ? " site-header--open" : ""
      }`}
      initial={reduceMotion ? false : { y: HEADER_ENTRANCE_OFFSET_PX }}
      animate={{ y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : PAGE_ENTRANCE_DURATION_SECONDS,
        delay: reduceMotion ? 0 : PAGE_ENTRANCE_DELAY_SECONDS,
        ease: EASE,
      }}
    >
      <div className="site-header__inner">
        <a className="site-header__logo" href="#top" aria-label={site.homeLabel} onClick={closePanels}>
          <Logo brand={site.brand} />
        </a>

        <div className="site-header__center">
          <div className="site-header__mobile-event-selector">
            <EventDropdown
              hero={props.hero}
              isOpen={isEventDropdownOpen}
              menuId="event-dropdown-menu-mobile"
              onClose={closePanels}
              onSelect={props.onSelect}
              onToggle={toggleEventPanel}
              selection={props.selection}
            />
          </div>

          <div className="site-header__desktop-event-selector">
            <LayoutGroup id="header-event-selection">
              <AnimatePresence initial={false} mode="sync">
                {isScrolled ? (
                  <motion.div
                    className="site-header__scrolled-controls"
                    key="navigation"
                    initial={false}
                    exit={reduceMotion ? undefined : { opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.16, ease: EASE }}
                  >
                    <EventDropdown
                      hero={props.hero}
                      isOpen={isEventDropdownOpen}
                      menuId="event-dropdown-menu-desktop"
                      onClose={closePanels}
                      onSelect={props.onSelect}
                      onToggle={toggleEventPanel}
                      selection={props.selection}
                      sharedThumbLayoutId={EVENT_SELECTION_LAYOUT_ID}
                    />
                    <EventNavigation
                      activeIndex={activeNavigationIndex}
                      label={site.navigationLabel}
                      navigation={navigation}
                      onSelect={selectNavigationSection}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    className="site-header__event-slot"
                    key="events"
                    initial="visible"
                    animate="visible"
                    exit="exit"
                  >
                    <EventSwitcher
                      hero={props.hero}
                      onSelect={props.onSelect}
                      selection={props.selection}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </LayoutGroup>
          </div>
        </div>

        <div className="site-header__actions">
          <a className="site-header__cta" href={site.ctaHref}>
            {site.ctaLabel}
          </a>

          <button
            className="menu-button"
            type="button"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMenuOpen ? site.menuCloseLabel : site.menuOpenLabel}
            onClick={() => setPanel((currentPanel) => (currentPanel === "menu" ? null : "menu"))}
          >
            <span />
            <span />
            <span />
          </button>

          <LanguageSwitcher
            currentLocale={site.locale}
            isOpen={isLanguageOpen}
            label={site.languageLabel}
            onToggle={() =>
              setPanel((currentPanel) => (currentPanel === "languages" ? null : "languages"))
            }
          />
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen ? (
          <motion.nav
            id="mobile-navigation"
            className="mobile-nav"
            aria-label={site.navigationLabel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <div className="mobile-nav__links">
              {navigation.map((item, index) => (
                <motion.a
                  href={item.href}
                  key={item.href}
                  onClick={closePanels}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.07 * index, ease: EASE }}
                >
                  <span>0{index + 1}</span>
                  {item.label}
                </motion.a>
              ))}
            </div>
            <a className="mobile-nav__contact" href={site.ctaHref} onClick={closePanels}>
              {site.ctaLabel}
              <ArrowIcon />
            </a>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
};

const FeatureSection = (props: FeatureSectionProps) => {
  const { feature, index } = props;
  const reduceMotion = useReducedMotion();

  return (
    <section
      className={`feature${feature.reverse ? " feature--reverse" : ""}`}
      id={feature.id}
    >
      <div className="feature__image-wrap">
        <motion.img
          className="feature__image"
          src={feature.image}
          alt={feature.imageAlt}
          loading="lazy"
          decoding="async"
          style={{ objectPosition: feature.imagePosition }}
          initial={reduceMotion ? false : { scale: 1.08 }}
          whileInView={reduceMotion ? undefined : { scale: 1 }}
          viewport={{ once: true, amount: 0.14 }}
          transition={{ duration: 1.5, ease: EASE }}
        />
      </div>

      <Reveal className="feature__content" delay={0.08}>
        <p className="eyebrow">
          <span>0{index + 1}</span>
          {feature.eyebrow}
        </p>
        <EditorialHeading level={2} text={feature.title} />
        <div className="prose" dangerouslySetInnerHTML={{ __html: feature.html }} />
      </Reveal>
    </section>
  );
};

const AnimatedStat = (props: AnimatedStatProps) => {
  const reduceMotion = useReducedMotion();
  const count = useMotionValue(reduceMotion ? props.value : 0);
  const displayValue = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    if (reduceMotion) {
      count.set(props.value);
      return;
    }

    if (!props.isActive) {
      count.set(0);
      return;
    }

    count.set(0);
    const controls = animate(count, props.value, {
      delay: props.delay,
      duration: TRACK_RECORD_COUNT_DURATION_SECONDS,
      ease: EASE,
    });

    return () => controls.stop();
  }, [count, props.delay, props.isActive, props.value, reduceMotion]);

  return (
    <motion.article
      className="track-record__stat"
      initial={false}
      animate={
        reduceMotion || props.isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }
      }
      transition={{
        duration: reduceMotion ? 0 : 0.7,
        delay: reduceMotion || !props.isActive ? 0 : props.delay,
        ease: EASE,
      }}
    >
      <strong>
        <motion.span>{displayValue}</motion.span>
        <sup>{props.suffix}</sup>
      </strong>
      <span>{props.label}</span>
    </motion.article>
  );
};

const TrackRecordSection = (props: TrackRecordSectionProps) => {
  const { trackRecord } = props;
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, {
    once: false,
    amount: TRACK_RECORD_VIEWPORT_AMOUNT,
  });

  return (
    <section className="track-record" id={trackRecord.id} ref={sectionRef}>
      <div className="track-record__heading shell">
        <Reveal>
          <p className="eyebrow">{trackRecord.eyebrow}</p>
          <EditorialHeading level={2} text={trackRecord.title} />
        </Reveal>
      </div>

      <div className="track-record__stats shell">
        {trackRecord.stats.map((stat, index) => (
          <AnimatedStat
            {...stat}
            delay={index * TRACK_RECORD_STAGGER_SECONDS}
            isActive={isInView}
            key={stat.label}
          />
        ))}
      </div>
    </section>
  );
};

export const VenuePage = (props: VenuePageProps) => {
  const { content } = props;
  const { site, hero, updatedAt } = content;
  const reduceMotion = useReducedMotion();
  const { scrollTo } = useVenueScrollModel();
  const [selection, setSelection] = useState<HeroSelection>({ activeIndex: 0, direction: 1 });
  const activeKind = EVENT_KINDS[selection.activeIndex] ?? EVENT_KINDS[0];
  const activeProfile = content.eventProfiles[activeKind];
  const updatedDate = new Intl.DateTimeFormat(site.locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: SITE_TIME_ZONE,
  }).format(new Date(updatedAt));

  const selectEvent = (requestedIndex: number) => {
    const nextIndex = Math.max(0, Math.min(EVENT_KINDS.length - 1, requestedIndex));

    if (selection.activeIndex === nextIndex) return;

    setSelection({
      activeIndex: nextIndex,
      direction: Math.sign(nextIndex - selection.activeIndex),
    });
    scrollTo(0, { immediate: Boolean(reduceMotion) });
  };

  return (
    <div className="venue-page" lang={site.locale}>
      <a className="skip-link" href="#main">
        {site.skipLabel}
      </a>
      <Header
        hero={hero}
        navigation={activeProfile.navigation}
        onSelect={selectEvent}
        onScrollTo={scrollTo}
        selection={selection}
        site={site}
      />

      <main id="main">
        <EventHero
          contactHref={site.ctaHref}
          hero={hero}
          location={site.location}
          scrollLabel={site.scrollLabel}
          selection={selection}
          storyId={activeProfile.story.id}
        />

        <AnimatePresence initial={false} mode="wait" custom={selection.direction}>
          <motion.div
            className="event-page-content"
            key={activeKind}
            custom={selection.direction}
            initial={reduceMotion ? false : { opacity: 0, y: selection.direction * 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: selection.direction * -12 }}
            transition={{ duration: reduceMotion ? 0 : 0.32, ease: EASE }}
          >
        <section className="story shell" id={activeProfile.story.id}>
          <Reveal className="story__heading">
            <p className="eyebrow">{activeProfile.story.eyebrow}</p>
            <EditorialHeading level={2} text={activeProfile.story.title} />
          </Reveal>
          <Reveal className="story__body" delay={0.1}>
            <div
              className="prose prose--large"
              dangerouslySetInnerHTML={{ __html: activeProfile.story.html }}
            />
            <blockquote>{activeProfile.story.quote}</blockquote>
          </Reveal>
          <div className="story__stats">
            {activeProfile.story.stats.map((stat, index) => (
              <Reveal className="stat" delay={index * 0.08} key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </Reveal>
            ))}
          </div>
        </section>

        <div className="features shell">
          {activeProfile.features.map((feature, index) => (
            <FeatureSection feature={feature} index={index} key={feature.id} />
          ))}
        </div>

        <section className="marquee" aria-hidden="true">
          <div className="marquee__track">
            {MARQUEE_GROUPS.map((group) => (
              <div className="marquee__group" key={group}>
                {activeProfile.marquee.map((word) => (
                  <span key={`${group}-${word}`}>
                    {word}
                    <i>✦</i>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="offer" id={activeProfile.offer.id}>
          <div className="shell offer__inner">
            <Reveal className="offer__intro">
              <p className="eyebrow">{activeProfile.offer.eyebrow}</p>
              <EditorialHeading level={2} text={activeProfile.offer.title} />
              <p>{activeProfile.offer.lead}</p>
              <a className="text-link" href={activeProfile.offer.ctaHref}>
                {activeProfile.offer.ctaLabel}
                <ArrowIcon />
              </a>
            </Reveal>
            <div className="offer__list">
              {activeProfile.offer.points.map((point, index) => (
                <Reveal className="offer-point" delay={index * 0.05} key={point.title}>
                  <span>0{index + 1}</span>
                  <div>
                    <h3>{point.title}</h3>
                    <p>{point.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="gallery shell" id={activeProfile.gallery.id}>
          <Reveal className="gallery__heading">
            <p className="eyebrow">{activeProfile.gallery.eyebrow}</p>
            <EditorialHeading level={2} text={activeProfile.gallery.title} />
            <p>{activeProfile.gallery.lead}</p>
          </Reveal>
          <div className="gallery__grid">
            {activeProfile.gallery.images.map((item, index) => (
              <motion.figure
                className={`gallery__item gallery__item--${index + 1}`}
                key={item.src}
                initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.12 }}
                transition={{ duration: 0.85, delay: (index % 2) * 0.08, ease: EASE }}
              >
                <img src={item.src} alt={item.alt} loading="lazy" decoding="async" />
              </motion.figure>
            ))}
          </div>
        </section>

        <TrackRecordSection trackRecord={content.trackRecord} />

        <section className="contact" id={activeProfile.contact.id}>
          <div className="contact__inner shell">
            <div className="contact__image">
              <img
                src={activeProfile.contact.image}
                alt={activeProfile.contact.imageAlt}
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="contact__panel">
              <Reveal>
                <p className="eyebrow">{activeProfile.contact.eyebrow}</p>
                <EditorialHeading level={2} text={activeProfile.contact.title} />
                <p className="contact__lead">{activeProfile.contact.lead}</p>
              </Reveal>
              <Reveal className="contact__details" delay={0.08}>
                <div>
                  <span>{activeProfile.contact.emailLabel}</span>
                  <a href={activeProfile.contact.emailHref}>{activeProfile.contact.email}</a>
                </div>
                <div>
                  <span>{activeProfile.contact.phoneLabel}</span>
                  <a href={activeProfile.contact.phoneHref}>{activeProfile.contact.phone}</a>
                </div>
                <div>
                  <span>{activeProfile.contact.addressLabel}</span>
                  <p>{activeProfile.contact.address}</p>
                  <a
                    className="text-link"
                    href={activeProfile.contact.mapHref}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {activeProfile.contact.mapLabel}
                    <ArrowIcon />
                  </a>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="footer">
        <div className="shell footer__inner">
          <div className="footer__brand">
            <a href="#top" aria-label={site.homeLabel}>
              <Logo brand={site.brand} />
            </a>
            <a
              className="footer__facebook"
              href={site.facebookHref}
              target="_blank"
              rel="noreferrer"
            >
              {site.facebookLabel}
            </a>
          </div>
          <p>{activeProfile.footerText}</p>
          <div className="footer__links">
            <a
              className="footer__partner"
              href={site.partnerHref}
              target="_blank"
              rel="noreferrer"
              title={site.partnerTitle}
            >
              <img
                src={site.partnerImage}
                alt={site.partnerImageAlt}
                width="52"
                height="64"
                loading="lazy"
              />
            </a>
          </div>
          <p className="footer__updated">
            {site.updatedLabel} · <time dateTime={updatedAt}>{updatedDate}</time>
          </p>
        </div>
      </footer>
    </div>
  );
};
