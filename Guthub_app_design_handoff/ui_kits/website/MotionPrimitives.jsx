// MotionPrimitives.jsx — scroll-reveal, hover helpers, section divider
// Lightweight, respects prefers-reduced-motion.

// --- Reveal ---
// Fades + lifts children into view when they enter the viewport.
// Props: as, delay (ms), y (px lift), duration (ms), threshold
function Reveal({ as = 'div', delay = 0, y = 16, duration = 700, threshold = 0.15, once = true, children, style, ...rest }) {
  const Tag = as;
  const ref = React.useRef(null);
  const [shown, setShown] = React.useState(false);
  const reduced = React.useRef(false);

  React.useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced.current) { setShown(true); return; }
    const el = ref.current;
    if (!el) return;
    // If element is already in viewport at mount, trigger on next frame (preserves animation, avoids observer race)
    const rect = el.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (inView) {
      // Microtask: React commits the opacity:0 render first, then flips to shown
      // (plays the fade-in). Fallback setTimeout in case microtask is skipped.
      let cancelled = false;
      Promise.resolve().then(() => { if (!cancelled) setShown(true); });
      const t = setTimeout(() => { if (!cancelled) setShown(true); }, 50);
      return () => { cancelled = true; clearTimeout(t); };
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setShown(true);
          if (once) io.unobserve(el);
        } else if (!once) {
          setShown(false);
        }
      });
    }, { threshold, rootMargin: '0px 0px -40px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once]);

  const motionStyle = {
    opacity: shown ? 1 : 0,
    transform: shown ? 'translateY(0)' : `translateY(${y}px)`,
    transition: `opacity ${duration}ms var(--ease-out) ${delay}ms, transform ${duration}ms var(--ease-out) ${delay}ms`,
    willChange: 'opacity, transform',
  };

  return React.createElement(Tag, { ref, style: { ...motionStyle, ...(style || {}) }, ...rest }, children);
}

// --- RevealStagger ---
// Animates children sequentially. Wrap a list-like container.
function RevealStagger({ children, step = 80, initialDelay = 0, y = 14, duration = 650, style, ...rest }) {
  return (
    <div style={style} {...rest}>
      {React.Children.map(children, (child, i) => (
        <Reveal delay={initialDelay + i * step} y={y} duration={duration} style={{ display: 'contents' }}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}

// --- SectionDivider ---
// Soft organic shape that peeks out of a section edge, marking a transition.
// variants: 'leaf', 'splash', 'wave'
function SectionDivider({ variant = 'leaf', color = 'var(--terracotta-300)', side = 'top', offset = -40 }) {
  const paths = {
    leaf: (
      // Organic leaf/brushstroke
      <svg viewBox="0 0 120 120" width="100" height="100" style={{ display: 'block', filter: 'drop-shadow(0 6px 16px rgba(219,111,86,0.25))' }}>
        <path
          d="M60 10 C 90 20, 112 50, 105 85 C 98 100, 80 110, 60 112 C 35 110, 18 95, 12 70 C 10 40, 30 15, 60 10 Z"
          fill={color}
          opacity="0.92"
        />
        <path
          d="M60 18 C 62 50, 70 75, 85 100"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    ),
    splash: (
      <svg viewBox="0 0 140 100" width="140" height="100" style={{ display: 'block' }}>
        <path
          d="M10 70 C 20 40, 40 30, 60 45 C 75 55, 85 40, 100 50 C 115 55, 125 70, 120 85 C 100 92, 70 90, 50 85 C 25 80, 5 85, 10 70 Z"
          fill={color}
          opacity="0.85"
        />
      </svg>
    ),
    wave: (
      <svg viewBox="0 0 200 40" width="200" height="40" style={{ display: 'block' }}>
        <path
          d="M0 20 Q 25 5, 50 20 T 100 20 T 150 20 T 200 20 V 40 H 0 Z"
          fill={color}
        />
      </svg>
    ),
  };
  const pos = side === 'top'
    ? { top: offset, left: '50%', transform: 'translateX(-50%) rotate(-8deg)' }
    : { bottom: offset, left: '50%', transform: 'translateX(-50%) rotate(172deg)' };
  return (
    <div aria-hidden style={{
      position: 'absolute', ...pos, pointerEvents: 'none', zIndex: 3,
    }}>
      {paths[variant]}
    </div>
  );
}

Object.assign(window, { Reveal, RevealStagger, SectionDivider });
