// 09 Cap — le même Ikigai, au pluriel. Placements à tour de rôle ou à main levée, guidés par
// l'animatrice ; quand deux personnes placent différemment, les deux positions restent à l'écran,
// chacune à son nom. Puis le changement attendu, formulé pour pouvoir être observé.

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AideButton } from '../../components/AideButton';

import {DragArea, Draggable, Zone } from '../../components/Drag';
import { Screen } from '../../components/Chrome';
import { Ikigai } from '../../components/Ikigai';
import type { Circle, Crossing, Spot } from '../../core/acts';
import { say } from '../../core/useAids';
import { provenanceOf } from '../../core/facility';
import { useFacility, useFacilityState } from '../../core/useFacility';
import { useProject, useTeam } from '../../core/useProject';
import { C, F, S } from '../../design/theme';

const WORDS: Record<Circle | Crossing, string> = {
  love: '❤️ Nous aimons', able: '🛠️ Nous en sommes capables', useful: '🤝 Nous sommes utiles', living: '💶 Nous en vivons',
  passion: 'Passion', mission: 'Mission', profession: 'Profession', vocation: 'Vocation',
};
const same = (a: Spot, b: Spot) => JSON.stringify(a) === JSON.stringify(b);

export default function Cap() {
  // L'équipe de l'établissement (saisie au premier lancement) ; la professionnelle qui a ouvert la séance d'abord.
  const PEOPLE = useTeam();
  const opener = useProject((x) => x.pro) ?? PEOPLE[0] ?? '';
  const f = useFacilityState();
  const act = useFacility((x) => x.act);
  const [by, setBy] = useState(f.mandate || opener);
  const [title, setTitle] = useState('');
  const [live, setLive] = useState('');
  const [change, setChange] = useState(f.expectedChange?.text ?? '');
  const [aided, setAided] = useState(false);
  const [hands, setHands] = useState<string[] | null>(null); // null : à tour de rôle
  const sayChange = (validated: boolean) => {
    if (!change.trim()) return;
    const [author, prov, conf] = provenanceOf(aided, validated, by);
    act(author, { act: 'expected_change', cap: caps[0]?.[0] ?? '', text: change.trim(), validated }, prov, conf);
  };

  const caps = Object.entries(f.caps);
  // Les constats confirmés ou répétés peuvent devenir un cap.
  const fromFindings = Object.entries(f.findings).filter(([id, c]) => (c.level === 'repeated' || c.level === 'confirmed') && !f.caps[`cap-${id}`]);
  const unplaced = caps.filter(([, c]) => !c.placements.some((p) => p.by === by && p.spot.at !== 'tray'));

  const place = (cap: string, spot: Spot, words: string) => {
    const t = f.caps[cap]?.title ?? f.findings[cap.replace(/^cap-/, '')]?.title ?? cap;
    const who = hands ?? [by];
    if (!who.length) return;
    for (const p of who) act(p, { act: 'cap_placed', cap, title: t, by: p, spot });
    const line = `${who.join(', ')} ${who.length > 1 ? 'placent' : 'place'} « ${t} » : ${words}.`;
    say(line);
    setLive(line);
  };

  return (
    <Screen side="pe" title="course" question="Que voulons-nous améliorer ? Le constat devient un cap, et un changement observable.">
      <ScrollView contentContainerStyle={{ gap: 12 }}>
        <View style={st.row}>
          <Pressable accessibilityRole="radio" accessibilityState={{ checked: hands === null }} onPress={() => setHands(null)} style={[st.btn, hands === null && st.on]}>
            <Text style={[st.btnTxt, hands === null && { color: C.onAccent }]}>À tour de rôle</Text>
          </Pressable>
          <Pressable accessibilityRole="radio" accessibilityState={{ checked: hands !== null }} onPress={() => setHands([])} style={[st.btn, hands !== null && st.on]}>
            <Text style={[st.btnTxt, hands !== null && { color: C.onAccent }]}>À main levée</Text>
          </Pressable>
        </View>
        {hands !== null && (
          <View style={st.row}>
            <Text style={st.small}>Qui lève la main ?</Text>
            {PEOPLE.map((p) => {
              const on = hands.includes(p);
              return (
                <Pressable key={p} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => setHands(on ? hands.filter((x) => x !== p) : [...hands, p])} style={[st.btn, on && st.on]}>
                  <Text style={[st.btnTxt, on && { color: C.onAccent }]}>✋ {p}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
        {live ? <Text style={st.small} accessibilityLiveRegion="polite">{live}</Text> : null}
        <View style={[st.row, hands !== null && { display: 'none' }]}>
          <Text style={st.small}>À tour de rôle, guidé par {f.mandate || "l'animatrice"} — place :</Text>
          {PEOPLE.map((p) => (
            <Pressable key={p} onPress={() => setBy(p)} style={[st.btn, by === p && st.on]} accessibilityRole="radio" accessibilityState={{ checked: by === p }}>
              <Text style={[st.btnTxt, by === p && { color: C.onAccent }]}>{p}</Text>
            </Pressable>
          ))}
        </View>
        <DragArea>
          <Ikigai
            label={(k) => WORDS[k]}
            onDrop={place}
            at={(spot) => caps.flatMap(([id, c]) => c.placements.filter((p) => same(p.spot, spot)).map((p) => {
              const mark = (
                <View key={`${id}-${p.by}`} style={[st.mark, p.by !== by && st.ghost]}>
                  <Text style={st.markTxt}>{c.title}</Text>
                  <Text style={st.markBy}>{p.by}</Text>
                </View>
              );
              // Sa propre marque se reprend : on la repose ailleurs, ou dans le bac.
              return p.by === by && hands === null ? <Draggable key={`${id}-${p.by}`} id={id} label={`${c.title} · ${p.by}`}>{mark}</Draggable> : mark;
            }))}
          />
          <Zone id="bac" label="Le bac" accepts={(id) => !!f.caps[id]?.placements.some((p) => p.by === by && p.spot.at !== 'tray')} onDrop={(id) => place(id, { at: 'tray' }, 'reprise')} style={st.tray}>
            <Text style={st.small}>Cartes de cap à placer par {by} :</Text>
            <View style={st.row}>
              {[...unplaced.map(([id, c]) => [id, c.title] as const), ...fromFindings.map(([id, c]) => [`cap-${id}`, c.title] as const)].map(([id, t]) => (
                <Draggable key={id} id={id} label={t}><View style={st.card}><Text style={st.markTxt}>{t}</Text></View></Draggable>
              ))}
            </View>
            <View style={st.row}>
              <TextInput value={title} onChangeText={setTitle} placeholder="Une carte de cap, dite par le groupe…" style={st.input} accessibilityLabel="Nouvelle carte de cap" />
              <Pressable accessibilityRole="button" onPress={() => { if (title.trim()) { act(by, { act: 'cap_placed', cap: `cap-${caps.length + 1}`, title: title.trim(), by, spot: { at: 'tray' } }); setTitle(''); } }} style={[st.btn, st.on]}>
                <Text style={[st.btnTxt, { color: C.onAccent }]}>Ajouter</Text>
              </Pressable>
            </View>
          </Zone>
        </DragArea>
        {caps.some(([, c]) => new Set(c.placements.filter((p) => p.spot.at !== 'tray').map((p) => JSON.stringify(p.spot))).size > 1) && (
          <Text style={st.note}>Deux placements · à discuter. Les deux positions restent à l’écran.</Text>
        )}
        <View style={st.change}>
          <Text style={st.h}>Changement attendu</Text>
          <TextInput value={change} onChangeText={setChange} multiline placeholder="Ce que nous voulons voir changer, en une phrase qui s'observe" style={st.input} accessibilityLabel="Changement attendu" />
          <AideButton kind="phrase" label="Mettre en mots ce que le groupe a dit" text={change} who="Le groupe" onProposal={(p) => { setChange(p); setAided(true); }} />
          <View style={st.row}>
            <Pressable accessibilityRole="button" onPress={() => sayChange(false)} style={st.btn}><Text style={st.btnTxt}>À discuter</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={() => sayChange(true)} style={[st.btn, st.on]}><Text style={[st.btnTxt, { color: C.onAccent }]}>Validé par le groupe</Text></Pressable>
          </View>
          {f.expectedChange && <Text style={st.small}>{f.expectedChange.validated ? '✓ validé' : 'à discuter'} : {f.expectedChange.text}</Text>}
        </View>
      </ScrollView>
    </Screen>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  small: { fontFamily: F.body, fontSize: 13, color: C.muted },
  btn: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 14, borderRadius: S.radiusPill, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  on: { backgroundColor: C.violetInk, borderColor: C.violetInk },
  btnTxt: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  mark: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: C.surface },
  ghost: { opacity: 0.7, borderWidth: 1, borderStyle: 'dashed', borderColor: C.slate },
  markTxt: { fontFamily: F.bold, fontSize: 13, color: C.ink },
  markBy: { fontFamily: F.body, fontSize: 11, color: C.muted },
  tray: { marginTop: 12, padding: 12, borderRadius: S.radius, backgroundColor: C.surface2, gap: 8 },
  card: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: C.surface, borderTopWidth: 4, borderTopColor: C.pe.value },
  input: { flex: 1, minWidth: 240, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 10, fontFamily: F.body, fontSize: 16, color: C.ink, backgroundColor: C.surface },
  note: { fontFamily: F.bold, fontSize: 14, color: C.warn.ink, padding: 10, borderRadius: S.radius, backgroundColor: C.warn.soft },
  change: { padding: 14, borderRadius: S.radius, backgroundColor: C.surface, gap: 8 },
  h: { fontFamily: F.bold, fontSize: 17, color: C.ink },
});
