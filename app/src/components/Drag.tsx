// Le geste unique de l'Atlas : prendre → poser.
// Au prendre, la carte se soulève et les zones où la poser s'éclairent ; au poser, la zone reçoit.
// Aussi au toucher simple : toucher une carte la « prend », toucher une zone la « pose »
// (accessibilité, lecteurs d'écran, et contrôle fin sur tablette).

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useT } from '../core/useAids';
import { reduceMotionNow } from '../design/motion';
import { C } from '../design/theme';

type Rect = { x: number; y: number; w: number; h: number };
interface Ctx {
  held: string | null;
  hover: string | null;
  take: (id: string) => void;
  move: (x: number, y: number) => void;
  drop: (x?: number, y?: number) => void;
  register: (zone: string, r: Rect, onDrop: (item: string) => void, accepts?: (item: string) => boolean) => void;
  placeHeld: (zone: string) => void;
}

const DragCtx = createContext<Ctx | null>(null);
const useDrag = () => useContext(DragCtx)!;

export function DragArea({ children }: { children: ReactNode }) {
  const [held, setHeld] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const zones = useRef(new Map<string, { r: Rect; onDrop: (item: string) => void; accepts?: (item: string) => boolean }>());
  const heldRef = useRef<string | null>(null);

  // La plus petite zone sous le doigt l'emporte : un croisement de l'Ikigai passe avant son cercle.
  const hit = (x: number, y: number) => {
    let best: string | null = null;
    let area = Infinity;
    const item = heldRef.current;
    for (const [id, z] of zones.current) {
      if (item && z.accepts && !z.accepts(item)) continue; // une zone qui ne reçoit pas cette carte ne compte pas
      if (x >= z.r.x && x <= z.r.x + z.r.w && y >= z.r.y && y <= z.r.y + z.r.h && z.r.w * z.r.h < area) {
        best = id;
        area = z.r.w * z.r.h;
      }
    }
    return best;
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
    register: (zone, r, onDrop, accepts) => zones.current.set(zone, { r, onDrop, accepts }),
    placeHeld: (zone) => {
      const item = heldRef.current;
      if (item) zones.current.get(zone)?.onDrop(item);
      heldRef.current = null;
      setHeld(null);
    },
  };
  return <DragCtx.Provider value={value}>{children}</DragCtx.Provider>;
}

/** Une zone de dépôt : elle s'éclaire dès qu'une carte est prise.
 *  Au toucher : quand une carte est prise, un bouton « Poser ici » apparaît dans la zone
 *  (pas de bouton autour des cartes : elles restent elles-mêmes touchables). */
export function Zone({ id, onDrop, style, children, label, accepts }: { id: string; onDrop: (item: string) => void; style?: ViewStyle; children: ReactNode; label: string; accepts?: (item: string) => boolean }) {
  const d = useDrag();
  const t = useT();
  const ref = useRef<View>(null);
  const measure = useCallback(() => {
    ref.current?.measureInWindow((x, y, w, h) => d.register(id, { x, y, w, h }, onDrop, accepts));
  }, [d, id, onDrop, accepts]);
  // Seules les zones qui peuvent recevoir la carte prise s'éclairent.
  const lit = d.held !== null && (accepts ? accepts(d.held) : true);
  // Re-mesurer au moment du prendre : la mise en page a pu bouger depuis.
  useEffect(() => { if (lit) measure(); }, [lit, measure]);
  return (
    <View ref={ref} onLayout={measure} accessibilityLabel={label} style={[st.zone, style, lit && st.zoneLit, d.hover === id && st.zoneHover]}>
      {children}
      {lit && (
        <Pressable onPress={() => d.placeHeld(id)} accessibilityRole="button" accessibilityLabel={t(`Poser ici : ${label}`, `ضعيها هنا: ${label}`)} style={st.here}>
          <Text style={st.hereTxt}>{t('⤓ Poser ici', '⤓ ضعيها هنا', '⤓ Ici')}</Text>
        </Pressable>
      )}
    </View>
  );
}

/** Une carte que l'on prend et que l'on pose. */
export function Draggable({ id, children, label }: { id: string; children: ReactNode; label: string }) {
  const d = useDrag();
  const [pos] = useState(() => new Animated.ValueXY()); // valeur animée stable, sans ref lue au rendu
  // La traînée et le point de contact : d'où part la carte, où est le doigt (Atlas, écran 02).
  const [trail, setTrail] = useState<{ x: number; y: number; dx: number; dy: number } | null>(null);
  const pan = Gesture.Pan()
    .runOnJS(true)
    .onStart((e) => {
      d.take(id);
      setTrail({ x: e.x, y: e.y, dx: 0, dy: 0 });
    })
    .onUpdate((e) => {
      pos.setValue({ x: e.translationX, y: e.translationY });
      d.move(e.absoluteX, e.absoluteY);
      setTrail((t) => (t ? { ...t, dx: e.translationX, dy: e.translationY } : t));
    })
    .onEnd((e) => {
      d.drop(e.absoluteX, e.absoluteY);
      setTrail(null);
      if (reduceMotionNow()) pos.setValue({ x: 0, y: 0 });
      else Animated.spring(pos, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    });
  const held = d.held === id;
  const len = trail ? Math.hypot(trail.dx, trail.dy) : 0;
  return (
    <GestureDetector gesture={pan}>
      <View>
        {trail && len > 4 ? (
          <View
            pointerEvents="none"
            style={[st.trail, { left: trail.x, top: trail.y, width: len, transform: [{ rotate: `${Math.atan2(trail.dy, trail.dx)}rad` }] }]}
          />
        ) : null}
        <Animated.View style={[{ transform: pos.getTranslateTransform() }, held && st.lifted]}>
          <Pressable onPress={() => (held ? d.drop() : d.take(id))} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: held }}>
            {children}
          </Pressable>
          {trail ? <View pointerEvents="none" style={[st.contact, { left: trail.x - 14, top: trail.y - 14 }]} /> : null}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const st = StyleSheet.create({
  zone: { borderRadius: 18, borderWidth: 2, borderStyle: 'dashed', borderColor: C.line, padding: 14 },
  zoneLit: { borderColor: C.violet, backgroundColor: C.violetSoft },
  zoneHover: { borderStyle: 'solid', backgroundColor: C.violetHover },
  here: { alignSelf: 'flex-start', marginTop: 8, minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 999, backgroundColor: C.violetInk },
  hereTxt: { color: C.onAccent, fontFamily: 'SourceSans3Bold', fontSize: 15 },
  // La traînée part du point de départ et tourne vers le doigt (origine de rotation : son bord gauche).
  trail: { position: 'absolute', height: 4, borderRadius: 2, backgroundColor: C.violet, opacity: 0.45, transformOrigin: 'left center' },
  contact: { position: 'absolute', width: 28, height: 28, borderRadius: 14, borderWidth: 3, borderColor: C.violet, backgroundColor: C.violetSoft, opacity: 0.85 },
  lifted: { zIndex: 10, shadowColor: C.shadow, shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
});
