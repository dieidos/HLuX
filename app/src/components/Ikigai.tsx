// L'Ikigai de l'Atlas, au singulier (écran 03) comme au pluriel (écran 09) : quatre cercles,
// leurs croisements nommés avec des mots, jamais des coordonnées.
// Disposition : lavande en haut à gauche, bleu en haut à droite, vert en bas à gauche, jaune en bas à droite.

import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import type { Circle, Crossing, Spot } from '../core/acts';
import { useLayout } from '../design/layout';
import { C, F } from '../design/theme';
import { Zone } from './Drag';

/** La taille de l'Atlas ; sur un écran plus étroit, l'Ikigai se réduit en gardant ses proportions. */
export const IKIGAI_SIZE = 440;

function geometry(size: number) {
  const k = size / IKIGAI_SIZE;
  const R = 150 * k;
  const FAR = size - 2 * R;
  const edge = 70 * k;
  const circles: [Circle, string, number, number][] = [
    ['love', C.lavender, 0, 0], ['able', C.blue.value, FAR, 0], ['useful', C.green.value, 0, FAR], ['living', C.yellow.value, FAR, FAR],
  ];
  const crossings: [Crossing, number, number][] = [
    ['passion', size / 2, edge], ['mission', edge, size / 2], ['profession', size - edge, size / 2], ['vocation', size / 2, size - edge],
  ];
  return { R, circles, crossings, box: Math.max(84, 120 * k) };
}

export function Ikigai({ label, at, onDrop, legend }: {
  label: (k: Circle | Crossing) => string;
  at: (spot: Spot) => ReactNode;
  onDrop: (item: string, spot: Spot, words: string) => void;
  legend?: boolean;
}) {
  const { width } = useLayout();
  const size = Math.min(IKIGAI_SIZE, width - 40);
  const { R, circles, crossings, box } = geometry(size);
  return (
    <View style={st.row}>
      <View style={{ width: size, height: size }}>
        {circles.map(([c, color, x, y]) => (
          <Zone key={c} id={c} label={label(c)} onDrop={(id) => onDrop(id, { at: 'circle', which: c }, label(c))}
            style={{ ...st.circle, width: 2 * R, height: 2 * R, borderRadius: R, left: x, top: y, backgroundColor: color } as ViewStyle}>
            <View style={{ gap: 4 }}>{at({ at: 'circle', which: c })}</View>
          </Zone>
        ))}
        {crossings.map(([c, x, y]) => (
          <Zone key={c} id={c} label={label(c)} onDrop={(id) => onDrop(id, { at: 'crossing', which: c }, label(c))}
            style={{ ...st.crossing, width: box, left: x - box / 2, top: y - 22 } as ViewStyle}>
            <Text style={st.crossTxt}>{label(c).toUpperCase()}</Text>
            {at({ at: 'crossing', which: c })}
          </Zone>
        ))}
      </View>
      {legend !== false && (
        <View style={{ gap: 10 }}>
          {circles.map(([c]) => <Text key={c} style={st.legend}>{label(c)}</Text>)}
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', gap: 24, flexWrap: 'wrap', alignItems: 'center' },
  circle: { position: 'absolute', opacity: 0.8, borderWidth: 0, alignItems: 'center', justifyContent: 'center' },
  crossing: { position: 'absolute', minHeight: 44, borderRadius: 12, alignItems: 'center', backgroundColor: C.veil.light, padding: 6 },
  crossTxt: { fontFamily: F.bold, fontSize: 12, letterSpacing: 1, color: C.ink },
  legend: { fontFamily: F.bold, fontSize: 16, color: C.ink, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: C.surface, overflow: 'hidden' },
});
