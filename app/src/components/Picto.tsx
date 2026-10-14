import { SvgXml } from 'react-native-svg';

import { PICTOS, type PictoKey } from '../design/pictos';

/** Un picto de l'Atlas : deux aplats de couleur et un tracé blanc cerné. */
export function Picto({ name, size = 56, label = true }: { name: string; size?: number; label?: boolean }) {
  const p = PICTOS[name as PictoKey];
  if (!p) return null;
  const caption = label
    ? `<text x="50" y="91" text-anchor="middle" font-family="SourceSans3,sans-serif" font-weight="700" font-size="17" fill="#fff" stroke="#3d4555" stroke-width="5" stroke-linejoin="round" paint-order="stroke">${p.fr}</text>`
    : '';
  const xml = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><clipPath id="c"><rect width="100" height="100" rx="14"/></clipPath></defs>
    <g clip-path="url(#c)"><rect width="100" height="100" fill="${p.a}"/><path d="M58 0H100V100H38z" fill="${p.b}"/></g>
    <g fill="#fff" stroke="#3d4555" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round" transform="translate(9,1) scale(.82)">${p.g}</g>
    ${caption}</svg>`;
  return <SvgXml xml={xml} width={size} height={size} accessibilityLabel={p.fr} />;
}
