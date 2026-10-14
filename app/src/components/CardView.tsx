import { StyleSheet, Text, View } from 'react-native';

import type { Card } from '../core/project';
import { useFamily, useRegister, useT } from '../core/useAids';
import { C, F, S } from '../design/theme';
import { PICTOS, type PictoKey } from '../design/pictos';
import { Picto } from './Picto';

const STATE: Record<NonNullable<Card['feeling']>, string> = { fine: '😊', unsure: '🤔', hard: '😟' };

/** Une Carte : picto, titre, son état et son dernier moment. Apportée au collectif, elle passe du jaune au vert. */
export function CardView({ card, compact = false, brought = false }: { card: Card; compact?: boolean; brought?: boolean }) {
  const reg = useRegister();
  const bold = useFamily(true);
  const t = useT();
  const title = reg === 'ar' && card.picto ? PICTOS[card.picto as PictoKey]?.ar ?? card.title : card.title;
  return (
    <View style={[st.card, compact && st.compact, brought && st.brought]} accessibilityLabel={`${title}${card.feeling ? `, ${STATE[card.feeling]}` : ''}${brought ? t(', apportée au collectif', '، قُدّمت للمجموعة', ', donnée au groupe') : ''}`}>
      {card.picto ? <Picto name={card.picto} size={compact ? 44 : 64} label={false} /> : null}
      <View style={{ flexShrink: 1 }}>
        <Text style={[st.title, { fontFamily: bold }]}>{title}{card.feeling ? ` ${STATE[card.feeling]}` : ''}</Text>
        {!compact && <Text style={st.moment}>{card.moments[card.moments.length - 1]}</Text>}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, borderRadius: S.radius, backgroundColor: C.surface, borderTopWidth: 6, borderTopColor: C.pp.value, minWidth: 160, shadowColor: C.shadow, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  compact: { minWidth: 0, padding: 8 },
  brought: { borderTopColor: C.pe.value, backgroundColor: C.pe.soft },
  title: { fontFamily: F.bold, fontSize: 17, color: C.ink },
  moment: { fontFamily: F.body, fontSize: 13, color: C.muted },
});
