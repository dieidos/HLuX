// Le geste sur une ligne : glisser à l'horizontale, de « peu » vers « beaucoup ».
// - `SlideChip` (écran 04) : une idée glisse de plusieurs places d'un coup ; les flèches ◀ ▶ restent,
//   pour qui ne peut pas glisser (lecteur d'écran, motricité).
// - `LeanSlider` (page invité, écran 05) : trois positions — un peu, entre les deux, beaucoup — que l'on
//   touche ou vers lesquelles on glisse. Aucun chiffre n'est montré ni gardé : une position, pas une note.

import { useState, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { placesFor } from '../core/views';
import { C, F, S } from '../design/theme';

export function SlideChip({ children, step = 110, onShift }: { children: ReactNode; step?: number; onShift: (places: number) => void }) {
  const [x] = useState(() => new Animated.Value(0));
  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-12, 12])
    .failOffsetY([-14, 14])
    .onUpdate((e) => x.setValue(e.translationX))
    .onEnd((e) => {
      Animated.spring(x, { toValue: 0, useNativeDriver: false }).start();
      const n = placesFor(e.translationX, step);
      if (n) onShift(n);
    });
  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={{ transform: [{ translateX: x }] }}>{children}</Animated.View>
    </GestureDetector>
  );
}

export function LeanSlider<L extends string>({ options, value, onChange, rtl = false }: { options: [L, string][]; value: L | undefined; onChange: (l: L) => void; rtl?: boolean }) {
  const [width, setWidth] = useState(0);
  const pick = (absX: number) => {
    if (!width) return;
    const ratio = Math.min(0.999, Math.max(0, absX / width));
    const i = Math.floor((rtl ? 1 - ratio : ratio) * options.length);
    onChange(options[Math.min(options.length - 1, i)][0]);
  };
  const pan = Gesture.Pan().runOnJS(true).activeOffsetX([-8, 8]).onUpdate((e) => pick(e.x)).onEnd((e) => pick(e.x));
  return (
    <GestureDetector gesture={pan}>
      <View style={st.track} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} accessibilityRole="radiogroup">
        {options.map(([l, label]) => (
          <Pressable key={l} onPress={() => onChange(l)} style={[st.stop, value === l && st.stopOn]} accessibilityRole="radio" accessibilityState={{ checked: value === l }}>
            <Text style={[st.stopTxt, value === l && { color: C.onAccent }]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </GestureDetector>
  );
}

const st = StyleSheet.create({
  track: { flexDirection: 'row', gap: 6, padding: 4, borderRadius: S.radiusPill, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.line },
  stop: { flex: 1, minHeight: S.touch, alignItems: 'center', justifyContent: 'center', borderRadius: S.radiusPill },
  stopOn: { backgroundColor: C.violetInk },
  stopTxt: { fontFamily: F.bold, fontSize: 15, color: C.ink },
});
