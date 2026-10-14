// 01 Cartes — « Quelle Carte reprendre ? Ou j'en ajoute une. »
// Cartes existantes ; Nouvelle Carte (je parle / j'écris / je choisis une image) ; Carte en grand.

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CardView } from '../../components/CardView';
import { Screen } from '../../components/Chrome';
import { Picto } from '../../components/Picto';
import { AideRefusal, askAide } from '../../core/aides';
import { say, useWords } from '../../core/useAids';
import { usePending, useProject, useProjectState } from '../../core/useProject';
import { PICTOS, type PictoKey } from '../../design/pictos';
import { C, F, S } from '../../design/theme';

export default function Cartes() {
  const w = useWords();
  const s = useProjectState();
  const act = useProject((x) => x.act);
  const confirm = useProject((x) => x.confirm);
  const undo = useProject((x) => x.undo);
  const pending = usePending();
  const [aideMsg, setAideMsg] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const [picto, setPicto] = useState<PictoKey | null>(null);
  const big = open ? s.cards[open] : null;

  // Une aide IA : sur geste, le résultat attend la validation d'Amina (journal : « hypothesis »).
  const aide = async (card: string, kind: 'simplify' | 'translate') => {
    const c = s.cards[card];
    try {
      setAideMsg('…');
      const r = await askAide({ kind, text: c.verbatim || c.title, lang: kind === 'translate' ? 'ar' : 'fr', register: kind === 'simplify' ? 'falc' : 'plain' });
      act('hlux-ia', kind === 'simplify' ? { act: 'card_simpler', card, text: r.proposal } : { act: 'card_translated', card, lang: 'ar', text: r.proposal }, 'hypothesis');
      setAideMsg(r.offline ? 'Exemple hors ligne (sans IA) — à valider.' : 'Proposition — à valider.');
    } catch (e) {
      setAideMsg(e instanceof AideRefusal ? e.message : "L'aide n'a pas répondu.");
    }
  };
  const proposalsFor = (card: string) =>
    pending.filter((e) => e.act && 'card' in e.act && e.act.card === card && (e.act.act === 'card_simpler' || e.act.act === 'card_translated'));

  const create = () => {
    if (!text.trim() && !picto) return;
    const id = `carte-${Object.keys(s.cards).length + 1}`;
    act('amina', {
      act: 'card_created', card: id, title: picto ? PICTOS[picto].fr : text.trim().split(' ').slice(0, 3).join(' '),
      picto, verbatim: text.trim(), lang: 'fr', origin: picto && !text.trim() ? 'picture' : 'written', said_with: 'Sarah', when: "aujourd'hui",
    });
    say('Ta Carte est créée.');
    setAdding(false); setText(''); setPicto(null);
  };

  return (
    <Screen side="pp" title="cards" question={w('whichCard')}>
      <ScrollView contentContainerStyle={st.grid}>
        {Object.entries(s.cards).map(([id, c]) => (
          <Pressable accessibilityRole="button" key={id} onPress={() => { setOpen(id); say(c.verbatim || c.title); }} accessibilityLabel={c.title}>
            <CardView card={c} />
          </Pressable>
        ))}
        <Pressable onPress={() => setAdding(true)} style={st.new} accessibilityRole="button">
          <Text style={st.plus}>＋</Text>
          <Text style={st.newTitle}>{w('newCard')}</Text>
          <Text style={st.muted}>{w('newCardHow')}</Text>
        </Pressable>
      </ScrollView>

      {big && (
        <View style={st.overlay}>
          <View style={st.bigCard}>
            {big.picto && <Picto name={big.picto} size={96} />}
            <Text style={st.bigTitle}>{big.title}</Text>
            {big.verbatim ? <Text style={st.verbatim}>« {big.verbatim} »</Text> : null}
            {big.simpler ? <Text style={st.simpler}>Plus simple : {big.simpler}</Text> : null}
            {big.moments.map((m) => <Text key={m} style={st.chip}>{m}</Text>)}
            {!big.feeling && <Text style={st.chip}>{w('notPlaced')}</Text>}
            <Text style={st.muted}>{w('keepsAll')}</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Pressable accessibilityRole="button" onPress={() => aide(open!, 'simplify')} style={st.btn}><Text style={st.btnTxt}>💬 Version plus simple</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => aide(open!, 'translate')} style={st.btn}><Text style={st.btnTxt}>🌐 En arabe</Text></Pressable>
            </View>
            {aideMsg ? <Text style={st.muted} accessibilityLiveRegion="polite">{aideMsg}</Text> : null}
            {proposalsFor(open!).map((e) => (
              <View key={e.rank} style={st.proposal}>
                <Text style={st.simpler}>Proposition : {e.act && 'text' in e.act ? e.act.text : ''}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable accessibilityRole="button" onPress={() => { confirm(e.rank, 'amina'); setAideMsg('Validé par Amina.'); }} style={[st.btn, st.primary]}><Text style={[st.btnTxt, { color: '#fff' }]}>Je valide</Text></Pressable>
                  <Pressable accessibilityRole="button" onPress={() => { undo('amina', e.rank); setAideMsg('Écartée.'); }} style={st.btn}><Text style={st.btnTxt}>Non merci</Text></Pressable>
                </View>
              </View>
            ))}
            <Pressable accessibilityRole="button" onPress={() => setOpen(null)} style={st.btn}><Text style={st.btnTxt}>Fermer</Text></Pressable>
          </View>
        </View>
      )}

      {adding && (
        <View style={st.overlay}>
          <View style={st.bigCard}>
            <Text style={st.bigTitle}>{w('newCard')}</Text>
            <TextInput value={text} onChangeText={setText} placeholder="J'écris ce que je veux dire…" style={st.input} multiline accessibilityLabel="J'écris" />
            <Text style={st.muted}>…ou je choisis une image</Text>
            <View style={st.pictos}>
              {(Object.keys(PICTOS) as PictoKey[]).map((k) => (
                <Pressable accessibilityRole="button" key={k} onPress={() => setPicto(k)} style={[st.pick, picto === k && st.pickOn]} accessibilityLabel={PICTOS[k].fr}>
                  <Picto name={k} size={56} />
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable accessibilityRole="button" onPress={create} style={[st.btn, st.primary]}><Text style={[st.btnTxt, { color: '#fff' }]}>Créer ma Carte</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => setAdding(false)} style={st.btn}><Text style={st.btnTxt}>Annuler</Text></Pressable>
            </View>
          </View>
        </View>
      )}
    </Screen>
  );
}

const st = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  new: { minWidth: 220, padding: 16, borderRadius: S.radius, borderWidth: 2, borderStyle: 'dashed', borderColor: C.line, backgroundColor: C.surface },
  plus: { fontSize: 32, color: C.slate },
  newTitle: { fontFamily: F.bold, fontSize: 17, color: C.ink },
  muted: { fontFamily: F.body, fontSize: 13, color: C.muted },
  overlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(13,17,23,.35)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  bigCard: { width: '100%', maxWidth: 620, gap: 10, padding: 24, borderRadius: 20, backgroundColor: C.surface, borderTopWidth: 8, borderTopColor: C.pp.value },
  bigTitle: { fontFamily: F.display, fontSize: 26, color: C.ink },
  verbatim: { fontFamily: F.display, fontSize: 22, color: C.ink },
  simpler: { fontFamily: F.body, fontSize: 16, color: C.text },
  chip: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: S.radiusPill, backgroundColor: C.surface2, fontFamily: F.body, fontSize: 13, color: C.slate },
  proposal: { gap: 6, padding: 10, borderRadius: 12, backgroundColor: '#f6effb', borderWidth: 1, borderStyle: 'dashed', borderColor: C.violet },
  input: { minHeight: 80, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12, fontFamily: F.body, fontSize: 17, color: C.ink },
  pictos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pick: { borderRadius: 16, padding: 3, borderWidth: 3, borderColor: 'transparent' },
  pickOn: { borderColor: C.violet },
  btn: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 18, borderRadius: S.radiusPill, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.line, alignSelf: 'flex-start' },
  primary: { backgroundColor: C.violetInk, borderColor: C.violetInk },
  btnTxt: { fontFamily: F.bold, fontSize: 16, color: C.ink },
});
