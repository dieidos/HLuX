// « ⋯ Plus » : les outils secondaires d'un écran, repliés (décision du 2026-10-14 : chaque écran garde
// la sobriété de l'Atlas — sa surface, son plateau, au plus une rangée d'action). Rien n'est supprimé.
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useT } from '../core/useAids';
import { C, F, S } from '../design/theme';

export function More({ children, label }: { children: ReactNode; label?: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <View style={st.wrap}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={st.toggle}>
        <Text style={st.txt}>{open ? '▴ ' : label ? '' : '⋯ '}{label ?? t('Plus', 'المزيد', 'Plus')}</Text>
      </Pressable>
      {open ? <View style={st.body}>{children}</View> : null}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { gap: 8, alignSelf: 'stretch' },
  toggle: { alignSelf: 'flex-start', minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 14, borderRadius: S.radiusPill, borderWidth: 1, borderStyle: 'dashed', borderColor: C.line },
  txt: { fontFamily: F.bold, fontSize: 14, color: C.slate },
  body: { gap: 10 },
});
