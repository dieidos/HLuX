// 02 Ressenti — « Comment ça va pour moi ? Je prends une carte, je la pose. »
// Trois lieux ; prendre → poser ; une phrase dit la conséquence ; annuler = le même geste à l'envers.

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CardView } from '../../components/CardView';
import { Screen } from '../../components/Chrome';
import { DictateButton } from '../../components/DictateButton';
import { DragArea, Draggable, Zone } from '../../components/Drag';
import type { Feeling } from '../../core/acts';
import { FEELING_WORDS } from '../../core/project';
import { say, useAids, useWords } from '../../core/useAids';
import { parsePlacement } from '../../core/voicePlace';
import { useProject, useProjectState, useMe } from '../../core/useProject';
import { C, F, S } from '../../design/theme';
import type { WordKey } from '../../i18n/words';

const ZONES: [Feeling, WordKey, string][] = [
  ['fine', 'fine', C.feeling.fine],
  ['unsure', 'unsure', C.feeling.unsure],
  ['hard', 'hard', C.feeling.hard],
];

export default function Ressenti() {
  const me = useMe();
  const w = useWords();
  const lang = useAids().lang === 'ar' ? 'ar' : 'fr';
  const s = useProjectState();
  const act = useProject((x) => x.act);
  const undo = useProject((x) => x.undo);
  const [said, setSaid] = useState<{ text: string; rank: number } | null>(null);

  const place = (card: string, feeling: Feeling) => {
    const e = act(me.id, { act: 'card_felt', card, feeling, when: "aujourd'hui" });
    const text = `${s.cards[card].title} va dans « ${FEELING_WORDS[feeling]} ».`;
    setSaid({ text, rank: e.rank });
    say(text);
  };

  const tray = Object.entries(s.cards).filter(([, c]) => !c.feeling);
  // Dire au lieu de glisser : « Papiers, c'est difficile ». Même geste, même phrase redite, même « Annuler ».
  const [heard, setHeard] = useState('');
  const spoken = (text: string, final: boolean) => {
    if (!final) return;
    const p = parsePlacement(text, Object.entries(s.cards).map(([id, c]) => ({ id, title: c.title })));
    if (p) {
      setHeard('');
      place(p.card, p.feeling);
    } else setHeard(`« ${text} » : je n’ai pas reconnu la Carte et l’endroit. Tu peux toucher la carte.`);
  };
  return (
    <Screen side="pp" title="feeling" question={w('howFeel')}>
      <DragArea>
        <View style={st.zones}>
          {ZONES.map(([f, label, bg]) => (
            <Zone key={f} id={f} label={w(label)} onDrop={(card) => place(card, f)} style={{ ...st.zone, backgroundColor: bg }}>
              <Text style={st.zoneTitle}>{w(label)}</Text>
              <View style={st.stack}>
                {Object.entries(s.cards).filter(([, c]) => c.feeling === f).map(([id, c]) => (
                  <Draggable key={id} id={id} label={c.title}><CardView card={c} compact /></Draggable>
                ))}
              </View>
            </Zone>
          ))}
        </View>
        <View style={st.tray}>
          {tray.length === 0 ? <Text style={st.muted}>Toutes les cartes sont posées.</Text> : null}
          {tray.map(([id, c]) => (
            <Draggable key={id} id={id} label={c.title}><CardView card={c} compact /></Draggable>
          ))}
        </View>
      </DragArea>
      <View style={st.voice}>
        <DictateButton label="🎙 Je le dis" lang={lang} onText={spoken} />
        {heard ? <Text style={st.muted} accessibilityLiveRegion="polite">{heard}</Text> : null}
      </View>
      {said && (
        <View style={st.said} accessibilityLiveRegion="polite">
          <Text style={st.saidTxt}>{said.text}</Text>
          <Pressable onPress={() => { undo(me.id, said.rank); setSaid(null); }} style={st.undo} accessibilityRole="button">
            <Text style={st.undoTxt}>↶ Annuler</Text>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}

const st = StyleSheet.create({
  zones: { flexDirection: 'row', gap: 16, flex: 1, flexWrap: 'wrap' },
  zone: { flex: 1, minWidth: 220, minHeight: 220 },
  zoneTitle: { fontFamily: F.bold, fontSize: 18, color: C.ink, marginBottom: 10 },
  stack: { gap: 8 },
  tray: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16, padding: 12, borderRadius: S.radius, backgroundColor: C.surface2, minHeight: 72 },
  muted: { fontFamily: F.body, color: C.muted },
  voice: { marginTop: 12, gap: 6 },
  said: { position: 'absolute', bottom: 16, alignSelf: 'center', flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, paddingHorizontal: 18, borderRadius: S.radiusPill, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  saidTxt: { fontFamily: F.bold, fontSize: 16, color: C.ink },
  undo: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 14, borderRadius: S.radiusPill, backgroundColor: C.surface2 },
  undoTxt: { fontFamily: F.bold, color: C.ink },
});
