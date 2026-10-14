// « À valider pour le groupe » : ce que l'IA a proposé au collectif ne compte pas tant que l'animatrice
// ne l'a pas validé, une fois que le groupe a dit oui (décision du 2026-10-14). « Non » l'écarte.
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { facilityPending, type FacilityAct } from '../core/facility';
import { useFacility, useFacilityState } from '../core/useFacility';
import { useProject } from '../core/useProject';
import { C, F, S } from '../design/theme';

const words = (a: FacilityAct): string => {
  switch (a.act) {
    case 'expected_change':
      return `Changement attendu : ${a.text}`;
    case 'decision':
      return `Notre décision : ${a.words}`;
    case 'commitment':
      return `Engagement : ${a.text}`;
    case 'result':
      return `Résultat : ${a.text}`;
    default:
      return a.act;
  }
};

export function GroupPending() {
  const entries = useFacility((x) => x.entries);
  const confirm = useFacility((x) => x.confirm);
  const undo = useFacility((x) => x.undo);
  const f = useFacilityState();
  const pro = useProject((x) => x.pro) ?? '';
  const facilitator = f.mandate || pro;
  const pending = facilityPending(entries);
  if (!pending.length) return null;
  return (
    <View style={st.box} accessibilityLabel="À valider pour le groupe">
      <Text style={st.h}>À valider pour le groupe</Text>
      <Text style={st.small}>Proposé par l’IA. Le groupe relit et dit oui ; {facilitator || 'l’animatrice'} valide pour le groupe. Avant, rien ne compte.</Text>
      {pending.map((e) => (
        <View key={e.rank} style={st.item}>
          <Text style={st.txt}>{e.act ? words(e.act) : ''}</Text>
          <View style={st.row}>
            <Pressable accessibilityRole="button" onPress={() => confirm(e.rank, facilitator || 'groupe')} style={[st.btn, st.on]}>
              <Text style={[st.btnTxt, { color: C.onAccent }]}>Validé par le groupe{facilitator ? ` · ${facilitator}` : ''}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => undo(facilitator || 'groupe', e.rank)} style={st.btn}>
              <Text style={st.btnTxt}>Non</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  box: { gap: 8, padding: 14, borderRadius: S.radius, backgroundColor: C.violetSoft, borderWidth: 1, borderStyle: 'dashed', borderColor: C.violet },
  h: { fontFamily: F.bold, fontSize: 16, color: C.ink },
  small: { fontFamily: F.body, fontSize: 13, color: C.muted },
  item: { gap: 6, padding: 10, borderRadius: 12, backgroundColor: C.surface },
  txt: { fontFamily: F.body, fontSize: 15, color: C.ink },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  btn: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 14, borderRadius: S.radiusPill, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  on: { backgroundColor: C.violetInk, borderColor: C.violetInk },
  btnTxt: { fontFamily: F.bold, fontSize: 14, color: C.ink },
});
