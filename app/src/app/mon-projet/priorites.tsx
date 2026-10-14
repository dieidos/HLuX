// 04 Priorités — volet A : je range les quatre axes (des ex æquo sont permis, « je ne sais pas encore »
// aussi) ; volet B : sur une ligne par axe, dans l'ordre des rangs, je situe mes idées de peu à
// beaucoup. Aucun chiffre : un ordre, et une phrase qui dit ce qui a bougé.

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../components/Chrome';
import { DragArea, Draggable, Zone } from '../../components/Drag';
import type { Circle, Rank } from '../../core/acts';
import { lineKey } from '../../core/project';
import { say, useWords } from '../../core/useAids';
import { useProject, useProjectState, useMe } from '../../core/useProject';
import { C, F, S } from '../../design/theme';
import type { WordKey } from '../../i18n/words';

const AXES: [Circle, WordKey, string][] = [
  ['love', 'love', '#cfafe7'], ['able', 'able', '#8faadc'], ['useful', 'useful', '#a9d18e'], ['living', 'living', '#ffd966'],
];
const RANKS: [Rank, WordKey][] = [['first', 'first'], ['then', 'then'], ['also', 'also'], ['less', 'less'], ['not_yet', 'notYet']];
const ORDER: Rank[] = ['first', 'then', 'also', 'less', 'not_yet'];

export default function Priorites() {
  const me = useMe();
  const w = useWords();
  const s = useProjectState();
  const act = useProject((x) => x.act);
  const [pane, setPane] = useState<'a' | 'b'>('a');
  const [open, setOpen] = useState<Circle | null>(null);
  const [live, setLive] = useState('');

  const ideas = Object.entries(s.ideas).filter(([, i]) => i.spot.at !== 'discarded');
  const rankOf = (a: Circle) => s.axisRanks[a];
  const ranked = [...AXES].sort((x, y) => ORDER.indexOf(rankOf(x[0]) ?? 'not_yet') - ORDER.indexOf(rankOf(y[0]) ?? 'not_yet'));

  const orderOn = (axis: Circle) => {
    const stored = s.lines[lineKey(axis, me.id)] ?? [];
    const ids = ideas.map(([id]) => id);
    return [...stored.filter((id) => ids.includes(id)), ...ids.filter((id) => !stored.includes(id))];
  };

  const move = (axis: Circle, id: string, dir: -1 | 1) => {
    const order = orderOn(axis);
    const i = order.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    act(me.id, { act: 'line_ordered', axis, author: me.id, order });
    const other = s.ideas[order[i]].title;
    const t = dir === 1 ? `« ${s.ideas[id].title} » passe devant ${other}.` : `« ${s.ideas[id].title} » se tient plus à gauche que ${other}.`;
    setLive(t);
    say(t);
  };

  return (
    <Screen side="pp" title="priorities" question={w('prioQuestion')}>
      <View style={st.tabs}>
        {(['a', 'b'] as const).map((p) => (
          <Pressable key={p} onPress={() => setPane(p)} style={[st.tab, pane === p && st.tabOn]} accessibilityRole="tab" accessibilityState={{ selected: pane === p }}>
            <Text style={[st.tabTxt, pane === p && { color: '#fff' }]}>{w(p === 'a' ? 'ranks' : 'lines')}</Text>
          </Pressable>
        ))}
      </View>

      {pane === 'a' ? (
        <DragArea>
          <View style={{ gap: 8 }}>
            {RANKS.map(([r, k]) => (
              <Zone key={r} id={r} label={w(k)} style={st.rankRow}
                onDrop={(axis) => {
                  act(me.id, { act: 'axis_ranked', axis: axis as Circle, rank: r });
                  say(`${w(AXES.find((a) => a[0] === axis)![1])} : ${w(k)}.`);
                }}>
                <Text style={st.rankLabel}>{w(k)}</Text>
                <View style={st.chips}>
                  {AXES.filter(([a]) => rankOf(a) === r).map(([a, ak, color]) => (
                    <Draggable key={a} id={a} label={w(ak)}><View style={[st.axis, { borderTopColor: color }]}><Text style={st.axisTxt}>{w(ak)}</Text></View></Draggable>
                  ))}
                </View>
              </Zone>
            ))}
            <View style={st.chips}>
              {AXES.filter(([a]) => !rankOf(a)).map(([a, ak, color]) => (
                <Draggable key={a} id={a} label={w(ak)}><View style={[st.axis, { borderTopColor: color }]}><Text style={st.axisTxt}>{w(ak)}</Text></View></Draggable>
              ))}
            </View>
            <Text style={st.small}>{w('shareRank')}</Text>
          </View>
        </DragArea>
      ) : (
        <ScrollView contentContainerStyle={{ gap: 10 }}>
          {ranked.map(([axis, k, color], idx) => {
            const r = rankOf(axis);
            const folded = (r === 'less' || r === 'not_yet' || !r) && open !== axis;
            return (
              <View key={axis} style={[st.line, idx === 0 && st.lineTop]}>
                <Pressable onPress={() => setOpen(open === axis ? null : axis)} style={st.lineHead} accessibilityRole="button">
                  <Text style={st.rankLabel}>{r ? w(RANKS.find((x) => x[0] === r)![1]) : '—'}</Text>
                  <Text style={st.axisTxt}>{w(k)}</Text>
                  {folded ? <Text style={st.small}>▾</Text> : null}
                </Pressable>
                {!folded && (
                  <View style={[st.track, { backgroundColor: color + '55' }]}>
                    <Text style={st.small}>{w('littleMuch')}</Text>
                    <View style={st.chips}>
                      {orderOn(axis).map((id, i, all) => (
                        <View key={id} style={st.idea}>
                          <Pressable accessibilityRole="button" onPress={() => move(axis, id, -1)} disabled={i === 0} accessibilityLabel={`${s.ideas[id].title} vers peu`} style={st.arrow}><Text style={st.arrowTxt}>◀</Text></Pressable>
                          <Text style={st.ideaTxt}>{s.ideas[id].title}</Text>
                          <Pressable accessibilityRole="button" onPress={() => move(axis, id, 1)} disabled={i === all.length - 1} accessibilityLabel={`${s.ideas[id].title} vers beaucoup`} style={st.arrow}><Text style={st.arrowTxt}>▶</Text></Pressable>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
          {live ? <Text style={st.live} accessibilityLiveRegion="polite">{live}</Text> : null}
        </ScrollView>
      )}
    </Screen>
  );
}

const st = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 16, borderRadius: S.radiusPill, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  tabOn: { backgroundColor: C.violetInk, borderColor: C.violetInk },
  tabTxt: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, backgroundColor: C.surface },
  rankLabel: { width: 150, fontFamily: F.bold, fontSize: 13, letterSpacing: 1, color: C.slate },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, flex: 1 },
  axis: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: C.surface, borderTopWidth: 4, borderWidth: 1, borderColor: C.line },
  axisTxt: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  small: { fontFamily: F.body, fontSize: 13, color: C.muted },
  line: { padding: 12, borderRadius: S.radius, backgroundColor: C.surface, gap: 8 },
  lineTop: { borderWidth: 2, borderColor: C.violet },
  lineHead: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: S.touch },
  track: { borderRadius: 12, padding: 10, gap: 6 },
  idea: { flexDirection: 'row', alignItems: 'center', borderRadius: S.radiusPill, backgroundColor: C.violetInk },
  ideaTxt: { fontFamily: F.bold, fontSize: 14, color: '#fff', paddingHorizontal: 4 },
  arrow: { minWidth: S.touch, minHeight: S.touch, alignItems: 'center', justifyContent: 'center' },
  arrowTxt: { color: '#fff', fontSize: 14 },
  live: { fontFamily: F.bold, fontSize: 16, color: C.ink, padding: 12, borderRadius: S.radius, backgroundColor: C.pp.soft },
});
