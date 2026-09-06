// icons.jsx — monoline SVG icon set. Exports Icon components to window.
// All use currentColor + strokeWidth ~1.6 for a consistent monoline feel.

const Ic = (props) => ({
  width: props.size || 18, height: props.size || 18,
  viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: props.sw || 1.7,
  strokeLinecap: 'round', strokeLinejoin: 'round',
  style: props.style,
});

const IconChevron = (p) => ( // points right; rotate via style for down
  <svg {...Ic(p)}><path d="M9 6l6 6-6 6" /></svg>
);
const IconArrowLeft = (p) => (<svg {...Ic(p)}><path d="M15 5l-7 7 7 7" /></svg>);
const IconArrowRight = (p) => (<svg {...Ic(p)}><path d="M9 5l7 7-7 7" /></svg>);
const IconPlus = (p) => (<svg {...Ic(p)}><path d="M12 5v14M5 12h14" /></svg>);
const IconMinus = (p) => (<svg {...Ic(p)}><path d="M5 12h14" /></svg>);
const IconClose = (p) => (<svg {...Ic(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>);
const IconCheck = (p) => (<svg {...Ic(p)}><path d="M5 12.5l4.5 4.5L19 7" /></svg>);
const IconReset = (p) => (
  <svg {...Ic(p)}><path d="M4 12a8 8 0 1 0 2.5-5.8" /><path d="M4 4v3.5h3.5" /></svg>
);
const IconCalendar = (p) => (
  <svg {...Ic(p)}><rect x="4" y="5" width="16" height="16" rx="2.5" /><path d="M4 9h16M8 3v4M16 3v4" /></svg>
);
const IconPencil = (p) => (
  <svg {...Ic(p)}><path d="M16.5 4.5l3 3L8 19l-4 1 1-4 11.5-11.5z" /></svg>
);
const IconTrash = (p) => (
  <svg {...Ic(p)}><path d="M5 7h14M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>
);
const IconGrip = (p) => (<svg {...Ic(p)}><path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" /></svg>);
const IconMenu = (p) => (<svg {...Ic(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>);
const IconList = (p) => (<svg {...Ic(p)}><path d="M8 6h12M8 12h12M8 18h12M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></svg>);
const IconInbox = (p) => (<svg {...Ic(p)}><path d="M3 13l2.5-7.5A2 2 0 017.4 4h9.2a2 2 0 011.9 1.5L21 13v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5z" /><path d="M3 13h5l1.5 2.5h5L16 13h5" /></svg>);
const IconLayers = (p) => (<svg {...Ic(p)}><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3.5 12L12 17l8.5-5M3.5 16L12 21l8.5-5" /></svg>);
const IconClock = (p) => (<svg {...Ic(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>);
const IconCaretUp = (p) => (<svg {...Ic(p)}><path d="M6 15l6-6 6 6" /></svg>);
const IconCaretDown = (p) => (<svg {...Ic(p)}><path d="M6 9l6 6 6-6" /></svg>);

// geometric decorative empty-state marks (monoline)
const MarkTasks = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none"
       stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="12" y="10" width="40" height="44" rx="6" />
    <path d="M20 22h24M20 32h24M20 42h14" opacity="0.45" />
    <circle cx="46" cy="44" r="9" fill="var(--bg)" />
    <path d="M42 44l3 3 5-6" stroke="var(--accent)" />
  </svg>
);
const MarkProjects = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none"
       stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="10" y="16" width="44" height="34" rx="6" />
    <path d="M10 24h44" opacity="0.45" />
    <circle cx="32" cy="38" r="8" stroke="var(--accent)" />
    <path d="M32 34v8M28 38h8" stroke="var(--accent)" />
  </svg>
);
const MarkGroups = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none"
       stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="14" width="34" height="26" rx="5" opacity="0.45" />
    <rect x="18" y="22" width="34" height="26" rx="5" fill="var(--bg)" />
    <path d="M25 35h20" stroke="var(--accent)" />
  </svg>
);

Object.assign(window, {
  IconChevron, IconArrowLeft, IconArrowRight, IconPlus, IconMinus, IconClose,
  IconCheck, IconReset, IconCalendar, IconPencil, IconTrash, IconCaretUp, IconCaretDown, IconGrip, IconMenu,
  IconList, IconInbox, IconLayers, IconClock,
  MarkTasks, MarkProjects, MarkGroups,
});
