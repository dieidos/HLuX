// Accueil : « Bonjour Amina », puis Mon projet ou Notre projet (membres de l'établissement).
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Wordmark } from '../components/Chrome';
import { useWords } from '../core/useAids';
import { C, F, S } from '../design/theme';

export default function Home() {
  const w = useWords();
  return (
    <View style={st.page}>
      <Wordmark size={28} />
      <Text style={st.hello}>{w('hello')} Amina 👋</Text>
      <View style={st.row}>
        <Link href="/mon-projet/cartes" style={[st.door, { borderTopColor: C.pp.value }]}>
          <Text style={st.doorTxt}>👤 {w('myProject')}</Text>
        </Link>
        <Link href="/notre-projet/sujets" style={[st.door, { borderTopColor: C.pe.value }]}>
          <Text style={st.doorTxt}>🏛️ {w('ourProject')}</Text>
        </Link>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, backgroundColor: C.bg, padding: 24 },
  hello: { fontFamily: F.display, fontSize: 40, color: C.ink },
  row: { flexDirection: 'row', gap: 20, flexWrap: 'wrap', justifyContent: 'center' },
  door: { minWidth: 260, padding: 28, borderRadius: S.radius, backgroundColor: C.surface, borderTopWidth: 8 },
  doorTxt: { fontFamily: F.body, fontSize: 22, fontWeight: '700', color: C.ink },
});
