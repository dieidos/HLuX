// La page invité des Regards : lien temporaire, sans compte, dans la langue de l'invité (arabe RTL).
// L'invité voit une seule idée et fait le même geste : un penchant par axe, peu ←→ beaucoup.
// ⛳ Lot 5 : cette page sera servie par dieidos et répondra via le relais (jeton éphémère).
//    D'ici là, elle lit et écrit l'invitation sur l'appareil, pour la démonstration.

import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { Circle, Lean } from '../../core/acts';
import { useProject, useProjectState } from '../../core/useProject';
import { C, F, S } from '../../design/theme';

const AXES: [Circle, { fr: string; ar: string }][] = [
  ['love', { fr: "Ce qu'elle aime", ar: 'ما تحبّه' }],
  ['able', { fr: "Ce dont elle est capable", ar: 'ما تقدر عليه' }],
  ['useful', { fr: 'Ce qui est utile', ar: 'ما هو مفيد' }],
  ['living', { fr: "Ce qui peut la faire vivre", ar: 'ما يمكن أن تعيش منه' }],
];
const LEANS: [Lean, { fr: string; ar: string }][] = [
  ['little', { fr: 'un peu', ar: 'قليلاً' }], ['middle', { fr: 'entre les deux', ar: 'بين الاثنين' }], ['much', { fr: 'beaucoup', ar: 'كثيراً' }],
];

export default function Invite() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useProjectState();
  const act = useProject((x) => x.act);
  const inv = s.invitations[id];
  const [leans, setLeans] = useState<Partial<Record<Circle, Lean>>>({});
  const [word, setWord] = useState('');
  if (!inv) return <View style={st.page}><Text style={st.title}>Ce lien s’est reposé.</Text><Text style={st.small}>Les liens d’invitation vivent peu de temps, pour protéger la personne qui invite.</Text></View>;
  const ar = inv.lang === 'ar';
  const t = (x: { fr: string; ar: string }) => (ar ? x.ar : x.fr);
  const idea = s.ideas[inv.idea];
  if (inv.answered) return <View style={st.page}><Text style={st.title}>{ar ? 'شكراً' : 'Merci'}</Text><Text style={st.small}>{ar ? 'ستُكشف إجابتكِ مع إجابات الآخرين في الوقت نفسه.' : 'Votre regard sera découvert avec les autres, en même temps.'}</Text></View>;

  return (
    <View style={[st.page, { direction: ar ? 'rtl' : 'ltr' }]}>
      <Text style={st.small}>{ar ? 'رابط مؤقّت · دون حساب' : 'lien temporaire · sans compte'}</Text>
      <Text style={st.title}>{ar ? 'أمينة تطلب رأيكِ' : 'Amina vous demande un regard'}</Text>
      <Text style={st.idea}>« {idea?.title} »</Text>
      {AXES.map(([axis, label]) => (
        <View key={axis} style={st.line}>
          <Text style={st.axis}>{t(label)}</Text>
          <View style={st.row}>
            {LEANS.map(([l, lw]) => (
              <Pressable key={l} onPress={() => setLeans((prev) => ({ ...prev, [axis]: l }))} style={[st.pick, leans[axis] === l && st.pickOn]} accessibilityRole="radio" accessibilityState={{ checked: leans[axis] === l }}>
                <Text style={st.pickTxt}>{t(lw)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
      <TextInput value={word} onChangeText={setWord} placeholder={ar ? 'كلمة حرّة (اختياري)' : 'Un mot libre (facultatif)'} style={st.input} />
      <Pressable
        onPress={() => act(inv.guest, { act: 'invitation_answered', invitation: id, leans: Object.entries(leans) as [Circle, Lean][], word: word.trim() || null })}
        style={[st.pick, st.send]} accessibilityRole="button">
        <Text style={[st.pickTxt, { color: C.onAccent }]}>{ar ? 'أرسل رأيي' : 'Envoyer mon avis'}</Text>
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
