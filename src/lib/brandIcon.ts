/** Global-In 아이콘 H2(탑승권 모양 입국 도장) SVG. rx=0이면 사각 배경(iOS가 모서리를 직접 둥글게 깎는다). */
export function brandIconSvg(rx = 112): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><mask id="n"><rect width="512" height="512" fill="#fff"/><circle cx="330" cy="164" r="26" fill="#000"/><circle cx="330" cy="348" r="26" fill="#000"/></mask></defs><rect width="512" height="512" rx="${rx}" fill="#FFE14D"/><g transform="rotate(-10 256 256)"><rect x="88" y="164" width="336" height="184" rx="26" fill="none" stroke="#C42B1C" stroke-width="20" mask="url(#n)"/><path d="M304 164 A26 26 0 0 0 356 164 M304 348 A26 26 0 0 1 356 348" fill="none" stroke="#C42B1C" stroke-width="20"/><line x1="330" y1="202" x2="330" y2="310" stroke="#C42B1C" stroke-width="8" stroke-dasharray="14 12"/><rect x="146" y="208" width="34" height="96" fill="#C42B1C"/><path d="M196 304 V208 H232 L254 262 V208 H286 V304 H252 L230 250 V304 Z" fill="#C42B1C"/><path d="M354 256 H396 M380 238 L398 256 L380 274" fill="none" stroke="#C42B1C" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`;
}

export function brandIconDataUri(rx = 112): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(brandIconSvg(rx))}`;
}
