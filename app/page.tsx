/* eslint-disable @next/next/no-img-element -- Static media is pre-optimized and served directly by Cloudflare. */
"use client";

import { Fragment, useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { withBasePath } from "./asset-path";
import { backgroundMusic, backgroundMusicTitle, couplePortraits, logoImage, weddingPhotos } from "./generated-wedding-gallery";
import { weddingData } from "./wedding-data";

type Countdown = { days: number; hours: number; minutes: number; seconds: number };
type Theme = "light" | "dark";
type WishItem = {
  name: string;
  relation: string;
  attendance?: string;
  guestsCount?: string;
  message: string;
  date: string;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  gravity: number;
  type: "spark" | "confetti" | "heart";
  rotation?: number;
  rotationSpeed?: number;
  tilt?: number;
  tiltSpeed?: number;
};

const HO_CHI_MINH_TIME_ZONE = "Asia/Ho_Chi_Minh";
const HO_CHI_MINH_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;
const WEDDING_TIMESTAMP = new Date(weddingData.invitation.dateTime).getTime();
const HO_CHI_MINH_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: HO_CHI_MINH_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});
const REVEAL_SELECTOR =
  ".countdown, .section-heading, .couple-profile, .event-card, .film-chapter, .film-frame, .film-finale-copy, .wedding-slider, .calendar-copy, .wedding-calendar, .gift-card, .wishes-form-card, .wishes-wall, .footer-logo, .footer-thanks, .footer-heart";
const REVEAL_STAGGER_MS = 100;
const REVEAL_MAX_STAGGER_STEPS = 4;
// Pinned, scroll-driven scenes (hero expansion, horizontal story film) only run on wide screens
// for visitors who have not asked for reduced motion. Keep in sync with the CSS media queries.
const CINEMATIC_MEDIA_QUERY = "(min-width: 901px) and (prefers-reduced-motion: no-preference)";
// Portrait/phone version of the scenes: short pinned hero + stacked "album pages" for the story.
const MOBILE_CINEMATIC_MEDIA_QUERY = "(max-width: 900px) and (prefers-reduced-motion: no-preference)";
const HERO_WIDE_PHOTO = "/images/wedding/ROZ02268.webp";
const STORY_LEAD_PHOTO = "/images/wedding/ROZ01885.webp";
const STORY_FINALE_PHOTO = "/images/wedding/ROZ02150.webp";
const STORY_FILM_FRAMES = [
  { main: "/images/wedding/ROZ01978.webp", detail: "/images/wedding/ROZ02037.webp" },
  { main: "/images/wedding/ROZ02369.webp", detail: "/images/wedding/ROZ02245.webp" },
];
const INVITATION_OPEN_ANIMATION_MS = 1850;

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function readStoredTheme(): string | null {
  try {
    return window.localStorage.getItem("wedding-theme");
  } catch {
    return null;
  }
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Wraps each word so headings can rise word-by-word out of a soft mask when revealed. */
function SplitWords({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <span className="split-word" style={{ "--word-index": index } as CSSProperties}>
            <span>{word}</span>
          </span>
          {index < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}

function getRevealVariant(target: HTMLElement): string {
  if (target.matches(".couple-profile")) {
    const profiles = Array.from(target.parentElement?.querySelectorAll(":scope > .couple-profile") ?? []);
    return profiles.indexOf(target) % 2 === 0 ? "from-left" : "from-right";
  }
  if (target.matches(".section-heading, .calendar-copy, .footer-thanks")) return "words";
  if (target.matches(".film-frame, .wedding-slider, .wedding-calendar")) return "soft-zoom";
  if (target.matches(".film-chapter, .film-finale-copy")) return "timeline";
  if (target.matches(".footer-heart")) return "heart";
  return "rise";
}


function getHoChiMinhNow(): number {
  const parts = HO_CHI_MINH_DATE_TIME_FORMATTER.formatToParts(new Date());
  const value = Object.fromEntries(parts.map(({ type, value: partValue }) => [type, partValue]));

  return Date.UTC(
    Number(value.year),
    Number(value.month) - 1,
    Number(value.day),
    Number(value.hour),
    Number(value.minute),
    Number(value.second),
  ) - HO_CHI_MINH_UTC_OFFSET_MS;
}

function getCountdown(): Countdown {
  const distance = WEDDING_TIMESTAMP - getHoChiMinhNow();
  if (distance <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(distance / 86_400_000),
    hours: Math.floor((distance / 3_600_000) % 24),
    minutes: Math.floor((distance / 60_000) % 60),
    seconds: Math.floor((distance / 1_000) % 60),
  };
}

export default function WeddingInvitation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [invitationOpen, setInvitationOpen] = useState(false);
  const [invitationOpening, setInvitationOpening] = useState(false);
  const [countdown, setCountdown] = useState<Countdown>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [flippedEventId, setFlippedEventId] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicCollapsed, setMusicCollapsed] = useState(false);
  const [headerCompact, setHeaderCompact] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [activeBankTab, setActiveBankTab] = useState<"groom" | "bride">("groom");
  const [lightboxPhotoIndex, setLightboxPhotoIndex] = useState<number | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestRelation, setGuestRelation] = useState("Bạn chung");
  const [guestMessage, setGuestMessage] = useState("");
  const [isSubmittingWish, setIsSubmittingWish] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [wishesList, setWishesList] = useState<WishItem[]>(weddingData.defaultWishes);
  const [wishesPage, setWishesPage] = useState(1);
  const WISHES_PER_PAGE = 6;
  const totalWishesPages = Math.ceil(wishesList.length / WISHES_PER_PAGE) || 1;
  const paginatedWishes = wishesList.slice(
    (wishesPage - 1) * WISHES_PER_PAGE,
    wishesPage * WISHES_PER_PAGE
  );

  const getPageNumbers = (current: number, total: number): (number | string)[] => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, "...", total];
    }
    if (current >= total - 3) {
      return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, "...", current - 1, current, current + 1, "...", total];
  };
  const audioRef = useRef<HTMLAudioElement>(null);
  const sliderDragStartXRef = useRef<number | null>(null);
  const thumbnailWheelReadyRef = useRef(true);
  const lightboxDragStartXRef = useRef<number | null>(null);
  const lightboxIsDraggingRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);
  const scrollProgressRef = useRef<HTMLSpanElement>(null);
  const heroSceneRef = useRef<HTMLElement>(null);
  const storyFilmRef = useRef<HTMLDivElement>(null);
  const storyTrackRef = useRef<HTMLDivElement>(null);
  const filmProgressRef = useRef<HTMLSpanElement>(null);
  const filmCounterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const syncFallback = () => setInvitationOpen(true);
    window.addEventListener("invitation-fallback-open", syncFallback);
    // The visitor may have opened the static page before React finished loading.
    const frame = window.requestAnimationFrame(() => {
      if (document.documentElement.dataset.invitationFallback === "open") syncFallback();
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("invitation-fallback-open", syncFallback);
    };
  }, []);

  const triggerFireworks = useCallback((originX?: number, originY?: number, count = 75) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = window.innerWidth;
    const height = window.innerHeight;

    const colors = [
      "#d4af37", // Gold
      "#f9e79f", // Light Gold
      "#ffd700", // Yellow Gold
      "#ff6b81", // Rose Pink
      "#ff8e9e", // Light Pink
      "#ffffff", // Sparkle White
      "#f39c12", // Amber
      "#fadbd8", // Champagne Pink
      "#e5c07b", // Warm Sand
    ];

    const newParticles: Particle[] = [];
    const cx = originX ?? width / 2;
    const cy = originY ?? height * 0.45;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 3;
      const typeRand = Math.random();
      const type: "spark" | "confetti" | "heart" =
        typeRand < 0.4 ? "confetti" : typeRand < 0.75 ? "spark" : "heart";

      newParticles.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed * (Math.random() * 1.2 + 0.6),
        vy: Math.sin(angle) * speed * (Math.random() * 1.2 + 0.6) - (Math.random() * 3 + 2),
        color: colors[Math.floor(Math.random() * colors.length)],
        size: type === "spark" ? Math.random() * 3 + 2 : Math.random() * 6 + 6,
        alpha: 1,
        decay: Math.random() * 0.012 + 0.008,
        gravity: type === "spark" ? 0.15 : 0.09,
        type,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        tilt: Math.random() * 10,
        tiltSpeed: Math.random() * 0.1 + 0.05,
      });
    }

    particlesRef.current.push(...newParticles);

    if (!animationFrameIdRef.current) {
      const render = () => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const particles = particlesRef.current;
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.vx *= 0.98;
          p.alpha -= p.decay;

          if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
            p.rotation += p.rotationSpeed;
          }
          if (p.tilt !== undefined && p.tiltSpeed !== undefined) {
            p.tilt += p.tiltSpeed;
          }

          if (p.alpha <= 0 || p.y > canvas.height + 30) {
            particles.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;

          if (p.type === "spark") {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.35, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.type === "confetti") {
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation || 0) * (Math.PI / 180));
            const xFactor = Math.cos(p.tilt || 0);
            ctx.scale(xFactor, 1);
            ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6);
          } else if (p.type === "heart") {
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation || 0) * (Math.PI / 180));
            const s = p.size * 0.6;
            ctx.beginPath();
            ctx.moveTo(0, s / 4);
            ctx.quadraticCurveTo(0, 0, s / 2, 0);
            ctx.quadraticCurveTo(s, 0, s, s / 2);
            ctx.quadraticCurveTo(s, (s * 3) / 4, s / 2, s);
            ctx.lineTo(0, s * 1.3);
            ctx.lineTo(-s / 2, s);
            ctx.quadraticCurveTo(-s, (s * 3) / 4, -s, s / 2);
            ctx.quadraticCurveTo(-s, 0, -s / 2, 0);
            ctx.quadraticCurveTo(0, 0, 0, s / 4);
            ctx.fill();
          }

          ctx.restore();
        }

        if (particles.length > 0) {
          animationFrameIdRef.current = requestAnimationFrame(render);
        } else {
          animationFrameIdRef.current = null;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      };

      animationFrameIdRef.current = requestAnimationFrame(render);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const storedTheme = readStoredTheme();
    const initialTheme: Theme =
      storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : root.dataset.theme === "dark" || media.matches
          ? "dark"
          : "light";

    root.dataset.theme = initialTheme;
    root.style.colorScheme = initialTheme;
    const syncThemeFrame = window.requestAnimationFrame(() => setTheme(initialTheme));

    const followSystemTheme = (event: MediaQueryListEvent) => {
      if (readStoredTheme()) return;
      const nextTheme: Theme = event.matches ? "dark" : "light";
      root.dataset.theme = nextTheme;
      root.style.colorScheme = nextTheme;
      setTheme(nextTheme);
    };

    media.addEventListener("change", followSystemTheme);
    return () => {
      window.cancelAnimationFrame(syncThemeFrame);
      media.removeEventListener("change", followSystemTheme);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const root = document.documentElement;
    const body = document.body;
    const lockedScrollY = window.scrollY;
    const previousScrollBehavior = root.style.scrollBehavior;

    root.classList.add("menu-open");
    body.classList.add("menu-open");
    body.style.setProperty("--menu-scroll-offset", `${lockedScrollY}px`);

    return () => {
      root.classList.remove("menu-open");
      body.classList.remove("menu-open");
      body.style.removeProperty("--menu-scroll-offset");

      root.style.scrollBehavior = "auto";
      window.scrollTo(0, lockedScrollY);
      root.style.scrollBehavior = previousScrollBehavior;
    };
  }, [menuOpen]);

  useEffect(() => {
    const isLocked = !invitationOpen;
    document.documentElement.classList.toggle("invitation-locked", isLocked);
    document.body.classList.toggle("invitation-locked", isLocked);
    document.body.classList.toggle("invitation-ready", invitationOpen);

    const resetScroll = () => window.scrollTo({ top: 0, behavior: "auto" });
    resetScroll();

    if (isLocked) {
      const preventScroll = (e: Event) => {
        e.preventDefault();
      };
      const preventKeyScroll = (e: KeyboardEvent) => {
        // Let native buttons handle Space/Enter activation while the gate is locked.
        if (e.target instanceof Element && e.target.closest("button")) return;
        if (
          ["Space", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(e.code) ||
          [" ", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(e.key)
        ) {
          e.preventDefault();
        }
      };

      window.addEventListener("wheel", preventScroll, { passive: false });
      // CSS locks touch scrolling; cancelling touchmove can suppress a tap's click.
      window.addEventListener("keydown", preventKeyScroll, { passive: false });

      return () => {
        document.documentElement.classList.remove("invitation-locked");
        document.body.classList.remove("invitation-locked");
        window.removeEventListener("wheel", preventScroll);
        window.removeEventListener("keydown", preventKeyScroll);
      };
    }

    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      resetScroll();
      secondFrame = window.requestAnimationFrame(resetScroll);
    });
    const scrollResetTimer = window.setTimeout(resetScroll, 240);

    return () => {
      document.body.classList.remove("invitation-ready");
      if (firstFrame) window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
      if (scrollResetTimer) window.clearTimeout(scrollResetTimer);
    };
  }, [invitationOpen]);

  useEffect(() => {
    if (!invitationOpen) return;

    const revealTargets = document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    revealTargets.forEach((target) => {
      target.classList.add("motion-reveal");
      target.dataset.reveal = getRevealVariant(target);
    });

    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealTargets.forEach((target) => target.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // Stagger only the elements that enter together, per section, in document order,
        // so headings lead and the content inside the same section follows.
        const staggerBySection = new Map<Element, number>();
        entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target as HTMLElement)
          .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
          .forEach((target) => {
            const section = target.closest("section, footer") ?? document.body;
            const step = staggerBySection.get(section) ?? 0;
            staggerBySection.set(section, step + 1);
            target.style.setProperty("--reveal-delay", `${Math.min(step, REVEAL_MAX_STAGGER_STEPS) * REVEAL_STAGGER_MS}ms`);
            target.classList.add("is-visible");
          });
      },
      { threshold: 0.12, rootMargin: "0px 0px -7%" },
    );

    // Replay on the way back down: once an element has fully left through the bottom edge (the
    // visitor scrolled back up past it), reset it so it animates in again next time. Elements that
    // leave through the top stay visible, so scrolling up never hides content in front of the reader.
    const resetObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) return;
          const viewportBottom = entry.rootBounds?.bottom ?? window.innerHeight;
          if (entry.boundingClientRect.top >= viewportBottom) entry.target.classList.remove("is-visible");
        });
      },
      { threshold: 0 },
    );

    revealTargets.forEach((target) => {
      observer.observe(target);
      resetObserver.observe(target);
    });
    return () => {
      observer.disconnect();
      resetObserver.disconnect();
    };
  }, [invitationOpen]);

  // Scroll-driven scenes: page progress bar, hero arch → full-bleed expansion, horizontal story
  // film and photo parallax. Everything is written straight to the DOM inside one rAF per scroll
  // burst (no React state per frame).
  useEffect(() => {
    if (!invitationOpen) return;

    const root = document.documentElement;
    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cinematicQuery = window.matchMedia(CINEMATIC_MEDIA_QUERY);
    const mobileCinematicQuery = window.matchMedia(MOBILE_CINEMATIC_MEDIA_QUERY);
    const progressBar = scrollProgressRef.current;
    const heroScene = heroSceneRef.current;
    const heroPhoto = heroScene?.querySelector<HTMLElement>(".hero-photo") ?? null;
    const film = storyFilmRef.current;
    const track = storyTrackRef.current;
    const filmProgressBar = filmProgressRef.current;
    const filmCounter = filmCounterRef.current;
    const chapters = track ? Array.from(track.querySelectorAll<HTMLElement>(".film-chapter")) : [];
    const pages = track ? Array.from(track.querySelectorAll<HTMLElement>(":scope > .film-page")) : [];
    const parallaxFrames = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
    const nearbyFrames = new Set<HTMLElement>();
    // Smallest visible height seen at the current width (address bar shown). Using the minimum keeps
    // the pin offset stable while the bar hides/shows, and never places content under the toolbar.
    let stableViewportWidth = 0;
    let stableViewportHeight = 0;
    let frame = 0;
    let filmDistance = 0;
    let chapterStops: number[] = [];
    let activeChapter = -1;

    // Layout measurements that only change on resize, not on every scroll frame.
    const measure = () => {
      // Phones: pages taller than the screen pin once their bottom reaches the bottom edge, so every
      // line and photo is shown before the next page slides over.
      if (window.innerWidth !== stableViewportWidth || !stableViewportHeight) {
        stableViewportWidth = window.innerWidth;
        stableViewportHeight = window.innerHeight;
      } else {
        stableViewportHeight = Math.min(stableViewportHeight, window.innerHeight);
      }
      pages.forEach((page) => {
        const top = mobileCinematicQuery.matches ? `${Math.min(0, Math.round(stableViewportHeight - page.offsetHeight))}px` : "";
        if (page.style.getPropertyValue("--page-top") !== top) {
          if (top) page.style.setProperty("--page-top", top);
          else page.style.removeProperty("--page-top");
        }
        if (!mobileCinematicQuery.matches) page.style.removeProperty("--page-cover");
      });
      if (!film || !track) return;
      if (cinematicQuery.matches) {
        filmDistance = Math.max(0, track.scrollWidth - window.innerWidth);
        const height = `${Math.round(filmDistance + window.innerHeight)}px`;
        if (film.style.height !== height) film.style.height = height;
        chapterStops = chapters.map((chapter) => chapter.offsetLeft - window.innerWidth * 0.55);
      } else {
        filmDistance = 0;
        chapterStops = [];
        if (film.style.height) film.style.height = "";
        if (track.style.transform) track.style.transform = "";
      }
    };

    const update = () => {
      frame = 0;
      // While the mobile menu is open the body is position:fixed and scrollY reads 0; keep the last state.
      if (root.classList.contains("menu-open")) return;

      const reduceMotion = reduceMotionQuery.matches;
      const cinematic = cinematicQuery.matches;
      const mobileCinematic = mobileCinematicQuery.matches;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Reads first…
      const scrollable = root.scrollHeight - viewportHeight;
      const pageProgress = scrollable > 0 ? clamp(window.scrollY / scrollable) : 0;

      let heroProgress = 0;
      if (heroScene && !reduceMotion) {
        if (cinematic) {
          const rect = heroScene.getBoundingClientRect();
          heroProgress = clamp(-rect.top / Math.max(1, rect.height - viewportHeight));
        } else if (mobileCinematic && heroPhoto) {
          // Phones: the photo frame pins at the top while its (taller) wrapper scrolls past.
          const rect = heroPhoto.getBoundingClientRect();
          heroProgress = clamp(-rect.top / Math.max(1, rect.height - viewportHeight));
        } else if (heroPhoto) {
          const rect = heroPhoto.getBoundingClientRect();
          heroProgress = clamp((viewportHeight - rect.top) / (viewportHeight * 0.75));
        }
      }

      let filmProgress = 0;
      if (film && cinematic && filmDistance > 0) {
        const rect = film.getBoundingClientRect();
        filmProgress = clamp(-rect.top / Math.max(1, rect.height - viewportHeight));
      }
      const filmOffset = filmProgress * filmDistance;
      let chapterIndex = 0;
      chapterStops.forEach((stop, index) => {
        if (filmOffset >= stop) chapterIndex = index;
      });

      // How far the following page has slid over each pinned page (0…1).
      const pageTops = mobileCinematic ? pages.map((page) => page.getBoundingClientRect().top) : [];
      const pageCovers = pageTops.map((_, index) =>
        index + 1 < pageTops.length ? clamp((viewportHeight - pageTops[index + 1]) / viewportHeight) : 0,
      );

      const parallaxShifts = reduceMotion
        ? []
        : Array.from(nearbyFrames, (element) => {
            const rect = element.getBoundingClientRect();
            const y = clamp((rect.top + rect.height / 2 - viewportHeight / 2) / (viewportHeight / 2 + rect.height / 2), -1, 1);
            const x = clamp((rect.left + rect.width / 2 - viewportWidth / 2) / (viewportWidth / 2 + rect.width / 2), -1, 1);
            return [element, x, y] as const;
          });

      // …then writes, to avoid layout thrashing.
      if (progressBar) progressBar.style.transform = `scaleX(${pageProgress.toFixed(4)})`;
      if (heroScene) {
        heroScene.style.setProperty("--hero-p", heroProgress.toFixed(4));
        heroScene.style.setProperty("--hero-wide", smoothstep(0.28, 0.78, heroProgress).toFixed(4));
        heroScene.style.setProperty("--hero-caption", smoothstep(0.62, 0.94, heroProgress).toFixed(4));
      }
      if (track && cinematic) track.style.transform = `translate3d(${(-filmOffset).toFixed(1)}px, 0, 0)`;
      pageCovers.forEach((cover, index) => pages[index].style.setProperty("--page-cover", cover.toFixed(4)));
      if (filmProgressBar) filmProgressBar.style.transform = `scaleX(${filmProgress.toFixed(4)})`;
      if (filmCounter && chapters.length && chapterIndex !== activeChapter) {
        activeChapter = chapterIndex;
        filmCounter.textContent = `${String(chapterIndex + 1).padStart(2, "0")} / ${String(chapters.length).padStart(2, "0")}`;
      }
      parallaxShifts.forEach(([element, x, y]) => {
        element.style.setProperty("--parallax-x", x.toFixed(4));
        element.style.setProperty("--parallax-shift", y.toFixed(4));
      });
    };

    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    const remeasure = () => {
      measure();
      scheduleUpdate();
    };

    const parallaxObserver =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                const element = entry.target as HTMLElement;
                if (entry.isIntersecting) nearbyFrames.add(element);
                else nearbyFrames.delete(element);
              });
              scheduleUpdate();
            },
            { rootMargin: "25% 25%" },
          )
        : null;
    if (parallaxObserver) parallaxFrames.forEach((element) => parallaxObserver.observe(element));
    else parallaxFrames.forEach((element) => nearbyFrames.add(element));

    // Page height changes (images, wishes loading, flipping cards) without a window resize.
    const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(remeasure) : null;
    resizeObserver?.observe(document.body);

    remeasure();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", remeasure, { passive: true });
    reduceMotionQuery.addEventListener("change", remeasure);
    cinematicQuery.addEventListener("change", remeasure);
    mobileCinematicQuery.addEventListener("change", remeasure);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", remeasure);
      reduceMotionQuery.removeEventListener("change", remeasure);
      cinematicQuery.removeEventListener("change", remeasure);
      mobileCinematicQuery.removeEventListener("change", remeasure);
      parallaxObserver?.disconnect();
      resizeObserver?.disconnect();
      if (film) film.style.height = "";
      if (track) track.style.transform = "";
      pages.forEach((page) => {
        page.style.removeProperty("--page-top");
        page.style.removeProperty("--page-cover");
      });
    };
  }, [invitationOpen]);

  useEffect(() => {
    if (!invitationOpen) return;
    const firstFrame = window.requestAnimationFrame(() => setCountdown(getCountdown()));
    const timer = window.setInterval(() => setCountdown(getCountdown()), 1000);
    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.clearInterval(timer);
    };
  }, [invitationOpen]);

  useEffect(() => {
    let frame = 0;
    const updateHeader = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        setHeaderCompact(window.scrollY > 72);
        frame = 0;
      });
    };
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateHeader);
    };
  }, []);

  const openInvitation = () => {
    if (invitationOpening) return;
    setInvitationOpening(true);
    if (backgroundMusic && audioRef.current) {
      void audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => setMusicPlaying(false));
    }
    // Launch celebratory wedding fireworks when envelope opens!
    window.setTimeout(() => {
      triggerFireworks(window.innerWidth / 2, window.innerHeight * 0.45, 90);
    }, 450);
    window.setTimeout(() => {
      triggerFireworks(window.innerWidth * 0.28, window.innerHeight * 0.35, 65);
      triggerFireworks(window.innerWidth * 0.72, window.innerHeight * 0.35, 65);
    }, 950);
    const openingDuration = INVITATION_OPEN_ANIMATION_MS;
    window.setTimeout(() => {
      setInvitationOpen(true);
    }, openingDuration);
  };

  const skipInvitation = () => {
    if (backgroundMusic && audioRef.current && !musicPlaying) {
      void audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => setMusicPlaying(false));
    }
    setInvitationOpen(true);
    triggerFireworks(window.innerWidth / 2, window.innerHeight * 0.4, 85);
  };

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      void audio.play().then(() => setMusicPlaying(true)).catch(() => setMusicPlaying(false));
    } else {
      audio.pause();
      setMusicPlaying(false);
    }
  };

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    try {
      window.localStorage.setItem("wedding-theme", nextTheme);
    } catch {
      // Saving a preference is optional when browser storage is unavailable.
    }
    setTheme(nextTheme);
  };

  const showPreviousPhoto = () => {
    setActivePhotoIndex((current) => (current - 1 + weddingPhotos.length) % weddingPhotos.length);
  };

  const showNextPhoto = () => {
    setActivePhotoIndex((current) => (current + 1) % weddingPhotos.length);
  };

  const thumbnailRadius = Math.min(5, Math.floor((weddingPhotos.length - 1) / 2));
  const thumbnailWindow = Array.from(
    { length: thumbnailRadius * 2 + 1 },
    (_, position) => {
      const offset = position - thumbnailRadius;
      return {
        index: (activePhotoIndex + offset + weddingPhotos.length) % weddingPhotos.length,
        offset,
      };
    },
  );

  const copyToClipboard = (text: string, label = "thành công") => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopyToast(`Đã sao chép ${label}!`);
    window.setTimeout(() => setCopyToast(null), 2500);
  };

  const [isLoadingWishes, setIsLoadingWishes] = useState(false);

  const fetchWishesFromSheet = useCallback(async (isManualRefresh = false) => {
    if (!weddingData.googleSheetScriptUrl) return;
    setIsLoadingWishes(true);
    try {
      const url = `${weddingData.googleSheetScriptUrl}${weddingData.googleSheetScriptUrl.includes("?") ? "&" : "?"}_t=${Date.now()}`;
      // Use clean GET without custom headers to avoid CORS preflight rejection on GitHub Pages / redirect
      const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });
      const text = await res.text();
      let data: Record<string, unknown> | null = null;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.warn("Could not parse JSON from Google Sheets:", parseErr, text.slice(0, 120));
        if (isManualRefresh) {
          setCopyToast("Chưa thể đồng bộ! Vui lòng kiểm tra quyền chia sẻ Google Apps Script.");
          window.setTimeout(() => setCopyToast(null), 3500);
        }
        return;
      }
      if (data && data.status === "success" && Array.isArray(data.wishes)) {
        const sheetWishes: WishItem[] = data.wishes.map((item: Record<string, unknown>) => ({
          name: String(item.name || "Khách mời"),
          relation: String(item.relation || "Bạn chung"),
          attendance: item.attendance ? String(item.attendance) : undefined,
          guestsCount: item.guestsCount ? String(item.guestsCount) : undefined,
          message: String(item.message || ""),
          date:
            typeof item.date === "string" && item.date.includes(" ")
              ? item.date.split(" ")[0]
              : String(item.date || "28/09/2026"),
        }));

        setWishesList([...sheetWishes, ...weddingData.defaultWishes]);
        setWishesPage(1);
        try {
          window.localStorage.setItem("wedding_wishes", JSON.stringify(sheetWishes));
        } catch {
          // ignore
        }
        if (isManualRefresh) {
          setCopyToast("Đã làm mới danh sách");
          window.setTimeout(() => setCopyToast(null), 3000);
        }
      } else {
        if (isManualRefresh) {
          setCopyToast("Data chưa trả về danh sách hợp lệ.");
          window.setTimeout(() => setCopyToast(null), 3500);
        }
      }
    } catch (err) {
      console.warn("Could not fetch wishes from Google Sheet:", err);
      if (isManualRefresh) {
        setCopyToast("Lỗi kết nối tới Google Sheets! Vui lòng kiểm tra lại quyền Web App.");
        window.setTimeout(() => setCopyToast(null), 3500);
      }
    } finally {
      setIsLoadingWishes(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem("wedding_wishes");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setWishesList([...parsed, ...weddingData.defaultWishes]);
          }
        }
      } catch {
        // ignore
      }
      void fetchWishesFromSheet(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchWishesFromSheet]);

  useEffect(() => {
    if (lightboxPhotoIndex === null) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const preventScroll = (e: Event) => {
      e.preventDefault();
    };

    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxPhotoIndex(null);
      if (e.key === "ArrowLeft") {
        setLightboxPhotoIndex((cur) =>
          cur !== null ? (cur - 1 + weddingPhotos.length) % weddingPhotos.length : null,
        );
      }
      if (e.key === "ArrowRight") {
        setLightboxPhotoIndex((cur) =>
          cur !== null ? (cur + 1) % weddingPhotos.length : null,
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxPhotoIndex]);

  const handleWishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestMessage.trim()) return;

    setIsSubmittingWish(true);
    const newWish: WishItem = {
      name: guestName.trim(),
      relation: guestRelation,
      message: guestMessage.trim(),
      date: new Date().toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    };

    if (weddingData.googleSheetScriptUrl) {
      try {
        await fetch(weddingData.googleSheetScriptUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newWish),
        });
        window.setTimeout(() => {
          void fetchWishesFromSheet();
        }, 1500);
      } catch (err) {
        console.warn("Could not sync to Google Sheet:", err);
      }
    }

    const updated = [newWish, ...wishesList];
    setWishesList(updated);
    setWishesPage(1);
    try {
      const localSaved = JSON.parse(window.localStorage.getItem("wedding_wishes") || "[]");
      localSaved.unshift(newWish);
      window.localStorage.setItem("wedding_wishes", JSON.stringify(localSaved));
    } catch {
      // ignore
    }

    setIsSubmittingWish(false);
    setSubmitSuccess(true);
    setGuestMessage("");
    setCopyToast("Gửi lời chúc thành công! Cảm ơn bạn.");
    window.setTimeout(() => setCopyToast(null), 3000);
    // Fire celebratory fireworks!
    triggerFireworks(window.innerWidth / 2, window.innerHeight * 0.45, 85);
    window.setTimeout(() => {
      triggerFireworks(window.innerWidth * 0.25, window.innerHeight * 0.35, 60);
      triggerFireworks(window.innerWidth * 0.75, window.innerHeight * 0.35, 60);
    }, 280);
  };

  const currentBank = weddingData.banks[activeBankTab];
  const gift = weddingData.bank;

  return (
    <main>
      {!invitationOpen && (
        <section
          className={`invitation-gate${invitationOpening ? " is-opening" : ""}`}
          aria-label="Mở thiệp cưới"
        >
          <div className="gate-backdrop" aria-hidden="true" />
          <div className="gate-ambient-glow" aria-hidden="true" />

          {/* Floating romantic ambient petals */}
          <div className="gate-petals" aria-hidden="true">
            <span className="gate-petal p-1" />
            <span className="gate-petal p-2" />
            <span className="gate-petal p-3" />
            <span className="gate-petal p-4" />
            <span className="gate-petal p-5" />
            <span className="gate-petal p-6" />
            <span className="gate-petal p-7" />
            <span className="gate-petal p-8" />
          </div>

          {/* Quick skip button */}
          <button
            type="button"
            className="gate-skip-btn"
            data-open-invitation
            onClick={skipInvitation}
            aria-label="Vào xem thiệp ngay không cần hiệu ứng"
          >
            <span>Vào xem ngay</span>
            <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13" aria-hidden="true">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </button>

          <div className="gate-stage">
            <div className="gate-envelope">
              {/* Envelope Back Wall & Golden Satin Lining */}
              <div className="envelope-back" aria-hidden="true">
                <div className="envelope-lining" />
                <div className="envelope-gold-rim" />
              </div>

              {/* Inside Wedding Invitation Letter (Slides up gracefully when opened) */}
              <div className="envelope-letter" aria-hidden="true">
                <div className="envelope-letter-face">
                  <p className="gate-kicker">Trân trọng kính mời bạn đến chung vui</p>
                  <img
                    className="gate-logo"
                    src={withBasePath("/images/logo/wedding-lockup.webp")}
                    alt="Duy & Lan"
                    width="640"
                    height="895"
                    decoding="async"
                  />
                  <p className="gate-venue">{weddingData.invitation.venue}</p>
                </div>
              </div>

              {/* Envelope Front Pocket (Lower Triangular Folds in Royal Crimson Velvet) */}
              <div className="envelope-pocket" aria-hidden="true">
                <div className="envelope-stardust-shimmer" />
                <div className="pocket-gold-trim" />
                <img
                  className="envelope-corner corner-bl"
                  src={withBasePath("/images/decor/gold-corner-filigree.png")}
                  alt=""
                  aria-hidden="true"
                />
                <img
                  className="envelope-corner corner-br"
                  src={withBasePath("/images/decor/gold-corner-filigree.png")}
                  alt=""
                  aria-hidden="true"
                />
              </div>

              {/* 3D Triangular Top Flap */}
              <div className="envelope-flap" aria-hidden="true">
                <div className="envelope-flap-face flap-front">
                  <div className="envelope-stardust-shimmer" />
                  <div className="flap-gold-trim" />
                  <img
                    className="envelope-corner corner-tl"
                    src={withBasePath("/images/decor/gold-corner-filigree.png")}
                    alt=""
                    aria-hidden="true"
                  />
                  <img
                    className="envelope-corner corner-tr"
                    src={withBasePath("/images/decor/gold-corner-filigree.png")}
                    alt=""
                    aria-hidden="true"
                  />
                </div>
                <div className="envelope-flap-face flap-back">
                  <div className="flap-lining" />
                </div>
              </div>

              {/* Center Medallion & Tassel Seal Button */}
              <div className="envelope-seal-wrapper">
                <button
                  className="envelope-seal-btn"
                  data-open-invitation
                  type="button"
                  aria-label="Chạm để mở thiệp cưới"
                  onClick={openInvitation}
                  disabled={invitationOpening}
                >
                  <span className="seal-pulse-glow" aria-hidden="true" />
                  <img
                    className="seal-disc-img"
                    src={withBasePath("/images/decor/song-hy-medallion.png")}
                    alt="Long Phụng Song Hỷ"
                    width="512"
                    height="512"
                    decoding="async"
                  />
                  {/* Flowing Red Silk Tassel with Jade Bead */}
                  <span className="envelope-tassel-wrapper" aria-hidden="true">
                    <img
                      className="envelope-tassel-img"
                      src={withBasePath("/images/decor/red-silk-tassel.png")}
                      alt=""
                      width="300"
                      height="533"
                      decoding="async"
                    />
                  </span>
                </button>
              </div>

              {/* Floating Call to Action Prompt */}
              <button
                className="envelope-open-prompt"
                data-open-invitation
                type="button"
                onClick={openInvitation}
                disabled={invitationOpening}
              >
                <span className="prompt-sparkle" aria-hidden="true">✧</span>
                <span className="prompt-text">Chạm mở thiệp</span>
                <span className="prompt-sparkle" aria-hidden="true">✧</span>
              </button>
            </div>
          </div>
        </section>
      )}

      <header className={`site-header${headerCompact ? " is-compact" : ""}${menuOpen ? " menu-open" : ""}`}>
        <a className={`monogram${logoImage ? " has-image" : ""}`} href="#home" aria-label="Duy và Lan · Về đầu trang">
          {logoImage ? (
            <img
              className="monogram-logo-image"
              src={withBasePath(theme === "dark" ? "/images/logo/logo-gold.webp" : logoImage)}
              alt="Logo Duy và Lan"
              width="512"
              height="512"
              decoding="async"
            />
          ) : (
            <><span className="monogram-d">D</span><span className="rings-icon rings-monogram"><i /><i /></span><span className="monogram-l">L</span></>
          )}
        </a>
        <nav id="main-navigation" className={menuOpen ? "navigation is-open" : "navigation"} aria-label="Điều hướng chính">
          <a href="#home" onClick={() => setMenuOpen(false)}>Trang chủ</a>
          <a href="#event" onClick={() => setMenuOpen(false)}>Ba ngày vui</a>
          <a href="#story" onClick={() => setMenuOpen(false)}>Chuyện chúng mình</a>
          <a href="#gallery" onClick={() => setMenuOpen(false)}>Album</a>
          <a href="#wishes" onClick={() => setMenuOpen(false)}>Lời chúc</a>
        </nav>
        <div className="header-controls">
          <button
            className="theme-toggle"
            type="button"
            aria-label={theme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
            aria-pressed={theme === "dark"}
            onClick={toggleTheme}
          >
            <span className="theme-toggle-icon" aria-hidden="true">{theme === "dark" ? "☾" : "☀"}</span>
            <span className="theme-toggle-label">{theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}</span>
          </button>
          <button className="menu-button" aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen((open) => !open)}>
            <span /><span /><span /><span className="sr-only">{menuOpen ? "Đóng menu" : "Mở menu"}</span>
          </button>
        </div>
      </header>

      {invitationOpen && (
        <div className="scroll-progress" aria-hidden="true">
          <span ref={scrollProgressRef} />
        </div>
      )}

      {backgroundMusic && (
        <>
          <audio ref={audioRef} src={withBasePath(backgroundMusic)} loop preload="none" onPause={() => setMusicPlaying(false)} onPlay={() => setMusicPlaying(true)} />
          {invitationOpen && (
            <div className={`music-toggle${musicPlaying ? " is-playing" : ""}${musicCollapsed ? " is-collapsed" : ""}`}>
              <button
                className="music-details"
                type="button"
                aria-label={musicCollapsed ? "Mở rộng trình phát nhạc nền" : "Thu gọn trình phát nhạc nền"}
                aria-expanded={!musicCollapsed}
                onClick={() => setMusicCollapsed((collapsed) => !collapsed)}
              >
                <span className="music-wave" aria-hidden="true"><i /><i /><i /><i /><i /></span>
                <span className="music-copy">
                  <small>{musicPlaying ? "Đang phát" : "Nhạc nền"}</small>
                  <strong>{backgroundMusicTitle || "Nhạc cưới của chúng mình"}</strong>
                </span>
              </button>
              <button
                className="music-action"
                type="button"
                aria-label={musicPlaying ? "Tạm dừng nhạc nền" : "Phát nhạc nền"}
                aria-pressed={musicPlaying}
                onClick={toggleMusic}
              >
                <svg className="music-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {musicPlaying ? (
                    <path d="M9 7.5v9M15 7.5v9" />
                  ) : (
                    <path d="m9 7 8 5-8 5V7Z" />
                  )}
                </svg>
              </button>
            </div>
          )}
        </>
      )}

      <section id="home" className="hero-scene" ref={heroSceneRef}>
      <div className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{weddingData.invitation.eyebrow}</p>
          <span className="leaf-divider" aria-hidden="true">✦</span>
          <h2 className="hero-names">
            <span className="hero-name hero-name-groom">{weddingData.couple.groom}</span>
            <span className="hero-love-mark" aria-hidden="true">
              <img src={withBasePath("/images/decor/heart-rings-icon.webp")} alt="" width="728" height="761" decoding="async" />
            </span>
            <span className="hero-name hero-name-bride">{weddingData.couple.bride}</span>
          </h2>
          <p className="wedding-date">{weddingData.invitation.dateDisplay}</p>
          <p className="venue">{weddingData.invitation.venue}</p>
          <a className="primary-button" href="#event">Xem lời mời</a>
          <a className="scroll-cue" href="#event"><span aria-hidden="true">↓</span>Cuộn để khám phá</a>
        </div>
        <div className="hero-photo">
          {/* The frame is what pins (phones) / expands (desktop) during the hero scroll scene. */}
          <div className="hero-photo-frame">
            <img className="hero-photo-portrait" src={withBasePath("/images/01-ROZ02396.webp")} alt="Ảnh cưới của Duy và Lan" width="1200" height="1800" fetchPriority="high" decoding="async" />
            <img className="hero-photo-wide" src={withBasePath(HERO_WIDE_PHOTO)} alt="" aria-hidden="true" width="1800" height="1180" loading="lazy" decoding="async" />
            <div className="hero-scene-caption" aria-hidden="true">
              <p>Save the date</p>
              <strong>{weddingData.invitation.dateDisplay}</strong>
              <span>{weddingData.couple.groom} &amp; {weddingData.couple.bride}</span>
            </div>
          </div>
        </div>
      </div>
      </section>

      <section className="countdown-section" aria-label="Đếm ngược đến ngày thành hôn">
        <p className="section-kicker">Save the date</p>
        <h2>Ngày mình về chung một nhà</h2>
        <div className="countdown">
          {[["Ngày", countdown.days], ["Giờ", countdown.hours], ["Phút", countdown.minutes], ["Giây", countdown.seconds]].map(([label, value]) => (
            <div className="countdown-item" key={label}>
              <strong>{String(value).padStart(2, "0")}</strong><span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="couple-section section" aria-labelledby="couple-heading">
        <div className="section-heading">
          <p className="section-kicker">The bride and groom</p>
          <h2 id="couple-heading"><SplitWords text="Cô dâu và Chú rể" /></h2>
          <p>Hai trái tim, một lời hẹn và một hành trình mới mang tên gia đình.</p>
        </div>
        <div className="couple-portraits">
          <article className="couple-profile">
            <div className="couple-portrait-frame"><img src={withBasePath(couplePortraits.groom)} alt="Chú rể Duy" width="1200" height="1800" loading="lazy" decoding="async" /></div>
            <div className="couple-identity">
              <p className="couple-role">Chú rể</p>
              <h3>{weddingData.couple.groomProfile.fullName}</h3>
              <p className="family-order">— {weddingData.couple.groomProfile.familyOrder} —</p>
              <div className="couple-family">
                <p><span>{weddingData.couple.groomProfile.familySide}</span><small>Thân sinh</small></p>
                {weddingData.couple.groomProfile.parents.map((parent) => <strong key={parent}>{parent}</strong>)}
              </div>
            </div>
          </article>
          <span className="portrait-love-mark" aria-hidden="true"><img src={withBasePath("/images/decor/heart-rings-icon.webp")} alt="" width="728" height="761" loading="lazy" decoding="async" /></span>
          <article className="couple-profile">
            <div className="couple-portrait-frame"><img src={withBasePath(couplePortraits.bride)} alt="Cô dâu Lan" width="1200" height="1800" loading="lazy" decoding="async" /></div>
            <div className="couple-identity">
              <p className="couple-role">Cô dâu</p>
              <h3>{weddingData.couple.brideProfile.fullName}</h3>
              <p className="family-order">— {weddingData.couple.brideProfile.familyOrder} —</p>
              <div className="couple-family">
                <p><span>{weddingData.couple.brideProfile.familySide}</span><small>Thân sinh</small></p>
                {weddingData.couple.brideProfile.parents.map((parent) => <strong key={parent}>{parent}</strong>)}
              </div>
            </div>
          </article>
        </div>
      </section>

      <section id="event" className="event-section section">
        <div className="section-heading">
          <p className="section-kicker">Lịch hỷ sự</p>
          <h2><SplitWords text="Ba dấu mốc · Một hành trình" /></h2>
          <p>Gia đình hai bên trân trọng kính mời quý khách cùng hiện diện trong hành trình hỷ sự của Duy và Lan. Mỗi buổi lễ là một dấu mốc thân tình, được tổ chức tại ba địa điểm khác nhau.</p>
        </div>
        <div className="events-list">
          {weddingData.events.map((event, index) => (
            <article className={`event-card${flippedEventId === event.id ? " is-flipped" : ""}`} key={event.id}>
              <div className="event-card-inner">
                <div className="event-card-face event-card-front" aria-hidden={flippedEventId === event.id}>
                  <p className="event-label"><span>0{index + 1}</span>{event.title}</p>
                  <div className="event-front-calendar" aria-hidden="true">
                    <span>{event.dayOfWeek}</span>
                    <strong>{event.day}</strong>
                    <span>{event.monthYear}</span>
                  </div>
                  <h3>{event.venue}</h3>
                  <p className="event-front-date">{event.date}</p>
                  <button
                    className="outline-button"
                    type="button"
                    aria-expanded={flippedEventId === event.id}
                    onClick={() => setFlippedEventId(event.id)}
                  >
                    Xem chi tiết <span aria-hidden="true">←</span>
                  </button>
                </div>
                <div className="event-card-face event-card-back" aria-hidden={flippedEventId !== event.id}>
                  <div className="event-details">
                    <p className="event-label"><span>0{index + 1}</span>{event.title}</p>
                    <h3>{event.venue}</h3>
                    {event.venueDetail && <p className="venue-detail">{event.venueDetail}</p>}
                    <dl className="event-facts">
                      <div><dt>Ngày tổ chức</dt><dd>{event.date}</dd></div>
                      <div><dt>Thời gian</dt><dd>{event.time}</dd></div>
                      <div><dt>Địa chỉ</dt><dd>{event.address}</dd></div>
                    </dl>
                    <div className="event-actions">
                      <button className="text-button" type="button" onClick={() => setFlippedEventId(null)}>
                        <span aria-hidden="true">←</span> Quay lại
                      </button>
                      <a className="outline-button" href={event.mapUrl} target="_blank" rel="noreferrer">Chỉ đường</a>
                    </div>
                  </div>
                  <div className="event-map">
                    <iframe src={event.mapEmbedUrl} title={`Bản đồ ${event.venue}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="story" className="story-section section" aria-labelledby="story-heading">
        {/* On wide screens this becomes a pinned, horizontally scrolling film strip; elsewhere it stacks. */}
        <div className="story-film" ref={storyFilmRef}>
          <div className="story-film-viewport">
            <div className="story-film-track" ref={storyTrackRef}>
              {/* `.film-page` wrappers are `display: contents` on desktop (flat film strip) and become
                  stacked, pinned "album pages" on phones. */}
              <div className="film-page">
              <div className="section-heading film-intro">
                <p className="section-kicker">Our story</p>
                <h2 id="story-heading"><SplitWords text="Từ ngày gặp nhau" /></h2>
                <p>Đây là một vài dấu mốc trong hành trình chúng mình gặp gỡ, đồng hành và quyết định cùng nhau xây dựng gia đình.</p>
                <span className="film-hint" aria-hidden="true">Cuộn để lật từng trang <i>→</i></span>
              </div>
              <figure className="film-frame film-frame-arch" data-parallax>
                <img src={withBasePath(STORY_LEAD_PHOTO)} alt="Duy và Lan tựa vào nhau" width="1800" height="2700" loading="lazy" decoding="async" />
              </figure>
              </div>
              {weddingData.story.map((item, index) => {
                const frames = STORY_FILM_FRAMES[index % STORY_FILM_FRAMES.length];
                return (
                  <div className="film-page" key={item.year}>
                    <article className="film-chapter">
                      <p className="film-chapter-label">Chương {String(index + 1).padStart(2, "0")}</p>
                      <p className="film-year">{item.year}</p>
                      <h3>{item.title}</h3>
                      <p className="film-text">{item.text}</p>
                    </article>
                    <div className="film-collage">
                      <figure className="film-frame film-frame-main" data-parallax>
                        <img src={withBasePath(frames.main)} alt={`Kỷ niệm của Duy và Lan · ${item.title}`} width="1800" height="1200" loading="lazy" decoding="async" />
                      </figure>
                      <figure className="film-frame film-frame-detail" data-parallax>
                        <img src={withBasePath(frames.detail)} alt="" width="1800" height="1200" loading="lazy" decoding="async" />
                      </figure>
                    </div>
                  </div>
                );
              })}
              <div className="film-page">
              <div className="film-finale">
                <figure className="film-frame film-frame-arch film-frame-finale" data-parallax>
                  <img src={withBasePath(STORY_FINALE_PHOTO)} alt="Duy nắm tay Lan" width="1800" height="2700" loading="lazy" decoding="async" />
                </figure>
                <div className="film-finale-copy">
                  <p className="section-kicker">Chương tiếp theo</p>
                  <p className="film-finale-title">Và từ đây, mình là một nhà.</p>
                  <p className="film-finale-date">{weddingData.invitation.dateDisplay}</p>
                </div>
              </div>
              </div>
            </div>
            <div className="film-progress" aria-hidden="true">
              <span className="film-progress-label">Chuyện chúng mình</span>
              <span className="film-progress-track"><span ref={filmProgressRef} /></span>
              <span className="film-progress-count" ref={filmCounterRef}>01 / {String(weddingData.story.length).padStart(2, "0")}</span>
            </div>
          </div>
        </div>
      </section>

      <section id="gallery" className="gallery-section section">
        <div className="section-heading">
          <p className="section-kicker">Little moments</p><h2><SplitWords text="Khoảnh khắc của chúng mình" /></h2>
          <p>Những kỷ niệm nhỏ trên hành trình của chúng mình.</p>
        </div>
        {weddingPhotos.length > 0 ? (
          <div className="wedding-slider" role="region" aria-roledescription="carousel" aria-label="Album ảnh cưới Duy và Lan">
            <div
              className="slider-stage"
              onPointerDown={(event) => {
                sliderDragStartXRef.current = event.clientX;
              }}
              onPointerUp={(event) => {
                const startX = sliderDragStartXRef.current;
                sliderDragStartXRef.current = null;
                if (startX === null) return;
                const distance = event.clientX - startX;
                if (distance > 48) showPreviousPhoto();
                if (distance < -48) showNextPhoto();
              }}
              onPointerCancel={() => { sliderDragStartXRef.current = null; }}
              onTouchStart={(e) => {
                if (e.touches && e.touches[0]) {
                  sliderDragStartXRef.current = e.touches[0].clientX;
                }
              }}
              onTouchEnd={(e) => {
                const startX = sliderDragStartXRef.current;
                sliderDragStartXRef.current = null;
                if (startX === null || !e.changedTouches || !e.changedTouches.length) return;
                const distance = e.changedTouches[0].clientX - startX;
                if (distance > 40) showPreviousPhoto();
                if (distance < -40) showNextPhoto();
              }}
            >
              <figure className="wedding-slide">
                <img
                  src={withBasePath(weddingPhotos[activePhotoIndex].src)}
                  alt={weddingPhotos[activePhotoIndex].alt || `Ảnh cưới Duy và Lan ${activePhotoIndex + 1}`}
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                  onClick={() => setLightboxPhotoIndex(activePhotoIndex)}
                  title="Chạm để xem ảnh toàn màn hình"
                />
                <button className="slider-arrow slider-arrow-prev" type="button" aria-label="Xem ảnh trước" onClick={showPreviousPhoto}>←</button>
                <button className="slider-arrow slider-arrow-next" type="button" aria-label="Xem ảnh tiếp theo" onClick={showNextPhoto}>→</button>
                <div className="slider-swipe-hint" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>Vuốt để chuyển ảnh</span>
                </div>
                <figcaption aria-live="polite">{String(activePhotoIndex + 1).padStart(2, "0")} <span>/</span> {String(weddingPhotos.length).padStart(2, "0")}</figcaption>
              </figure>
            </div>
            <div
              className="slider-thumbnails"
              aria-label="Chọn ảnh trong album"
              onWheel={(event) => {
                if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 8) return;
                event.preventDefault();
                if (!thumbnailWheelReadyRef.current) return;
                thumbnailWheelReadyRef.current = false;
                if (event.deltaX > 0) showNextPhoto();
                else showPreviousPhoto();
                window.setTimeout(() => { thumbnailWheelReadyRef.current = true; }, 140);
              }}
            >
              {thumbnailWindow.map(({ index, offset }) => {
                const photo = weddingPhotos[index];
                return (
                  <button
                    className={offset === 0 ? "is-active" : ""}
                    type="button"
                    data-photo-index={index}
                    aria-label={`Xem ảnh ${index + 1}`}
                    aria-current={offset === 0 ? "true" : undefined}
                    onClick={() => setActivePhotoIndex(index)}
                    key={`${photo.src}-${offset}`}
                  >
                    <img src={withBasePath(photo.src)} alt="" loading="lazy" decoding="async" />
                  </button>
                );
              })}
            </div>
            <div className="slider-mobile-controls">
              <button type="button" aria-label="Xem ảnh trước" onClick={showPreviousPhoto}>←</button>
              <div className="slider-progress" aria-hidden="true"><span style={{ width: `${((activePhotoIndex + 1) / weddingPhotos.length) * 100}%` }} /></div>
              <button
                type="button"
                aria-label="Xem ảnh tiếp theo"
                onClick={showNextPhoto}
              >→</button>
            </div>
          </div>
        ) : (
          <p className="gallery-empty">Hãy thêm ảnh vào thư mục public/images/wedding để album xuất hiện tại đây.</p>
        )}
      </section>

      <section id="saigon-date" className="calendar-section section" aria-labelledby="saigon-date-heading">
        <div className="calendar-copy">
          <p className="section-kicker">Lịch hẹn Sài Gòn</p>
          <h2 id="saigon-date-heading"><SplitWords text="Tháng Mười," /><br /><SplitWords text="ngày mình chung vui" /></h2>
          <p>
            Hẹn gặp bạn vào <strong>Thứ Tư, 28 tháng 10 năm 2026</strong> tại Diamond Place,
            Thành phố Hồ Chí Minh.
          </p>
          <div className="calendar-event-note">
            <span>18:00</span>
            <div><strong>Đón khách</strong><small>Sảnh Sapphire · Diamond Place</small></div>
          </div>
        </div>
        <div className="wedding-calendar" aria-label="Lịch tháng 10 năm 2026, ngày cưới 28 được đánh dấu">
          <div className="calendar-header"><span>October</span><strong>10 · 2026</strong></div>
          <div className="calendar-grid calendar-weekdays" aria-hidden="true">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="calendar-grid calendar-days">
            {Array.from({ length: 3 }, (_, index) => <span className="calendar-empty" key={`empty-${index}`} />)}
            {Array.from({ length: 31 }, (_, index) => {
              const day = index + 1;
              return day === 28 ? (
                <strong className="wedding-day" key={day} aria-label="Ngày 28, ngày tổ chức tại Sài Gòn">
                  <svg className="wedding-day-ring" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" pathLength="1" /></svg>
                  <span>28</span><i aria-hidden="true">♥</i>
                </strong>
              ) : <span key={day}>{day}</span>;
            })}
          </div>
          <p className="calendar-caption"><span aria-hidden="true">♥</span> Ngày tổ chức tại Sài Gòn</p>
        </div>
      </section>

      <section id="wishes" className="gift-section section">
        <div className="section-heading">
          <p className="section-kicker">With love</p>
          <h2><SplitWords text="Gửi lời chúc đến tụi mình" /></h2>
          <p>Tình cảm và sự hiện diện của bạn là niềm hạnh phúc lớn nhất của tụi mình. Bạn có thể để lại lời chúc hoặc gửi món quà mừng cưới bên dưới nhé.</p>
        </div>

        {/* Wishes & Gift 2-Column Layout (Form on Left, QR on Right; Stacked on Mobile) */}
        <div className="wishes-gift-layout">
          {/* Bên trái: Sổ lưu bút & Xác nhận tham dự */}
          <div className="wishes-form-card">
            <div className="form-header">
              <div className="form-seal-badge" aria-hidden="true">
                <img
                  src={withBasePath("/images/logo/logo-gold.webp")}
                  alt="Logo Duy &amp; Lan"
                  className="seal-monogram-img"
                  width="64"
                  height="64"
                  decoding="async"
                />
              </div>
              <p className="form-kicker">Gửi trao yêu thương</p>
              <h3>Gửi lời chúc đến tụi mình</h3>
              <p className="form-subtitle">Sự hiện diện và lời chúc phúc của bạn là niềm hạnh phúc trọn vẹn nhất đối với tụi mình</p>
              <div className="form-divider" aria-hidden="true">
                <span className="divider-line" />
                <span className="divider-diamond">✦</span>
                <span className="divider-line" />
              </div>
            </div>

            {submitSuccess ? (
              <div className="submit-success-banner" role="alert">
                <span className="success-crest" aria-hidden="true">✦ ❀ ✦</span>
                <h4>Cảm ơn bạn rất nhiều!</h4>
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => setSubmitSuccess(false)}
                >
                  Gửi thêm lời chúc khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleWishSubmit} className="wishes-form">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label htmlFor="guest-name">
                      Tên của bạn <span className="req">*</span>
                    </label>
                    <input
                      id="guest-name"
                      type="text"
                      required
                      placeholder="Ví dụ: Bạn Tuấn, Bé My..."
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="guest-relation">Bạn là...</label>
                    <select
                      id="guest-relation"
                      value={guestRelation}
                      onChange={(e) => setGuestRelation(e.target.value)}
                    >
                      <option value="Bạn chung">Bạn chung của cả hai</option>
                      <option value="Bạn Chú rể">Bạn của Chú rể</option>
                      <option value="Bạn Cô dâu">Bạn của Cô dâu</option>
                      <option value="Người thân">Người thân / Gia đình</option>
                      <option value="Đồng nghiệp">Đồng nghiệp</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="guest-message">
                    Lời chúc gửi đến tụi mình <span className="req">*</span>
                  </label>
                  <textarea
                    id="guest-message"
                    required
                    rows={4}
                    placeholder="Gửi gắm vài dòng yêu thương đến tụi mình tại đây nhé..."
                    value={guestMessage}
                    onChange={(e) => setGuestMessage(e.target.value)}
                  />
                </div>

                <div className="form-submit-row">
                  <button
                    type="submit"
                    className="wishes-submit-btn"
                    disabled={isSubmittingWish}
                  >
                    {isSubmittingWish ? (
                      <span>Đang gửi lời chúc...</span>
                    ) : (
                      <>
                        <span>Gửi lời chúc yêu thương</span>
                        <span className="btn-arrow" aria-hidden="true">→</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Bên phải: Mã QR & Hộp mừng cưới */}
          <div className="gift-card">
            <div className="gift-card-inner">
              <div className="form-header">
                <div className="form-seal-badge" aria-hidden="true">
                  <img
                    src={withBasePath("/images/logo/logo-gold.webp")}
                    alt="Logo Duy &amp; Lan"
                    className="seal-monogram-img"
                    width="64"
                    height="64"
                    decoding="async"
                  />
                </div>
                <p className="form-kicker">Mừng cưới chúc phúc</p>
                <h3>{gift.label || "Hộp mừng cưới"}</h3>
                <p className="form-subtitle">Dù ở gần hay phương xa, mọi tình cảm và sự chúc phúc của bạn tụi mình đều vô cùng trân quý</p>
                <div className="form-divider" aria-hidden="true">
                  <span className="divider-line" />
                  <span className="divider-diamond">✦</span>
                  <span className="divider-line" />
                </div>
              </div>

              <div className="gift-body">
                {/* 2 Tabs chuyển đổi Chú rể / Cô dâu */}
                <div className="gift-tabs-wrap">
                  <div className="gift-tabs" role="tablist" aria-label="Chọn người nhận mừng cưới"
                    onKeyDown={(event) => {
                      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                      event.preventDefault();
                      const nextTab = event.key === "Home" ? "groom" : event.key === "End" ? "bride" : activeBankTab === "groom" ? "bride" : "groom";
                      setActiveBankTab(nextTab);
                      document.getElementById(`gift-tab-${nextTab}`)?.focus();
                    }}
                  >
                    <button
                      type="button"
                      role="tab"
                      id="gift-tab-groom"
                      aria-controls="gift-bank-panel"
                      tabIndex={activeBankTab === "groom" ? 0 : -1}
                      aria-selected={activeBankTab === "groom"}
                      className={`gift-tab-btn${activeBankTab === "groom" ? " is-active" : ""}`}
                      onClick={() => setActiveBankTab("groom")}
                    >
                      <span className="tab-label">
                        <small>Mừng Chú rể</small>
                        <strong>Khương Duy</strong>
                      </span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      id="gift-tab-bride"
                      aria-controls="gift-bank-panel"
                      tabIndex={activeBankTab === "bride" ? 0 : -1}
                      aria-selected={activeBankTab === "bride"}
                      className={`gift-tab-btn${activeBankTab === "bride" ? " is-active" : ""}`}
                      onClick={() => setActiveBankTab("bride")}
                    >
                      <span className="tab-label">
                        <small>Mừng Cô dâu</small>
                        <strong>Nguyễn Lan</strong>
                      </span>
                    </button>
                  </div>
                </div>

                {/* Khung thiệp mừng cưới / Thẻ chuyển khoản sang trọng */}
                <div className="gift-card-envelope" id="gift-bank-panel" role="tabpanel" aria-labelledby={`gift-tab-${activeBankTab}`}>
                  <div className="gift-card-header">
                    <div className="gift-recipient-heading">
                      <span className="gift-recipient-status">Mừng {currentBank.recipient.toLowerCase()}</span>
                      <h4>{currentBank.name}</h4>
                    </div>
                    <span className="gift-bank-badge-gold">
                      <span className="bank-name-tag">{currentBank.bankName}</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    className="qr-card-display is-clickable"
                    aria-label={`Mã QR mừng cưới ${currentBank.recipient} (Chạm để phóng to)`}
                    onClick={() => setQrModalOpen(true)}
                    title="Chạm để phóng to mã QR"
                  >
                    <span className="qr-image-wrapper">
                      <img
                        src={withBasePath(currentBank.qrImage)}
                        alt={`Mã QR mừng cưới ${currentBank.recipient}`}
                        className="qr-main-img"
                        width="240"
                        height="240"
                        loading="lazy"
                        decoding="async"
                      />
                    </span>
                    <span className="qr-hint">Phóng to mã QR ↗</span>
                  </button>

                  <dl className="gift-account-details">
                    <div>
                      <dt>Chủ tài khoản</dt>
                      <dd>{currentBank.accountName}</dd>
                    </div>
                    <div>
                      <dt>Số tài khoản</dt>
                      <dd className="gift-account-number">{currentBank.accountNumber}</dd>
                    </div>
                  </dl>

                  <div className="gift-card-actions">
                    <button
                      type="button"
                      className="copy-btn gift-full-copy-btn"
                      onClick={() => copyToClipboard(currentBank.accountNumber.replace(/\s+/g, ""), "số tài khoản")}
                      aria-label={`Sao chép số tài khoản ${currentBank.recipient.toLowerCase()}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      <span>Sao chép số tài khoản</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Wall of Wishes / Sổ lưu bút chúc phúc */}
        <div className="wishes-wall" id="guestbook-wall">
          <div className="wall-header">
            <p className="section-kicker">Guestbook</p>
            <h3>Sổ lưu bút chúc phúc</h3>
            <div className="wall-subtitle-row">
              <p className="wall-subtitle" suppressHydrationWarning>
                Những lời chúc yêu thương đã gửi đến tụi mình
              </p>
              {weddingData.googleSheetScriptUrl && (
                <button
                  type="button"
                  className="refresh-wishes-btn"
                  onClick={() => void fetchWishesFromSheet(true)}
                  disabled={isLoadingWishes}
                  title="Cập nhật lời chúc mới nhất từ Google Sheets"
                >
                  <span className={`sync-icon${isLoadingWishes ? " is-spinning" : ""}`} aria-hidden="true">↻</span>
                  <span>{isLoadingWishes ? "Đang đồng bộ..." : "Làm mới"}</span>
                </button>
              )}
            </div>
          </div>

          <div className="wishes-grid" suppressHydrationWarning>
            {paginatedWishes.map((wish, index) => {
              return (
                <article className="wish-card" key={`${wish.name}-${index}-${wishesPage}`}>
                  <div className="wish-card-header">
                    <div className="wish-avatar" aria-hidden="true">
                      {wish.name.trim().charAt(0).toUpperCase() || "♥"}
                    </div>
                    <div className="wish-meta">
                      <strong>{wish.name}</strong>
                      <div className="wish-tags">
                        <span className="wish-relation">{wish.relation}</span>
                      </div>
                    </div>
                    <time className="wish-date">{wish.date}</time>
                  </div>
                  <p className="wish-message">{wish.message}</p>
                </article>
              );
            })}
          </div>

          {totalWishesPages > 1 && (
            <nav className="wishes-pagination" aria-label="Phân trang lời chúc">
              <button
                type="button"
                className="page-btn page-nav-btn"
                onClick={() => {
                  setWishesPage((p) => Math.max(1, p - 1));
                  document.getElementById("guestbook-wall")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }}
                disabled={wishesPage <= 1}
                aria-label="Trang trước"
              >
                ← Trước
              </button>

              <div className="page-numbers">
                {getPageNumbers(wishesPage, totalWishesPages).map((item, idx) =>
                  typeof item === "number" ? (
                    <button
                      key={`page-${item}`}
                      type="button"
                      className={`page-btn page-num-btn${wishesPage === item ? " is-active" : ""}`}
                      onClick={() => {
                        setWishesPage(item);
                        document.getElementById("guestbook-wall")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                      }}
                      aria-current={wishesPage === item ? "page" : undefined}
                    >
                      {item}
                    </button>
                  ) : (
                    <span key={`ellipsis-${idx}`} className="page-ellipsis" aria-hidden="true">
                      …
                    </span>
                  )
                )}
              </div>

              <button
                type="button"
                className="page-btn page-nav-btn"
                onClick={() => {
                  setWishesPage((p) => Math.min(totalWishesPages, p + 1));
                  document.getElementById("guestbook-wall")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }}
                disabled={wishesPage >= totalWishesPages}
                aria-label="Trang sau"
              >
                Sau →
              </button>
            </nav>
          )}
        </div>
      </section>

      {/* QR Zoom Modal */}
      {qrModalOpen && (
        <div
          className="qr-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`Mã QR mừng cưới ${currentBank.recipient} phóng to`}
          onClick={() => setQrModalOpen(false)}
        >
          <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="qr-modal-close"
              aria-label="Đóng mã QR"
              onClick={() => setQrModalOpen(false)}
            >
              ✕
            </button>
            <div className="qr-modal-brand">
              <span className="qr-modal-brand-label">
                Mừng {currentBank.recipient} · {currentBank.bankName}
              </span>
            </div>
            <img
              src={withBasePath(currentBank.qrImage)}
              alt={`Mã QR mừng cưới ${currentBank.recipient} phóng to`}
              className="qr-modal-qr-img"
            />
            <button
              type="button"
              className="copy-btn gift-full-copy-btn"
              style={{ marginTop: "14px", width: "100%" }}
              onClick={() => copyToClipboard(currentBank.accountNumber.replace(/\s+/g, ""), "số tài khoản")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>Sao chép STK: <strong>{currentBank.accountNumber}</strong></span>
            </button>
          </div>
        </div>
      )}

      {/* Album Fullscreen Lightbox Modal */}
      {lightboxPhotoIndex !== null && (
        <div
          className="lightbox-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh cưới toàn màn hình"
          onClick={() => {
            if (!lightboxIsDraggingRef.current) {
              setLightboxPhotoIndex(null);
            }
          }}
          onWheel={(e) => {
            e.stopPropagation();
            if (Math.abs(e.deltaX) > 30) {
              if (e.deltaX > 0) {
                setLightboxPhotoIndex((cur) =>
                  cur !== null ? (cur + 1) % weddingPhotos.length : null,
                );
              } else {
                setLightboxPhotoIndex((cur) =>
                  cur !== null ? (cur - 1 + weddingPhotos.length) % weddingPhotos.length : null,
                );
              }
            }
          }}
          onPointerDown={(e) => {
            lightboxDragStartXRef.current = e.clientX;
            lightboxIsDraggingRef.current = false;
          }}
          onPointerMove={(e) => {
            if (lightboxDragStartXRef.current !== null) {
              if (Math.abs(e.clientX - lightboxDragStartXRef.current) > 8) {
                lightboxIsDraggingRef.current = true;
              }
            }
          }}
          onPointerUp={(e) => {
            const startX = lightboxDragStartXRef.current;
            lightboxDragStartXRef.current = null;
            if (startX === null) return;
            const deltaX = e.clientX - startX;
            if (Math.abs(deltaX) > 36) {
              if (deltaX > 0) {
                setLightboxPhotoIndex((cur) =>
                  cur !== null ? (cur - 1 + weddingPhotos.length) % weddingPhotos.length : null,
                );
              } else {
                setLightboxPhotoIndex((cur) =>
                  cur !== null ? (cur + 1) % weddingPhotos.length : null,
                );
              }
            }
            window.setTimeout(() => {
              lightboxIsDraggingRef.current = false;
            }, 80);
          }}
          onPointerCancel={() => {
            lightboxDragStartXRef.current = null;
            lightboxIsDraggingRef.current = false;
          }}
          onTouchStart={(e) => {
            if (e.touches && e.touches[0]) {
              lightboxDragStartXRef.current = e.touches[0].clientX;
              lightboxIsDraggingRef.current = false;
            }
          }}
          onTouchMove={(e) => {
            if (e.touches && e.touches[0] && lightboxDragStartXRef.current !== null) {
              if (Math.abs(e.touches[0].clientX - lightboxDragStartXRef.current) > 8) {
                lightboxIsDraggingRef.current = true;
              }
            }
          }}
          onTouchEnd={(e) => {
            const startX = lightboxDragStartXRef.current;
            lightboxDragStartXRef.current = null;
            if (startX === null || !e.changedTouches || !e.changedTouches.length) return;
            const deltaX = e.changedTouches[0].clientX - startX;
            if (Math.abs(deltaX) > 36) {
              if (deltaX > 0) {
                setLightboxPhotoIndex((cur) =>
                  cur !== null ? (cur - 1 + weddingPhotos.length) % weddingPhotos.length : null,
                );
              } else {
                setLightboxPhotoIndex((cur) =>
                  cur !== null ? (cur + 1) % weddingPhotos.length : null,
                );
              }
            }
            window.setTimeout(() => {
              lightboxIsDraggingRef.current = false;
            }, 80);
          }}
        >
          <button
            type="button"
            className="lightbox-close-btn"
            aria-label="Đóng chế độ toàn màn hình"
            onClick={() => setLightboxPhotoIndex(null)}
          >
            ✕
          </button>

          <div className="lightbox-image-wrap" onClick={(e) => e.stopPropagation()}>
            <img
              src={withBasePath(weddingPhotos[lightboxPhotoIndex].src)}
              alt={weddingPhotos[lightboxPhotoIndex].alt || "Ảnh cưới Duy và Lan"}
              draggable={false}
            />
            <div className="lightbox-caption">
              {String(lightboxPhotoIndex + 1).padStart(2, "0")} / {String(weddingPhotos.length).padStart(2, "0")}
            </div>
          </div>

          <button
            type="button"
            className="lightbox-nav-btn lightbox-nav-prev"
            aria-label="Ảnh trước"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxPhotoIndex(
                (cur) => (cur! - 1 + weddingPhotos.length) % weddingPhotos.length,
              );
            }}
          >
            ←
          </button>

          <button
            type="button"
            className="lightbox-nav-btn lightbox-nav-next"
            aria-label="Ảnh sau"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxPhotoIndex(
                (cur) => (cur! + 1) % weddingPhotos.length,
              );
            }}
          >
            →
          </button>
        </div>
      )}

      {/* Toast Feedback */}
      {copyToast && (
        <div className="copy-toast" role="status">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
          </svg>
          <span>{copyToast}</span>
        </div>
      )}

      <footer>
        <img
          className="footer-logo"
          src={withBasePath(theme === "dark" ? "/images/logo/logo-gold.webp" : "/images/logo/logo.webp")}
          alt="Logo Duy và Lan"
          width="512"
          height="512"
          loading="lazy"
          decoding="async"
        />
        <h2 className="footer-thanks"><SplitWords text="Cảm ơn bạn đã trở thành một phần trong ngày vui của chúng mình." /></h2>
        <span className="footer-heart" aria-hidden="true"><span className="footer-heart-glyph">♥</span></span>
        <p>{weddingData.invitation.dateDisplay} · {weddingData.invitation.venue}</p>
        <a href="#home">Trở về đầu trang ↑</a>
      </footer>
      <canvas ref={canvasRef} className="fireworks-canvas" aria-hidden="true" />
    </main>
  );
}
