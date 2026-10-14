// 02 Ressenti — « Comment ça va pour moi ? Je prends une carte, je la pose. »
// Trois lieux ; prendre → poser ; une phrase dit la conséquence ; annuler = le même geste à l'envers
// (reposer la carte dans la réserve). La réserve offre aussi les 10 cartes-pictos de l'Atlas : poser l'une
// d'elles crée la Carte (origine « image »), comme si elle avait été choisie à l'écran 01.

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
import { useMe, useProject, useProjectState } from '../../core/useProject';
import { Picto } from '../../components/Picto';
import { PICTOS, type PictoKey } from '../../design/pictos';
import { C, F, S } from '../../design/theme';
import type { WordKey } from '../../i18n/words';

/** La réserve de l'Atlas (écran 02) : dix cartes-pictos. */
const RESERVE: PictoKey[] = ['famille', 'amis', 'travail', 'appel', 'fatigue', 'papiers', 'logement', 'allocations', 'sante', 'courage'];

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
  const entries = useProject((x) => x.entries);
  const pro = useProject((x) => x.pro);
  const [said, setSaid] = useState<{ text: string; rank: number; card: string } | null>(null);

  const place = (id: string, feeling: Feeling) => {
    let card = id;
    // Une carte-picto de la réserve devient une Carte au moment où elle est posée.
    if (id.startsWith('picto:')) {
      const k = id.slice(6) as PictoKey;
      card = `carte-${Object.keys(s.cards).length + 1}`;
      act(me.id, { act: 'card_created', card, title: PICTOS[k].fr, picto: k, verbatim: '', lang: 'fr', origin: 'picture', said_with: pro, when: "aujourd'hui" });
    }
    const title = id.startsWith('picto:') ? PICTOS[id.slice(6) as PictoKey].fr : s.cards[card].title;
    const e = act(me.id, { act: 'card_felt', card, feeling, when: "aujourd'hui" });
    const text = `${title} va dans « ${FEELING_WORDS[feeling]} ».`;
    setSaid({ text, rank: e.rank, card });
    say(text);
  };
  // Annuler = le même geste à l'envers : la carte revient dans la réserve, et son dernier placement est compensé.
  const back = (card: string) => {
    const undone = new Set(entries.filter((e) => e.undone !== undefined).map((e) => e.undone!));
    const last = [...entries].reverse().find((e) => e.act?.act === 'card_felt' && e.act.card === card && !undone.has(e.rank));
    if (!last) return;
    undo(me.id, last.rank);
    const t = `${s.cards[card]?.title ?? ''} revient dans la réserve.`;
    setSaid(null);
    say(t);
  };

  const tray = Object.entries(s.cards).filter(([, c]) => !c.feeling);
  const used = new Set(Object.values(s.cards).map((c) => c.picto));
  const reserve = RESERVE.filter((k) => !used.has(k));
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
        <Zone id="reserve" label="La réserve" accepts={(card) => !!s.cards[card]?.feeling} onDrop={back} style={st.tray}>
          {tray.map(([id, c]) => (
            <Draggable key={id} id={id} label={c.title}><CardView card={c} compact /></Draggable>
          ))}
          {reserve.map((k) => (
            <Draggable key={k} id={`picto:${k}`} label={lang === 'ar' ? PICTOS[k].ar : PICTOS[k].fr}>
              <View style={st.picto}><Picto name={k} size={56} /></View>
            </Draggable>
          ))}
          {tray.length === 0 && reserve.length === 0 ? <Text style={st.muted}>Toutes les cartes sont posées.</Text> : null}
        </Zone>
      </DragArea>
      <View style={st.voice}>
        <DictateButton label="🎙 Je le dis" lang={lang} onText={spoken} />
        {heard ? <Text style={st.muted} accessibilityLiveRegion="polite">{heard}</Text> : null}
      </View>
      {said && (
        <View style={st.said} accessibilityLiveRegion="polite">
          <Text style={st.saidTxt}>{said.text}</Text>
          {s.cards[said.card]?.verbatim ? (
            <View style={st.side}>
              <Text style={st.verb}>« {s.cards[said.card].verbatim} »</Text>
              {s.cards[said.card].simpler ? <Text style={st.simple}>💬 {s.cards[said.card].simpler}</Text> : null}
            </View>
          ) : null}
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
  picto: { padding: 2, borderRadius: 14 },
  side: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, maxWidth: 560 },
  verb: { fontFamily: F.display, fontSize: 15, color: C.ink, flexShrink: 1 },
  simple: { fontFamily: F.body, fontSize: 14, color: C.text, flexShrink: 1, paddingLeft: 10, borderLeftWidth: 3, borderLeftColor: C.violet },
  voice: { marginTop: 12, gap: 6 },
  said: { position: 'absolute', bottom: 16, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center', padding: 12, paddingHorizontal: 18, borderRadius: 24, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  saidTxt: { fontFamily: F.bold, fontSize: 16, color: C.ink },
  undo: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 14, borderRadius: S.radiusPill, backgroundColor: C.surface2 },
  undoTxt: { fontFamily: F.bold, color: C.ink },
});
