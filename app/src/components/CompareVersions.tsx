// Deux versions du même dossier, côte à côte (copie QR divergente, décision du 2026-10-14).
// Rien n'est effacé ni fusionné d'office : la personne garde, point par point, ce qu'elle veut de l'autre
// version ; puis elle garde les deux, ou retire l'autre (avec confirmation).
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { adopt, describe, differences } from '../core/compare';
import { useT } from '../core/useAids';
import { useMe, useProject, useProjectState } from '../core/useProject';
import { C, F, S } from '../design/theme';

export function CompareVersions() {
  const t = useT();
  const me = useMe();
  const s = useProjectState();
  const entries = useProject((x) => x.entries);
  const profiles = useProject((x) => x.profiles);
  const { otherVersion, dropVersion, act } = useProject.getState();
  const other = profiles.find((p) => p.copyOf === me.id);
  const [remap] = useState(() => new Map<string, string>());
  const [kept, setKept] = useState<number[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [closed, setClosed] = useState(false);
  if (!other || closed) return null;
  const { mine, theirs } = differences(entries, otherVersion(other.id));
  const ids = {
    cards: Object.keys(s.cards), ideas: Object.keys(s.ideas), nodes: Object.keys(s.nodes),
    invitations: Object.keys(s.invitations), sims: Object.keys(s.whatIfs), subjects: Object.keys(s.subjects),
  };
  const keep = (rank: number) => {
    const e = theirs.find((x) => x.rank === rank);
    if (!e?.act) return;
    act(e.author, adopt(e.act, ids, remap), e.provenance, e.confirmedBy);
    setKept([...kept, rank]);
  };
  return (
    <View style={st.box} accessibilityLabel={t('Deux versions de ton dossier', 'نسختان من ملفّكِ')}>
      <Text style={st.h}>{t('Deux versions de ton dossier', 'نسختان من ملفّكِ', 'Deux dossiers')}</Text>
      <Text style={st.small}>{t('Ici et sur l’autre appareil, ton dossier a changé chacun de son côté. Rien n’est effacé : tu choisis ce que tu gardes de l’autre version.', 'هنا وعلى الجهاز الآخر، تغيّر ملفّكِ كلٌّ من جهته. لا يُمحى شيء: أنتِ تختارين ما تحتفظين به من النسخة الأخرى.')}</Text>
      <View style={st.cols}>
        <View style={st.col}>
          <Text style={st.colTitle}>{t('Sur cet appareil', 'على هذا الجهاز')}</Text>
          {mine.length === 0 ? <Text style={st.small}>—</Text> : mine.map((e) => <Text key={e.rank} style={st.item}>{describe(e.act!)}</Text>)}
        </View>
        <View style={st.col}>
          <Text style={st.colTitle}>{t('Sur l’autre appareil', 'على الجهاز الآخر')}</Text>
          {theirs.length === 0 ? <Text style={st.small}>—</Text> : theirs.map((e) => (
            <View key={e.rank} style={st.row}>
              <Text style={[st.item, { flex: 1 }]}>{describe(e.act!)}</Text>
              {kept.includes(e.rank) ? (
                <Text style={st.small}>{t('✓ gardé', '✓ محفوظ')}</Text>
              ) : (
                <Pressable accessibilityRole="button" onPress={() => keep(e.rank)} style={st.btn}>
                  <Text style={st.btnTxt}>{t('Je garde aussi', 'أحتفظ به أيضاً')}</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      </View>
      {!confirm ? (
        <View style={st.row}>
          <Pressable accessibilityRole="button" onPress={() => setClosed(true)} style={st.btn}>
            <Text style={st.btnTxt}>{t('Garder les deux versions', 'الاحتفاظ بالنسختين')}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setConfirm(true)} style={st.btn}>
            <Text style={st.btnTxt}>{t('J’ai gardé ce que je voulais : retirer l’autre version', 'احتفظتُ بما أريد: إزالة النسخة الأخرى')}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={st.row}>
          <Text style={[st.small, { flexBasis: '100%' }]}>{t('Ce que tu n’as pas gardé de l’autre version disparaîtra de cet appareil.', 'ما لم تحتفظي به من النسخة الأخرى سيختفي من هذا الجهاز.')}</Text>
          <Pressable accessibilityRole="button" onPress={() => dropVersion(other.id)} style={[st.btn, st.danger]}>
            <Text style={[st.btnTxt, { color: C.onAccent }]}>{t('Oui, retirer l’autre version', 'نعم، إزالة النسخة الأخرى')}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setConfirm(false)} style={st.btn}>
            <Text style={st.btnTxt}>{t('Annuler', 'إلغاء')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  box: { alignSelf: 'stretch', gap: 10, padding: 16, borderRadius: S.radius, backgroundColor: C.surface, borderWidth: 2, borderStyle: 'dashed', borderColor: C.violet },
  h: { fontFamily: F.bold, fontSize: 18, color: C.ink },
  small: { fontFamily: F.body, fontSize: 13, color: C.muted },
  cols: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  col: { flex: 1, minWidth: 260, gap: 6, padding: 10, borderRadius: 12, backgroundColor: C.surface2 },
  colTitle: { fontFamily: F.bold, fontSize: 14, color: C.slate },
  item: { fontFamily: F.body, fontSize: 15, color: C.ink },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  btn: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 14, borderRadius: S.radiusPill, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  danger: { backgroundColor: C.warn.ink, borderColor: C.warn.ink },
  btnTxt: { fontFamily: F.bold, fontSize: 14, color: C.ink },
});
