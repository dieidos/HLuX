// 07 Sujets — le sas. Les deux versions côte à côte : Amina voit exactement ce que verront les autres.
// Seul passe ce qu'elle choisit d'apporter, sous la forme qu'elle choisit ; « Pas maintenant » reste
// possible. Le sujet entre à l'ordre du jour, avec sa source ; la Carte passe du jaune au vert.

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '../../components/Chrome';
import { AideRefusal, askAide, guard } from '../../core/aides';
import { SOURCE_WORDS } from '../../core/facility';
import { say } from '../../core/useAids';
import { useFacility, useFacilityState } from '../../core/useFacility';
import { useMe, useProject, useProjectState, useTeam } from '../../core/useProject';
import { C, F, S } from '../../design/theme';

export default function Sujets() {
  const me = useMe();
  const p = useProjectState();
  const f = useFacilityState();
  const actP = useProject((x) => x.act);
  const actF = useFacility((x) => x.act);
  const team = useTeam();
  const pro = useProject((x) => x.pro) ?? '';
  // Quelle Carte apporter ? C'est la personne qui choisit, parmi les siennes.
  const cards = Object.entries(p.cards);
  const [cardId, setCardId] = useState<string | null>(null);
  const chosen = cardId ?? (cards.length === 1 ? cards[0][0] : null);
  const card = chosen ? p.cards[chosen] : null;
  const subjectId = chosen ? `sujet-${me.id}-${chosen}` : '';
  const subject = Object.entries(p.subjects).find(([, x]) => x.card === chosen)?.[1];
  const brought = !!chosen && f.agenda.some((a) => a.item === subjectId);
  const [collective, setCollective] = useState('');
  const [notNow, setNotNow] = useState(false);
  const [aideMsg, setAideMsg] = useState('');
  const [aided, setAided] = useState(false);
  const [newSession, setNewSession] = useState(false);
  // La séance : sa date, qui est là, qui anime. Une absence se dit simplement.
  const [date, setDate] = useState('');
  const [present, setPresent] = useState<string[]>(pro ? [pro] : []);
  const session = f.attendance?.session ?? '';

  const bring = () => {
    if (!card || !collective.trim() || !session) return;
    try {
      guard(collective);
    } catch (e) {
      setAideMsg(e instanceof AideRefusal ? e.message : '');
      return;
    }
    // Le sas : la version « pour le collectif » seulement. Au lot 5 : Consent{Publish} → Crystallization → project() → tableau dieidos.
    actP(aided ? 'hlux-ia' : me.id, { act: 'subject_prepared', subject: subjectId, card: chosen!, mine: card.verbatim || card.title, for_collective: collective.trim() }, aided ? 'generated' : 'by_hand', aided ? me.id : undefined);
    actF(me.id, { act: 'agenda_item', item: subjectId, title: collective.trim(), source: 'consented_word', session });
    say("Oui, j'apporte. Le sujet entre à l'ordre du jour.");
  };
  const holdSession = () => {
    if (!date.trim() || !present.length) return;
    setNewSession(false);
    actF(pro || present[0], { act: 'attendance', session: date.trim(), present, absent: team.filter((t) => !present.includes(t)), facilitator: present.includes(pro) ? pro : present[0] });
  };

  return (
    <Screen side="pe" title="subjects" question="Quels sujets travailler ? Seulement si la personne le veut.">
      <ScrollView contentContainerStyle={{ gap: 16 }}>
        {f.attendance && !newSession && (
          <Pressable accessibilityRole="button" onPress={() => setNewSession(true)} style={[st.btn, { alignSelf: 'flex-start' }]}>
            <Text style={st.btnTxt}>＋ Nouvelle séance</Text>
          </Pressable>
        )}
        {(!f.attendance || newSession) && (
          <View style={st.ask}>
            <Text style={st.h}>La séance</Text>
            <TextInput value={date} onChangeText={setDate} placeholder="La date, en mots (mardi 12 janvier…)" style={st.input} accessibilityLabel="Date de la séance" />
            <Text style={st.small}>Qui est là ?</Text>
            <View style={st.row}>
              {team.map((t) => {
                const on = present.includes(t);
                return (
                  <Pressable key={t} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => setPresent(on ? present.filter((x) => x !== t) : [...present, t])} style={[st.btn, on && st.primary]}>
                    <Text style={[st.btnTxt, on && { color: C.onAccent }]}>{t}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable accessibilityRole="button" onPress={holdSession} style={[st.btn, st.primary, { alignSelf: 'flex-start' }]}>
              <Text style={[st.btnTxt, { color: C.onAccent }]}>Ouvrir l’ordre du jour</Text>
            </Pressable>
          </View>
        )}
        {cards.length === 0 && <Text style={st.small}>{me.name} n’a pas encore de Carte : rien à apporter pour l’instant.</Text>}
        {cards.length > 1 && (
          <View style={st.row}>
            <Text style={st.small}>Quelle Carte apporter ?</Text>
            {cards.map(([id, c]) => (
              <Pressable key={id} accessibilityRole="radio" accessibilityState={{ checked: chosen === id }} onPress={() => { setCardId(id); setCollective(''); setNotNow(false); }} style={[st.btn, chosen === id && st.primary]}>
                <Text style={[st.btnTxt, chosen === id && { color: C.onAccent }]}>{c.title}</Text>
              </Pressable>
            ))}
          </View>
        )}
        {card && (
          <View style={st.sas}>
            <View style={[st.version, { borderTopColor: C.pp.value, backgroundColor: brought ? C.pe.soft : C.pp.soft }]}>
              <Text style={st.kicker}>MA VERSION — {me.name.toUpperCase()}</Text>
              <Text style={st.quote}>« {card.verbatim} »</Text>
            </View>
            <Text style={st.arrow}>→</Text>
            <View style={[st.version, { borderTopColor: C.pe.value }]}>
              <Text style={st.kicker}>POUR LE COLLECTIF</Text>
              {brought ? <Text style={st.quote}>{subject?.forCollective ?? collective}</Text> : (
                <>
                  <TextInput value={collective} onChangeText={setCollective} multiline placeholder="Une phrase pour tous, sans nom ni détail personnel" style={st.input} accessibilityLabel="Version pour le collectif" />
                  <Pressable
                    accessibilityRole="button"
                    onPress={async () => {
                      try {
                        const r = await askAide({ kind: 'generalize', text: card.verbatim || card.title });
                        setCollective(r.proposal);
                        setAided(true);
                        setAideMsg(r.offline ? `Exemple hors ligne (sans IA). ${me.name} relit et peut changer.` : `Proposition. ${me.name} relit et peut changer.`);
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
            <Text style={st.question}>{me.name} · C’est bien ce que tu veux dire au collectif ? Ton dossier reste chez toi.</Text>
            <View style={st.row}>
              <Pressable onPress={bring} style={[st.btn, st.primary]} accessibilityRole="button"><Text style={[st.btnTxt, { color: C.onAccent }]}>Oui, j’apporte</Text></Pressable>
              <Pressable onPress={() => { setNotNow(true); say('Pas maintenant. Rien ne passe.'); }} style={st.btn} accessibilityRole="button"><Text style={st.btnTxt}>Pas maintenant</Text></Pressable>
            </View>
            {notNow && <Text style={st.small}>Rien ne passe. Tu pourras le proposer plus tard, si tu veux.</Text>}
            {!session && <Text style={st.small}>D’abord la séance, plus haut : sa date et qui est là.</Text>}
            {session && !collective.trim() && <Text style={st.small}>Écris d’abord la phrase pour le collectif.</Text>}
          </View>
        )}

        <View style={st.agenda}>
          <Text style={st.h}>Ordre du jour{session ? ` · ${session}` : ''}</Text>
          {f.agenda.length === 0 && <Text style={st.small}>Rien pour l’instant.</Text>}
          {f.agenda.map((a) => (
            <View key={a.item} style={[st.item, a.item === subjectId && st.itemNew]}>
              <Text style={st.itemTitle}>{a.title}</Text>
              <Text style={st.small}>{SOURCE_WORDS[a.source]}</Text>
            </View>
          ))}
        </View>
        {f.attendance && (
          <View style={st.row}>
            {f.attendance.present.map((n) => <Text key={n} style={st.chip}>{n}{n === f.attendance!.facilitator ? ' · anime' : ''}</Text>)}
            {f.attendance.absent.map((n) => <Text key={n} style={[st.chip, st.absent]}>{n} · absente, c’est normal</Text>)}
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
