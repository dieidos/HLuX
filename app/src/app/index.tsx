// Accueil. Premier lancement : on nomme l'établissement et l'équipe (la tablette démarre vide).
// Puis la séance locale ouvre la tablette (décision du 2026-10-14).
// Appui long sur « HLuX » : le mode démonstration, caché, qui entre lui-même ses données.
// 1. La professionnelle touche son prénom. 2. La personne touche le sien, ou entre avec un prénom et une phrase.
// 3. « Bonjour Amina », puis Mon projet ou Notre projet. Hors séance, les profils restent fermés.
import { CompareVersions } from '../components/CompareVersions';
import { refusalAr } from '../i18n/refusals';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AidsBar, Wordmark } from '../components/Chrome';
import { DossierCopy } from '../components/DossierCopy';
import { QrReceive, QrSend } from '../components/QrCopy';
import { BackupRefusal, importDossier, type BackupFile } from '../core/backup';
import { pickTextFile } from '../core/openFile';
import { needsBackup, readDossier } from '../core/profiles';
import { tNow, useAids, useT, useWords } from '../core/useAids';
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
  const [confirmErase, setConfirmErase] = useState(false);
  const [period, setPeriod] = useState('');
  const arabicHome = useAids((a) => a.lang) === 'ar';
  const [device, setDevice] = useState<'facility' | 'personal' | null>(null);
  const [myName, setMyName] = useState('');
  const [mySentence, setMySentence] = useState('');
  const personal = setup?.kind === 'personal';
  const profiles = useProject((s) => s.profiles);
  const backedUpNow = useProject((s) => s.backedUpNow);
  const { openSession, closeSession, open, close, createProfile, restoreProfile, purge } = useProject.getState();
  const [name, setName] = useState('');
  const [sentence, setSentence] = useState('');
  const [file, setFile] = useState<string | null>(null);
  const [restorePhrase, setRestorePhrase] = useState('');
  const [restoreMsg, setRestoreMsg] = useState('');
  const [leaving, setLeaving] = useState(false);
  const [qr, setQr] = useState<'send' | 'receive' | null>(null);
  const profile = profiles.find((p) => p.id === me.id);

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

  if (!pro && !personal) {
    return (
      <View style={st.page}>
        {logo}
        <Text style={st.hello}>{w('whoOpens')}</Text>
        <View style={st.row}>
          {team.map((t) => (
            <Pressable key={t} accessibilityRole="button" onPress={() => openSession(t)} style={st.name}>
              <Text style={st.nameTxt}>{t}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={st.note}>{w('closedNote')}</Text>
      </View>
    );
  }

  if (!me.id) {
    return (
      <ScrollView contentContainerStyle={st.page}>
        <Wordmark size={28} />
        <Text style={st.hello}>{w('whoIsHere')}</Text>
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
        <Pressable accessibilityRole="button" onPress={() => setQr(qr === 'receive' ? null : 'receive')} style={st.btn} accessibilityState={{ expanded: qr === 'receive' }}>
          <Text style={st.btnTxt}>{w('receiveCopy')}</Text>
        </Pressable>
        {qr === 'receive' ? <QrReceive onDone={(m) => { setQr(null); setRestoreMsg(m); }} /> : null}
        <View style={st.newBox}>
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
          {restoreMsg ? <Text style={st.note} accessibilityLiveRegion="polite">{restoreMsg}</Text> : null}
        </View>
        <Link href="/notre-projet/constat" style={[st.door, { borderTopColor: C.pe.value }]}>
          <Text style={st.doorTxt}>🏛️ {w('ourProject')}</Text>
        </Link>
        <Pressable accessibilityRole="button" onPress={closeSession} style={st.btn}>
          <Text style={st.btnTxt}>{w('closeSession')} · {pro}</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={[st.page, { direction: arabicHome ? 'rtl' : 'ltr' }]} {...(arabicHome ? ({ lang: 'ar' } as object) : {})}>
      <Wordmark size={28} />
      <Text style={st.hello}>{w('hello')} {me.name} 👋</Text>
      <CompareVersions />
      {needsBackup(profile, new Date()) && !leaving ? (
        <View style={st.newBox}>
          <Text style={st.reminder}>{w('backupReminder')}</Text>
          <DossierCopy />
        </View>
      ) : null}
      <View style={st.row}>
        <Link href="/mon-projet/cartes" style={[st.door, { borderTopColor: C.pp.value }]}>
          <Text style={st.doorTxt}>👤 {w('myProject')}</Text>
        </Link>
        {!personal && <Link href="/notre-projet/sujets" style={[st.door, { borderTopColor: C.pe.value }]}>
          <Text style={st.doorTxt}>🏛️ {w('ourProject')}</Text>
        </Link>}
      </View>
      <View style={st.row}>
        {!personal && (
          <Pressable accessibilityRole="button" onPress={close} style={st.btn}>
            <Text style={st.btnTxt}>{w('changePerson')}</Text>
          </Pressable>
        )}
        {!personal && (
          <Pressable accessibilityRole="button" onPress={closeSession} style={st.btn}>
            <Text style={st.btnTxt}>{w('closeSession')} · {pro}</Text>
          </Pressable>
        )}
        <Pressable accessibilityRole="button" onPress={() => setQr(qr === 'send' ? null : 'send')} style={st.btn} accessibilityState={{ expanded: qr === 'send' }}>
          <Text style={st.btnTxt}>{w('copyToDevice')}</Text>
        </Pressable>
        {!personal && (
          <Pressable accessibilityRole="button" onPress={() => setLeaving(!leaving)} style={st.btn} accessibilityState={{ expanded: leaving }}>
            <Text style={st.btnTxt}>🧳 {w('leaving')}</Text>
          </Pressable>
        )}
      </View>
      {personal && (
        <Pressable accessibilityRole="button" onPress={() => setQr(qr === 'receive' ? null : 'receive')} style={st.btn} accessibilityState={{ expanded: qr === 'receive' }}>
          <Text style={st.btnTxt}>{w('receiveCopy')}</Text>
        </Pressable>
      )}
      {qr === 'send' ? <QrSend /> : null}
      {personal && qr === 'receive' ? <QrReceive onDone={(m) => { setQr(null); setRestoreMsg(m); }} /> : null}
      {personal && restoreMsg ? <Text style={st.note} accessibilityLiveRegion="polite">{restoreMsg}</Text> : null}
      {leaving ? (
        <View style={st.newBox}>
          <Text style={st.note}>{w('eraseNote')}</Text>
          <DossierCopy />
          <QrSend />
          {!confirmErase ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !backedUpNow }}
              disabled={!backedUpNow}
              onPress={() => setConfirmErase(true)}
              style={[st.btn, backedUpNow ? st.danger : st.off]}>
              <Text style={[st.btnTxt, backedUpNow && { color: C.onAccent }]}>{w('eraseHere')}</Text>
            </Pressable>
          ) : (
            <View style={st.newBox} accessibilityRole="alert">
              <Text style={st.reminder}>{t('C’est définitif : sur cette tablette, ton dossier sera effacé. Ta copie, elle, reste avec toi.', 'هذا نهائي: سيُمحى ملفّكِ من هذا الجهاز اللوحي. نسختكِ تبقى معكِ.', 'C’est pour toujours. Ta copie reste avec toi.')}</Text>
              <View style={st.row}>
                <Pressable accessibilityRole="button" onPress={() => { setConfirmErase(false); purge(); }} style={[st.btn, st.danger]}>
                  <Text style={[st.btnTxt, { color: C.onAccent }]}>{t('Oui, effacer définitivement', 'نعم، امحي نهائياً')}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => setConfirmErase(false)} style={st.btn}>
                  <Text style={st.btnTxt}>{w('cancel')}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      ) : null}
      <View style={{ alignSelf: 'stretch' }}>
        <AidsBar side="pp" />
      </View>
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
  danger: { backgroundColor: C.warn.ink, borderColor: C.warn.ink },
  off: { opacity: 0.5 },
  reminder: { fontFamily: F.bold, fontSize: 17, color: C.warn.ink },
  btnTxt: { fontFamily: F.bold, fontSize: 16, color: C.ink },
});
