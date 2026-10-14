// Mon plan, en quatre cases et dans ses mots (écran 06) : on ajoute une ligne, on en retire une.
// « Ça attend » dit quoi, et ce que ça attend. Aucune échéance qui menace : des mots, pas des dates imposées.

import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { Plan } from '../core/acts';
import { C, F, S } from '../design/theme';

type Box = 'first' | 'waiting' | 'with_whom' | 'open';

export function PlanEditor({ plan, titles, onChange }: { plan: Plan; titles: Record<Box, string>; onChange: (p: Plan) => void }) {
  const [draft, setDraft] = useState<Record<Box, string>>({ first: '', waiting: '', with_whom: '', open: '' });
  const [waitFor, setWaitFor] = useState('');

  const add = (b: Box) => {
    const t = draft[b].trim();
    if (!t) return;
    if (b === 'waiting') {
      if (!waitFor.trim()) return;
      onChange({ ...plan, waiting: [...plan.waiting, [t, waitFor.trim()]] });
      setWaitFor('');
    } else onChange({ ...plan, [b]: [...plan[b], t] });
    setDraft({ ...draft, [b]: '' });
  };
  const remove = (b: Box, i: number) => onChange({ ...plan, [b]: (plan[b] as unknown[]).filter((_, k) => k !== i) } as Plan);

  const items = (b: Box): string[] => (b === 'waiting' ? plan.waiting.map(([a, w]) => `${a} · attend ${w}`) : plan[b]);

  return (
    <View style={st.grid}>
      {(['first', 'waiting', 'with_whom', 'open'] as Box[]).map((b) => (
        <View key={b} style={st.tile}>
          <Text style={st.title}>{titles[b]}</Text>
          {items(b).map((t, i) => (
            <View key={`${t}-${i}`} style={st.item}>
              <Text style={st.itemTxt}>{t}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={`Retirer « ${t} »`} onPress={() => remove(b, i)} style={st.x}>
                <Text style={st.xTxt}>✕</Text>
              </Pressable>
            </View>
          ))}
          <TextInput value={draft[b]} onChangeText={(v) => setDraft({ ...draft, [b]: v })} placeholder="Ajouter, dans mes mots…" style={st.input} accessibilityLabel={`Ajouter à ${titles[b]}`} />
          {b === 'waiting' && <TextInput value={waitFor} onChangeText={setWaitFor} placeholder="…ça attend quoi ?" style={st.input} accessibilityLabel="Ça attend quoi" />}
          <Pressable accessibilityRole="button" onPress={() => add(b)} style={st.add}>
            <Text style={st.addTxt}>＋</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { flexGrow: 1, flexBasis: 220, padding: 14, borderRadius: S.radius, backgroundColor: C.surface, gap: 6 },
  title: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemTxt: { flex: 1, fontFamily: F.body, fontSize: 15, color: C.text },
  x: { minWidth: S.touch, minHeight: S.touch, alignItems: 'center', justifyContent: 'center' },
  xTxt: { fontFamily: F.bold, fontSize: 14, color: C.muted },
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 10, padding: 8, fontFamily: F.body, fontSize: 15, color: C.ink },
  add: { alignSelf: 'flex-start', minWidth: S.touch, minHeight: S.touch, alignItems: 'center', justifyContent: 'center', borderRadius: S.radiusPill, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.line },
  addTxt: { fontFamily: F.bold, fontSize: 18, color: C.ink },
});
