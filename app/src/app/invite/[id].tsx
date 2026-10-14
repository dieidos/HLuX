// La page invité des Regards : lien temporaire, sans compte, dans la langue de l'invité (arabe RTL).
// L'invité voit une seule idée et fait le même geste : un penchant par axe, peu ←→ beaucoup.
// Elle ne demande ni séance ni compte, et ne voit que l'invitation et l'idée visée.
// ⛳ Lot 5 : cette page sera servie par dieidos et répondra via le relais (jeton éphémère).
//    D'ici là, elle lit et écrit l'invitation sur l'appareil, pour la démonstration (`guestRead`, `guestAnswer`).

import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { LeanSlider } from '../../components/Slide';
import type { Circle, Lean } from '../../core/acts';
import { expired, standing } from '../../core/project';
import { useProject } from '../../core/useProject';
import { C, F, S } from '../../design/theme';

type W = { fr: string; ar: string };
// Deux registres, comme la barre d'aides : les mots de l'Atlas, et « en mots plus simples ».
const AXES: [Circle, W, W][] = [
  ['love', { fr: "Ce qu'elle aime", ar: 'ما تحبّه' }, { fr: 'Elle aime ça ?', ar: 'تحبّه؟' }],
  ['able', { fr: 'Ce dont elle est capable', ar: 'ما تقدر عليه' }, { fr: 'Elle sait le faire ?', ar: 'تقدر عليه؟' }],
  ['useful', { fr: 'Ce qui est utile', ar: 'ما هو مفيد' }, { fr: "C'est utile ?", ar: 'مفيد؟' }],
  ['living', { fr: 'Ce qui peut la faire vivre', ar: 'ما يمكن أن تعيش منه' }, { fr: 'Elle peut en vivre ?', ar: 'تعيش منه؟' }],
];
const LEANS: [Lean, { fr: string; ar: string }][] = [
  ['little', { fr: 'un peu', ar: 'قليلاً' }], ['middle', { fr: 'entre les deux', ar: 'بين الاثنين' }], ['much', { fr: 'beaucoup', ar: 'كثيراً' }],
];

export default function Invite() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { guestRead, guestAnswer } = useProject.getState();
  const [seen, setSeen] = useState(() => guestRead(id));
  const s = standing(seen?.entries ?? []);
  const inv = s.invitations[id];
  const name = seen?.firstName ?? '';
  const [leans, setLeans] = useState<Partial<Record<Circle, Lean>>>({});
  const [word, setWord] = useState('');
  const [simple, setSimple] = useState(false);
  if (!inv || expired(inv, new Date())) return <View style={st.page}><Text style={st.title}>Ce lien s’est reposé.</Text><Text style={st.small}>Les liens d’invitation vivent peu de temps, pour protéger la personne qui invite.</Text></View>;
  const ar = inv.lang === 'ar';
  const t = (x: W) => (ar ? x.ar : x.fr);
  // En arabe, l'idée telle que la personne qui invite l'a confirmée ; sinon, son titre.
  const ideaWords = ar && inv.ideaText ? inv.ideaText : s.ideas[inv.idea]?.title;
  const font = { fontFamily: ar ? F.arabic : F.bold };
  const lang = ar ? ({ lang: 'ar' } as object) : {};
  if (inv.answered) return <View style={st.page}><Text style={st.title}>{ar ? 'شكراً' : 'Merci'}</Text><Text style={st.small}>{ar ? 'ستُكشف إجابتكِ مع إجابات الآخرين في الوقت نفسه.' : 'Votre regard sera découvert avec les autres, en même temps.'}</Text></View>;

  return (
    <View style={[st.page, { direction: ar ? 'rtl' : 'ltr' }]} {...lang}>
      <Text style={[st.small, ar && font]}>{ar ? 'رابط مؤقّت · دون حساب' : 'lien temporaire · sans compte'}</Text>
      <Text style={[st.title, ar && font]}>{ar ? `${name} تطلب رأيكِ` : `${name} vous demande un regard`}</Text>
      <Text style={[st.idea, font]}>« {ideaWords} »</Text>
      <Pressable accessibilityRole="switch" accessibilityState={{ checked: simple }} onPress={() => setSimple(!simple)} style={[st.pick, simple && st.pickOn, { alignSelf: 'flex-start' }]}>
        <Text style={[st.pickTxt, ar && font]}>💬 {ar ? 'بكلمات أبسط' : 'En mots plus simples'}</Text>
      </Pressable>
      {AXES.filter(([axis]) => inv.axes.includes(axis)).map(([axis, label, easy]) => (
        <View key={axis} style={st.line}>
          <Text style={[st.axis, ar && font]}>{t(simple ? easy : label)}</Text>
          <LeanSlider options={LEANS.map(([l, lw]) => [l, t(lw)] as [Lean, string])} value={leans[axis]} onChange={(l) => setLeans((prev) => ({ ...prev, [axis]: l }))} rtl={ar} />
        </View>
      ))}
      <TextInput value={word} onChangeText={setWord} placeholder={ar ? 'كلمة حرّة (اختياري)' : 'Un mot libre (facultatif)'} style={[st.input, ar && font]} accessibilityLabel={ar ? 'كلمة حرّة' : 'Un mot libre'} />
      <Pressable
        onPress={() => {
          guestAnswer(id, { act: 'invitation_answered', invitation: id, leans: Object.entries(leans) as [Circle, Lean][], word: word.trim() || null }, inv.guest);
          setSeen(guestRead(id));
        }}
        style={[st.pick, st.send]} accessibilityRole="button">
        <Text style={[st.pickTxt, ar && font, { color: C.onAccent }]}>{ar ? 'أرسل رأيي' : 'Envoyer mon avis'}</Text>
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  page: { flex: 1, padding: 24, gap: 12, backgroundColor: C.bg, maxWidth: 640, width: '100%', alignSelf: 'center' },
  title: { fontFamily: F.display, fontSize: 26, color: C.ink },
  idea: { fontFamily: F.bold, fontSize: 20, color: C.ink },
  small: { fontFamily: F.body, fontSize: 14, color: C.muted },
  line: { gap: 6, padding: 12, borderRadius: S.radius, backgroundColor: C.surface },
  axis: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pick: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 14, borderRadius: S.radiusPill, borderWidth: 2, borderColor: C.line, backgroundColor: C.surface },
  pickOn: { borderColor: C.violet, backgroundColor: C.violetSoft },
  pickTxt: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12, fontFamily: F.body, fontSize: 16, color: C.ink, backgroundColor: C.surface },
  send: { backgroundColor: C.violetInk, borderColor: C.violetInk, alignSelf: 'flex-start' },
});
