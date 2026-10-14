// 10 Choix — le geste d'Amina, avec six critères du métier ; cinq regards autour d'une orientation.
// Chacun place seul, sur la tablette qui passe ou sur son mobile : on voit qui a placé, jamais où.
// Puis tout se révèle : les bandes nomment qui se rejoint et qui diverge — jamais de vote, jamais
// « la plupart » ; un désaccord reste sur la table. La décision est une phrase du groupe.

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AideButton } from '../../components/AideButton';
import { DictateButton } from '../../components/DictateButton';
import { VoicesCircle } from '../../components/VoicesCircle';
import { Link } from 'expo-router';

import { Screen } from '../../components/Chrome';
import type { Lean, Rank } from '../../core/acts';
import { provenanceOf, type Criterion } from '../../core/facility';
import { say } from '../../core/useAids';
import { useFacility, useFacilityState } from '../../core/useFacility';
import { useTeam } from '../../core/useProject';
import { band, LEANS } from '../../core/views';
import { useLayout } from '../../design/layout';
import { C, F, S } from '../../design/theme';

export const CRITERIA: [Criterion, string][] = [
  ['effect', '👤 Effet attendu pour les personnes'], ['rights', '⚖️ Respect des droits'], ['feasibility', '🛠️ Faisabilité'],
  ['urgency', '⏱️ Urgence'], ['cooperation', '🤝 Coopération nécessaire'], ['resources', '📦 Ressources disponibles'],
];
const RANKS: [Rank, string][] = [['first', "D'ABORD"], ['then', 'ENSUITE'], ['also', 'AUSSI'], ['less', 'MOINS'], ['not_yet', '?']];
const SAID: Record<Criterion, string> = {
  effect: "l'effet pour les personnes", rights: 'le respect des droits', feasibility: 'la faisabilité',
  urgency: "l'urgence", cooperation: 'la coopération nécessaire', resources: 'les ressources disponibles',
};
const LEAN_WORDS: Record<Lean, string> = { little: 'peu', middle: 'entre les deux', much: 'beaucoup' };

export default function Choix() {
  const { phone } = useLayout();
  // L'équipe de l'établissement (saisie au premier lancement) ; la professionnelle qui a ouvert la séance d'abord.
  const PEOPLE = useTeam();
  const VOICES = [...PEOPLE, 'Le CVS'];
  const f = useFacilityState();
  const act = useFacility((x) => x.act);
  const orientations = Object.entries(f.orientations);
  const [current, setCurrent] = useState<string | null>(orientations[0]?.[0] ?? null);
  const [placer, setPlacer] = useState<string | null>(null);
  const [mine, setMine] = useState<Partial<Record<Criterion, Lean>>>({});
  const [dictated, setDictated] = useState('');
  const [words, setWords] = useState('');
  const [aided, setAided] = useState(false);
  const [naming, setNaming] = useState('');
  const [others, setOthers] = useState(false);
  const [folded, setFolded] = useState(true);
  const [live, setLive] = useState('');
  const o = current ? f.orientations[current] : null;
  const order: Rank[] = RANKS.map((r) => r[0]);
  const ranked = [...CRITERIA].sort((a, b) => order.indexOf(f.criteria[a[0]] ?? 'not_yet') - order.indexOf(f.criteria[b[0]] ?? 'not_yet'));

  const cycleRank = (c: Criterion) => {
    const next = order[(order.indexOf(f.criteria[c] ?? 'not_yet') + 1) % order.length];
    act('groupe', { act: 'criterion_ranked', criterion: c, rank: next });
  };
  // Une orientation se nomme : le groupe l'écrit, ou reprend un cap déjà posé.
  const capTitles = Object.values(f.caps).map((c) => c.title).filter((t) => !orientations.some(([, o2]) => o2.title === t));
  const newOrientation = (title: string) => {
    if (!title.trim()) return;
    const id = `o-${orientations.length + 1}`;
    act('groupe', { act: 'orientation', orientation: id, title: title.trim() });
    setCurrent(id);
    setNaming('');
    setOthers(false);
  };
  const submitPrivate = () => {
    if (!current || !placer) return;
    for (const [c, lean] of Object.entries(mine) as [Criterion, Lean][]) act(placer, { act: 'private_placement', orientation: current, criterion: c, by: placer, lean });
    say(`${placer} a placé.`);
    setLive(`${placer} a placé. Personne ne voit où, jusqu’à la révélation.`);
    setPlacer(null);
    setMine({});
  };
  const reveal = () => {
    if (!current || !o) return;
    act('groupe', { act: 'revealed', orientation: current });
    say('Tout se révèle.');
    setLive('Tout se révèle, en même temps.');
  };

  // Les phrases de lecture, sans chiffre : qui se rejoint, qui voit très différemment.
  const readings = o?.revealed
    ? CRITERIA.flatMap(([c]) => {
        const marks = o.placements.filter((p) => p.criterion === c);
        if (marks.length < 2) return [];
        const b = band(marks.map((m) => m.lean))!;
        const names = marks.map((m) => m.by);
        if (b.narrow) return [{ converge: true, text: `${names.join(' et ')} se rejoignent sur ${SAID[c]}.` }];
        const lo = marks.filter((m) => m.lean === b.from).map((m) => m.by);
        const hi = marks.filter((m) => m.lean === b.to).map((m) => m.by);
        return [{ converge: false, text: `${lo.join(' et ')} et ${hi.join(' et ')} voient ${SAID[c]} très différemment.` }];
      })
    : [];

  return (
    <Screen side="pe" title="choice" question="Que choisissons-nous ? Chacun seul, puis ensemble.">
      <ScrollView contentContainerStyle={{ gap: 12 }}>
        <View style={st.box}>
          <Text style={st.h}>Le groupe range les six critères</Text>
          {ranked.map(([c, label]) => (
            <Pressable key={c} onPress={() => cycleRank(c)} style={st.rankRow} accessibilityRole="button" accessibilityLabel={`${label} : ${RANKS.find((r) => r[0] === (f.criteria[c] ?? 'not_yet'))![1]}. Toucher pour changer.`}>
              <Text style={st.rank}>{RANKS.find((r) => r[0] === (f.criteria[c] ?? 'not_yet'))![1]}</Text>
              <Text style={st.crit}>{label}</Text>
            </Pressable>
          ))}
          <Text style={st.small}>Plusieurs critères peuvent partager un rang.</Text>
        </View>

        <View style={st.box}>
          <View style={st.row}>
            {o && <Text style={[st.btn, st.on, st.btnTxt, { color: C.onAccent, paddingTop: 10 }]}>🧭 {o.title}</Text>}
            {orientations.length > 1 && (
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: others }} onPress={() => setOthers(!others)} style={st.btn}>
                <Text style={st.btnTxt}>{orientations.length - 1} autre{orientations.length > 2 ? 's' : ''} ▸</Text>
              </Pressable>
            )}
          </View>
          {others && (
            <View style={st.row}>
              {orientations.filter(([id]) => id !== current).map(([id, x]) => (
                <Pressable accessibilityRole="button" key={id} onPress={() => { setCurrent(id); setOthers(false); }} style={st.btn}><Text style={st.btnTxt}>🧭 {x.title}</Text></Pressable>
              ))}
            </View>
          )}
          <View style={st.row}>
            <TextInput value={naming} onChangeText={setNaming} placeholder="Nommer une orientation…" style={[st.input, { flex: 1, minWidth: 220 }]} accessibilityLabel="Nouvelle orientation" />
            <Pressable accessibilityRole="button" onPress={() => newOrientation(naming)} style={st.btn}><Text style={st.btnTxt}>＋ Une orientation</Text></Pressable>
          </View>
          {capTitles.length > 0 && (
            <View style={st.row}>
              <Text style={st.small}>Depuis le cap :</Text>
              {capTitles.map((t) => (
                <Pressable key={t} accessibilityRole="button" onPress={() => newOrientation(t)} style={st.btn}><Text style={st.btnTxt}>＋ {t}</Text></Pressable>
              ))}
            </View>
          )}
        </View>

        {o && (
          <View style={st.box}>
            <Text style={st.h}>Une orientation, {VOICES.length} regards</Text>
            {live ? <Text style={st.small} accessibilityLiveRegion="polite">{live}</Text> : null}
            {!o.revealed && (
              <>
                <Text style={st.small}>🔒 Chacun seul, en privé — sur la tablette qui passe, ou sur son mobile.</Text>
                <VoicesCircle title={o.title} voices={VOICES} placed={o.placedBy} current={placer} onPick={setPlacer} />
                {placer && (
                  <View style={st.private}>
                    <Text style={st.h}>{placer}, en privé</Text>
                    {CRITERIA.map(([c, label]) => (
                      <View key={c} style={st.row}>
                        <Text style={[st.crit, { width: phone ? '100%' : 260 }]}>{label}</Text>
                        {LEANS.map((l) => (
                          <Pressable key={l} onPress={() => setMine((m) => ({ ...m, [c]: l }))} style={[st.pick, mine[c] === l && st.pickOn]} accessibilityRole="radio" accessibilityState={{ checked: mine[c] === l }}>
                            <Text style={st.btnTxt}>{LEAN_WORDS[l]}</Text>
                          </Pressable>
                        ))}
                      </View>
                    ))}
                    <Pressable accessibilityRole="button" onPress={submitPrivate} style={[st.btn, st.on]}><Text style={[st.btnTxt, { color: C.onAccent }]}>J’ai placé</Text></Pressable>
                  </View>
                )}
                <Text style={st.small}>👁️ On voit qui a placé ; les positions se dévoilent ensemble.</Text>
                <Pressable accessibilityRole="button" onPress={reveal} disabled={o.placedBy.length < 2} style={[st.btn, st.on, o.placedBy.length < 2 && { opacity: 0.5 }]}>
                  <Text style={[st.btnTxt, { color: C.onAccent }]}>Tout révéler, ensemble</Text>
                </Pressable>
              </>
            )}
            {o.revealed && (
              <>
                {ranked.map(([c, label]) => {
                  const marks = o.placements.filter((p) => p.criterion === c);
                  if (!marks.length) return null;
                  // Les lignes Aussi / Moins / pas encore rangées se replient.
                  if (folded && ['also', 'less', 'not_yet'].includes(f.criteria[c] ?? 'not_yet')) return null;
                  const b = band(marks.map((m) => m.lean))!;
                  return (
                    <View key={c} style={st.lineRow}>
                      <Text style={[st.crit, { width: phone ? '100%' : 240 }]}>{label}</Text>
                      <View style={st.track}>
                        <View style={[st.band, { left: `${(LEANS.indexOf(b.from) * 100) / 3}%`, width: `${((LEANS.indexOf(b.to) - LEANS.indexOf(b.from) + 1) * 100) / 3}%`, backgroundColor: b.narrow ? C.band.near : C.band.far }]} />
                        {marks.map((m, i) => (
                          <Text key={m.by} style={[st.mark, { left: `${(LEANS.indexOf(m.lean) * 100) / 3 + 2}%`, top: 2 + (i % 2) * 18 }]}>{m.by}</Text>
                        ))}
                      </View>
                    </View>
                  );
                })}
                {ranked.some(([c]) => ['also', 'less', 'not_yet'].includes(f.criteria[c] ?? 'not_yet') && o.placements.some((p) => p.criterion === c)) && (
                  <Pressable accessibilityRole="button" accessibilityState={{ expanded: !folded }} onPress={() => setFolded(!folded)} style={st.btn}>
                    <Text style={st.btnTxt}>{folded ? '▾ Les lignes Aussi et Moins' : '▴ Replier Aussi et Moins'}</Text>
                  </Pressable>
                )}
                <View style={st.readings}>
                  {readings.filter((r) => r.converge).map((r) => <Text key={r.text} style={st.conv}>CONVERGENCES · {r.text}</Text>)}
                  {readings.filter((r) => !r.converge).map((r) => <Text key={r.text} style={st.diff}>À DISCUTER · {r.text}</Text>)}
                </View>
                <Text style={st.h}>Notre décision</Text>
                {o.decision ? (
                  <>
                    <Text style={st.decision}>✓ {o.decision.words}</Text>
                    <Link href="/notre-projet/actions" style={[st.btn, st.on, st.btnTxt, { color: C.onAccent, alignSelf: 'flex-start', paddingTop: 10 }]}>Vers les actions ▸</Link>
                  </>
                ) : (
                  <>
                    <TextInput value={dictated} onChangeText={setDictated} placeholder="Ce que le groupe dit…" multiline style={st.input} accessibilityLabel="Décision dictée" />
                    <DictateButton label="🎙 Le groupe dicte" onText={setDictated} />
                    <TextInput value={words} onChangeText={setWords} placeholder="La phrase validée (reformulée)…" multiline style={st.input} accessibilityLabel="Décision reformulée" />
                    <AideButton kind="phrase" label="Reformuler la phrase dictée" text={dictated} who="Le groupe" onProposal={(p) => { setWords(p); setAided(true); }} />
                    <Pressable accessibilityRole="button" onPress={() => {
                      if (!dictated.trim()) return;
                      const [author, prov, conf] = provenanceOf(aided && !!words.trim(), true, 'groupe');
                      act(author, { act: 'decision', orientation: current!, dictated: dictated.trim(), words: (words || dictated).trim() }, prov, conf);
                    }} style={[st.btn, st.on]}>
                      <Text style={[st.btnTxt, { color: C.onAccent }]}>Validée par le groupe · vers les actions</Text>
                    </Pressable>
                  </>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const st = StyleSheet.create({
  box: { padding: 14, borderRadius: S.radius, backgroundColor: C.surface, gap: 8 },
  h: { fontFamily: F.bold, fontSize: 17, color: C.ink },
  small: { fontFamily: F.body, fontSize: 13, color: C.muted },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  rankRow: { flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: S.touch, paddingHorizontal: 10, borderRadius: 12, backgroundColor: C.surface2 },
  rank: { width: 90, fontFamily: F.bold, fontSize: 12, letterSpacing: 1, color: C.slate },
  crit: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  btn: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 14, borderRadius: S.radiusPill, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, alignSelf: 'flex-start' },
  on: { backgroundColor: C.violetInk, borderColor: C.violetInk },
  btnTxt: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  voice: { minWidth: 110, padding: 10, borderRadius: 14, borderWidth: 2, borderColor: C.line, backgroundColor: C.surface },
  voiceDone: { borderColor: C.pe.value, backgroundColor: C.pe.soft },
  private: { padding: 12, borderRadius: 14, backgroundColor: C.violetSoft, gap: 8, borderWidth: 2, borderColor: C.violet },
  pick: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 12, borderRadius: S.radiusPill, borderWidth: 2, borderColor: C.line, backgroundColor: C.surface },
  pickOn: { borderColor: C.violet, backgroundColor: C.lavender },
  lineRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  track: { flex: 1, height: 44, borderRadius: 10, backgroundColor: C.surface2 },
  band: { position: 'absolute', top: 4, bottom: 4, borderRadius: 8 },
  mark: { position: 'absolute', paddingHorizontal: 6, borderRadius: 999, backgroundColor: C.violetInk, color: C.onAccent, fontFamily: F.bold, fontSize: 11, overflow: 'hidden' },
  readings: { gap: 6 },
  conv: { fontFamily: F.bold, fontSize: 14, color: C.pe.ink, padding: 8, borderRadius: 10, backgroundColor: C.pe.soft },
  diff: { fontFamily: F.bold, fontSize: 14, color: C.warn.ink, padding: 8, borderRadius: 10, backgroundColor: C.warn.soft },
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 10, fontFamily: F.body, fontSize: 16, color: C.ink },
  decision: { fontFamily: F.bold, fontSize: 16, color: C.ink, padding: 12, borderRadius: 12, backgroundColor: C.pe.soft },
});
