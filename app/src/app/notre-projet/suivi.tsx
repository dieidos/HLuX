// 12 Suivi — la grammaire du Chemin, au pluriel : couloirs, ◆ décidé ensemble, ● événements,
// conditions et dépendances. Ce que nous portons : des prénoms et un rythme, jamais un total.
// Le résultat se dit en mots ; s'il ne suffit pas, on revient au constat 🔁.
// Un seul sens : le collectif ne lit jamais le chemin d'Amina ; il lui propose, et c'est elle qui relie.

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AideButton } from '../../components/AideButton';

import { Screen } from '../../components/Chrome';
import { PathView } from '../../components/PathView';
import { router } from 'expo-router';

import { DragArea, Draggable, Zone } from '../../components/Drag';
import { PathEditor } from '../../components/PathEditor';
import { provenanceOf } from '../../core/facility';
import { say } from '../../core/useAids';
import { useFacility, useFacilityState } from '../../core/useFacility';
import { useProject, useTeam } from '../../core/useProject';
import { C, F, S } from '../../design/theme';

const MONTH_NAMES = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
/** Six mois à partir du mois en cours : le temps du suivi, de gauche à droite. */
const nextMonths = (from = new Date()) => Array.from({ length: 6 }, (_, k) => MONTH_NAMES[(from.getMonth() + k) % 12]);
const LANES = ['actions', 'partenaires', 'équipe'];

export default function Suivi() {
  // L'équipe de l'établissement (saisie au premier lancement) ; la professionnelle qui a ouvert la séance d'abord.
  const PEOPLE = useTeam();
  const opener = useProject((x) => x.pro) ?? PEOPLE[0] ?? '';
  const f = useFacilityState();
  const act = useFacility((x) => x.act);
  const [others, setOthers] = useState(false);
  const [loadName, setLoadName] = useState('');
  const [loadRhythm, setLoadRhythm] = useState('');
  const [loadCarriers, setLoadCarriers] = useState<string[]>([]);
  const [live, setLive] = useState('');
  const [result, setResult] = useState('');
  const [aided, setAided] = useState(false);
  const noteResult = (back: boolean) => {
    if (!result.trim()) return;
    const [author, prov, conf] = provenanceOf(aided, true, 'groupe');
    act(author, { act: 'result', text: result.trim(), back_to_finding: back }, prov, conf);
    setResult('');
    setAided(false);
    if (back) {
      say('Retour au constat.');
      router.push('/notre-projet/constat');
    }
  };
  const nodes = Object.entries(f.nodes).map(([id, n]) => ({ id, ...n }));
  const months = [...new Set([...nextMonths(), ...nodes.map((n) => n.when)])];
  const lanes = [...new Set([...LANES, ...nodes.map((n) => n.lane)])];
  const commitments = Object.entries(f.commitments);
  const place = useProject((x) => x.setup?.name ?? '');
  const by = opener || 'groupe';

  // Une charge passe d'un porteur à l'autre par le geste : on prend le prénom, on le pose sur un autre.
  const carry = (dragged: string, target: string) => {
    const [load, from] = dragged.split('|');
    const [load2, to] = target.split('|');
    if (load !== load2 || from === to) return;
    const l = f.loads[load];
    const carriers = [...l.carriers.filter((c) => c !== from && c !== to), to];
    act(by, { act: 'load', load, name: l.name, carriers, rhythm: l.rhythm });
    const t = `${l.name} : ${from} passe la main à ${to}.`;
    say(t);
    setLive(t);
  };
  const addLoad = () => {
    if (!loadName.trim() || !loadCarriers.length) return;
    act(by, { act: 'load', load: `charge-${Object.keys(f.loads).length + 1}`, name: loadName.trim(), carriers: loadCarriers, rhythm: loadRhythm.trim() });
    setLoadName('');
    setLoadRhythm('');
    setLoadCarriers([]);
  };

  return (
    <Screen side="pe" title="follow" question="Qui fait quoi, et quand ? Et ce qui en résulte.">
      <ScrollView contentContainerStyle={{ gap: 12 }}>
        {nodes.length > 0 ? (
          <PathView columns={months} lanes={lanes} nodes={nodes} links={f.links} showOthers={others} />
        ) : (
          <Text style={st.small}>Le chemin collectif se pose ici, étape par étape : ce qui est décidé ensemble, ce qui arrive.</Text>
        )}
        <PathEditor
          columns={months}
          lanes={lanes}
          nodes={nodes}
          decisionLabel="décidé ensemble"
          onAdd={(n) => {
            const id = `suivi-${nodes.length + 1}`;
            act(by, { act: 'node_set', node: id, lane: n.lane, kind: n.kind, label: n.label, when: n.when });
            if (n.link) act(by, { act: 'link_set', from: n.link.from, to: id, link: n.link.link });
            say(`${n.label} : posé sur le chemin collectif, ${n.when}.`);
          }}
        />
        <Pressable onPress={() => setOthers(!others)} style={[st.btn, others && st.on]} accessibilityRole="switch" accessibilityState={{ checked: others }}>
          <Text style={[st.btnTxt, others && { color: C.onAccent }]}>🌈 Conditions et dépendances</Text>
        </Pressable>

        <View style={st.box}>
          <Text style={st.h}>Ce que nous portons</Text>
          <DragArea>
            {Object.entries(f.loads).map(([id, l]) => (
              <View key={id} style={st.load}>
                <Text style={[st.loadName, { flex: 1 }]}>{l.name}</Text>
                <View style={st.row}>
                  {l.carriers.map((c) => (
                    <Draggable key={c} id={`${id}|${c}`} label={`${c} porte ${l.name}`}>
                      <Text style={[st.chip, st.btnTxt]}>{c}</Text>
                    </Draggable>
                  ))}
                  {PEOPLE.filter((p) => !l.carriers.includes(p)).map((p) => (
                    <Zone key={p} id={`${id}|${p}`} label={`${p}, pour ${l.name}`} onDrop={(dragged) => carry(dragged, `${id}|${p}`)} style={st.chipTo}>
                      <Text style={st.btnTxt}>{p}</Text>
                    </Zone>
                  ))}
                </View>
                {l.rhythm ? <Text style={st.small}>{l.rhythm}</Text> : null}
              </View>
            ))}
          </DragArea>
          {live ? <Text style={st.small} accessibilityLiveRegion="polite">{live}</Text> : null}
          <View style={st.row}>
            <TextInput value={loadName} onChangeText={setLoadName} placeholder="Ce que nous portons…" style={[st.input, { minHeight: S.touch, flex: 1, minWidth: 200 }]} accessibilityLabel="Nouvelle charge" />
            <TextInput value={loadRhythm} onChangeText={setLoadRhythm} placeholder="à quel rythme" style={[st.input, { minHeight: S.touch, minWidth: 160 }]} accessibilityLabel="Rythme de la charge" />
          </View>
          <View style={st.row}>
            <Text style={st.small}>Qui la porte ?</Text>
            {PEOPLE.map((p) => {
              const on = loadCarriers.includes(p);
              return (
                <Pressable key={p} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => setLoadCarriers(on ? loadCarriers.filter((x) => x !== p) : [...loadCarriers, p])} style={[st.btn, on && st.on]}>
                  <Text style={[st.btnTxt, on && { color: C.onAccent }]}>{p}</Text>
                </Pressable>
              );
            })}
            <Pressable accessibilityRole="button" onPress={addLoad} style={[st.btn, st.on]}>
              <Text style={[st.btnTxt, { color: C.onAccent }]}>＋ Une charge</Text>
            </Pressable>
          </View>
          <Text style={st.small}>On remarque les prénoms : chacun apporte ce qu’il peut.</Text>
        </View>

        <View style={st.box}>
          <Text style={st.h}>Ce qui en résulte</Text>
          {f.results.map((r, i) => <Text key={i} style={st.result}>📊 {r.text}{r.backToFinding ? ' → retour au constat 🔁' : ''}</Text>)}
          <TextInput value={result} onChangeText={setResult} multiline placeholder="« Au printemps : 5 personnes chaque mardi, 3 comprennent seules leurs courriers. Les relances restent dures. »" style={st.input} accessibilityLabel="Résultat" />
          <AideButton kind="phrase" label="Mettre en mots le résultat" text={result} who="Le groupe" onProposal={(p) => { setResult(p); setAided(true); }} />
          <View style={st.row}>
            <Pressable onPress={() => noteResult(false)} style={st.btn} accessibilityRole="button"><Text style={st.btnTxt}>Noter le résultat</Text></Pressable>
            <Pressable onPress={() => noteResult(true)} style={[st.btn, st.on]} accessibilityRole="button"><Text style={[st.btnTxt, { color: C.onAccent }]}>🔁 Retour au constat</Text></Pressable>
          </View>
        </View>

        {commitments.length > 0 && (
          <View style={st.box}>
            <Text style={st.h}>Proposer aux personnes</Text>
            <Text style={st.small}>Le collectif ne lit jamais leur chemin : il propose, et chacune choisit de relier, depuis son espace.</Text>
            {commitments.map(([id, c]) =>
              f.proposals[`p-${id}`] ? (
                <Text key={id} style={st.result}>📣 {f.proposals[`p-${id}`]}</Text>
              ) : (
                <Pressable key={id} onPress={() => act(by, { act: 'proposal', proposal: `p-${id}`, text: c.text })} style={[st.btn, st.on]} accessibilityRole="button">
                  <Text style={[st.btnTxt, { color: C.onAccent }]}>{place} propose : {c.text}</Text>
                </Pressable>
              ),
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
