import { StyleSheet, Text, View } from 'react-native';

import type { Card } from '../core/project';
import { useRegister } from '../core/useAids';
import { C, F, S } from '../design/theme';
import { PICTOS, type PictoKey } from '../design/pictos';
import { Picto } from './Picto';

/** Une Carte : picto, titre, et son dernier moment. */
export function CardView({ card, compact = false }: { card: Card; compact?: boolean }) {
  const reg = useRegister();
  const title = reg === 'ar' && card.picto ? PICTOS[card.picto as PictoKey]?.ar ?? card.title : card.title;
  return (
    <View style={[st.card, compact && st.compact]}>
      {card.picto ? <Picto name={card.picto} size={compact ? 44 : 64} label={false} /> : null}
      <View style={{ flexShrink: 1 }}>
        <Text style={st.title}>{title}</Text>
        {!compact && <Text style={st.moment}>{card.moments[card.moments.length - 1]}</Text>}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, borderRadius: S.radius, backgroundColor: C.surface, borderTopWidth: 6, borderTopColor: C.pp.value, minWidth: 160, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  compact: { minWidth: 0, padding: 8 },
  title: { fontFamily: F.body, fontWeight: '700', fontSize: 17, color: C.ink },
  moment: { fontFamily: F.body, fontSize: 13, color: C.muted },
});
