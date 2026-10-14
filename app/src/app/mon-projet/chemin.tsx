// 06 Chemin — le chemin d'Amina, saison après saison. Les autres chemins s'ouvrent à la demande.
// « Et si… ? » joue sur une COPIE (cadre en pointillé) : le vrai chemin ne bouge pas ; deux sorties
// explicites. Puis le plan, en quatre cases, dans ses mots.

import { DossierCopy } from '../../components/DossierCopy';
import { usePathname } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '../../components/Chrome';
import { AideButton } from '../../components/AideButton';
import { PathEditor } from '../../components/PathEditor';
import { PathView } from '../../components/PathView';
import { PlanEditor } from '../../components/PlanEditor';
import { seasonsFrom } from '../../core/dates';
import { freshId } from '../../core/ids';
import { tNow, tell, useAids, useT, useWords } from '../../core/useAids';
import { useFacilityState } from '../../core/useFacility';
import { useProject, useProjectState, useMe } from '../../core/useProject';
import { C, F, S } from '../../design/theme';

const LANES = ['démarches', 'formation', 'activité', 'permis'];

export default function Chemin() {
  const pathname = usePathname();
  // Les saisons commencent par celle d'aujourd'hui, plus celles des étapes déjà posées.
  const nodesSeasons = Object.values(useProjectState().nodes).map((n) => n.when);
  const SEASONS = [...new Set([...seasonsFrom(), ...nodesSeasons])];
  const [storyAided, setStoryAided] = useState(false);
  const me = useMe();
  const w = useWords();
  const t = useT();
  const s = useProjectState();
  const act = useProject((x) => x.act);
  const undo = useProject((x) => x.undo);
  const entries = useProject((x) => x.entries);
  const [others, setOthers] = useState(false);
  const [whatIf, setWhatIf] = useState(false);
  const [question, setQuestion] = useState('');
  const [moved, setMoved] = useState<{ node: string; when: string } | null>(null);
  const [plan, setPlan] = useState(false);
  const [story, setStory] = useState('');
  const [planWords, setPlanWords] = useState('');
  const [planAided, setPlanAided] = useState(false);
  const facility = useFacilityState();
  const place = useProject((x) => x.setup?.name ?? '');
  const proposals = Object.entries(facility.proposals).filter(([id]) => !s.linkedProposals.some((l) => l.proposal === id));

  const nodes = Object.entries(s.nodes).map(([id, n]) => ({ id, ...n }));
  // Les couloirs de l'Atlas, plus ceux que la personne a nommés.
  const lanes = [...new Set([...LANES, ...nodes.map((n) => n.lane)])];
  const copy = nodes.map((n) => (moved && n.id === moved.node ? { ...n, when: moved.when } : n));
  const movable = nodes.filter((n) => n.kind === 'event');
  const movedNode = moved ? nodes.find((n) => n.id === moved.node) : null;
  const facts = movedNode ? `${question} Sur la copie : « ${movedNode.label} » passe de ${movedNode.when} à ${moved!.when}.` : question;
  const planFacts = `D'abord : ${s.plan.first.join(', ')}. Ça attend : ${s.plan.waiting.map(([a, b]) => `${a} (${b})`).join(', ')}. Avec qui : ${s.plan.with_whom.join(', ')}. Reste ouvert : ${s.plan.open.join(', ')}.`;

  const closeWhatIf = (kept: boolean) => {
    const sim = `sim-${Object.keys(s.whatIfs).length + 1}`;
    // Un récit proposé par l'IA, gardé par la personne, est « généré », confirmé par elle.
    const aided = storyAided && !!story.trim();
    act(aided ? 'hlux-ia' : me.id, { act: 'what_if', sim, question, moves: moved ? [[moved.node, moved.when]] : [], story: story.trim() || null }, aided ? 'generated' : 'by_hand', aided ? me.id : undefined);
    act(me.id, { act: 'what_if_closed', sim, kept });
    tell(kept
      ? tNow("L'idée est gardée. Ton vrai chemin n'a pas bougé.", 'احتفظتِ بالفكرة. طريقكِ الحقيقي لم يتغيّر.', "Tu gardes l'idée. Ton chemin ne change pas.")
      : tNow("C'est refermé. Ton vrai chemin n'a pas bougé.", 'أُغلقت النسخة. طريقكِ الحقيقي لم يتغيّر.', "C'est fermé. Ton chemin ne change pas."), pathname);
    setWhatIf(false);
    setMoved(null);
    setStory('');
    setStoryAided(false);
  };

  return (
    <Screen side="pp" title="path" question={w('pathQuestion')}>
      <ScrollView contentContainerStyle={{ gap: 12 }}>
        {!whatIf ? (
          <>
            {nodes.length ? (
              <PathView columns={SEASONS} lanes={lanes} nodes={nodes} links={s.links} showOthers={others} />
            ) : (
              <Text style={st.small}>{t('Ton chemin commence ici : pose une première étape, avec la personne qui t’accompagne. C’est toi qui écris.', 'طريقكِ يبدأ هنا: ضعي خطوة أولى، مع الشخص الذي يرافقكِ. أنتِ من تكتبين.', 'Ton chemin commence ici. Tu poses une première étape.')}</Text>
            )}
            <PathEditor
              columns={SEASONS}
              lanes={lanes}
              nodes={nodes}
              decisionLabel={t('je choisis', 'أنا أختار')}
              threadOption
              actions={
                <>
                <Pressable onPress={() => setOthers(!others)} style={[st.btn, others && st.on]} accessibilityRole="switch" accessibilityState={{ checked: others }}><Text style={[st.btnTxt, others && { color: C.onAccent }]}>{w('otherPaths')}</Text></Pressable>
                <Pressable accessibilityRole="button" onPress={() => setWhatIf(true)} style={st.btn}><Text style={st.btnTxt}>{w('whatIf')}</Text></Pressable>
                <Pressable accessibilityRole="button" onPress={() => setPlan(!plan)} style={[st.btn, plan && st.on]}><Text style={[st.btnTxt, plan && { color: C.onAccent }]}>{w('myPlan')}</Text></Pressable>
                </>
              }
              cards={Object.entries(s.cards).map(([id, c]) => ({ id, title: c.title }))}
              onRemove={(id) => {
                const undone = new Set(entries.filter((e) => e.undone !== undefined).map((e) => e.undone!));
                const last = [...entries].reverse().find((e) => e.act?.act === 'node_set' && e.act.node === id && !undone.has(e.rank));
                if (last) {
                  undo(me.id, last.rank);
                  tell(tNow(`${s.nodes[id]?.label ?? ''} : retirée de ton chemin.`, `${s.nodes[id]?.label ?? ''}: أُزيلت من طريقكِ.`), pathname);
                }
              }}
              onAdd={(n) => {
                const id = freshId('etape', Object.keys(s.nodes));
                act(me.id, { act: 'node_set', node: id, lane: n.lane, kind: n.kind, label: n.label, when: n.when, thread: n.thread, card: n.card });
                if (n.link) act(me.id, { act: 'link_set', from: n.link.from, to: id, link: n.link.link });
                tell(tNow(`${n.label} : posée sur ton chemin, ${n.when}.`, `${n.label}: وُضعت على طريقكِ، ${n.when}.`), pathname);
              }}
            />
          </>
        ) : (
          <View style={{ gap: 8 }}>
            <Text style={st.copy}>{w('copyNote')}</Text>
            <TextInput value={question} onChangeText={setQuestion} placeholder={t('Et si… ?', 'ماذا لو…؟')} style={st.input} accessibilityLabel={t('Ma question Et si', 'سؤالي: ماذا لو')} />
            <View style={st.chips}>
              {movable.map((n) => (
                <Pressable accessibilityRole="button" key={n.id} onPress={() => setMoved({ node: n.id, when: SEASONS[(SEASONS.indexOf((moved?.node === n.id ? moved.when : n.when)) + 1) % SEASONS.length] })} style={[st.pick, moved?.node === n.id && st.pickOn]}>
                  <Text style={st.btnTxt}>{n.label} → {t('plus tard', 'لاحقاً')}</Text>
                </Pressable>
              ))}
            </View>
            <PathView columns={SEASONS} lanes={lanes} nodes={copy} links={s.links} showOthers dashed />
            <AideButton kind="narrate" lang={useAids.getState().lang} label={t("Raconter ce qui s'ouvre, ce qui se ferme", 'أحكي ما يُفتح وما يُغلق', 'Raconter')} text={facts} who={me.name} onProposal={(p) => { setStory(p); setStoryAided(true); }} />
            {story ? <TextInput value={story} onChangeText={setStory} multiline style={st.input} accessibilityLabel={t('Récit de la copie', 'حكاية النسخة')} /> : null}
            <View style={st.chips}>
              <Pressable accessibilityRole="button" onPress={() => closeWhatIf(true)} style={[st.btn, st.primary]}><Text style={[st.btnTxt, { color: C.onAccent }]}>{w('keepIdea')}</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => closeWhatIf(false)} style={st.btn}><Text style={st.btnTxt}>{w('closeIt')}</Text></Pressable>
            </View>
          </View>
        )}

        {proposals.map(([id, text]) => (
          <View key={id} style={st.inset}>
            <Text style={st.tileTitle}>{t(`${place} propose : ${text}.`, `اقتراح من ${place}: ${text}.`)}</Text>
            <Text style={st.small}>{t('Le collectif ne lit jamais ton chemin. C’est toi qui y fais entrer ce qu’il propose.', 'المجموعة لا تقرأ طريقكِ أبداً. أنتِ من تُدخلين فيه ما تقترحه.', 'Le collectif ne voit pas ton chemin. C’est toi qui choisis.')}</Text>
            <Pressable
              onPress={() => {
                act(me.id, { act: 'node_set', node: `propose-${id}`, lane: LANES[0], kind: 'event', label: text, when: SEASONS[0], thread: false });
                act(me.id, { act: 'proposal_linked', proposal: id, node: `propose-${id}` });
                tell(tNow('Relié à ton chemin.', 'رُبط بطريقكِ.'), pathname);
              }}
              style={[st.btn, st.primary, { alignSelf: 'flex-start' }]} accessibilityRole="button">
              <Text style={[st.btnTxt, { color: C.onAccent }]}>{t('Je le relie à mon chemin', 'أربطه بطريقي')}</Text>
            </Pressable>
          </View>
        ))}


        {Object.values(s.whatIfs).some((x) => x.kept) && (
          <View style={{ gap: 6 }}>
            <Text style={st.tileTitle}>{t('💭 Les idées gardées', '💭 الأفكار المحفوظة', '💭 Mes idées')}</Text>
            {Object.entries(s.whatIfs).filter(([, x]) => x.kept).map(([id, x]) => (
              <View key={id} style={st.tile}>
                <Text style={st.tileItem}>{x.question || t('Et si… ?', 'ماذا لو…؟')}</Text>
                {x.story ? <Text style={st.small}>{x.story}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {plan && (
          <View style={st.plan}>
            <PlanEditor
              plan={s.plan}
              titles={{ first: w('planFirst'), waiting: w('planWaiting'), with_whom: w('planWith'), open: w('planOpen') }}
              onChange={(plan) => act(me.id, { act: 'plan_set', plan })}
            />
            <View style={{ flexBasis: '100%', gap: 6 }}>
              <AideButton kind="narrate" lang={useAids.getState().lang} label={t('Dire mon plan en quelques phrases', 'أقول خطّتي في بضع جمل', 'Dire mon plan')} text={planFacts} who={me.name} onProposal={(x) => { setPlanWords(x); setPlanAided(true); }} />
              {s.plan.words && !planWords ? <Text style={st.tileItem}>« {s.plan.words} »</Text> : null}
              {planWords ? <TextInput value={planWords} onChangeText={setPlanWords} multiline style={st.input} accessibilityLabel={t('Mon plan dans mes mots', 'خطّتي بكلماتي')} /> : null}
              {planWords ? (
                <Pressable accessibilityRole="button" onPress={() => { act(planAided ? 'hlux-ia' : me.id, { act: 'plan_set', plan: { ...s.plan, words: planWords.trim() } }, planAided ? 'generated' : 'by_hand', planAided ? me.id : undefined); setPlanWords(''); setPlanAided(false); tell(tNow('Ton plan, dans tes mots, est gardé.', 'خطّتكِ بكلماتكِ محفوظة.'), pathname); }} style={[st.btn, st.primary, { alignSelf: 'flex-start' }]}>
                  <Text style={[st.btnTxt, { color: C.onAccent }]}>{t('Je garde ces mots', 'أحتفظ بهذه الكلمات')}</Text>
                </Pressable>
              ) : null}
            </View>
            <DossierCopy />
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
  copy: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: S.radiusPill, backgroundColor: C.violetInk, color: C.onAccent, fontFamily: F.bold, fontSize: 12, letterSpacing: 1 },
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12, fontFamily: F.bold, fontSize: 17, color: C.ink, backgroundColor: C.surface },
  pick: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 14, borderRadius: S.radiusPill, borderWidth: 2, borderColor: C.line, backgroundColor: C.surface },
  pickOn: { borderColor: C.violet, backgroundColor: C.violetSoft },
  plan: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { flexGrow: 1, flexBasis: 200, padding: 14, borderRadius: S.radius, backgroundColor: C.surface, gap: 4 },
  tileTitle: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  inset: { padding: 14, borderRadius: S.radius, backgroundColor: C.pe.soft, gap: 6, borderLeftWidth: 5, borderLeftColor: C.pe.value },
  export: { padding: 14, borderRadius: S.radius, backgroundColor: C.surface, gap: 8 },
  small: { fontFamily: F.body, fontSize: 13, color: C.muted },
  tileItem: { fontFamily: F.body, fontSize: 15, color: C.text },
});
