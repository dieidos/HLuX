// Le geste unique de l'Atlas : prendre → poser.
// Au prendre, la carte se soulève et les zones où la poser s'éclairent ; au poser, la zone reçoit.
// Aussi au toucher simple : toucher une carte la « prend », toucher une zone la « pose »
// (accessibilité, lecteurs d'écran, et contrôle fin sur tablette).

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { C } from '../design/theme';

type Rect = { x: number; y: number; w: number; h: number };
interface Ctx {
  held: string | null;
  hover: string | null;
  take: (id: string) => void;
  move: (x: number, y: number) => void;
  drop: (x?: number, y?: number) => void;
  register: (zone: string, r: Rect, onDrop: (item: string) => void) => void;
  placeHeld: (zone: string) => void;
}

const DragCtx = createContext<Ctx | null>(null);
const useDrag = () => useContext(DragCtx)!;

export function DragArea({ children }: { children: ReactNode }) {
  const [held, setHeld] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const zones = useRef(new Map<string, { r: Rect; onDrop: (item: string) => void }>());
  const heldRef = useRef<string | null>(null);

  const hit = (x: number, y: number) => {
    for (const [id, z] of zones.current) {
      if (x >= z.r.x && x <= z.r.x + z.r.w && y >= z.r.y && y <= z.r.y + z.r.h) return id;
    }
    return null;
  };
  const value: Ctx = {
    held,
    hover,
    take: (id) => { heldRef.current = id; setHeld(id); },
    move: (x, y) => setHover(hit(x, y)),
    drop: (x, y) => {
      const z = x !== undefined && y !== undefined ? hit(x, y) : null;
      const item = heldRef.current;
      if (z && item) zones.current.get(z)!.onDrop(item);
      heldRef.current = null;
      setHeld(null);
      setHover(null);
    },
    register: (zone, r, onDrop) => zones.current.set(zone, { r, onDrop }),
    placeHeld: (zone) => {
      const item = heldRef.current;
      if (item) zones.current.get(zone)?.onDrop(item);
      heldRef.current = null;
      setHeld(null);
    },
  };
  return <DragCtx.Provider value={value}>{children}</DragCtx.Provider>;
}

/** Une zone de dépôt : elle s'éclaire dès qu'une carte est prise. */
export function Zone({ id, onDrop, style, children, label }: { id: string; onDrop: (item: string) => void; style?: ViewStyle; children: ReactNode; label: string }) {
  const d = useDrag();
  const ref = useRef<View>(null);
  const measure = useCallback(() => {
    ref.current?.measureInWindow((x, y, w, h) => d.register(id, { x, y, w, h }, onDrop));
  }, [d, id, onDrop]);
  const lit = d.held !== null;
  return (
    <Pressable
      ref={ref}
      onLayout={measure}
      onPressIn={measure}
      onPress={() => d.held && d.placeHeld(id)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[st.zone, style, lit && st.zoneLit, d.hover === id && st.zoneHover]}
    >
      {children}
    </Pressable>
  );
}

/** Une carte que l'on prend et que l'on pose. */
export function Draggable({ id, children, label }: { id: string; children: ReactNode; label: string }) {
  const d = useDrag();
  const pos = useRef(new Animated.ValueXY()).current;
  const pan = Gesture.Pan()
    .runOnJS(true)
    .onStart(() => d.take(id))
    .onUpdate((e) => {
      pos.setValue({ x: e.translationX, y: e.translationY });
      d.move(e.absoluteX, e.absoluteY);
    })
    .onEnd((e) => {
      d.drop(e.absoluteX, e.absoluteY);
      Animated.spring(pos, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    });
  const held = d.held === id;
  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[{ transform: pos.getTranslateTransform() }, held && st.lifted]}>
        <Pressable onPress={() => (held ? d.drop() : d.take(id))} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: held }}>
          {children}
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

const st = StyleSheet.create({
  zone: { borderRadius: 18, borderWidth: 2, borderStyle: 'dashed', borderColor: C.line, padding: 14 },
  zoneLit: { borderColor: C.violet, backgroundColor: '#f6effb' },
  zoneHover: { borderStyle: 'solid', backgroundColor: '#efe4f8' },
  lifted: { zIndex: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
});
