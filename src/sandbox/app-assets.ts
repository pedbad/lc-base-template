/**
 * app-assets.ts — every lucide icon and every image the app uses, for the debug
 * sandbox's Icons and Images sections (maintainer, 2026-10-08). `app-assets.test.ts`
 * scans src/ and public/ and fails until a new icon or image is listed here, so the
 * sandbox cannot fall behind the app again. Debug-only: nothing here reaches an LO page.
 */
import {
  ArrowDownAZ,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowUpZA,
  BookOpenIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CircleAlert,
  CircleCheck,
  CircleCheckBig,
  CircleX,
  ExternalLink,
  Eye,
  EyeOff,
  Frown,
  Globe,
  Info,
  Layers,
  Lightbulb,
  Menu,
  MoonIcon,
  PanelLeftIcon,
  PartyPopper,
  RotateCcw,
  RotateCw,
  Smile,
  SplinePointer,
  SunIcon,
  Volume2,
  XIcon,
  type LucideIcon,
} from 'lucide-react';
import { EXAMPLE_LO_FOLDER } from '@/lo/lo-index';

/** Lucide icons by the name the code imports them under. */
export const APP_ICONS: Readonly<Record<string, LucideIcon>> = {
  ArrowDownAZ,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowUpZA,
  BookOpenIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CircleAlert,
  CircleCheck,
  CircleCheckBig,
  CircleX,
  ExternalLink,
  Eye,
  EyeOff,
  Frown,
  Globe,
  Info,
  Layers,
  Lightbulb,
  Menu,
  MoonIcon,
  PanelLeftIcon,
  PartyPopper,
  RotateCcw,
  RotateCw,
  Smile,
  SplinePointer,
  SunIcon,
  Volume2,
  XIcon,
};

/** `images/<lesson folder>/…`, the folder captured. */
const LESSON_IMAGE_PATTERN = /^images\/(lo-[^/]+)\//;

/**
 * Whether an image under public/ belongs to one of a course's own lessons, not to the
 * template: anything in an `images/lo-*` folder other than the example lesson's. The
 * same boundary as `CODEOWNERS` (`/public/images/lo-*` has no owner). A course's
 * lesson images are its author's content, so `app-assets.test.ts` leaves them out:
 * listing them here would turn every lesson with a picture into a change to `src/`,
 * which waits for the maintainer's review.
 *
 * @param publicPath a path relative to public/, e.g. `images/lo-01-salutations/hero.svg`
 */
export function isCourseLessonImage(publicPath: string): boolean {
  const folder = LESSON_IMAGE_PATTERN.exec(publicPath)?.[1];
  return folder !== undefined && folder !== EXAMPLE_LO_FOLDER;
}

/** Every template image under public/ (paths relative to it), the sprite aside. */
export const APP_IMAGES: readonly string[] = [
  'favicon.svg',
  'logo.svg',
  'images/lo-placeholder.svg',
  'images/placeholders/reading.svg',
  'images/lo-00-example/hero.svg',
  'images/lo-00-example/03-outcomes/illustration.svg',
  'images/lo-00-example/04-tabs/chart.svg',
  'images/lo-00-example/04-tabs/speaker.svg',
  'images/lo-00-example/06-intro/illustration.svg',
  'images/lo-00-example/07-intro/illustration.svg',
  'images/line-match/circle.svg',
  'images/line-match/square.svg',
  'images/line-match/star.svg',
  'images/line-match/triangle.svg',
  'images/footer/cc-logo-black.svg',
  'images/footer/cc-logo-white.svg',
  'images/footer/elearning-logo-black.svg',
  'images/footer/elearning-logo-white.svg',
  'images/footer/lc-logo-black.svg',
  'images/footer/lc-logo-white.svg',
  'images/footer/ucam-lockup-dark.png',
  'images/footer/ucam-lockup-light.png',
];
