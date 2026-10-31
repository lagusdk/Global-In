type P = { size?: number; color?: string; width?: number };

const base = (size: number, color: string, width: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: color,
  strokeWidth: width,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const IconBack = ({ size = 22, color = "currentColor", width = 1.8 }: P) => (
  <svg {...base(size, color, width)}><path d="m15 5-7 7 7 7" /></svg>
);
export const IconChevron = ({ size = 18, color = "currentColor", width = 1.8 }: P) => (
  <svg {...base(size, color, width)}><path d="m9 6 6 6-6 6" /></svg>
);
export const IconDown = ({ size = 18, color = "currentColor", width = 1.8 }: P) => (
  <svg {...base(size, color, width)}><path d="m6 9 6 6 6-6" /></svg>
);
export const IconExternal = ({ size = 16, color = "currentColor", width = 1.8 }: P) => (
  <svg {...base(size, color, width)}><path d="M7 17 17 7M8 7h9v9" /></svg>
);
export const IconCamera = ({ size = 20, color = "currentColor", width = 1.8 }: P) => (
  <svg {...base(size, color, width)}><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13.5" r="3.5" /></svg>
);
export const IconHome = ({ size = 22, color = "currentColor", width = 1.8 }: P) => (
  <svg {...base(size, color, width)}><path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>
);
export const IconDoc = ({ size = 22, color = "currentColor", width = 1.6 }: P) => (
  <svg {...base(size, color, width)}><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></svg>
);
export const IconReceipt = ({ size = 22, color = "currentColor", width = 1.6 }: P) => (
  <svg {...base(size, color, width)}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></svg>
);
export const IconChat = ({ size = 22, color = "currentColor", width = 1.6 }: P) => (
  <svg {...base(size, color, width)}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></svg>
);
export const IconBell = ({ size = 22, color = "currentColor", width = 1.6 }: P) => (
  <svg {...base(size, color, width)}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10.3 20a2 2 0 0 0 3.4 0" /></svg>
);
export const IconCheck = ({ size = 18, color = "currentColor", width = 2.2 }: P) => (
  <svg {...base(size, color, width)}><path d="m5 12 5 5 9-10" /></svg>
);
export const IconArrowRight = ({ size = 22, color = "currentColor", width = 1.8 }: P) => (
  <svg {...base(size, color, width)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const IconSend = ({ size = 20, color = "currentColor", width = 2 }: P) => (
  <svg {...base(size, color, width)}><path d="M12 19V5M5 12l7-7 7 7" /></svg>
);
export const IconUpload = ({ size = 20, color = "currentColor", width = 1.8 }: P) => (
  <svg {...base(size, color, width)}><path d="M12 16V4M6 10l6-6 6 6M4 20h16" /></svg>
);
export const IconPaste = ({ size = 20, color = "currentColor", width = 1.8 }: P) => (
  <svg {...base(size, color, width)}><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4V3h6v1M9 10h6M9 14h6" /></svg>
);
export const IconLock = ({ size = 18, color = "currentColor", width = 1.6 }: P) => (
  <svg {...base(size, color, width)}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
);
export const IconCopy = ({ size = 18, color = "currentColor", width = 1.8 }: P) => (
  <svg {...base(size, color, width)}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a1 1 0 0 1 1-1h10" /></svg>
);
