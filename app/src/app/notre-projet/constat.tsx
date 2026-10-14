// 08 Constat — la table du Ressenti, au pluriel. La tablette circule : la parole se voit.
// Chaque carte porte sa source et son auteur ; la qualification est décidée par le groupe,
// en mots : situation individuelle → signal à vérifier → difficulté répétée → enjeu confirmé.
// Un cas isolé reste un signal ; il faut plusieurs voix pour faire un constat.

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AideButton } from '../../components/AideButton';
import { DictateButton } from '../../components/DictateButton';
import { Screen } from '../../components/Chrome';
import { DragArea, Draggable, Zone } from '../../components/Drag';
import type { Feeling } from '../../core/acts';
import { QUALIF_WORDS, SOURCE_WORDS, type Qualification, type Source } from '../../core/facility';
import { say } from '../../core/useAids';
import { useFacility, useFacilityState } from '../../core/useFacility';
import { useProject, useTeam } from '../../core/useProject';
import { C, F, S } from '../../design/theme';

const ZONES: [Feeling, string, string][] = [
  ['fine', 'Ça va chez nous', C.feeling.fine],
  ['unsure', 'Nous hésitons', C.feeling.unsure],
  ['hard', "C'est difficile chez nous", C.feeling.hard],
];
const LADDER: Qualification[] = ['individual', 'signal', 'repeated', 'confirmed'];

export default function Constat() {
  // L'équipe de l'établissement (saisie au premier lancement) ; la professionnelle qui a ouvert la séance d'abord.
  const PEOPLE = useTeam();
  const opener = useProject((x) => x.pro) ?? PEOPLE[0] ?? '';
  const f = useFacilityState();
  const act = useFacility((x) => x.act);
  const [title, setTitle] = useState('');
  const [source, setSource] = useState<Source>('team');
  const [reading, setReading] = useState('');
  const speaker = f.floor ?? (f.mandate || opener);
  const [mandating, setMandating] = useState(false);
  const [live, setLive] = useState('');
  const tell = (t: string) => {
    say(t);
    setLive(t);
  };
  const giveMandate = (to: string) => {
    act('groupe', { act: 'mandate_set', to });
    tell(to ? `Le groupe confie l'animation à ${to}.` : "Le groupe reprend le mandat d'animation.");
    setMandating(false);
  };
  const session = f.attendance?.session ?? 'séance';
  // Les sujets consentis (écran 07) arrivent sur la table, à placer.
  const fromAgenda = f.agenda.filter((a) => a.source === 'consented_word' && !f.findings[a.item]);

  const place = (id: string, zone: Feeling) => {
    const fromA = fromAgenda.find((a) => a.item === id);
    const existing = f.findings[id];
    act(speaker, { act: 'finding_placed', finding: id, title: existing?.title ?? fromA?.title ?? id, zone, source: existing?.source ?? fromA?.source ?? 'team', author: existing?.author ?? (fromA ? 'Amina' : speaker) });
    tell(`${speaker} pose une carte.`);
  };
  const qualify = (id: string) => {
    const next = LADDER[(LADDER.indexOf(f.findings[id].level) + 1) % LADDER.length];
    act(speaker, { act: 'finding_qualified', finding: id, level: next });
    tell(`${f.findings[id].title} : ${QUALIF_WORDS[next]}.`);
  };
  // La relecture : une phrase par zone, lue à voix haute ; le groupe corrige les cartes, pas la machine.
  const draft = ZONES.map(([z, label]) => {
    const titles = Object.values(f.findings).filter((x) => x.zone === z).map((x) => x.title);
    return titles.length ? `${label} : ${titles.join(', ')}.` : '';
  }).filter(Boolean).join(' ');
  const add = () => {
    if (!title.trim()) return;
    act(speaker, { act: 'finding_placed', finding: `c-${Object.keys(f.findings).length + 1}`, title: title.trim(), zone: 'unsure', source, author: speaker });
    setTitle('');
  };

  return (
    <Screen side="pe" title="finding" question="Où en sommes-nous ? On croise plusieurs voix.">
      <ScrollView contentContainerStyle={{ gap: 12 }}>
        <View style={st.row}>
          <Text style={st.small}>{f.mandate ? `${f.mandate} anime, par mandat du groupe.` : 'Personne n’anime pour l’instant.'}</Text>
          {f.mandate ? (
            <Pressable accessibilityRole="button" onPress={() => giveMandate('')} style={st.btn}>
              <Text style={st.btnTxt}>Retirer le mandat</Text>
            </Pressable>
          ) : null}
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: mandating }} onPress={() => setMandating(!mandating)} style={st.btn}>
            <Text style={st.btnTxt}>{f.mandate ? 'Le confier à une autre personne' : 'Confier l’animation'}</Text>
          </Pressable>
          {mandating && PEOPLE.filter((p) => p !== f.mandate).map((p) => (
            <Pressable key={p} accessibilityRole="button" onPress={() => giveMandate(p)} style={[st.btn, st.on]}>
              <Text style={[st.btnTxt, { color: C.onAccent }]}>{p}</Text>
            </Pressable>
          ))}
        </View>
        <View style={st.row}>
          <Text style={st.floor}>🎙️ La parole est à {speaker}</Text>
          {PEOPLE.filter((p) => p !== speaker).map((p) => (
            <Pressable key={p} onPress={() => { act(speaker, { act: 'floor_given', session, to: p }); tell(`La parole est à ${p}.`); }} style={st.btn} accessibilityRole="button">
              <Text style={st.btnTxt}>→ {p}</Text>
            </Pressable>
          ))}
        </View>
        <DragArea>
          <View style={st.zones}>
            {ZONES.map(([z, label, bg]) => (
              <Zone key={z} id={z} label={label} onDrop={(id) => place(id, z)} style={{ ...st.zone, backgroundColor: bg }}>
                <Text style={st.zoneTitle}>{label}</Text>
                {Object.entries(f.findings).filter(([, c]) => c.zone === z).map(([id, c]) => (
                  <View key={id} style={st.cardWrap}>
                    <Draggable id={id} label={c.title}>
                      <View style={st.card}>
                        <Text style={st.cardTitle}>{c.title}</Text>
                        <Text style={st.small}>{SOURCE_WORDS[c.source]} · {c.author}</Text>
                      </View>
                    </Draggable>
                    <Pressable onPress={() => qualify(id)} style={st.qual} accessibilityRole="button" accessibilityLabel={`Qualification de « ${c.title} » : ${QUALIF_WORDS[c.level]}. Toucher pour changer.`}>
                      <Text style={st.qualTxt}>{QUALIF_WORDS[c.level]}</Text>
                    </Pressable>
                  </View>
                ))}
              </Zone>
            ))}
          </View>
          {fromAgenda.length > 0 && (
            <View style={st.tray}>
              <Text style={st.small}>Venu de l’ordre du jour, à placer :</Text>
              {fromAgenda.map((a) => (
                <Draggable key={a.item} id={a.item} label={a.title}><View style={st.card}><Text style={st.cardTitle}>{a.title}</Text><Text style={st.small}>{SOURCE_WORDS[a.source]}</Text></View></Draggable>
              ))}
            </View>
          )}
        </DragArea>
        <View style={[st.row, st.addRow]}>
          <TextInput value={title} onChangeText={setTitle} placeholder={`${speaker} pose une carte…`} style={st.input} accessibilityLabel="Nouvelle carte du constat" />
          <DictateButton label="🎙" onText={setTitle} />
          {(['team', 'cvs', 'consented_word'] as Source[]).map((s) => (
            <Pressable accessibilityRole="button" key={s} onPress={() => setSource(s)} style={[st.btn, source === s && st.on]}><Text style={[st.btnTxt, source === s && { color: C.onAccent }]}>{SOURCE_WORDS[s]}</Text></Pressable>
          ))}
          <Pressable accessibilityRole="button" onPress={add} style={[st.btn, st.on]}><Text style={[st.btnTxt, { color: C.onAccent }]}>Poser</Text></Pressable>
        </View>
        {live ? <Text style={st.live} accessibilityLiveRegion="polite">{live}</Text> : null}
        <Text style={st.small}>Un cas isolé reste un signal ; il faut plusieurs voix pour faire un constat. Chaque parole garde le nom de qui l’a dite.</Text>
        <View style={st.tray}>
          <Text style={st.cardTitle}>Relire le constat à voix haute</Text>
          <TextInput value={reading || draft} onChangeText={setReading} multiline style={st.input} accessibilityLabel="Relecture du constat" />
          <View style={st.row}>
            <AideButton kind="narrate" label="Une phrase par carte" text={reading || draft} who="Le groupe" onProposal={setReading} />
            <Pressable accessibilityRole="button" onPress={() => say(reading || draft)} style={st.btn}><Text style={st.btnTxt}>🔊 Lire à voix haute</Text></Pressable>
          </View>
          <Text style={st.small}>Si une phrase ne va pas, le groupe corrige la carte elle-même.</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  addRow: { padding: 12, borderRadius: S.radius, backgroundColor: C.surface },
  floor: { fontFamily: F.bold, fontSize: 17, color: C.ink, paddingHorizontal: 14, paddingVertical: 8, borderRadius: S.radiusPill, backgroundColor: C.lavender, overflow: 'hidden' },
  zones: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  zone: { flex: 1, minWidth: 240, minHeight: 200, gap: 8 },
  zoneTitle: { fontFamily: F.bold, fontSize: 17, color: C.ink },
  card: { padding: 10, borderRadius: 12, backgroundColor: C.surface, gap: 4, borderTopWidth: 4, borderTopColor: C.pe.value },
  cardTitle: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  cardWrap: { gap: 4 },
  qual: { alignSelf: 'flex-start', minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 10, borderRadius: S.radiusPill, backgroundColor: C.pe.soft },
  qualTxt: { fontFamily: F.bold, fontSize: 12, color: C.pe.ink },
  tray: { marginTop: 12, padding: 12, borderRadius: S.radius, backgroundColor: C.surface2, gap: 8 },
  small: { fontFamily: F.body, fontSize: 13, color: C.muted },
  live: { fontFamily: F.bold, fontSize: 15, color: C.ink, padding: 10, borderRadius: S.radius, backgroundColor: C.surface },
  input: { flex: 1, minWidth: 220, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 10, fontFamily: F.body, fontSize: 16, color: C.ink },
  btn: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 14, borderRadius: S.radiusPill, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  on: { backgroundColor: C.violetInk, borderColor: C.violetInk },
  btnTxt: { fontFamily: F.bold, fontSize: 14, color: C.ink },
});
