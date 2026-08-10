import { readFile } from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import { z } from "zod";

import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/lib/i18n";

export { SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/i18n";

const SINGLE_LETTER_WORD = /(?<![\p{L}\p{N}])(\p{L})[ \t]+(?=\S)/gu;

const protectSingleLetterWords = (copy: string) =>
  copy.replace(SINGLE_LETTER_WORD, "$1\u00A0");

const copySchema = z.string().transform(protectSingleLetterWords);

const linkSchema = z.object({
  label: copySchema,
  href: z.string(),
});

const siteSchema = z.object({
  locale: z.enum(SUPPORTED_LOCALES),
  brand: copySchema,
  homeLabel: copySchema,
  skipLabel: copySchema,
  menuOpenLabel: copySchema,
  menuCloseLabel: copySchema,
  navigationLabel: copySchema,
  languageLabel: copySchema,
  updatedLabel: copySchema,
  metaTitle: copySchema,
  metaDescription: copySchema,
  location: copySchema,
  ctaLabel: copySchema,
  ctaHref: z.string(),
  scrollLabel: copySchema,
  footerText: copySchema,
  facebookLabel: copySchema,
  facebookHref: z.string(),
  partnerHref: z.string(),
  partnerTitle: copySchema,
  partnerImage: z.string(),
  partnerImageAlt: copySchema,
  nav: z.array(linkSchema),
  marquee: z.array(copySchema),
});

const heroSchema = z.object({
  eyebrow: copySchema,
  title: copySchema,
  lead: copySchema,
  primaryLabel: copySchema,
  primaryHref: z.string(),
  secondaryLabel: copySchema,
  secondaryHref: z.string(),
  desktopImage: z.string(),
  mobileImage: z.string(),
  imageAlt: copySchema,
});

const storySchema = z.object({
  id: z.string(),
  eyebrow: copySchema,
  title: copySchema,
  quote: copySchema,
  stats: z.array(
    z.object({
      value: copySchema,
      label: copySchema,
    }),
  ),
});

const featureSchema = z.object({
  id: z.string(),
  eyebrow: copySchema,
  title: copySchema,
  image: z.string(),
  imageAlt: copySchema,
  imagePosition: z.string(),
  reverse: z.boolean(),
});

const offerSchema = z.object({
  id: z.string(),
  eyebrow: copySchema,
  title: copySchema,
  lead: copySchema,
  ctaLabel: copySchema,
  ctaHref: z.string(),
  points: z.array(
    z.object({
      title: copySchema,
      text: copySchema,
    }),
  ),
});

const gallerySchema = z.object({
  id: z.string(),
  eyebrow: copySchema,
  title: copySchema,
  lead: copySchema,
  images: z.array(
    z.object({
      src: z.string(),
      alt: copySchema,
    }),
  ),
});

const contactSchema = z.object({
  id: z.string(),
  eyebrow: copySchema,
  title: copySchema,
  lead: copySchema,
  emailLabel: copySchema,
  email: z.string(),
  emailHref: z.string(),
  phoneLabel: copySchema,
  phone: z.string(),
  phoneHref: z.string(),
  addressLabel: copySchema,
  address: copySchema,
  mapLabel: copySchema,
  mapHref: z.string(),
  image: z.string(),
  imageAlt: copySchema,
});

type SiteContent = z.infer<typeof siteSchema>;
type HeroContent = z.infer<typeof heroSchema>;
type MarkdownBody = { html: string };
type StoryContent = z.infer<typeof storySchema> & MarkdownBody;
export type FeatureContent = z.infer<typeof featureSchema> & MarkdownBody;
type OfferContent = z.infer<typeof offerSchema>;
type GalleryContent = z.infer<typeof gallerySchema>;
type ContactContent = z.infer<typeof contactSchema>;

export type PageContent = {
  site: SiteContent;
  hero: HeroContent;
  story: StoryContent;
  features: FeatureContent[];
  offer: OfferContent;
  gallery: GalleryContent;
  contact: ContactContent;
  updatedAt: string;
};

const getContentPath = (locale: SupportedLocale, fileName: string) =>
  path.join(process.cwd(), "content", locale, fileName);

const loadFrontmatter = async <TSchema extends z.ZodObject>(
  filePath: string,
  schema: TSchema,
): Promise<z.infer<TSchema>> => {
  const source = await readFile(filePath, "utf8");
  const { data } = matter(source);

  return schema.parse(data);
};

const loadMarkdown = async <TSchema extends z.ZodObject>(
  filePath: string,
  schema: TSchema,
): Promise<z.infer<TSchema> & { html: string }> => {
  const source = await readFile(filePath, "utf8");
  const { content, data } = matter(source);
  const parsedData = schema.parse(data);
  const rendered = await remark().use(html).process(protectSingleLetterWords(content));

  return Object.assign(parsedData, { html: String(rendered) });
};

export const getPageContent = async (locale: SupportedLocale): Promise<PageContent> => {
  const basePath = path.join(process.cwd(), "content", locale);
  const [site, hero, story, sala, ceremonia, goscinnosc, offer, gallery, contact] =
    await Promise.all([
      loadFrontmatter(path.join(basePath, "000-ustawienia-strony.md"), siteSchema),
      loadFrontmatter(path.join(basePath, "010-poczatek.md"), heroSchema),
      loadMarkdown(path.join(basePath, "020-o-miejscu.md"), storySchema),
      loadMarkdown(path.join(basePath, "030-sala.md"), featureSchema),
      loadMarkdown(path.join(basePath, "040-ceremonia.md"), featureSchema),
      loadMarkdown(path.join(basePath, "050-goscinnosc.md"), featureSchema),
      loadFrontmatter(path.join(basePath, "060-oferta.md"), offerSchema),
      loadFrontmatter(path.join(basePath, "070-galeria.md"), gallerySchema),
      loadFrontmatter(path.join(basePath, "080-kontakt.md"), contactSchema),
    ]);

  return {
    site,
    hero,
    story,
    features: [sala, ceremonia, goscinnosc],
    offer,
    gallery,
    contact,
    updatedAt: new Date().toISOString(),
  };
};

export const getDefaultContent = () => getPageContent(DEFAULT_LOCALE);

export const parseLocale = (locale: string): SupportedLocale | null =>
  isSupportedLocale(locale) ? locale : null;

export const contentFilePath = (locale: SupportedLocale, fileName: string) =>
  getContentPath(locale, fileName);
