/* eslint-disable @next/next/no-img-element -- Static media is pre-optimized and served directly by Cloudflare. */
"use client";

import { useEffect, useRef, useState } from "react";
import { withBasePath } from "./asset-path";
import { backgroundMusic, backgroundMusicTitle, couplePortraits, logoImage, weddingPhotos } from "./generated-wedding-gallery";
import { weddingData } from "./wedding-data";

type Countdown = { days: number; hours: number; minutes: number; seconds: number };

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
  ".countdown, .section-heading, .couple-profile, .event-card, .story-photo, .story-list article, .wedding-slider, .calendar-copy, .wedding-calendar, .gift-card";

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
  const audioRef = useRef<HTMLAudioElement>(null);
  const sliderDragStartXRef = useRef<number | null>(null);
  const thumbnailWheelReadyRef = useRef(true);

  useEffect(() => {
    document.body.classList.toggle("invitation-locked", !invitationOpen);
    document.body.classList.toggle("invitation-ready", invitationOpen);
    const resetScroll = () => window.scrollTo({ top: 0, behavior: "auto" });
    let secondFrame = 0;
    const firstFrame = invitationOpen
      ? window.requestAnimationFrame(() => {
          resetScroll();
          secondFrame = window.requestAnimationFrame(resetScroll);
        })
      : 0;
    const scrollResetTimer = invitationOpen ? window.setTimeout(resetScroll, 240) : 0;

    return () => {
      document.body.classList.remove("invitation-locked");
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

    revealTargets.forEach((target, index) => {
      target.classList.add("motion-reveal");
      target.style.setProperty("--reveal-delay", `${(index % 3) * 80}ms`);
      if (reduceMotion) target.classList.add("is-visible");
    });

    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealTargets.forEach((target) => target.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -7%" },
    );

    revealTargets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
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
    window.setTimeout(() => {
      setInvitationOpen(true);
    }, 1500);
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

  const gift = weddingData.bank;

  return (
    <main>
      {!invitationOpen && (
        <section
          className={`invitation-gate${invitationOpening ? " is-opening" : ""}`}
          aria-label="Mở thiệp cưới"
        >
          <div className="gate-backdrop" aria-hidden="true" />
          <div className="gate-stage">
            <div className="gate-envelope">
              <div className="envelope-back" aria-hidden="true" />
              <div className="envelope-letter" aria-hidden="true">
                <p className="gate-kicker">Trân trọng kính mời bạn đến chung vui</p>
                <img className="gate-logo" src={withBasePath("/images/logo/wedding-lockup.webp")} alt="" width="640" height="895" decoding="async" />
                <p className="gate-venue">{weddingData.invitation.venue}</p>
              </div>
              <div className="envelope-pocket" aria-hidden="true" />
              <div className="envelope-flap" aria-hidden="true" />
              <button
                className="envelope-seal"
                type="button"
                aria-label="Mở thiệp"
                onClick={openInvitation}
                disabled={invitationOpening}
              >
                <img src={withBasePath("/images/decor/heart-rings-icon.webp")} alt="" aria-hidden="true" width="728" height="761" decoding="async" />
              </button>
            </div>
          </div>
        </section>
      )}

      <header className={`site-header${headerCompact ? " is-compact" : ""}`}>
        <a className={`monogram${logoImage ? " has-image" : ""}`} href="#home" aria-label="Duy và Lan · Về đầu trang">
          {logoImage ? (
            <img className="monogram-logo-image" src={withBasePath(logoImage)} alt="Logo Duy và Lan" width="512" height="512" decoding="async" />
          ) : (
            <><span className="monogram-d">D</span><span className="rings-icon rings-monogram"><i /><i /></span><span className="monogram-l">L</span></>
          )}
        </a>
        <button className="menu-button" aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen((open) => !open)}>
          <span /><span /><span /><span className="sr-only">Mở menu</span>
        </button>
        <nav id="main-navigation" className={menuOpen ? "navigation is-open" : "navigation"} aria-label="Điều hướng chính">
          <a href="#home" onClick={() => setMenuOpen(false)}>Trang chủ</a>
          <a href="#event" onClick={() => setMenuOpen(false)}>Ba ngày vui</a>
          <a href="#story" onClick={() => setMenuOpen(false)}>Chuyện chúng mình</a>
          <a href="#gallery" onClick={() => setMenuOpen(false)}>Album</a>
          <a href="#wishes" onClick={() => setMenuOpen(false)}>Lời chúc</a>
        </nav>
      </header>

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
                <span aria-hidden="true">{musicPlaying ? "Ⅱ" : "▶"}</span>
              </button>
            </div>
          )}
        </>
      )}

      <section id="home" className="hero">
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
          <img src={withBasePath("/images/01-ROZ02408.JPG")} alt="Ảnh cưới của Duy và Lan" width="1200" height="1800" fetchPriority="high" decoding="async" />
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
          <h2 id="couple-heading">Cô dâu và Chú rể</h2>
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
          <h2>Ba dấu mốc · Một hành trình</h2>
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
                      <button className="text-button" type="button" onClick={() => setFlippedEventId(null)}>Quay lại</button>
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

      <section id="story" className="story-section section">
        <div className="section-heading">
          <p className="section-kicker">Our story</p>
          <h2>Từ ngày gặp nhau</h2>
          <p>Đây là một vài dấu mốc trong hành trình chúng mình gặp gỡ, đồng hành và quyết định cùng nhau xây dựng gia đình.</p>
        </div>
        <div className="story-layout">
          <div className="story-photo">
            <img src={withBasePath("/images/02-ROZ01985.JPG")} alt="Ảnh kỷ niệm của Duy và Lan" width="1800" height="1200" loading="lazy" decoding="async" />
          </div>
          <div className="story-list">
            {weddingData.story.map((item) => (
              <article key={item.year}><span>{item.year}</span><div><h3>{item.title}</h3><p>{item.text}</p></div></article>
            ))}
          </div>
        </div>
      </section>

      <section id="gallery" className="gallery-section section">
        <div className="section-heading">
          <p className="section-kicker">Little moments</p><h2>Khoảnh khắc của chúng mình</h2>
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
            >
              <figure className="wedding-slide">
                <img
                  src={withBasePath(weddingPhotos[activePhotoIndex].src)}
                  alt={weddingPhotos[activePhotoIndex].alt || `Ảnh cưới Duy và Lan ${activePhotoIndex + 1}`}
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                />
                <button className="slider-arrow slider-arrow-prev" type="button" aria-label="Xem ảnh trước" onClick={showPreviousPhoto}>←</button>
                <button className="slider-arrow slider-arrow-next" type="button" aria-label="Xem ảnh tiếp theo" onClick={showNextPhoto}>→</button>
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
          <h2 id="saigon-date-heading">Tháng Mười,<br />ngày mình chung vui</h2>
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
                  <span>28</span><i aria-hidden="true">♥</i>
                </strong>
              ) : <span key={day}>{day}</span>;
            })}
          </div>
          <p className="calendar-caption"><span aria-hidden="true">♥</span> Ngày tổ chức tại Sài Gòn</p>
        </div>
      </section>

      <section id="wishes" className="gift-section section">
        <div className="section-heading"><p className="section-kicker">With love</p><h2>Gửi lời chúc đến cô dâu và chú rể</h2><p>Tình cảm và sự hiện diện của bạn đã là món quà quý giá. Nếu muốn gửi thêm lời chúc, bạn có thể dùng thông tin bên dưới.</p></div>
        <div className="gift-card">
          <div className="gift-content"><div className="sample-qr" aria-label="Mã QR mừng cưới của Duy và Lan"><span><img src={withBasePath("/images/logo/logo.webp")} alt="Logo Duy và Lan" width="512" height="512" loading="lazy" decoding="async" /></span></div><div><p>{gift.label}</p><h3>{gift.bankName}</h3><strong>{gift.accountNumber}</strong><span>{gift.accountName}</span></div></div>
        </div>
      </section>

      <footer><img className="footer-logo" src={withBasePath("/images/logo/logo.webp")} alt="Logo Duy và Lan" width="512" height="512" loading="lazy" decoding="async" /><h2>Cảm ơn bạn đã trở thành một phần trong ngày vui của chúng mình.</h2><p>{weddingData.invitation.dateDisplay} · {weddingData.invitation.venue}</p><a href="#home">Trở về đầu trang ↑</a></footer>
    </main>
  );
}
