// 12 Suivi — la grammaire du Chemin, au pluriel : couloirs, ◆ décidé ensemble, ● événements,
// conditions et dépendances. Ce que nous portons : des prénoms et un rythme, jamais un total.
// Le résultat se dit en mots ; s'il ne suffit pas, on revient au constat 🔁.
// Un seul sens : le collectif ne lit jamais le chemin d'Amina ; il lui propose, et c'est elle qui relie.

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AideButton } from '../../components/AideButton';

import { Screen } from '../../components/Chrome';
import { PathView } from '../../components/PathView';
import type { FacilityAct } from '../../core/facility';
import { say } from '../../core/useAids';
import { useFacility, useFacilityState } from '../../core/useFacility';
import { C, F, S } from '../../design/theme';

const MONTHS = ['janvier', 'février', 'mars', 'avril'];
const LANES = ['atelier', 'CAF', 'équipe'];
const PEOPLE = ['Aïcha', 'Bruno', 'Karim', 'Léa'];

/** Le suivi tel que l'Atlas le montre (écran 12). */
const ATLAS: FacilityAct[] = [
  { act: 'node_set', node: 'decide', lane: 'atelier', kind: 'decision', label: 'décidé ensemble', when: 'janvier' },
  { act: 'node_set', node: 'mardi', lane: 'atelier', kind: 'event', label: 'premier mardi', when: 'février' },
  { act: 'node_set', node: 'revue', lane: 'atelier', kind: 'event', label: 'revue avec les personnes', when: 'avril' },
  { act: 'node_set', node: 'jeudi', lane: 'atelier', kind: 'event', label: 'jeudi aussi ?', when: 'mars' },
  { act: 'node_set', node: 'convention', lane: 'CAF', kind: 'event', label: 'convention CAF', when: 'février' },
  { act: 'node_set', node: 'permanence', lane: 'CAF', kind: 'event', label: 'permanence CAF', when: 'mars' },
  { act: 'node_set', node: 'fiches', lane: 'équipe', kind: 'event', label: 'fiches en FALC', when: 'février' },
  { act: 'link_set', from: 'decide', to: 'mardi', link: { kind: 'chosen' } },
  { act: 'link_set', from: 'mardi', to: 'revue', link: { kind: 'chosen' } },
  { act: 'link_set', from: 'mardi', to: 'jeudi', link: { kind: 'condition', words: 'si plus de 8 viennent' } },
  { act: 'link_set', from: 'convention', to: 'permanence', link: { kind: 'dependency', words: 'attend la convention' } },
  { act: 'link_set', from: 'decide', to: 'fiches', link: { kind: 'chosen' } },
  { act: 'load', load: 'atelier', name: "📮 L'atelier du mardi", carriers: ['Léa', 'Bruno'], rhythm: 'chaque semaine' },
  { act: 'load', load: 'caf', name: '🤝 Le lien avec la CAF', carriers: ['Aïcha'], rhythm: 'quand il faut' },
  { act: 'load', load: 'falc', name: '📝 Les fiches en FALC', carriers: ['Karim'], rhythm: 'chaque mois' },
];

export default function Suivi() {
  const f = useFacilityState();
  const act = useFacility((x) => x.act);
  const [others, setOthers] = useState(false);
  const [moving, setMoving] = useState<{ load: string; from: string } | null>(null);
  const [result, setResult] = useState('');
  const nodes = Object.entries(f.nodes).map(([id, n]) => ({ id, ...n }));
  const commitment = Object.values(f.commitments)[0];

  const carry = (load: string, to: string) => {
    if (!moving) return;
    const l = f.loads[load];
    const carriers = [...l.carriers.filter((c) => c !== moving.from && c !== to), to];
    act('groupe', { act: 'load', load, name: l.name, carriers, rhythm: l.rhythm });
    say(`${l.name} : ${moving.from} passe la main à ${to}.`);
    setMoving(null);
  };

  return (
    <Screen side="pe" title="follow" question="Qui fait quoi, et quand ? Et ce qui en résulte.">
      <ScrollView contentContainerStyle={{ gap: 12 }}>
        {nodes.length === 0 ? (
          <Pressable onPress={() => ATLAS.forEach((a) => act('groupe', a))} style={[st.btn, st.on]} accessibilityRole="button">
            <Text style={[st.btnTxt, { color: '#fff' }]}>Poser le suivi décidé (exemple de l'Atlas)</Text>
          </Pressable>
        ) : (
          <PathView columns={MONTHS} lanes={LANES} nodes={nodes} links={f.links} showOthers={others} />
        )}
        <Pressable onPress={() => setOthers(!others)} style={[st.btn, others && st.on]} accessibilityRole="switch" accessibilityState={{ checked: others }}>
          <Text style={[st.btnTxt, others && { color: '#fff' }]}>🌈 Conditions et dépendances</Text>
        </Pressable>

        <View style={st.box}>
          <Text style={st.h}>Ce que nous portons</Text>
          {Object.entries(f.loads).map(([id, l]) => (
            <View key={id} style={st.load}>
              <Text style={[st.loadName, { flex: 1 }]}>{l.name}</Text>
              <View style={st.row}>
                {l.carriers.map((c) => (
                  <Pressable key={c} onPress={() => setMoving({ load: id, from: c })} style={[st.chip, moving?.load === id && moving.from === c && st.on]} accessibilityRole="button" accessibilityLabel={`${c} porte ${l.name}. Toucher pour passer la main.`}>
                    <Text style={[st.btnTxt, moving?.load === id && moving.from === c && { color: '#fff' }]}>{c}</Text>
                  </Pressable>
                ))}
                {moving?.load === id && PEOPLE.filter((p) => !l.carriers.includes(p)).map((p) => (
                  <Pressable key={p} onPress={() => carry(id, p)} style={st.chipTo} accessibilityRole="button"><Text style={st.btnTxt}>→ {p}</Text></Pressable>
                ))}
              </View>
              <Text style={st.small}>{l.rhythm}</Text>
            </View>
          ))}
          <Text style={st.small}>On remarque les prénoms : chacun apporte ce qu'il peut.</Text>
        </View>

        <View style={st.box}>
          <Text style={st.h}>Ce qui en résulte</Text>
          {f.results.map((r, i) => <Text key={i} style={st.result}>📊 {r.text}{r.backToFinding ? ' → retour au constat 🔁' : ''}</Text>)}
          <TextInput value={result} onChangeText={setResult} multiline placeholder="« Au printemps : 5 personnes chaque mardi, 3 comprennent seules leurs courriers. Les relances restent dures. »" style={st.input} accessibilityLabel="Résultat" />
          <AideButton kind="phrase" label="Mettre en mots le résultat" text={result} who="Le groupe" onProposal={setResult} />
          <View style={st.row}>
            <Pressable onPress={() => { if (result.trim()) { act('groupe', { act: 'result', text: result.trim(), back_to_finding: false }); setResult(''); } }} style={st.btn} accessibilityRole="button"><Text style={st.btnTxt}>Noter le résultat</Text></Pressable>
            <Pressable onPress={() => { if (result.trim()) { act('groupe', { act: 'result', text: result.trim(), back_to_finding: true }); setResult(''); say('Retour au constat.'); } }} style={[st.btn, st.on]} accessibilityRole="button"><Text style={[st.btnTxt, { color: '#fff' }]}>🔁 Retour au constat</Text></Pressable>
          </View>
        </View>

        {commitment && (
          <View style={st.box}>
            <Text style={st.h}>Proposer aux personnes</Text>
            <Text style={st.small}>Le collectif ne lit jamais leur chemin : il propose, et chacune choisit de relier, depuis son espace.</Text>
            {Object.values(f.proposals).map((p) => <Text key={p} style={st.result}>📣 {p}</Text>)}
            {!Object.keys(f.proposals).length && (
              <Pressable onPress={() => act('groupe', { act: 'proposal', proposal: 'atelier-mardi', text: "L'atelier courriers du mardi" })} style={[st.btn, st.on]} accessibilityRole="button">
                <Text style={[st.btnTxt, { color: '#fff' }]}>Le CHRS propose : l'atelier courriers du mardi</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  box: { padding: 14, borderRadius: S.radius, backgroundColor: C.surface, gap: 8 },
  h: { fontFamily: F.bold, fontSize: 17, color: C.ink },
  small: { fontFamily: F.body, fontSize: 13, color: C.muted },
  btn: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 14, borderRadius: S.radiusPill, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, alignSelf: 'flex-start' },
  on: { backgroundColor: C.violetInk, borderColor: C.violetInk },
  btnTxt: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  load: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, backgroundColor: C.surface2 },
  loadName: { fontFamily: F.bold, fontSize: 15, color: C.ink, minWidth: 200 },
  chip: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 12, borderRadius: S.radiusPill, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  chipTo: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 12, borderRadius: S.radiusPill, borderWidth: 1, borderStyle: 'dashed', borderColor: C.violet },
  result: { fontFamily: F.bold, fontSize: 15, color: C.ink, padding: 10, borderRadius: 12, backgroundColor: C.pe.soft },
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 10, fontFamily: F.body, fontSize: 16, color: C.ink },
});
