// Construire un chemin, étape par étape (écran 06 pour la personne, écran 12 pour le collectif).
// La grammaire est celle de l'Atlas : un couloir, un moment, ◆ une décision ou ● un événement ; puis,
// si l'on veut, un lien vers une étape déjà posée — chemin choisi, alternative ouverte, condition
// écrite sur sa branche, ou dépendance. Rien n'est proposé à la place de la personne : on écrit soi-même.

import { PictoPicker } from './PictoPicker';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { LinkKind, NodeKind } from '../core/acts';
import { useT } from '../core/useAids';
import { C, F, S } from '../design/theme';
import type { PNode } from './PathView';

export interface NewStep {
  lane: string;
  when: string;
  kind: NodeKind;
  label: string;
  link: { from: string; link: LinkKind } | null;
  /** L'étape en cours du fil (écran 06) : elle pulse sur le chemin. */
  thread: boolean;
  /** La Carte dont l'étape est née (écran 06), s'il y en a une. */
  card: string | null;
  /** Une image choisie par le groupe (écran 12), facultative. */
  picto: string | null;
}

type LinkChoice = 'none' | 'chosen' | 'open' | 'condition' | 'dependency';
const LINKS: [LinkChoice, string, string][] = [
  ['none', 'sans lien', 'بلا رابط'],
  ['chosen', '━ à la suite', '━ بعدها مباشرة'],
  ['open', '┅ autre chemin possible', '┅ طريق آخر ممكن'],
  ['condition', 'si…', 'إذا…'],
  ['dependency', 'attend…', 'ينتظر…'],
];

export function PathEditor({ columns, lanes, nodes, decisionLabel, onAdd, onRemove, threadOption = false, cards = [], actions = null, pictoOption = false }: {
  columns: string[];
  lanes: string[];
  nodes: PNode[];
  /** « je choisis » (06) ou « décidé ensemble » (12). */
  decisionLabel: string;
  onAdd: (s: NewStep) => void;
  /** Retirer une étape : le même geste à l'envers (une compensation dans le journal). */
  onRemove?: (id: string) => void;
  /** Proposer « l'étape en cours » (écran 06). */
  threadOption?: boolean;
  /** Les Cartes de la personne, pour dire de laquelle l'étape est née (écran 06). */
  cards?: { id: string; title: string }[];
  /** Les autres boutons de l'écran, sur la même rangée (une seule rangée d'action, comme l'Atlas). */
  actions?: ReactNode;
  /** Proposer une image facultative pour l'étape (écran 12, chemin collectif). */
  pictoOption?: boolean;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [lane, setLane] = useState(lanes[0] ?? '');
  const [newLane, setNewLane] = useState('');
  const [when, setWhen] = useState(columns[0] ?? '');
  const [kind, setKind] = useState<NodeKind>('event');
  const [from, setFrom] = useState<string | null>(null);
  const [link, setLink] = useState<LinkChoice>('none');
  const [words, setWords] = useState('');
  const [current, setCurrent] = useState(false);
  const [card, setCard] = useState<string | null>(null);
  const [picto, setPicto] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const add = () => {
    const l = (newLane.trim() || lane).trim();
    if (!label.trim() || !l || !when) return;
    const lk: LinkKind | null =
      link === 'none' || !from ? null : link === 'condition' || link === 'dependency' ? { kind: link, words: words.trim() } : { kind: link };
    if (lk && 'words' in lk && !lk.words) return; // une condition ou une attente s'écrit
    onAdd({ lane: l, when, kind, label: label.trim(), link: lk && from ? { from, link: lk } : null, thread: current, card, picto });
    setCurrent(false);
    setCard(null);
    setPicto(null);
    setLabel('');
    setNewLane('');
    setFrom(null);
    setLink('none');
    setWords('');
    setOpen(false);
  };

  if (!open) {
    return (
      <View style={st.row}>
        <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={st.btn}>
          <Text style={st.btnTxt}>{t('＋ Une étape', '＋ خطوة')}</Text>
        </Pressable>
        {actions}
        {onRemove && nodes.length > 0 && (
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: removing }} onPress={() => setRemoving(!removing)} style={st.btn}>
            <Text style={st.btnTxt}>{t('Retirer une étape', 'إزالة خطوة', 'Enlever une étape')}</Text>
          </Pressable>
        )}
        {removing && onRemove && nodes.map((n) => (
          <Pressable key={n.id} accessibilityRole="button" accessibilityLabel={t(`Retirer « ${n.label} »`, `إزالة « ${n.label} »`)} onPress={() => { onRemove(n.id); setRemoving(false); }} style={st.pick}>
            <Text style={st.pickTxt}>✕ {n.label}</Text>
          </Pressable>
        ))}
      </View>
    );
  }
  const chip = (on: boolean, text: string, onPress: () => void, key: string) => (
    <Pressable key={key} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={onPress} style={[st.pick, on && st.pickOn]}>
      <Text style={st.pickTxt}>{text}</Text>
    </Pressable>
  );
  return (
    <View style={st.box}>
      <TextInput value={label} onChangeText={setLabel} placeholder={t("L'étape, en quelques mots", 'الخطوة، في بضع كلمات')} style={st.input} accessibilityLabel={t("L'étape", 'الخطوة')} />
      <Text style={st.small}>{t('Un événement ou une décision ?', 'حدث أم قرار؟', 'Ça arrive, ou je choisis ?')}</Text>
      <View style={st.row}>
        {chip(kind === 'event', t('● ça arrive', '● يحدث'), () => setKind('event'), 'e')}
        {chip(kind === 'decision', `◆ ${decisionLabel}`, () => setKind('decision'), 'd')}
      </View>
      <Text style={st.small}>{t('Dans quel couloir ?', 'في أيّ مسار؟')}</Text>
      <View style={st.row}>
        {lanes.map((l) => chip(lane === l && !newLane, l, () => { setLane(l); setNewLane(''); }, l))}
        <TextInput value={newLane} onChangeText={setNewLane} placeholder={t('un autre couloir…', 'مسار آخر…')} style={[st.input, st.small2]} accessibilityLabel={t('Un autre couloir', 'مسار آخر')} />
      </View>
      <Text style={st.small}>{t('Quand ?', 'متى؟')}</Text>
      <View style={st.row}>{columns.map((c) => chip(when === c, c, () => setWhen(c), c))}</View>
      {nodes.length > 0 && (
        <>
          <Text style={st.small}>{t('Relier à une étape déjà posée ?', 'ربطها بخطوة موضوعة من قبل؟', 'Avec une autre étape ?')}</Text>
          <View style={st.row}>{LINKS.map(([k, fr, ar]) => chip(link === k, t(fr, ar), () => setLink(k), k))}</View>
          {link !== 'none' && <View style={st.row}>{nodes.map((n) => chip(from === n.id, n.label, () => setFrom(n.id), n.id))}</View>}
          {(link === 'condition' || link === 'dependency') && (
            <TextInput value={words} onChangeText={setWords} placeholder={link === 'condition' ? t('si…', 'إذا…') : t('attend…', 'ينتظر…')} style={st.input} accessibilityLabel={link === 'condition' ? t('La condition', 'الشرط') : t("Ce qu'elle attend", 'ما تنتظره')} />
          )}
        </>
      )}
      {cards.length > 0 && (
        <>
          <Text style={st.small}>{t('Née d’une de mes Cartes ?', 'وُلدت من إحدى بطاقاتي؟', 'Elle vient de quelle Carte ?')}</Text>
          <View style={st.row}>{cards.map((c) => chip(card === c.id, c.title, () => setCard(card === c.id ? null : c.id), `card-${c.id}`))}</View>
        </>
      )}
      {pictoOption && <PictoPicker value={picto} onChange={setPicto} />}
      {threadOption && (
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: current }} onPress={() => setCurrent(!current)} style={[st.pick, current && st.pickOn]}>
          <Text style={st.pickTxt}>{t('📍 C’est l’étape en cours', '📍 هذه هي الخطوة الحالية', '📍 Je suis là')}</Text>
        </Pressable>
      )}
      <View style={st.row}>
        <Pressable accessibilityRole="button" onPress={add} style={[st.btn, st.primary]}>
          <Text style={[st.btnTxt, { color: C.onAccent }]}>{t('Poser l’étape', 'وضع الخطوة')}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={st.btn}>
          <Text style={st.btnTxt}>{t('Annuler', 'إلغاء')}</Text>
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
