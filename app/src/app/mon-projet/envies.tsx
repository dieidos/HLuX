// 03 Envies — l'Ikigai : quatre cercles, leurs croisements nommés avec des mots, jamais des coordonnées.
// Une idée naît d'une Carte et en garde le lien ; elle se déplace quand on veut ;
// l'écarter par le bord est le seul geste irréversible, et l'écran le dit.

import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';

import { Screen } from '../../components/Chrome';
import { DragArea, Draggable, Zone } from '../../components/Drag';
import type { Circle, Crossing, Spot } from '../../core/acts';
import { say, useWords } from '../../core/useAids';
import { useProject, useProjectState } from '../../core/useProject';
import { C, F, S } from '../../design/theme';
import type { WordKey } from '../../i18n/words';

const SIZE = 440;
const R = 150;
// Disposition de l'Atlas : lavande en haut à gauche, bleu en haut à droite, vert en bas à gauche, jaune en bas à droite.
const FAR = SIZE - 2 * R; // les cercles se chevauchent sur 2R - FAR
const CIRCLES: [Circle, WordKey, string, number, number][] = [
  ['love', 'love', '#cfafe7', 0, 0],
  ['able', 'able', '#8faadc', FAR, 0],
  ['useful', 'useful', '#a9d18e', 0, FAR],
  ['living', 'living', '#ffd966', FAR, FAR],
];
// Les croisements, au milieu des chevauchements : Passion en haut, Mission à gauche,
// Profession à droite, Vocation en bas — comme l'Atlas.
const CROSSINGS: [Crossing, WordKey, number, number][] = [
  ['passion', 'passion', SIZE / 2, 70],
  ['mission', 'mission', 70, SIZE / 2],
  ['profession', 'profession', SIZE - 70, SIZE / 2],
  ['vocation', 'vocation', SIZE / 2, SIZE - 70],
];

export default function Envies() {
  const w = useWords();
  const s = useProjectState();
  const act = useProject((x) => x.act);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [from, setFrom] = useState<string | null>(null);

  const place = (idea: string, spot: Spot, words: string) => {
    act('amina', { act: 'idea_placed', idea, spot });
    const t = `${s.ideas[idea].title} : ${words}.`;
    say(t);
  };
  const create = () => {
    if (!title.trim()) return;
    act('amina', { act: 'idea_created', idea: `idee-${Object.keys(s.ideas).length + 1}`, title: title.trim(), from_card: from, in_session: false });
    setAdding(false); setTitle(''); setFrom(null);
  };
  const at = (spot: Spot) =>
    Object.entries(s.ideas).filter(([, i]) => JSON.stringify(i.spot) === JSON.stringify(spot));

  const chip = (id: string) => {
    const i = s.ideas[id];
    const card = i.fromCard ? s.cards[i.fromCard] : null;
    return (
      <Draggable key={id} id={id} label={i.title}>
        <View style={st.idea}>
          <Text style={st.ideaTxt}>{i.title}</Text>
          {card ? <Text style={st.born}>{w('bornOf')} {card.title}</Text> : null}
        </View>
      </Draggable>
    );
  };

  return (
    <Screen side="pp" title="wishes" question={w('wishQuestion')}>
      <DragArea>
        <View style={st.row}>
          <View style={{ width: SIZE, height: SIZE }}>
            {CIRCLES.map(([c, k, color, x, y]) => (
              <Zone key={c} id={c} label={w(k)} onDrop={(id) => place(id, { at: 'circle', which: c }, w(k))}
                style={{ ...st.circle, left: x, top: y, backgroundColor: color } as ViewStyle}>
                <View style={{ gap: 4 }}>{at({ at: 'circle', which: c }).map(([id]) => chip(id))}</View>
              </Zone>
            ))}
            {CROSSINGS.map(([c, k, x, y]) => (
              <Zone key={c} id={c} label={w(k)} onDrop={(id) => place(id, { at: 'crossing', which: c }, w(k))}
                style={{ ...st.crossing, left: x - 60, top: y - 22 } as ViewStyle}>
                <Text style={st.crossTxt}>{w(k).toUpperCase()}</Text>
                {at({ at: 'crossing', which: c }).map(([id]) => chip(id))}
              </Zone>
            ))}
          </View>
          <View style={st.side}>
            {CIRCLES.map(([c, k]) => <Text key={c} style={st.legend}>{w(k)}</Text>)}
          </View>
        </View>
        <View style={st.bottom}>
          <Zone id="tray" label={w('tray')} onDrop={(id) => place(id, { at: 'tray' }, w('tray'))} style={st.tray}>
            <Text style={st.small}>{w('tray')}</Text>
            <View style={st.chips}>{at({ at: 'tray' }).map(([id]) => chip(id))}</View>
          </Zone>
          <Zone id="discard" label={w('discard')} onDrop={(id) => place(id, { at: 'discarded' }, 'écartée, pour toujours')} style={st.discard}>
            <Text style={st.small}>🗑️ {w('discard')}</Text>
          </Zone>
          <Pressable onPress={() => setAdding(true)} style={st.btn} accessibilityRole="button"><Text style={st.btnTxt}>{w('newIdea')}</Text></Pressable>
        </View>
      </DragArea>

      {adding && (
        <View style={st.overlay}>
          <View style={st.sheet}>
            <Text style={st.sheetTitle}>{w('newIdea')}</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder="Mon idée…" style={st.input} accessibilityLabel="Mon idée" />
            <Text style={st.small}>{w('bornOf')} :</Text>
            <View style={st.chips}>
              {Object.entries(s.cards).map(([id, c]) => (
                <Pressable key={id} onPress={() => setFrom(from === id ? null : id)} style={[st.pick, from === id && st.pickOn]}>
                  <Text style={st.btnTxt}>{c.title}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable onPress={create} style={[st.btn, st.primary]}><Text style={[st.btnTxt, { color: '#fff' }]}>Créer</Text></Pressable>
              <Pressable onPress={() => setAdding(false)} style={st.btn}><Text style={st.btnTxt}>Annuler</Text></Pressable>
            </View>
          </View>
        </View>
      )}
    </Screen>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', gap: 24, flexWrap: 'wrap', alignItems: 'center' },
  circle: { position: 'absolute', width: 2 * R, height: 2 * R, borderRadius: R, opacity: 0.8, borderWidth: 0, alignItems: 'center', justifyContent: 'center' },
  crossing: { position: 'absolute', width: 120, minHeight: 44, borderRadius: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,.75)', padding: 6 },
  crossTxt: { fontFamily: F.bold, fontSize: 12, letterSpacing: 1, color: C.ink },
  side: { gap: 10 },
  legend: { fontFamily: F.bold, fontSize: 16, color: C.ink, paddingHorizontal: 12, paddingVertical: 6, borderRadius: S.radiusPill, backgroundColor: C.surface },
  bottom: { flexDirection: 'row', gap: 12, marginTop: 16, alignItems: 'stretch', flexWrap: 'wrap' },
  tray: { flex: 1, minWidth: 260, backgroundColor: C.surface2 },
  discard: { width: 220, justifyContent: 'center', borderColor: '#e2b4ac' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  idea: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: C.surface, borderTopWidth: 4, borderTopColor: C.violet },
  ideaTxt: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  born: { fontFamily: F.body, fontSize: 12, color: C.muted },
  small: { fontFamily: F.body, fontSize: 13, color: C.muted },
  btn: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 16, borderRadius: S.radiusPill, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, alignSelf: 'center' },
  primary: { backgroundColor: C.violetInk, borderColor: C.violetInk },
  btnTxt: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  overlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(13,17,23,.35)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet: { width: '100%', maxWidth: 560, gap: 10, padding: 24, borderRadius: 20, backgroundColor: C.surface },
  sheetTitle: { fontFamily: F.display, fontSize: 24, color: C.ink },
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12, fontFamily: F.body, fontSize: 17, color: C.ink },
  pick: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 14, borderRadius: S.radiusPill, borderWidth: 2, borderColor: C.line },
  pickOn: { borderColor: C.violet, backgroundColor: '#f6effb' },
});
