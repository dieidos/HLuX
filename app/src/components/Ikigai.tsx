// L'Ikigai de l'Atlas, au singulier (écran 03) comme au pluriel (écran 09) : quatre cercles,
// leurs croisements nommés avec des mots, jamais des coordonnées.
// Disposition : lavande en haut à gauche, bleu en haut à droite, vert en bas à gauche, jaune en bas à droite.

import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import type { Circle, Crossing, Spot } from '../core/acts';
import { C, F } from '../design/theme';
import { Zone } from './Drag';

export const IKIGAI_SIZE = 440;
const R = 150;
const FAR = IKIGAI_SIZE - 2 * R;

export const CIRCLES: [Circle, string, number, number][] = [
  ['love', C.lavender, 0, 0], ['able', C.blue.value, FAR, 0], ['useful', C.green.value, 0, FAR], ['living', C.yellow.value, FAR, FAR],
];
export const CROSSINGS: [Crossing, number, number][] = [
  ['passion', IKIGAI_SIZE / 2, 70], ['mission', 70, IKIGAI_SIZE / 2], ['profession', IKIGAI_SIZE - 70, IKIGAI_SIZE / 2], ['vocation', IKIGAI_SIZE / 2, IKIGAI_SIZE - 70],
];

export function Ikigai({ label, at, onDrop, legend }: {
  label: (k: Circle | Crossing) => string;
  at: (spot: Spot) => ReactNode;
  onDrop: (item: string, spot: Spot, words: string) => void;
  legend?: boolean;
}) {
  return (
    <View style={st.row}>
      <View style={{ width: IKIGAI_SIZE, height: IKIGAI_SIZE }}>
        {CIRCLES.map(([c, color, x, y]) => (
          <Zone key={c} id={c} label={label(c)} onDrop={(id) => onDrop(id, { at: 'circle', which: c }, label(c))}
            style={{ ...st.circle, left: x, top: y, backgroundColor: color } as ViewStyle}>
            <View style={{ gap: 4 }}>{at({ at: 'circle', which: c })}</View>
          </Zone>
        ))}
        {CROSSINGS.map(([c, x, y]) => (
          <Zone key={c} id={c} label={label(c)} onDrop={(id) => onDrop(id, { at: 'crossing', which: c }, label(c))}
            style={{ ...st.crossing, left: x - 60, top: y - 22 } as ViewStyle}>
            <Text style={st.crossTxt}>{label(c).toUpperCase()}</Text>
            {at({ at: 'crossing', which: c })}
          </Zone>
        ))}
      </View>
      {legend !== false && (
        <View style={{ gap: 10 }}>
          {CIRCLES.map(([c]) => <Text key={c} style={st.legend}>{label(c)}</Text>)}
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', gap: 24, flexWrap: 'wrap', alignItems: 'center' },
  circle: { position: 'absolute', width: 2 * R, height: 2 * R, borderRadius: R, opacity: 0.8, borderWidth: 0, alignItems: 'center', justifyContent: 'center' },
  crossing: { position: 'absolute', width: 120, minHeight: 44, borderRadius: 12, alignItems: 'center', backgroundColor: C.veil.light, padding: 6 },
  crossTxt: { fontFamily: F.bold, fontSize: 12, letterSpacing: 1, color: C.ink },
  legend: { fontFamily: F.bold, fontSize: 16, color: C.ink, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: C.surface, overflow: 'hidden' },
});
