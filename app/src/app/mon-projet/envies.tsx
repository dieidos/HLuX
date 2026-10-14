// 03 Envies — l'Ikigai : quatre cercles, leurs croisements nommés avec des mots, jamais des coordonnées.
// Une idée naît d'une Carte et en garde le lien ; elle se déplace quand on veut ;
// l'écarter par le bord est le seul geste irréversible, et l'écran le dit.

import { Picto } from '../../components/Picto';
import { useThreadCard } from '../../core/useThread';
import { usePathname } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '../../components/Chrome';
import { DragArea, Draggable, Zone } from '../../components/Drag';
import { Ikigai } from '../../components/Ikigai';
import type { Spot } from '../../core/acts';
import {tell, useT, useWords } from '../../core/useAids';
import { useProject, useProjectState, useMe } from '../../core/useProject';
import { C, F, S } from '../../design/theme';
import type { WordKey } from '../../i18n/words';

export default function Envies() {
  const pathname = usePathname();
  const me = useMe();
  const w = useWords();
  const t = useT();
  const s = useProjectState();
  const act = useProject((x) => x.act);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [from, setFrom] = useState<string | null>(null);
  const [inSession, setInSession] = useState(false);
  const pro = useProject((x) => x.pro);
  // La Carte du fil : une nouvelle envie naît d'elle, sauf si la personne en choisit une autre.
  const thread = useThreadCard();

  const place = (idea: string, spot: Spot, words: string) => {
    act(me.id, { act: 'idea_placed', idea, spot });
    const line = `${s.ideas[idea].title} : ${words}.`;
    tell(line, pathname);
  };
  const create = () => {
    if (!title.trim()) return;
    act(me.id, { act: 'idea_created', idea: `idee-${Object.keys(s.ideas).length + 1}`, title: title.trim(), from_card: from, in_session: inSession });
    setInSession(false);
    setAdding(false); setTitle(''); setFrom(null);
  };
  const at = (spot: Spot) =>
    Object.entries(s.ideas).filter(([, i]) => JSON.stringify(i.spot) === JSON.stringify(spot));

  const chip = (id: string) => {
    const i = s.ideas[id];
    const card = i.fromCard ? s.cards[i.fromCard] : null;
    return (
      <Draggable key={id} id={id} label={i.title}>
        <View style={[st.idea, card && st.ideaPic]}>
          {card?.picto ? <Picto name={card.picto} size={28} label={false} /> : null}
          <View style={{ flexShrink: 1 }}>
          <Text style={st.ideaTxt}>{i.title}</Text>
          {card ? <Text style={st.born}>{w('bornOf')} {card.title}</Text> : null}
          {i.inSession ? <Text style={st.born}>{t('née en séance', 'وُلدت في الجلسة')}</Text> : null}
          </View>
        </View>
      </Draggable>
    );
  };

  return (
    <Screen side="pp" title="wishes" question={w('wishQuestion')}>
      <DragArea>
        <ScrollView contentContainerStyle={{ gap: 0 }}>
        <Ikigai
          label={(k) => w(k as WordKey)}
          at={(spot) => at(spot).map(([id]) => chip(id))}
          onDrop={(id, spot, words) => place(id, spot, words)}
        />
        <View style={st.bottom}>
          <Zone id="tray" label={w('tray')} onDrop={(id) => place(id, { at: 'tray' }, w('tray'))} style={st.tray}>
            <Text style={st.small}>{w('tray')}</Text>
            <View style={st.chips}>{at({ at: 'tray' }).map(([id]) => chip(id))}</View>
          </Zone>
          <Zone id="discard" label={w('discard')} onDrop={(id) => place(id, { at: 'discarded' }, t('écartée, pour toujours', 'أُبعدت نهائياً', 'enlevée pour toujours'))} style={st.discard}>
            <Text style={st.small}>🗑️ {w('discard')}</Text>
          </Zone>
          <Pressable onPress={() => { setFrom(thread.id); setAdding(true); }} style={st.btn} accessibilityRole="button"><Text style={st.btnTxt}>{w('newIdea')}</Text></Pressable>
        </View>
        </ScrollView>
      </DragArea>

      {adding && (
        <View style={st.overlay}>
          <View style={st.sheet}>
            <Text style={st.sheetTitle}>{w('newIdea')}</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder={t('Mon idée…', 'فكرتي…')} style={st.input} accessibilityLabel={t('Mon idée', 'فكرتي')} />
            <Text style={st.small}>{w('bornOf')} :</Text>
            <View style={st.chips}>
              {Object.entries(s.cards).map(([id, c]) => (
                <Pressable accessibilityRole="button" key={id} onPress={() => setFrom(from === id ? null : id)} style={[st.pick, from === id && st.pickOn]}>
                  <Text style={st.btnTxt}>{c.title}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {pro ? (
                <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: inSession }} onPress={() => setInSession(!inSession)} style={[st.pick, inSession && st.pickOn]}>
                  <Text style={st.btnTxt}>{t(`Née en séance, avec ${pro}`, `وُلدت في الجلسة، مع ${pro}`)}</Text>
                </Pressable>
              ) : null}
              <Pressable accessibilityRole="button" onPress={create} style={[st.btn, st.primary]}><Text style={[st.btnTxt, { color: C.onAccent }]}>{t('Créer', 'إنشاء')}</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => setAdding(false)} style={st.btn}><Text style={st.btnTxt}>{t('Annuler', 'إلغاء')}</Text></Pressable>
            </View>
          </View>
        </View>
      )}
    </Screen>
  );
}

const st = StyleSheet.create({
  bottom: { flexDirection: 'row', gap: 12, marginTop: 16, alignItems: 'stretch', flexWrap: 'wrap' },
  tray: { flex: 1, minWidth: 260, backgroundColor: C.surface2 },
  discard: { width: 220, justifyContent: 'center', borderColor: C.discard },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ideaPic: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  idea: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: C.surface, borderTopWidth: 4, borderTopColor: C.violet },
  ideaTxt: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  born: { fontFamily: F.body, fontSize: 12, color: C.muted },
  small: { fontFamily: F.body, fontSize: 13, color: C.muted },
  btn: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 16, borderRadius: S.radiusPill, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, alignSelf: 'center' },
  primary: { backgroundColor: C.violetInk, borderColor: C.violetInk },
  btnTxt: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  overlay: { position: 'absolute', inset: 0, backgroundColor: C.scrim, alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet: { width: '100%', maxWidth: 560, gap: 10, padding: 24, borderRadius: 20, backgroundColor: C.surface },
  sheetTitle: { fontFamily: F.display, fontSize: 24, color: C.ink },
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12, fontFamily: F.body, fontSize: 17, color: C.ink },
  pick: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 14, borderRadius: S.radiusPill, borderWidth: 2, borderColor: C.line },
  pickOn: { borderColor: C.violet, backgroundColor: C.violetSoft },
});
