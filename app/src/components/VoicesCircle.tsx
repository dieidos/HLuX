// « Une orientation, cinq regards » (écran 10) : l'orientation au centre, chaque voix autour.
// On voit qui a placé, jamais où. Toucher une voix qui n'a pas encore placé lui ouvre le placement privé.

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { C, F, S } from '../design/theme';

export function VoicesCircle({ title, voices, placed, current, onPick }: {
  title: string;
  voices: string[];
  placed: string[];
  current: string | null;
  onPick: (v: string) => void;
}) {
  const [w, setW] = useState(520);
  const size = Math.min(w, 520);
  const r = size / 2 - 64;
  return (
    <View style={st.wrap} onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}>
      <View style={[st.ring, { width: size, height: size }]}>
        <View style={[st.center, { left: size / 2 - 90, top: size / 2 - 40 }]}>
          <Text style={st.title} numberOfLines={3}>🧭 {title}</Text>
        </View>
        {voices.map((v, i) => {
          const a = (2 * Math.PI * i) / voices.length - Math.PI / 2;
          const done = placed.includes(v);
          return (
            <Pressable
              key={v}
              onPress={() => onPick(v)}
              accessibilityRole="button"
              accessibilityLabel={`${v} : ${done ? 'a placé — toucher pour reprendre' : current === v ? 'en cours' : 'à venir'}`}
              style={[st.voice, done && st.done, current === v && st.now, { left: size / 2 + r * Math.cos(a) - 56, top: size / 2 + r * Math.sin(a) - 28 }]}>
              <Text style={st.name}>{v}</Text>
              <Text style={st.small}>{done ? '✓ a placé' : current === v ? '✏️ en cours' : '⏳ à venir'}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { alignSelf: 'stretch', alignItems: 'center' },
  ring: { position: 'relative', borderRadius: 999, borderWidth: 2, borderStyle: 'dashed', borderColor: C.line },
  center: { position: 'absolute', width: 180, height: 80, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: F.bold, fontSize: 15, color: C.ink, textAlign: 'center' },
  voice: { position: 'absolute', width: 112, minHeight: S.touch + 12, alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 14, backgroundColor: C.surface, borderWidth: 2, borderColor: C.line },
  done: { backgroundColor: C.pe.soft, borderColor: C.pe.value },
  now: { borderColor: C.violet, backgroundColor: C.violetSoft },
  name: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  small: { fontFamily: F.body, fontSize: 12, color: C.muted },
});
