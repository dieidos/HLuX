// Accueil. Premier lancement : on nomme l'établissement et l'équipe (la tablette démarre vide).
// Puis la séance locale ouvre la tablette (décision du 2026-10-14).
// Appui long sur « HLuX » : le mode démonstration, caché, qui entre lui-même ses données.
// Un seul écran « Qui est là ? » : la professionnelle (retenue pour la journée), puis la personne, qui entre
// directement dans 01 Mes Cartes (décision du 2026-10-14 : moins d'écrans intermédiaires). Hors séance,
// les profils restent fermés. L'ancien accueil « Bonjour Amina » est devenu le menu du bandeau (PersonMenu).
import { refusalAr } from '../i18n/refusals';
import { Link, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Wordmark } from '../components/Chrome';
import { QrReceive } from '../components/QrCopy';
import { BackupRefusal, importDossier, type BackupFile } from '../core/backup';
import { pickTextFile } from '../core/openFile';
import { readDossier } from '../core/profiles';
import { tNow, useT, useWords } from '../core/useAids';
import { enterDemo, useMe, useProject, useTeam } from '../core/useProject';
import { C, F, S } from '../design/theme';

export default function Home() {
  const w = useWords();
  const t = useT();
  const me = useMe();
  const pro = useProject((s) => s.pro);
  const setup = useProject((s) => s.setup);
  const team = useTeam();
  const [place, setPlace] = useState('');
  const [names, setNames] = useState('');
  const [askDemo, setAskDemo] = useState(false);
  const [period, setPeriod] = useState('');
  const [device, setDevice] = useState<'facility' | 'personal' | null>(null);
  const [myName, setMyName] = useState('');
  const [mySentence, setMySentence] = useState('');
  const personal = setup?.kind === 'personal';
  const profiles = useProject((s) => s.profiles);
  const { openSession, closeSession, open, createProfile, restoreProfile } = useProject.getState();
  const [more, setMore] = useState(false);
  const [name, setName] = useState('');
  const [sentence, setSentence] = useState('');
  const [file, setFile] = useState<string | null>(null);
  const [restorePhrase, setRestorePhrase] = useState('');
  const [restoreMsg, setRestoreMsg] = useState('');
  const [qr, setQr] = useState<'receive' | null>(null);

  // Sur son téléphone, la personne entre directement dans son profil.
  useEffect(() => {
    if (personal && !me.id && profiles[0]) open(profiles[0].id);
  }, [personal, me.id, profiles, open]);
  const choose = async () => {
    try {
      setFile(await pickTextFile());
      setRestoreMsg('');
    } catch {
      setRestoreMsg(tNow("Ce fichier ne s'ouvre pas.", 'هذا الملف لا يُفتح.'));
    }
  };
  const restore = () => {
    if (!file) return;
    try {
      const d = readDossier(importDossier(JSON.parse(file) as BackupFile, restorePhrase));
      restoreProfile(d);
      setFile(null);
      setRestorePhrase('');
      setRestoreMsg('');
    } catch (e) {
      setRestoreMsg(e instanceof BackupRefusal ? tNow(e.message, refusalAr(e.message)) : tNow("Ce fichier n'est pas un dossier HLuX.", 'هذا الملف ليس ملفّاً من HLuX.'));
    }
  };

  // Appui long sur « HLuX » : proposer la démonstration (jamais par accident : il faut confirmer).
  const logo = (
    <>
      <Pressable onLongPress={() => setAskDemo(true)} delayLongPress={800} accessibilityLabel="HLuX" accessibilityHint={w('demoOpen')}>
        <Wordmark size={28} />
      </Pressable>
      {askDemo ? (
        <View style={st.newBox}>
          <Text style={st.note}>{w('demoOpen')}</Text>
          <View style={st.row}>
            <Pressable accessibilityRole="button" onPress={() => { setAskDemo(false); enterDemo(); }} style={[st.btn, st.primary]}>
              <Text style={[st.btnTxt, { color: C.onAccent }]}>{w('openIt')}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setAskDemo(false)} style={st.btn}>
              <Text style={st.btnTxt}>{w('cancel')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </>
  );

  if (!setup) {
    return (
      <ScrollView contentContainerStyle={st.page}>
        {logo}
        <Text style={st.hello}>{t('Cet appareil, c’est…', 'هذا الجهاز هو…', 'Cet appareil, c’est…')}</Text>
        <View style={st.row}>
          <Pressable accessibilityRole="radio" accessibilityState={{ checked: device === 'facility' }} onPress={() => setDevice('facility')} style={[st.door, device === 'facility' && st.doorOn]}>
            <Text style={st.doorTxt}>🏛️ {t('La tablette d’un établissement', 'الجهاز اللوحي لمؤسسة')}</Text>
          </Pressable>
          <Pressable accessibilityRole="radio" accessibilityState={{ checked: device === 'personal' }} onPress={() => setDevice('personal')} style={[st.door, device === 'personal' && st.doorOn]}>
            <Text style={st.doorTxt}>📱 {t('Mon téléphone', 'هاتفي')}</Text>
          </Pressable>
        </View>
        {device === 'facility' && (
          <View style={st.newBox}>
            <Text style={st.doorTxt}>{w('setupTitle')}</Text>
            <TextInput value={place} onChangeText={setPlace} placeholder={w('setupPlace')} style={st.input} accessibilityLabel={w('setupPlace')} />
            <TextInput value={names} onChangeText={setNames} placeholder={w('setupTeam')} multiline style={st.input} accessibilityLabel={w('setupTeam')} />
            <TextInput value={period} onChangeText={setPeriod} placeholder="La période du projet d'établissement (ex. 2027–2031)" style={st.input} accessibilityLabel="Période du projet" />
            <Pressable accessibilityRole="button" onPress={() => useProject.getState().configure(place, names.split(/[,;\n]/), period)} style={[st.btn, st.primary]}>
              <Text style={[st.btnTxt, { color: C.onAccent }]}>{w('begin')}</Text>
            </Pressable>
            <Text style={st.note}>{w('setupNote')}</Text>
          </View>
        )}
        {device === 'personal' && (
          <View style={st.newBox}>
            <Text style={st.note}>{t('Ton projet reste sur ce téléphone. Personne d’autre n’y entre : le verrou du téléphone suffit.', 'مشروعكِ يبقى على هذا الهاتف. لا يدخله أحد غيركِ: قفل الهاتف يكفي.', 'Ton projet reste sur ton téléphone.')}</Text>
            <TextInput value={myName} onChangeText={setMyName} placeholder={t('Mon prénom', 'اسمي')} style={st.input} accessibilityLabel={t('Mon prénom', 'اسمي')} />
            <TextInput value={mySentence} onChangeText={setMySentence} placeholder={w('oneSentence')} multiline style={st.input} accessibilityLabel={w('oneSentence')} />
            <Pressable accessibilityRole="button" onPress={() => useProject.getState().configurePersonal(myName, mySentence)} style={[st.btn, st.primary]}>
              <Text style={[st.btnTxt, { color: C.onAccent }]}>{w('enter')}</Text>
            </Pressable>
            <Text style={st.note}>{t('Ou, si ton dossier est déjà sur la tablette de l’établissement :', 'أو، إذا كان ملفّكِ موجوداً على الجهاز اللوحي للمؤسسة:', 'Ou ton dossier de la tablette :')}</Text>
            <Pressable accessibilityRole="button" onPress={() => setQr(qr === 'receive' ? null : 'receive')} style={st.btn}>
              <Text style={st.btnTxt}>{w('receiveCopy')}</Text>
            </Pressable>
            {qr === 'receive' ? (
              <QrReceive before={(firstName) => useProject.getState().configurePersonal(firstName, null)} onDone={(m) => { setQr(null); setRestoreMsg(m); }} />
            ) : null}
          </View>
        )}
      </ScrollView>
    );
  }

  if (personal && !me.id) {
    return (
      <View style={st.page}>
        {logo}
        <Text style={st.note}>{restoreMsg}</Text>
      </View>
    );
  }

  // La personne est entrée : directement dans son premier écran.
  if (me.id) return <Redirect href="/mon-projet/cartes" />;

  return (
    <ScrollView contentContainerStyle={st.page}>
      {logo}
      <Text style={st.hello}>{w('whoIsHere')}</Text>
      <Text style={st.label}>{t('Qui accompagne ?', 'مَن يرافق؟')}</Text>
      <View style={st.row}>
        {team.map((m) => (
          <Pressable key={m} accessibilityRole="button" accessibilityState={{ selected: pro === m }} onPress={() => openSession(m)} style={[st.chip, pro === m && st.chipOn]}>
            <Text style={[st.chipTxt, pro === m && { color: C.onAccent }]}>{m}</Text>
          </Pressable>
        ))}
      </View>
      {!pro ? (
        <Text style={st.note}>{w('closedNote')}</Text>
      ) : (
        <>
          <Text style={st.label}>{t('Avec qui ?', 'مع مَن؟')}</Text>
          <View style={st.row}>
            {profiles.filter((p) => !p.copyOf).map((p) => (
              <Pressable key={p.id} accessibilityRole="button" onPress={() => open(p.id)} style={st.name}>
                <Text style={st.nameTxt}>{p.firstName}</Text>
              </Pressable>
            ))}
          </View>
          <View style={st.newBox}>
            <Text style={st.doorTxt}>{w('newPerson')}</Text>
            <TextInput value={name} onChangeText={setName} placeholder={w('firstName')} style={st.input} accessibilityLabel={w('firstName')} />
            <TextInput value={sentence} onChangeText={setSentence} placeholder={w('oneSentence')} multiline style={st.input} accessibilityLabel={w('oneSentence')} />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (createProfile(name, sentence)) {
                  setName('');
                  setSentence('');
                }
              }}
              style={[st.btn, st.primary]}>
              <Text style={[st.btnTxt, { color: C.onAccent }]}>{w('enter')}</Text>
            </Pressable>
          </View>
          <View style={st.row}>
            <Link href="/notre-projet/constat" style={[st.btn, { borderColor: C.pe.value, borderWidth: 2 }]}>
              <Text style={st.btnTxt}>🏛️ {w('ourProject')}</Text>
            </Link>
            <Pressable accessibilityRole="button" onPress={() => setMore(!more)} style={st.btn} accessibilityState={{ expanded: more }}>
              <Text style={st.btnTxt}>{t('Un dossier venu d’ailleurs…', 'ملفّ من مكان آخر…')}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={closeSession} style={st.btn}>
              <Text style={st.btnTxt}>{w('closeSession')} · {pro}</Text>
            </Pressable>
          </View>
          {more ? (
            <View style={st.newBox}>
              <Pressable accessibilityRole="button" onPress={() => setQr(qr === 'receive' ? null : 'receive')} style={st.btn} accessibilityState={{ expanded: qr === 'receive' }}>
                <Text style={st.btnTxt}>{w('receiveCopy')}</Text>
              </Pressable>
              {qr === 'receive' ? <QrReceive onDone={(m) => { setQr(null); setRestoreMsg(m); }} /> : null}
              <Text style={st.doorTxt}>{w('restore')}</Text>
              <Pressable accessibilityRole="button" onPress={choose} style={st.btn}>
                <Text style={st.btnTxt}>📂 {w('chooseFile')}{file ? ' ✓' : ''}</Text>
              </Pressable>
              {file ? <TextInput value={restorePhrase} onChangeText={setRestorePhrase} placeholder={t('Sa phrase de six mots ou plus', 'جملة الملف، من ستّ كلمات أو أكثر')} secureTextEntry style={st.input} accessibilityLabel={t('Phrase du dossier', 'جملة الملف')} /> : null}
              {file ? (
                <Pressable accessibilityRole="button" onPress={restore} style={[st.btn, st.primary]}>
                  <Text style={[st.btnTxt, { color: C.onAccent }]}>{w('openIt')}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
          {restoreMsg ? <Text style={st.note} accessibilityLiveRegion="polite">{restoreMsg}</Text> : null}
        </>
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  page: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 24, backgroundColor: C.bg, padding: 24 },
  hello: { fontFamily: F.display, fontSize: 40, color: C.ink, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', justifyContent: 'center' },
  name: { minWidth: 140, minHeight: S.touch * 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, borderRadius: S.radius, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  nameTxt: { fontFamily: F.display, fontSize: 24, color: C.ink },
  newBox: { width: '100%', maxWidth: 420, gap: 10, padding: 16, borderRadius: S.radius, backgroundColor: C.surface, borderTopWidth: 6, borderTopColor: C.pp.value },
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12, fontFamily: F.body, fontSize: 17, color: C.ink },
  doorOn: { borderColor: C.violet, borderWidth: 3 },
  door: { minWidth: 260, padding: 28, borderRadius: S.radius, backgroundColor: C.surface, borderTopWidth: 8 },
  doorTxt: { fontFamily: F.bold, fontSize: 22, color: C.ink },
  note: { fontFamily: F.body, fontSize: 14, color: C.muted, textAlign: 'center', maxWidth: 420 },
  btn: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 18, borderRadius: S.radiusPill, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.line, alignSelf: 'center' },
  primary: { backgroundColor: C.violetInk, borderColor: C.violetInk },
  label: { fontFamily: F.bold, fontSize: 16, color: C.slate },
  chip: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 18, borderRadius: S.radiusPill, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  chipOn: { backgroundColor: C.violetInk, borderColor: C.violetInk },
  chipTxt: { fontFamily: F.bold, fontSize: 17, color: C.ink },
  btnTxt: { fontFamily: F.bold, fontSize: 16, color: C.ink },
});
