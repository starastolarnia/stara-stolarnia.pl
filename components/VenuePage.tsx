"use client";

/* eslint-disable @next/next/no-img-element -- Local WebP assets are pre-sized; the hero also needs a responsive picture source. */

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import type { FeatureContent, PageContent } from "@/lib/content";

type VenuePageProps = {
  content: PageContent;
};

type HeaderProps = {
  site: PageContent["site"];
};

type LogoProps = {
  brand: string;
};

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

type FeatureSectionProps = {
  feature: FeatureContent;
  index: number;
};

type HeroLight = {
  x: number;
  y: number;
  radius: number;
};

const EASE = [0.22, 1, 0.36, 1] as const;
const MARQUEE_GROUPS = [0, 1] as const;

const HERO_LIGHTS = [
  { x: 418, y: 443, radius: 112 },
  { x: 1096, y: 438, radius: 92 },
  { x: 1718, y: 425, radius: 104 },
  { x: 2315, y: 392, radius: 76 },
  { x: 2358, y: 466, radius: 36 },
  { x: 2015, y: 520, radius: 43 },
  { x: 1617, y: 576, radius: 50 },
  { x: 1240, y: 625, radius: 56 },
  { x: 925, y: 650, radius: 50 },
  { x: 637, y: 671, radius: 46 },
  { x: 393, y: 687, radius: 43 },
  { x: 171, y: 707, radius: 38 },
  { x: 78, y: 758, radius: 18 },
  { x: 154, y: 750, radius: 19 },
  { x: 302, y: 746, radius: 20 },
  { x: 438, y: 738, radius: 20 },
  { x: 566, y: 726, radius: 21 },
  { x: 697, y: 713, radius: 21 },
  { x: 850, y: 702, radius: 22 },
  { x: 1000, y: 698, radius: 22 },
  { x: 1103, y: 701, radius: 23 },
  { x: 1182, y: 687, radius: 23 },
  { x: 1286, y: 674, radius: 24 },
  { x: 1395, y: 660, radius: 24 },
  { x: 1528, y: 645, radius: 25 },
  { x: 1662, y: 627, radius: 25 },
  { x: 1834, y: 603, radius: 26 },
  { x: 2010, y: 578, radius: 26 },
  { x: 2200, y: 548, radius: 27 },
  { x: 2370, y: 520, radius: 27 },
] as const satisfies readonly HeroLight[];

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

const HeroLights = () => {
  const reduceMotion = useReducedMotion();

  return (
    <svg
      className="hero-lights"
      viewBox="0 0 2400 1800"
      preserveAspectRatio="xMidYMid slice"
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
        const delay = 1.4 + index * 0.1;
        const distanceFactor = (light.radius - 18) / (112 - 18);
        const restingOpacity = 0.28 + distanceFactor * 0.44;

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
  const { site } = props;
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (value) => {
    setIsScrolled(value > 48);
  });

  useEffect(() => {
    document.body.dataset.menuOpen = String(isMenuOpen);

    return () => {
      delete document.body.dataset.menuOpen;
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header
      className={`site-header${isScrolled ? " site-header--scrolled" : ""}${
        isMenuOpen ? " site-header--open" : ""
      }`}
    >
      <div className="site-header__inner">
        <a className="site-header__logo" href="#top" aria-label={site.homeLabel} onClick={closeMenu}>
          <Logo brand={site.brand} />
        </a>

        <nav className="desktop-nav" aria-label={site.navigationLabel}>
          {site.nav.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <a className="button button--header" href={site.ctaHref}>
          {site.ctaLabel}
        </a>

        <button
          className="menu-button"
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={isMenuOpen ? site.menuCloseLabel : site.menuOpenLabel}
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
        >
          <span />
          <span />
        </button>
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
              {site.nav.map((item, index) => (
                <motion.a
                  href={item.href}
                  key={item.href}
                  onClick={closeMenu}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.07 * index, ease: EASE }}
                >
                  <span>0{index + 1}</span>
                  {item.label}
                </motion.a>
              ))}
            </div>
            <a className="mobile-nav__contact" href={site.ctaHref} onClick={closeMenu}>
              {site.ctaLabel}
              <ArrowIcon />
            </a>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
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
        <h2>{feature.title}</h2>
        <div className="prose" dangerouslySetInnerHTML={{ __html: feature.html }} />
      </Reveal>
    </section>
  );
};

export const VenuePage = (props: VenuePageProps) => {
  const { content } = props;
  const { site, hero, story, features, offer, gallery, contact } = content;
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const heroImageY = useTransform(scrollYProgress, [0, 0.22], ["0%", "12%"]);

  return (
    <>
      <a className="skip-link" href="#main">
        {site.skipLabel}
      </a>
      <Header site={site} />

      <main id="main">
        <section className="hero" id="top">
          <motion.div className="hero__media" style={reduceMotion ? undefined : { y: heroImageY }}>
            <div className="hero__visual">
              <picture>
                <source media="(max-width: 767px)" srcSet={hero.mobileImage} />
                <img src={hero.desktopImage} alt={hero.imageAlt} fetchPriority="high" />
              </picture>
              <HeroLights />
            </div>
          </motion.div>
          <div className="hero__veil" />
          <motion.div
            className="hero__content"
            initial={reduceMotion ? false : { opacity: 0, y: 30 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 1.05, delay: 0.25, ease: EASE }}
          >
            <p className="hero__eyebrow">{hero.eyebrow}</p>
            <h1>{hero.title}</h1>
            <p className="hero__lead">{hero.lead}</p>
            <div className="hero__actions">
              <a className="button button--light" href={hero.primaryHref}>
                {hero.primaryLabel}
              </a>
              <a className="text-link text-link--light" href={hero.secondaryHref}>
                {hero.secondaryLabel}
                <ArrowIcon />
              </a>
            </div>
          </motion.div>
          <a className="hero__scroll" href="#miejsce">
            <span>{site.scrollLabel}</span>
            <i />
          </a>
          <p className="hero__location">{site.location}</p>
        </section>

        <section className="story shell" id={story.id}>
          <Reveal className="story__heading">
            <p className="eyebrow">{story.eyebrow}</p>
            <h2>{story.title}</h2>
          </Reveal>
          <Reveal className="story__body" delay={0.1}>
            <div className="prose prose--large" dangerouslySetInnerHTML={{ __html: story.html }} />
            <blockquote>{story.quote}</blockquote>
          </Reveal>
          <div className="story__stats">
            {story.stats.map((stat, index) => (
              <Reveal className="stat" delay={index * 0.08} key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </Reveal>
            ))}
          </div>
        </section>

        <div className="features shell">
          {features.map((feature, index) => (
            <FeatureSection feature={feature} index={index} key={feature.id} />
          ))}
        </div>

        <section className="marquee" aria-hidden="true">
          <div className="marquee__track">
            {MARQUEE_GROUPS.map((group) => (
              <div className="marquee__group" key={group}>
                {site.marquee.map((word) => (
                  <span key={`${group}-${word}`}>
                    {word}
                    <i>✦</i>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="offer" id={offer.id}>
          <div className="shell offer__inner">
            <Reveal className="offer__intro">
              <p className="eyebrow">{offer.eyebrow}</p>
              <h2>{offer.title}</h2>
              <p>{offer.lead}</p>
              <a className="text-link" href={offer.ctaHref}>
                {offer.ctaLabel}
                <ArrowIcon />
              </a>
            </Reveal>
            <div className="offer__list">
              {offer.points.map((point, index) => (
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

        <section className="gallery shell" id={gallery.id}>
          <Reveal className="gallery__heading">
            <p className="eyebrow">{gallery.eyebrow}</p>
            <h2>{gallery.title}</h2>
            <p>{gallery.lead}</p>
          </Reveal>
          <div className="gallery__grid">
            {gallery.images.map((item, index) => (
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

        <section className="contact" id={contact.id}>
          <div className="contact__image">
            <img src={contact.image} alt={contact.imageAlt} loading="lazy" decoding="async" />
          </div>
          <div className="contact__panel">
            <Reveal>
              <p className="eyebrow">{contact.eyebrow}</p>
              <h2>{contact.title}</h2>
              <p className="contact__lead">{contact.lead}</p>
            </Reveal>
            <Reveal className="contact__details" delay={0.08}>
              <div>
                <span>{contact.emailLabel}</span>
                <a href={contact.emailHref}>{contact.email}</a>
              </div>
              <div>
                <span>{contact.phoneLabel}</span>
                <a href={contact.phoneHref}>{contact.phone}</a>
              </div>
              <div>
                <span>{contact.addressLabel}</span>
                <p>{contact.address}</p>
                <a className="text-link" href={contact.mapHref} target="_blank" rel="noreferrer">
                  {contact.mapLabel}
                  <ArrowIcon />
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="shell footer__inner">
          <a href="#top" aria-label={site.homeLabel}>
            <Logo brand={site.brand} />
          </a>
          <p>{site.footerText}</p>
          <div className="footer__links">
            <a href={site.facebookHref} target="_blank" rel="noreferrer">
              {site.facebookLabel}
            </a>
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
        </div>
      </footer>
    </>
  );
};
