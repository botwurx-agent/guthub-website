// Icon.jsx — minimal Lucide-style icon set used across the app.
// Stroke 1.75, currentColor, 20px default.

function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, style }) {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round',
    style,
  };
  const paths = {
    home: <><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></>,
    sparkle: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></>,
    chat: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></>,
    list: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></>,
    plate: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></>,
    chart: <><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-7"/></>,
    book: <><path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4z"/><path d="M4 4v16"/></>,
    users: <><circle cx="9" cy="7" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15 19a5 5 0 0 1 8 0"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M14 21a2 2 0 0 1-4 0"/></>,
    search: <><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    arrowRight: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    arrowLeft: <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
    arrowUp: <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>,
    arrowDown: <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>,
    check: <><polyline points="4 12 10 18 20 6"/></>,
    x: <><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></>,
    camera: <><path d="M3 7h3l2-3h8l2 3h3v12H3z"/><circle cx="12" cy="13" r="4"/></>,
    paperclip: <><path d="M21 11.5l-9 9a5 5 0 0 1-7-7l9-9a3 3 0 0 1 4 4L9.5 17a1.5 1.5 0 0 1-2-2L15 7"/></>,
    send: <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    file: <><path d="M14 3H6v18h12V7z"/><polyline points="14 3 14 7 18 7"/></>,
    lab: <><path d="M9 3h6"/><path d="M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></>,
    leaf: <><path d="M20 4c0 8-7 14-14 14"/><path d="M20 4c-8 0-14 6-14 14L20 4z"/></>,
    flame: <><path d="M12 22s-7-4-7-11a7 7 0 0 1 7-7 5 5 0 0 1 0 10 3 3 0 0 1 0-6"/></>,
    droplet: <><path d="M12 3l6 8a6 6 0 1 1-12 0z"/></>,
    moon: <><path d="M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10z"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/></>,
    download: <><path d="M12 3v12"/><polyline points="7 10 12 15 17 10"/><line x1="4" y1="20" x2="20" y2="20"/></>,
    share: <><circle cx="6" cy="12" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><line x1="9" y1="11" x2="15" y2="7"/><line x1="9" y1="13" x2="15" y2="17"/></>,
    edit: <><path d="M16 3l5 5-12 12H4v-5z"/></>,
    refresh: <><polyline points="20 8 20 14 14 14"/><path d="M5 19a8 8 0 0 0 14-3"/><polyline points="4 16 4 10 10 10"/><path d="M19 5a8 8 0 0 0-14 3"/></>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5"/><line x1="12" y1="17" x2="12" y2="17.01"/></>,
    cart: <><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M3 4h2l3 12h12l2-9H6"/></>,
    chefHat: <><path d="M6 18h12V12a4 4 0 1 0-3-7 4 4 0 0 0-6 0 4 4 0 1 0-3 7v6z"/><line x1="6" y1="22" x2="18" y2="22"/></>,
    activity: <><polyline points="3 12 7 12 10 4 14 20 17 12 21 12"/></>,
    info: <><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="8" x2="12" y2="8.01"/></>,
    smile: <><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9" y2="9.01"/><line x1="15" y1="9" x2="15" y2="9.01"/></>,
    frown: <><circle cx="12" cy="12" r="9"/><path d="M8 16s1.5-2 4-2 4 2 4 2"/><line x1="9" y1="9" x2="9" y2="9.01"/><line x1="15" y1="9" x2="15" y2="9.01"/></>,
    meh: <><circle cx="12" cy="12" r="9"/><line x1="8" y1="15" x2="16" y2="15"/><line x1="9" y1="9" x2="9" y2="9.01"/><line x1="15" y1="9" x2="15" y2="9.01"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.6" y1="4.6" x2="6.7" y2="6.7"/><line x1="17.3" y1="17.3" x2="19.4" y2="19.4"/><line x1="4.6" y1="19.4" x2="6.7" y2="17.3"/><line x1="17.3" y1="6.7" x2="19.4" y2="4.6"/></>,
    mic: <><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><line x1="12" y1="18" x2="12" y2="22"/></>,
    heart: <><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></>,
  };
  return <svg {...props}>{paths[name] || paths.help}</svg>;
}

window.Icon = Icon;
