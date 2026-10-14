// En démonstration, une bande le dit sur tous les écrans, avec la sortie. Rien à voir avec les vrais profils.
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useWords } from '../core/useAids';
import { leaveDemo, useMode } from '../core/useProject';
import { C, F, S } from '../design/theme';

export function DemoBanner() {
  const w = useWords();
  const mode = useMode((s) => s.mode);
  if (mode !== 'demo') return null;
  return (
    <View style={st.band} accessibilityRole="alert">
      <Text style={st.txt}>{w('demoBanner')}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={async () => {
          await leaveDemo();
          router.replace('/');
        }}
        style={st.btn}>
        <Text style={st.btnTxt}>{w('demoLeave')}</Text>
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  band: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 12, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: C.warn.soft, borderBottomWidth: 1, borderBottomColor: C.warn.ink },
  txt: { fontFamily: F.bold, fontSize: 14, color: C.warn.ink, letterSpacing: 1 },
  btn: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 14, borderRadius: S.radiusPill, backgroundColor: C.surface, borderWidth: 1, borderColor: C.warn.ink },
  btnTxt: { fontFamily: F.bold, fontSize: 14, color: C.warn.ink },
});
