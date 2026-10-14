// Construire un chemin, étape par étape (écran 06 pour la personne, écran 12 pour le collectif).
// La grammaire est celle de l'Atlas : un couloir, un moment, ◆ une décision ou ● un événement ; puis,
// si l'on veut, un lien vers une étape déjà posée — chemin choisi, alternative ouverte, condition
// écrite sur sa branche, ou dépendance. Rien n'est proposé à la place de la personne : on écrit soi-même.

import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { LinkKind, NodeKind } from '../core/acts';
import { C, F, S } from '../design/theme';
import type { PNode } from './PathView';

export interface NewStep {
  lane: string;
  when: string;
  kind: NodeKind;
  label: string;
  link: { from: string; link: LinkKind } | null;
}

type LinkChoice = 'none' | 'chosen' | 'open' | 'condition' | 'dependency';
const LINKS: [LinkChoice, string][] = [
  ['none', 'sans lien'],
  ['chosen', '━ à la suite'],
  ['open', '┅ autre chemin possible'],
  ['condition', 'si…'],
  ['dependency', 'attend…'],
];

export function PathEditor({ columns, lanes, nodes, decisionLabel, onAdd }: {
  columns: string[];
  lanes: string[];
  nodes: PNode[];
  /** « je choisis » (06) ou « décidé ensemble » (12). */
  decisionLabel: string;
  onAdd: (s: NewStep) => void;
}) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [lane, setLane] = useState(lanes[0] ?? '');
  const [newLane, setNewLane] = useState('');
  const [when, setWhen] = useState(columns[0] ?? '');
  const [kind, setKind] = useState<NodeKind>('event');
  const [from, setFrom] = useState<string | null>(null);
  const [link, setLink] = useState<LinkChoice>('none');
  const [words, setWords] = useState('');

  const add = () => {
    const l = (newLane.trim() || lane).trim();
    if (!label.trim() || !l || !when) return;
    const lk: LinkKind | null =
      link === 'none' || !from ? null : link === 'condition' || link === 'dependency' ? { kind: link, words: words.trim() } : { kind: link };
    if (lk && 'words' in lk && !lk.words) return; // une condition ou une attente s'écrit
    onAdd({ lane: l, when, kind, label: label.trim(), link: lk && from ? { from, link: lk } : null });
    setLabel('');
    setNewLane('');
    setFrom(null);
    setLink('none');
    setWords('');
    setOpen(false);
  };

  if (!open) {
    return (
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={st.btn}>
        <Text style={st.btnTxt}>＋ Une étape</Text>
      </Pressable>
    );
  }
  const chip = (on: boolean, text: string, onPress: () => void, key: string) => (
    <Pressable key={key} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={onPress} style={[st.pick, on && st.pickOn]}>
      <Text style={st.pickTxt}>{text}</Text>
    </Pressable>
  );
  return (
    <View style={st.box}>
      <TextInput value={label} onChangeText={setLabel} placeholder="L'étape, en quelques mots" style={st.input} accessibilityLabel="L'étape" />
      <Text style={st.small}>Un événement ou une décision ?</Text>
      <View style={st.row}>
        {chip(kind === 'event', '● ça arrive', () => setKind('event'), 'e')}
        {chip(kind === 'decision', `◆ ${decisionLabel}`, () => setKind('decision'), 'd')}
      </View>
      <Text style={st.small}>Dans quel couloir ?</Text>
      <View style={st.row}>
        {lanes.map((l) => chip(lane === l && !newLane, l, () => { setLane(l); setNewLane(''); }, l))}
        <TextInput value={newLane} onChangeText={setNewLane} placeholder="un autre couloir…" style={[st.input, st.small2]} accessibilityLabel="Un autre couloir" />
      </View>
      <Text style={st.small}>Quand ?</Text>
      <View style={st.row}>{columns.map((c) => chip(when === c, c, () => setWhen(c), c))}</View>
      {nodes.length > 0 && (
        <>
          <Text style={st.small}>Relier à une étape déjà posée ?</Text>
          <View style={st.row}>{LINKS.map(([k, t]) => chip(link === k, t, () => setLink(k), k))}</View>
          {link !== 'none' && <View style={st.row}>{nodes.map((n) => chip(from === n.id, n.label, () => setFrom(n.id), n.id))}</View>}
          {(link === 'condition' || link === 'dependency') && (
            <TextInput value={words} onChangeText={setWords} placeholder={link === 'condition' ? 'si plus de 8 viennent…' : 'attend la convention…'} style={st.input} accessibilityLabel={link === 'condition' ? 'La condition' : "Ce qu'elle attend"} />
          )}
        </>
      )}
      <View style={st.row}>
        <Pressable accessibilityRole="button" onPress={add} style={[st.btn, st.primary]}>
          <Text style={[st.btnTxt, { color: C.onAccent }]}>Poser l’étape</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={st.btn}>
          <Text style={st.btnTxt}>Annuler</Text>
        </Pressable>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  box: { gap: 8, padding: 14, borderRadius: S.radius, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 10, fontFamily: F.body, fontSize: 16, color: C.ink, backgroundColor: C.surface },
  small2: { minWidth: 180 },
  small: { fontFamily: F.body, fontSize: 13, color: C.muted },
  btn: { alignSelf: 'flex-start', minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 16, borderRadius: S.radiusPill, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  primary: { backgroundColor: C.violetInk, borderColor: C.violetInk },
  btnTxt: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  pick: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 14, borderRadius: S.radiusPill, borderWidth: 2, borderColor: C.line, backgroundColor: C.surface },
  pickOn: { borderColor: C.violet, backgroundColor: C.violetSoft },
  pickTxt: { fontFamily: F.bold, fontSize: 14, color: C.ink },
});
