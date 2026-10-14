// La grammaire du Chemin (écran 06, et au pluriel écran 12) : couloirs nommés, le temps de gauche
// à droite, ◆ une décision, ● un événement ; lien choisi, alternative ouverte (jamais grise),
// condition écrite sur sa branche, dépendance tracée. Au repos, seul le chemin choisi se montre.

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import type { LinkKind, NodeKind } from '../core/acts';
import { C, F } from '../design/theme';

export interface PNode { id: string; lane: string; kind: NodeKind; label: string; when: string; thread?: boolean }
export interface PLink { from: string; to: string; link: LinkKind }

const LANE_H = 86;
const HEAD_W = 110;

export function PathView({ columns, lanes, nodes, links, showOthers, dashed = false }: {
  columns: string[]; lanes: string[]; nodes: PNode[]; links: PLink[]; showOthers: boolean; dashed?: boolean;
}) {
  const [width, setWidth] = useState(800);
  const colW = (width - HEAD_W) / columns.length;
  const shown = new Set<string>();
  // Au repos : les nœuds reliés par le chemin choisi (et les nœuds isolés).
  links.filter((l) => l.link.kind === 'chosen').forEach((l) => { shown.add(l.from); shown.add(l.to); });
  nodes.filter((n) => !links.some((l) => l.from === n.id || l.to === n.id)).forEach((n) => shown.add(n.id));
  const visible = nodes.filter((n) => showOthers || shown.has(n.id));
  const visLinks = links.filter((l) => showOthers || l.link.kind === 'chosen');

  // Position : colonne = moment, ligne = couloir, décalage si plusieurs nœuds au même endroit.
  const pos = new Map<string, { x: number; y: number }>();
  const seen = new Map<string, number>();
  for (const n of visible) {
    const c = Math.max(0, columns.indexOf(n.when));
    const r = Math.max(0, lanes.indexOf(n.lane));
    const k = `${c}/${r}`;
    const nth = seen.get(k) ?? 0;
    seen.set(k, nth + 1);
    pos.set(n.id, { x: HEAD_W + c * colW + 30 + nth * (colW / 2), y: 40 + r * LANE_H + LANE_H / 2 });
  }
  const height = 40 + lanes.length * LANE_H;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={[st.frame, dashed && st.dashed, { height }]}>
      {columns.map((c, i) => (
        <Text key={c} style={[st.col, { left: HEAD_W + i * colW + 8 }]}>{c.toUpperCase()}</Text>
      ))}
      {lanes.map((l, i) => (
        <Text key={l} style={[st.lane, { top: 40 + i * LANE_H + LANE_H / 2 - 9 }]}>{l}</Text>
      ))}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {visLinks.map((l) => {
          const a = pos.get(l.from);
          const b = pos.get(l.to);
          if (!a || !b) return null;
          const k = l.link.kind;
          return (
            <Line key={`${l.from}>${l.to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={k === 'chosen' ? C.violet : k === 'open' ? '#8faadc' : k === 'condition' ? '#e0a84f' : C.slate}
              strokeWidth={k === 'dependency' ? 2 : 4} strokeDasharray={k === 'condition' ? '8 6' : k === 'dependency' ? '2 6' : undefined} strokeLinecap="round" />
          );
        })}
      </Svg>
      {visLinks.filter((l) => l.link.kind === 'condition' || l.link.kind === 'dependency').map((l) => {
        const a = pos.get(l.from);
        const b = pos.get(l.to);
        if (!a || !b || !('words' in l.link)) return null;
        return <Text key={`w-${l.from}>${l.to}`} style={[st.callout, { left: (a.x + b.x) / 2 - 80, top: (a.y + b.y) / 2 - 22 }]}>{l.link.words}</Text>;
      })}
      {visible.map((n) => {
        const p = pos.get(n.id)!;
        return (
          <View key={n.id} style={[st.node, { left: p.x - 12, top: p.y - 12 }]} accessibilityLabel={`${n.kind === 'decision' ? 'Décision' : 'Événement'} : ${n.label}, ${n.when}`}>
            <Text style={[st.glyph, n.kind === 'decision' ? st.diamond : st.dot, n.thread && st.thread]}>{n.kind === 'decision' ? '◆' : '●'}</Text>
            <Text style={st.label} numberOfLines={2}>{n.label}</Text>
          </View>
        );
      })}
      {showOthers && (
        <View style={st.legend}>
          <Text style={st.legendTxt}>━ chemin choisi · <Text style={{ color: '#5f78a8' }}>━ alternative ouverte</Text> · <Text style={{ color: '#b07a1f' }}>┅ condition</Text> · ⋯ dépend de · ◆ décision · ● événement</Text>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  frame: { position: 'relative', borderRadius: 16, backgroundColor: C.surface, overflow: 'hidden' },
  dashed: { borderWidth: 2, borderStyle: 'dashed', borderColor: C.violet },
  col: { position: 'absolute', top: 10, fontFamily: F.bold, fontSize: 12, letterSpacing: 1, color: C.slate },
  lane: { position: 'absolute', left: 12, fontFamily: F.bold, fontSize: 13, color: C.slate },
  node: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: 190 },
  glyph: { fontSize: 22, lineHeight: 24 },
  diamond: { color: C.violetInk },
  dot: { color: '#3f5a90' },
  thread: { textShadowColor: '#ffd966', textShadowRadius: 8 },
  label: { fontFamily: F.bold, fontSize: 12, color: C.ink, backgroundColor: 'rgba(255,255,255,.85)', paddingHorizontal: 4, borderRadius: 4, flexShrink: 1 },
  callout: { position: 'absolute', width: 160, fontFamily: F.body, fontSize: 11, color: '#7a5418', backgroundColor: '#fff6e0', padding: 4, borderRadius: 6, textAlign: 'center' },
  legend: { position: 'absolute', bottom: 6, left: 12, right: 12 },
  legendTxt: { fontFamily: F.body, fontSize: 12, color: C.slate },
});
