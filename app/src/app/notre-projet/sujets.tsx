// 07 Sujets — le sas. Les deux versions côte à côte : Amina voit exactement ce que verront les autres.
// Seul passe ce qu'elle choisit d'apporter, sous la forme qu'elle choisit ; « Pas maintenant » reste
// possible. Le sujet entre à l'ordre du jour, avec sa source ; la Carte passe du jaune au vert.

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '../../components/Chrome';
import { AideRefusal, askAide } from '../../core/aides';
import { SOURCE_WORDS } from '../../core/facility';
import { say } from '../../core/useAids';
import { useFacility, useFacilityState } from '../../core/useFacility';
import { useProject, useProjectState } from '../../core/useProject';
import { C, F, S } from '../../design/theme';

export default function Sujets() {
  const p = useProjectState();
  const f = useFacilityState();
  const actP = useProject((x) => x.act);
  const actF = useFacility((x) => x.act);
  const card = p.cards.papiers;
  const subject = p.subjects.courriers;
  const brought = f.agenda.some((a) => a.item === 'courriers');
  const [collective, setCollective] = useState(subject?.forCollective ?? 'Comprendre les courriers administratifs est difficile pour plusieurs personnes.');
  const [notNow, setNotNow] = useState(false);
  const [aideMsg, setAideMsg] = useState('');
  const session = f.attendance?.session ?? 'prochaine séance';

  const bring = () => {
    // Le sas : la version « pour le collectif » seulement. Au lot 5 : Consent{Publish} → Crystallization → project() → tableau dieidos.
    actP('amina', { act: 'subject_prepared', subject: 'courriers', card: 'papiers', mine: card?.verbatim ?? '', for_collective: collective });
    actF('amina', { act: 'agenda_item', item: 'courriers', title: collective, source: 'consented_word', session });
    say("Oui, j'apporte. Le sujet entre à l'ordre du jour.");
  };

  return (
    <Screen side="pe" title="subjects" question="Quels sujets travailler ? Seulement si la personne le veut.">
      <ScrollView contentContainerStyle={{ gap: 16 }}>
        {card && (
          <View style={st.sas}>
            <View style={[st.version, { borderTopColor: C.pp.value, backgroundColor: brought ? C.pe.soft : C.pp.soft }]}>
              <Text style={st.kicker}>MA VERSION — AMINA</Text>
              <Text style={st.quote}>« {card.verbatim} »</Text>
            </View>
            <Text style={st.arrow}>→</Text>
            <View style={[st.version, { borderTopColor: C.pe.value }]}>
              <Text style={st.kicker}>POUR LE COLLECTIF</Text>
              {brought ? <Text style={st.quote}>{collective}</Text> : (
                <>
                  <TextInput value={collective} onChangeText={setCollective} multiline style={st.input} accessibilityLabel="Version pour le collectif" />
                  <Pressable
                    accessibilityRole="button"
                    onPress={async () => {
                      try {
                        const r = await askAide({ kind: 'generalize', text: card.title === 'Papiers' ? 'Comprendre les courriers administratifs' : card.verbatim });
                        setCollective(r.proposal);
                        setAideMsg(r.offline ? 'Exemple hors ligne (sans IA). Amina relit et peut changer.' : 'Proposition. Amina relit et peut changer.');
                      } catch (e) {
                        setAideMsg(e instanceof AideRefusal ? e.message : "L'aide n'a pas répondu.");
                      }
                    }}
                    style={[st.btn, { alignSelf: 'flex-start' }]}>
                    <Text style={st.btnTxt}>✨ Proposer une formulation générale</Text>
                  </Pressable>
                  {aideMsg ? <Text style={st.small}>{aideMsg}</Text> : null}
                </>
              )}
            </View>
          </View>
        )}
        {card && !brought && (
          <View style={st.ask}>
            <Text style={st.question}>Amina · C'est bien ce que tu veux dire au CHRS ? Ton dossier reste chez toi.</Text>
            <View style={st.row}>
              <Pressable onPress={bring} style={[st.btn, st.primary]} accessibilityRole="button"><Text style={[st.btnTxt, { color: '#fff' }]}>Oui, j'apporte</Text></Pressable>
              <Pressable onPress={() => { setNotNow(true); say('Pas maintenant. Rien ne passe.'); }} style={st.btn} accessibilityRole="button"><Text style={st.btnTxt}>Pas maintenant</Text></Pressable>
            </View>
            {notNow && <Text style={st.small}>Rien ne passe. Tu pourras le proposer plus tard, si tu veux.</Text>}
          </View>
        )}

        <View style={st.agenda}>
          <Text style={st.h}>Ordre du jour · {session}</Text>
          {f.agenda.map((a) => (
            <View key={a.item} style={[st.item, a.item === 'courriers' && st.itemNew]}>
              <Text style={st.itemTitle}>{a.title}</Text>
              <Text style={st.small}>{SOURCE_WORDS[a.source]}</Text>
            </View>
          ))}
        </View>
        {f.attendance && (
          <View style={st.row}>
            {f.attendance.present.map((n) => <Text key={n} style={st.chip}>{n}{n === f.attendance!.facilitator ? ' · anime' : ''}</Text>)}
            {f.attendance.absent.map((n) => <Text key={n} style={[st.chip, st.absent]}>{n} · absente, c'est normal</Text>)}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const st = StyleSheet.create({
  sas: { flexDirection: 'row', gap: 12, alignItems: 'stretch', flexWrap: 'wrap' },
  version: { flex: 1, minWidth: 260, padding: 16, borderRadius: S.radius, backgroundColor: C.surface, borderTopWidth: 6, gap: 6 },
  kicker: { fontFamily: F.bold, fontSize: 12, letterSpacing: 1, color: C.slate },
  quote: { fontFamily: F.display, fontSize: 20, color: C.ink },
  arrow: { alignSelf: 'center', fontSize: 28, color: C.violet },
  input: { minHeight: 70, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 10, fontFamily: F.body, fontSize: 17, color: C.ink },
  ask: { padding: 16, borderRadius: S.radius, backgroundColor: C.surface, gap: 10 },
  question: { fontFamily: F.bold, fontSize: 17, color: C.ink },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  btn: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 18, borderRadius: S.radiusPill, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  primary: { backgroundColor: C.violetInk, borderColor: C.violetInk },
  btnTxt: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  small: { fontFamily: F.body, fontSize: 13, color: C.muted },
  agenda: { padding: 16, borderRadius: S.radius, backgroundColor: C.surface, gap: 8 },
  h: { fontFamily: F.bold, fontSize: 17, color: C.ink },
  item: { padding: 12, borderRadius: 12, backgroundColor: C.surface2, borderLeftWidth: 5, borderLeftColor: C.pe.value },
  itemNew: { backgroundColor: C.pe.soft },
  itemTitle: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: S.radiusPill, backgroundColor: C.surface, fontFamily: F.bold, fontSize: 14, color: C.ink, overflow: 'hidden' },
  absent: { color: C.muted, fontFamily: F.body },
});
