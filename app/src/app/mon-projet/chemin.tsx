// 06 Chemin — le chemin d'Amina, saison après saison. Les autres chemins s'ouvrent à la demande.
// « Et si… ? » joue sur une COPIE (cadre en pointillé) : le vrai chemin ne bouge pas ; deux sorties
// explicites. Puis le plan, en quatre cases, dans ses mots.

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '../../components/Chrome';
import { BackupRefusal, exportDossier, MIN_WORDS } from '../../core/backup';
import { saveFile } from '../../core/saveFile';
import { PathView } from '../../components/PathView';
import { say, useWords } from '../../core/useAids';
import { useProject, useProjectState } from '../../core/useProject';
import { C, F, S } from '../../design/theme';
import type { WordKey } from '../../i18n/words';

const SEASONS = ['automne', 'hiver', 'printemps', 'été'];
const LANES = ['démarches', 'formation', 'activité', 'permis'];

export default function Chemin() {
  const w = useWords();
  const s = useProjectState();
  const act = useProject((x) => x.act);
  const [others, setOthers] = useState(false);
  const [whatIf, setWhatIf] = useState(false);
  const [question, setQuestion] = useState('Et si le rendez-vous à la CAF était repoussé ?');
  const [moved, setMoved] = useState<{ node: string; when: string } | null>(null);
  const [plan, setPlan] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [saved, setSaved] = useState('');
  const entries = useProject((x) => x.entries);

  const nodes = Object.entries(s.nodes).map(([id, n]) => ({ id, ...n }));
  const copy = nodes.map((n) => (moved && n.id === moved.node ? { ...n, when: moved.when } : n));
  const movable = nodes.filter((n) => n.kind === 'event');

  const closeWhatIf = (kept: boolean) => {
    const sim = `sim-${Object.keys(s.whatIfs).length + 1}`;
    act('amina', { act: 'what_if', sim, question, moves: moved ? [[moved.node, moved.when]] : [], story: null });
    act('amina', { act: 'what_if_closed', sim, kept });
    say(kept ? "L'idée est gardée. Ton vrai chemin n'a pas bougé." : "C'est refermé. Ton vrai chemin n'a pas bougé.");
    setWhatIf(false);
    setMoved(null);
  };

  return (
    <Screen side="pp" title="path" question={w('pathQuestion')}>
      <ScrollView contentContainerStyle={{ gap: 12 }}>
        {!whatIf ? (
          <PathView columns={SEASONS} lanes={LANES} nodes={nodes} links={s.links} showOthers={others} />
        ) : (
          <View style={{ gap: 8 }}>
            <Text style={st.copy}>{w('copyNote')}</Text>
            <TextInput value={question} onChangeText={setQuestion} style={st.input} accessibilityLabel="Ma question Et si" />
            <View style={st.chips}>
              {movable.map((n) => (
                <Pressable accessibilityRole="button" key={n.id} onPress={() => setMoved({ node: n.id, when: SEASONS[(SEASONS.indexOf((moved?.node === n.id ? moved.when : n.when)) + 1) % SEASONS.length] })} style={[st.pick, moved?.node === n.id && st.pickOn]}>
                  <Text style={st.btnTxt}>{n.label} → plus tard</Text>
                </Pressable>
              ))}
            </View>
            <PathView columns={SEASONS} lanes={LANES} nodes={copy} links={s.links} showOthers dashed />
            <View style={st.chips}>
              <Pressable accessibilityRole="button" onPress={() => closeWhatIf(true)} style={[st.btn, st.primary]}><Text style={[st.btnTxt, { color: '#fff' }]}>{w('keepIdea')}</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => closeWhatIf(false)} style={st.btn}><Text style={st.btnTxt}>{w('closeIt')}</Text></Pressable>
            </View>
          </View>
        )}

        <View style={st.chips}>
          <Pressable onPress={() => setOthers(!others)} style={[st.btn, others && st.on]} accessibilityRole="switch" accessibilityState={{ checked: others }}><Text style={[st.btnTxt, others && { color: '#fff' }]}>{w('otherPaths')}</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => setWhatIf(true)} style={st.btn}><Text style={st.btnTxt}>{w('whatIf')}</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => setPlan(!plan)} style={[st.btn, plan && st.on]}><Text style={[st.btnTxt, plan && { color: '#fff' }]}>{w('myPlan')}</Text></Pressable>
        </View>

        <View style={st.export}>
          <Text style={st.tileTitle}>🔒 Emporter mon dossier</Text>
          <Text style={st.small}>Une copie chiffrée, lisible seulement avec ta phrase ({MIN_WORDS} mots ou plus). Une phrase perdue, c'est un dossier perdu : personne ne peut la retrouver.</Text>
          <TextInput value={phrase} onChangeText={setPhrase} placeholder="Ma phrase de six mots ou plus" secureTextEntry style={st.input} accessibilityLabel="Ma phrase" />
          <Pressable
            onPress={async () => {
              try {
                const f = exportDossier(JSON.stringify({ person: 'amina', entries }), phrase);
                await saveFile('dossier-amina.hlux.json', JSON.stringify(f));
                setSaved('Ton dossier chiffré est prêt.');
                setPhrase('');
              } catch (e) {
                setSaved(e instanceof BackupRefusal ? e.message : 'La copie a échoué.');
              }
            }}
            style={[st.btn, st.primary, { alignSelf: 'flex-start' }]} accessibilityRole="button">
            <Text style={[st.btnTxt, { color: '#fff' }]}>Emporter</Text>
          </Pressable>
          {saved ? <Text style={st.small} accessibilityLiveRegion="polite">{saved}</Text> : null}
        </View>

        {plan && (
          <View style={st.plan}>
            {([['planFirst', s.plan.first], ['planWaiting', s.plan.waiting.map(([a, b]) => `${a} · ${b}`)], ['planWith', s.plan.with_whom], ['planOpen', s.plan.open]] as [WordKey, string[]][]).map(([k, items]) => (
              <View key={k} style={st.tile}>
                <Text style={st.tileTitle}>{w(k)}</Text>
                {items.map((i) => <Text key={i} style={st.tileItem}>{i}</Text>)}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const st = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  btn: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 16, borderRadius: S.radiusPill, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  on: { backgroundColor: C.violetInk, borderColor: C.violetInk },
  primary: { backgroundColor: C.violetInk, borderColor: C.violetInk },
  btnTxt: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  copy: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: S.radiusPill, backgroundColor: C.violetInk, color: '#fff', fontFamily: F.bold, fontSize: 12, letterSpacing: 1 },
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12, fontFamily: F.bold, fontSize: 17, color: C.ink, backgroundColor: C.surface },
  pick: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 14, borderRadius: S.radiusPill, borderWidth: 2, borderColor: C.line, backgroundColor: C.surface },
  pickOn: { borderColor: C.violet, backgroundColor: '#f6effb' },
  plan: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { flexGrow: 1, flexBasis: 200, padding: 14, borderRadius: S.radius, backgroundColor: C.surface, gap: 4 },
  tileTitle: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  export: { padding: 14, borderRadius: S.radius, backgroundColor: C.surface, gap: 8 },
  small: { fontFamily: F.body, fontSize: 13, color: C.muted },
  tileItem: { fontFamily: F.body, fontSize: 15, color: C.text },
});
