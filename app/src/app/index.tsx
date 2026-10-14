// Accueil : la séance locale ouvre la tablette (décision du 2026-10-14).
// 1. La professionnelle touche son prénom. 2. La personne touche le sien, ou entre avec un prénom et une phrase.
// 3. « Bonjour Amina », puis Mon projet ou Notre projet. Hors séance, les profils restent fermés.
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Wordmark } from '../components/Chrome';
import { useWords } from '../core/useAids';
import { TEAM, useMe, useProject } from '../core/useProject';
import { C, F, S } from '../design/theme';

export default function Home() {
  const w = useWords();
  const me = useMe();
  const pro = useProject((s) => s.pro);
  const profiles = useProject((s) => s.profiles);
  const { openSession, closeSession, open, close, createProfile } = useProject.getState();
  const [name, setName] = useState('');
  const [sentence, setSentence] = useState('');

  if (!pro) {
    return (
      <View style={st.page}>
        <Wordmark size={28} />
        <Text style={st.hello}>{w('whoOpens')}</Text>
        <View style={st.row}>
          {TEAM.map((t) => (
            <Pressable key={t} accessibilityRole="button" onPress={() => openSession(t)} style={st.name}>
              <Text style={st.nameTxt}>{t}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={st.note}>{w('closedNote')}</Text>
      </View>
    );
  }

  if (!me.id) {
    return (
      <View style={st.page}>
        <Wordmark size={28} />
        <Text style={st.hello}>{w('whoIsHere')}</Text>
        <View style={st.row}>
          {profiles.map((p) => (
            <Pressable key={p.id} accessibilityRole="button" onPress={() => open(p.id)} style={st.name}>
              <Text style={st.nameTxt}>{p.firstName}</Text>
            </Pressable>
          ))}
        </View>
        <View style={st.newBox}>
          <Text style={st.doorTxt}>{w('newPerson')}</Text>
          <TextInput value={name} onChangeText={setName} placeholder={w('firstName')} style={st.input} accessibilityLabel={w('firstName')} />
          <TextInput value={sentence} onChangeText={setSentence} placeholder={w('oneSentence')} multiline style={st.input} accessibilityLabel={w('oneSentence')} />
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (createProfile(name, sentence)) {
                setName('');
                setSentence('');
              }
            }}
            style={[st.btn, st.primary]}>
            <Text style={[st.btnTxt, { color: C.surface }]}>{w('enter')}</Text>
          </Pressable>
        </View>
        <Link href="/notre-projet/constat" style={[st.door, { borderTopColor: C.pe.value }]}>
          <Text style={st.doorTxt}>🏛️ {w('ourProject')}</Text>
        </Link>
        <Pressable accessibilityRole="button" onPress={closeSession} style={st.btn}>
          <Text style={st.btnTxt}>{w('closeSession')} · {pro}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={st.page}>
      <Wordmark size={28} />
      <Text style={st.hello}>{w('hello')} {me.name} 👋</Text>
      <View style={st.row}>
        <Link href="/mon-projet/cartes" style={[st.door, { borderTopColor: C.pp.value }]}>
          <Text style={st.doorTxt}>👤 {w('myProject')}</Text>
        </Link>
        <Link href="/notre-projet/sujets" style={[st.door, { borderTopColor: C.pe.value }]}>
          <Text style={st.doorTxt}>🏛️ {w('ourProject')}</Text>
        </Link>
      </View>
      <View style={st.row}>
        <Pressable accessibilityRole="button" onPress={close} style={st.btn}>
          <Text style={st.btnTxt}>{w('changePerson')}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={closeSession} style={st.btn}>
          <Text style={st.btnTxt}>{w('closeSession')} · {pro}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, backgroundColor: C.bg, padding: 24 },
  hello: { fontFamily: F.display, fontSize: 40, color: C.ink, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', justifyContent: 'center' },
  name: { minWidth: 140, minHeight: S.touch * 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, borderRadius: S.radius, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  nameTxt: { fontFamily: F.display, fontSize: 24, color: C.ink },
  newBox: { width: '100%', maxWidth: 420, gap: 10, padding: 16, borderRadius: S.radius, backgroundColor: C.surface, borderTopWidth: 6, borderTopColor: C.pp.value },
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12, fontFamily: F.body, fontSize: 17, color: C.ink },
  door: { minWidth: 260, padding: 28, borderRadius: S.radius, backgroundColor: C.surface, borderTopWidth: 8 },
  doorTxt: { fontFamily: F.bold, fontSize: 22, color: C.ink },
  note: { fontFamily: F.body, fontSize: 14, color: C.muted, textAlign: 'center', maxWidth: 420 },
  btn: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 18, borderRadius: S.radiusPill, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.line, alignSelf: 'center' },
  primary: { backgroundColor: C.violetInk, borderColor: C.violetInk },
  btnTxt: { fontFamily: F.bold, fontSize: 16, color: C.ink },
});
