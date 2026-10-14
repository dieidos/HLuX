// 🎙 Je parle : un geste, la voix devient du texte sur l'appareil ; la personne relit et corrige.
// ⛳ Se vérifie sur appareil au premier build EAS (docs/eas.md). Sur le web, le bouton dit pourquoi il ne marche pas.

import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { canDictateOnDevice, LOCALE } from '../core/dictation';
import { C, F, S } from '../design/theme';

export function DictateButton({ lang = 'fr', label = '🎙 Je parle', onText }: { lang?: 'fr' | 'ar'; label?: string; onText: (text: string, final: boolean) => void }) {
  const [listening, setListening] = useState(false);
  const [msg, setMsg] = useState('');

  useSpeechRecognitionEvent('result', (e) => {
    const text = e.results[0]?.transcript ?? '';
    if (text) onText(text, e.isFinal);
  });
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('error', () => {
    setListening(false);
    setMsg("La dictée s'est arrêtée. Tu peux écrire.");
  });

  const start = async () => {
    if (listening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    let installed: string[] = [];
    let supports = false;
    if (Platform.OS !== 'web') {
      supports = ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();
      if (Platform.OS === 'android') installed = (await ExpoSpeechRecognitionModule.getSupportedLocales({})).installedLocales;
    }
    const can = canDictateOnDevice({ platform: Platform.OS, supportsOnDevice: supports, installedLocales: installed, lang });
    if (!can.ok) {
      setMsg(can.reason);
      return;
    }
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) {
      setMsg('Le micro n’est pas autorisé. Tu peux écrire.');
      return;
    }
    setMsg('');
    setListening(true);
    // Sur l'appareil, sans enregistrement : `requiresOnDeviceRecognition`, et aucune option `recordingOptions`.
    ExpoSpeechRecognitionModule.start({ lang: LOCALE[lang], interimResults: true, requiresOnDeviceRecognition: true, addsPunctuation: true });
  };

  return (
    <View style={st.wrap}>
      <Pressable accessibilityRole="button" accessibilityState={{ selected: listening }} onPress={start} style={[st.btn, listening && st.on]}>
        <Text style={[st.txt, listening && { color: C.onAccent }]}>{listening ? '⏹ J’ai fini' : label}</Text>
      </Pressable>
      {msg ? <Text style={st.msg} accessibilityLiveRegion="polite">{msg}</Text> : null}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { gap: 4 },
  btn: { alignSelf: 'flex-start', minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 16, borderRadius: S.radiusPill, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.line },
  on: { backgroundColor: C.violetInk, borderColor: C.violetInk },
  txt: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  msg: { fontFamily: F.body, fontSize: 13, color: C.muted },
});
