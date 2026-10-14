// 07 Sujets — le sas. Les deux versions côte à côte : Amina voit exactement ce que verront les autres.
// Seul passe ce qu'elle choisit d'apporter, sous la forme qu'elle choisit ; « Pas maintenant » reste
// possible. Le sujet entre à l'ordre du jour, avec sa source ; la Carte passe du jaune au vert.

import { More } from '../../components/More';
import { Picto } from '../../components/Picto';
import { useThreadCards } from '../../core/useThread';
import { usePathname } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '../../components/Chrome';
import { AideRefusal, askAide, guard } from '../../core/aides';
import { dayInWords } from '../../core/dates';
import { freshId } from '../../core/ids';
import { refusalAr } from '../../i18n/refusals';
import { SOURCE_WORDS } from '../../core/facility';
import { tell, tNow, useT } from '../../core/useAids';
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
  const fil = useThreadCards();
  const fromFil = [...fil].reverse().find((c) => cards.some(([id]) => id === c.id))?.id ?? null;
  const chosen = cardId ?? fromFil ?? (cards.length === 1 ? cards[0][0] : null);
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
  const [guests, setGuests] = useState('');
  const [cvs, setCvs] = useState(false);
  // Un point de l'équipe ou du CVS à l'ordre du jour.
  const [item, setItem] = useState('');
  const [itemSource, setItemSource] = useState<'team' | 'cvs'>('team');
  const t = useT();
  const pathname = usePathname();
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
    actF(me.id, { act: 'agenda_item', item: subjectId, title: collective.trim(), source: 'consented_word', session, picto: card.picto });
    tell(tNow("Oui, j'apporte. Le sujet entre à l'ordre du jour.", 'نعم، أقدّمه. يدخل الموضوع جدول الأعمال.', "Oui. Le sujet va au groupe."), pathname);
  };
  // « Pas maintenant » : rien ne passe, et la Carte le garde dans son parcours.
  const notNowGesture = () => {
    if (!chosen) return;
    actP(me.id, { act: 'subject_declined', card: chosen, when: dayInWords() });
    setNotNow(true);
    tell(tNow('Pas maintenant. Rien ne passe.', 'ليس الآن. لا يمرّ شيء.'), pathname);
  };
  const addItem = () => {
    if (!item.trim() || !session) return;
    actF(pro || 'groupe', { act: 'agenda_item', item: freshId('point', f.agenda.map((a) => a.item)), title: item.trim(), source: itemSource, session });
    tell(`${item.trim()} : à l'ordre du jour.`, pathname);
    setItem('');
  };
  const holdSession = () => {
    if (!date.trim() || !present.length) return;
    setNewSession(false);
    // Les personnes accompagnées présentes, par leur prénom du jour : sans lien avec leur profil personnel.
    const people = guests.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
    const all = [...new Set([...present, ...people, ...(cvs ? ['CVS'] : [])])];
    actF(pro || present[0], { act: 'attendance', session: date.trim(), present: all, absent: team.filter((m) => !present.includes(m)), facilitator: present.includes(pro) ? pro : present[0] });
    setGuests('');
    setCvs(false);
  };

  return (
    <Screen side="pe" title="subjects" question="Quels sujets travailler ? Seulement si la personne le veut.">
      <ScrollView contentContainerStyle={{ gap: 16 }}>
        {(!f.attendance || newSession) && (
          <View style={st.ask}>
            <Text style={st.h}>La séance</Text>
            <TextInput value={date} onChangeText={setDate} placeholder="La date, en mots (mardi 12 janvier…)" style={st.input} accessibilityLabel="Date de la séance" />
            <Text style={st.small}>Qui est là ?</Text>
            <View style={st.row}>
              {team.map((m) => {
                const on = present.includes(m);
                return (
                  <Pressable key={m} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => setPresent(on ? present.filter((x) => x !== m) : [...present, m])} style={[st.btn, on && st.primary]}>
                    <Text style={[st.btnTxt, on && { color: C.onAccent }]}>{m}</Text>
                  </Pressable>
                );
              })}
              <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: cvs }} onPress={() => setCvs(!cvs)} style={[st.btn, cvs && st.primary]}>
                <Text style={[st.btnTxt, cvs && { color: C.onAccent }]}>CVS</Text>
              </Pressable>
            </View>
            <TextInput value={guests} onChangeText={setGuests} placeholder="Les personnes accompagnées présentes : leurs prénoms, séparés par des virgules" style={st.input} accessibilityLabel="Personnes accompagnées présentes" />
            <Text style={st.small}>Leur prénom du jour, sans lien avec leur projet personnel. Chaque avis reste signé.</Text>
            <Pressable accessibilityRole="button" onPress={holdSession} style={[st.btn, st.primary, { alignSelf: 'flex-start' }]}>
              <Text style={[st.btnTxt, { color: C.onAccent }]}>Ouvrir l’ordre du jour</Text>
            </Pressable>
          </View>
        )}
        {cards.length === 0 && <Text style={st.small}>{t(`${me.name} n’a pas encore de Carte : rien à apporter pour l’instant.`, `ليس لدى ${me.name} بطاقة بعد: لا شيء لتقديمه الآن.`)}</Text>}
        {cards.length > 1 && (
          <View style={st.row}>
            <Text style={st.small}>{t('Quelle Carte apporter ?', 'أيّ بطاقة أقدّم؟', 'Quelle Carte ?')}</Text>
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
              <View style={st.kickRow}>
                {card.picto ? <Picto name={card.picto} size={32} label={false} /> : null}
                <Text style={st.kicker}>{t(`MA VERSION — ${me.name.toUpperCase()}`, `نسختي — ${me.name}`, `MES MOTS — ${me.name.toUpperCase()}`)}</Text>
              </View>
              <Text style={st.quote}>« {card.verbatim} »</Text>
            </View>
            <Text style={st.arrow}>→</Text>
            <View style={[st.version, { borderTopColor: C.pe.value }]}>
              <Text style={st.kicker}>{t('POUR LE COLLECTIF', 'للمجموعة', 'POUR LE GROUPE')}</Text>
              {brought ? <Text style={st.quote}>{subject?.forCollective ?? collective}</Text> : (
                <>
                  <TextInput value={collective} onChangeText={setCollective} multiline placeholder={t('Une phrase pour tous, sans nom ni détail personnel', 'جملة للجميع، بلا اسم ولا تفاصيل شخصية', 'Une phrase pour tous')} style={st.input} accessibilityLabel={t('Version pour le collectif', 'النسخة للمجموعة')} />
                  <Pressable
                    accessibilityRole="button"
                    onPress={async () => {
                      try {
                        const r = await askAide({ kind: 'generalize', text: card.verbatim || card.title, lang: card.lang });
                        setCollective(r.proposal);
                        setAided(true);
                        setAideMsg(r.offline ? tNow(`Exemple hors ligne (sans IA). ${me.name} relit et peut changer.`, `مثال دون اتصال. ${me.name} تراجع ويمكنها التغيير.`) : tNow(`Proposition. ${me.name} relit et peut changer.`, `اقتراح. ${me.name} تراجع ويمكنها التغيير.`));
                      } catch (e) {
                        setAideMsg(e instanceof AideRefusal ? tNow(e.message, refusalAr(e.message)) : tNow("L'aide n'a pas répondu.", 'لم تُجب المساعدة.'));
                      }
                    }}
                    style={[st.btn, { alignSelf: 'flex-start' }]}>
                    <Text style={st.btnTxt}>{t('✨ Proposer une formulation générale', '✨ اقتراح صياغة عامّة', '✨ Une phrase pour tous')}</Text>
                  </Pressable>
                  {aideMsg ? <Text style={st.small}>{aideMsg}</Text> : null}
                </>
              )}
            </View>
          </View>
        )}
        {card && !brought && (
          <View style={st.ask}>
            <Text style={st.question}>{t(`${me.name} · C’est bien ce que tu veux dire au collectif ? Ton dossier reste chez toi.`, `${me.name} · هل هذا ما تريدين قوله للمجموعة؟ ملفّكِ يبقى عندكِ.`, `${me.name} · Tu veux dire ça au groupe ? Ton dossier reste à toi.`)}</Text>
            <View style={st.row}>
              <Pressable onPress={bring} style={[st.btn, st.primary]} accessibilityRole="button"><Text style={[st.btnTxt, { color: C.onAccent }]}>{t('Oui, j’apporte', 'نعم، أقدّمه', 'Oui')}</Text></Pressable>
              <Pressable onPress={notNowGesture} style={st.btn} accessibilityRole="button"><Text style={st.btnTxt}>{t('Pas maintenant', 'ليس الآن')}</Text></Pressable>
            </View>
            {notNow && <Text style={st.small}>{t('Rien ne passe. Tu pourras le proposer plus tard, si tu veux.', 'لا يمرّ شيء. يمكنكِ اقتراحه لاحقاً إن أردتِ.', 'Rien ne part. Plus tard, si tu veux.')}</Text>}
            {!session && <Text style={st.small}>{t('D’abord la séance : sa date et qui est là.', 'أوّلاً الجلسة: تاريخها ومن الحاضر.')}</Text>}
            {session && !collective.trim() && <Text style={st.small}>{t('Écris d’abord la phrase pour le collectif.', 'اكتبي أوّلاً الجملة للمجموعة.')}</Text>}
          </View>
        )}

        <View style={st.agenda}>
          <Text style={st.h}>Ordre du jour{session ? ` · ${session}` : ''}</Text>
          {f.agenda.filter((a) => !session || a.session === session).length === 0 && <Text style={st.small}>Rien pour l’instant.</Text>}
          {f.agenda.filter((a) => !session || a.session === session).map((a) => (
            <View key={a.item} style={[st.item, a.item === subjectId && st.itemNew]}>
              <View style={st.kickRow}>
                {a.picto ? <Picto name={a.picto} size={24} label={false} /> : null}
                <Text style={st.itemTitle}>{a.title}</Text>
              </View>
              <Text style={st.small}>{SOURCE_WORDS[a.source]}</Text>
            </View>
          ))}
          {f.attendance && (
            <View style={st.row}>
              {f.attendance.present.map((n) => <Text key={n} style={st.chip}>{n}{n === f.attendance!.facilitator ? ' · anime' : ''}</Text>)}
              {f.attendance.absent.map((n) => <Text key={n} style={[st.chip, st.absent]}>{n} · absente, c’est normal</Text>)}
            </View>
          )}
          {f.attendance ? (
            <More>
              {session ? (
                <View style={st.row}>
                  <TextInput value={item} onChangeText={setItem} placeholder="Un point de l’équipe ou du CVS…" style={[st.input, { minHeight: S.touch, flex: 1, minWidth: 220 }]} accessibilityLabel="Nouveau point à l'ordre du jour" />
                  {(['team', 'cvs'] as const).map((src) => (
                    <Pressable key={src} accessibilityRole="radio" accessibilityState={{ checked: itemSource === src }} onPress={() => setItemSource(src)} style={[st.btn, itemSource === src && st.primary]}>
                      <Text style={[st.btnTxt, itemSource === src && { color: C.onAccent }]}>{SOURCE_WORDS[src]}</Text>
                    </Pressable>
                  ))}
                  <Pressable accessibilityRole="button" onPress={addItem} style={st.btn}><Text style={st.btnTxt}>Ajouter</Text></Pressable>
                </View>
              ) : null}
              {!newSession && (
                <Pressable accessibilityRole="button" onPress={() => setNewSession(true)} style={[st.btn, { alignSelf: 'flex-start' }]}>
                  <Text style={st.btnTxt}>＋ Nouvelle séance</Text>
                </Pressable>
              )}
            </More>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const st = StyleSheet.create({
  sas: { flexDirection: 'row', gap: 12, alignItems: 'stretch', flexWrap: 'wrap' },
  version: { flex: 1, minWidth: 260, padding: 16, borderRadius: S.radius, backgroundColor: C.surface, borderTopWidth: 6, gap: 6 },
  kickRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
