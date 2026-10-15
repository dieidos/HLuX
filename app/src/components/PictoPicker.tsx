// Une image pour une carte écrite par le groupe (09-12) : facultative, parmi les pictos de 01
// (décision du 2026-10-15). Toucher l'image choisie la retire.
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useT } from '../core/useAids';
import { PICTOS, type PictoKey } from '../design/pictos';
import { C, F, S } from '../design/theme';
import { Picto } from './Picto';

export function PictoPicker({ value, onChange }: { value: string | null; onChange: (p: string | null) => void }) {
  const t = useT();
  return (
    <View style={st.row} accessibilityLabel={t('Une image, si on veut', 'صورة، إن أردنا')}>
      <Text style={st.small}>{t('Une image (facultatif) :', 'صورة (اختياري):')}</Text>
      {(Object.keys(PICTOS) as PictoKey[]).map((k) => (
        <Pressable key={k} accessibilityRole="radio" accessibilityState={{ checked: value === k }} accessibilityLabel={PICTOS[k].fr} onPress={() => onChange(value === k ? null : k)} style={[st.pick, value === k && st.on]}>
          <Picto name={k} size={28} label={false} />
        </Pressable>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center', width: '100%' },
  small: { fontFamily: F.body, fontSize: 13, color: C.muted },
  pick: { minWidth: S.touch, minHeight: S.touch, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 2, borderColor: 'transparent' },
  on: { borderColor: C.violet, backgroundColor: C.violetSoft },
});
