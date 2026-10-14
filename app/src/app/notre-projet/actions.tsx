// 11 Actions — plusieurs solutions avant un engagement. Les solutions sont jugées d'abord sur leur
// effet pour les personnes ; quand l'équipe et les personnes jugent la faisabilité différemment,
// l'écart reste affiché. Puis la carte-engagement, avec des noms, une date pour en reparler, et son fil.

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AideButton } from '../../components/AideButton';

import { Screen } from '../../components/Chrome';
import type { Lean } from '../../core/acts';
import { say } from '../../core/useAids';
import { provenanceOf } from '../../core/facility';
import { useFacility, useFacilityState } from '../../core/useFacility';
import { useProject, useTeam } from '../../core/useProject';
import { band, LEANS } from '../../core/views';
import { useLayout } from '../../design/layout';
import { C, F, S } from '../../design/theme';

const LEAN_WORDS: Record<Lean, string> = { little: 'peu', middle: 'entre les deux', much: 'beaucoup' };

export default function Actions() {
  const { phone } = useLayout();
  // L'équipe de l'établissement (saisie au premier lancement) ; la professionnelle qui a ouvert la séance d'abord.
  const PEOPLE = useTeam();
  const opener = useProject((x) => x.pro) ?? PEOPLE[0] ?? '';
  const f = useFacilityState();
  const act = useFacility((x) => x.act);
  const [who, setWho] = useState(opener);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [aided, setAided] = useState(false);
  const [review, setReview] = useState('');
  const [modality, setModality] = useState('');
  const [rhythm, setRhythm] = useState('');
  const [chosen, setChosen] = useState<string | null>(null);
  const [live, setLive] = useState('');
  const solutions = Object.entries(f.solutions);
  const decision = Object.values(f.orientations).find((o) => o.decision)?.decision;
  const commitments = Object.entries(f.commitments);

  const addSolution = () => {
    if (!title.trim()) return;
    act(who, { act: 'solution', solution: `s-${solutions.length + 1}`, title: title.trim(), modality: modality.trim(), rhythm: rhythm.trim() });
    setTitle('');
    setModality('');
    setRhythm('');
  };
  const lean = (sol: string, effect: boolean, l: Lean) => {
    act(who, { act: 'solution_lean', solution: sol, effect, by: who, lean: l });
    const t = `${who} : ${effect ? 'effet' : 'faisabilité'}, ${LEAN_WORDS[l]}.`;
    say(t);
    setLive(t);
  };
  // Le fil de l'engagement : la parole consentie qui l'a fait naître, l'orientation décidée, la solution.
  const thread = (sol: string) => {
    const said = f.agenda.filter((a) => a.source === 'consented_word').map((a) => a.title);
    const oriented = Object.values(f.orientations).filter((o) => o.decision).map((o) => o.title);
    return [...said, ...oriented, f.solutions[sol]?.title ?? '', 'engagement'].filter(Boolean);
  };
  const commit = () => {
    if (!text.trim() || !chosen) return;
    const [author, prov, conf] = provenanceOf(aided, true, 'groupe');
    act(author, { act: 'commitment', commitment: `e-${commitments.length + 1}`, text: text.trim(), solution: chosen, thread: thread(chosen), review: review.trim() }, prov, conf);
    setAided(false);
    say('Carte-engagement validée.');
    setLive('Carte-engagement validée.');
    setText('');
  };

  const line = (sol: string, effect: boolean) => {
    const marks = f.solutions[sol].leans.filter((l) => l.effect === effect);
    const b = band(marks.map((m) => m.lean));
    return (
      <View style={st.track}>
        {b && <View style={[st.band, { left: `${(LEANS.indexOf(b.from) * 100) / 3}%`, width: `${((LEANS.indexOf(b.to) - LEANS.indexOf(b.from) + 1) * 100) / 3}%`, backgroundColor: b.narrow ? C.band.near : C.band.far }]} />}
        {marks.map((m, i) => <Text key={m.by} style={[st.mark, { left: `${(LEANS.indexOf(m.lean) * 100) / 3 + 2}%`, top: 2 + (i % 2) * 18 }]}>{m.by}</Text>)}
      </View>
    );
  };

  return (
    <Screen side="pe" title="actions" question="Comment allons-nous agir ? Plusieurs solutions avant un engagement.">
      <ScrollView contentContainerStyle={{ gap: 12 }}>
        {decision && <Text style={st.decision}>Notre décision : {decision.words}</Text>}
        <View style={st.row}>
          <Text style={st.small}>Qui se positionne :</Text>
          {PEOPLE.map((p) => (
            <Pressable key={p} onPress={() => setWho(p)} style={[st.btn, who === p && st.on]} accessibilityRole="radio" accessibilityState={{ checked: who === p }}>
              <Text style={[st.btnTxt, who === p && { color: C.onAccent }]}>{p}</Text>
            </Pressable>
          ))}
        </View>
        <View style={st.box}>
          <Text style={st.h}>Cartes-solutions</Text>
          {live ? <Text style={st.small} accessibilityLiveRegion="polite">{live}</Text> : null}
          {solutions.map(([id, s]) => (
            <View key={id} style={st.sol}>
              <Text style={st.solTitle}>{s.title}</Text>
              <Text style={st.small}>{[s.modality, s.rhythm].filter(Boolean).join(' · ')}</Text>
              {([true, false] as const).map((effect) => (
                <View key={String(effect)} style={st.lineRow}>
                  <Text style={[st.small, { width: phone ? '100%' : 210 }]}>REGARDS RÉUNIS · {effect ? 'effet pour les personnes' : "faisabilité pour l'équipe"}</Text>
                  {line(id, effect)}
                  {LEANS.map((l) => (
                    <Pressable key={l} onPress={() => lean(id, effect, l)} style={st.pick} accessibilityRole="button" accessibilityLabel={`${who}, ${effect ? 'effet' : 'faisabilité'} : ${LEAN_WORDS[l]}`}>
                      <Text style={st.pickTxt}>{LEAN_WORDS[l]}</Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>
          ))}
          {solutions.length === 0 && <Text style={st.small}>Plusieurs solutions avant un engagement : écrivez-les, une à une.</Text>}
          <View style={st.row}>
            <TextInput value={title} onChangeText={setTitle} placeholder="Une solution…" style={st.input} accessibilityLabel="Nouvelle solution" />
            <TextInput value={modality} onChangeText={setModality} placeholder="comment (binôme, partenaire…)" style={st.input} accessibilityLabel="Modalité" />
            <TextInput value={rhythm} onChangeText={setRhythm} placeholder="à quel rythme" style={st.input} accessibilityLabel="Rythme" />
            <Pressable onPress={addSolution} style={[st.btn, st.on]} accessibilityRole="button"><Text style={[st.btnTxt, { color: C.onAccent }]}>Ajouter</Text></Pressable>
          </View>
        </View>

        <View style={st.box}>
          <Text style={st.h}>Carte-engagement</Text>
          {commitments.map(([id, c]) => (
            <View key={id} style={st.commit}>
              <Text style={st.solTitle}>✓ {c.text}</Text>
              <Text style={st.small}>fil : {c.thread.join(' → ')} · on en reparle {c.review}</Text>
            </View>
          ))}
          <TextInput value={text} onChangeText={setText} multiline placeholder="« Un atelier courriers chaque mardi, animé par un binôme, ouvert à toutes les personnes accompagnées. »" style={st.input} accessibilityLabel="Texte de l'engagement" />
          <AideButton kind="phrase" label="Mettre en mots l'engagement" text={text} who="Le groupe" onProposal={(p) => { setText(p); setAided(true); }} />
          <View style={st.row}>
            <Text style={st.small}>Pour quelle solution ?</Text>
            {solutions.map(([id, x]) => (
              <Pressable key={id} accessibilityRole="radio" accessibilityState={{ checked: chosen === id }} onPress={() => setChosen(id)} style={[st.btn, chosen === id && st.on]}>
                <Text style={[st.btnTxt, chosen === id && { color: C.onAccent }]}>{x.title}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput value={review} onChangeText={setReview} placeholder="Quand en reparler (au printemps, avec les personnes…)" style={st.input} accessibilityLabel="Date pour en reparler" />
          <Pressable onPress={commit} style={[st.btn, st.on]} accessibilityRole="button"><Text style={[st.btnTxt, { color: C.onAccent }]}>Validée par le groupe</Text></Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  box: { padding: 14, borderRadius: S.radius, backgroundColor: C.surface, gap: 10 },
  h: { fontFamily: F.bold, fontSize: 17, color: C.ink },
  small: { fontFamily: F.body, fontSize: 13, color: C.muted },
  decision: { fontFamily: F.bold, fontSize: 15, color: C.ink, padding: 12, borderRadius: S.radius, backgroundColor: C.pe.soft },
  btn: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 14, borderRadius: S.radiusPill, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, alignSelf: 'flex-start' },
  on: { backgroundColor: C.violetInk, borderColor: C.violetInk },
  btnTxt: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  sol: { padding: 12, borderRadius: 14, backgroundColor: C.surface2, gap: 6, borderTopWidth: 4, borderTopColor: C.pe.value },
  solTitle: { fontFamily: F.bold, fontSize: 16, color: C.ink },
  lineRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  track: { flex: 1, minWidth: 200, height: 40, borderRadius: 10, backgroundColor: C.surface },
  band: { position: 'absolute', top: 4, bottom: 4, borderRadius: 8 },
  mark: { position: 'absolute', paddingHorizontal: 6, borderRadius: 999, backgroundColor: C.violetInk, color: C.onAccent, fontFamily: F.bold, fontSize: 11, overflow: 'hidden' },
  pick: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 10, borderRadius: S.radiusPill, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface },
  pickTxt: { fontFamily: F.body, fontSize: 13, color: C.ink },
  input: { flex: 1, minWidth: 240, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 10, fontFamily: F.body, fontSize: 16, color: C.ink },
  commit: { padding: 12, borderRadius: 12, backgroundColor: C.pe.soft, gap: 4 },
});
