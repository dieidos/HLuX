// Copier un dossier par QR, d'un appareil posé à côté d'un autre (logique : `core/qrCopy.ts`).
// ⛳ La caméra et l'affichage se vérifient sur appareil au premier build EAS (docs/eas.md).

import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Collector, CopyRefusal, makeFrames } from '../core/qrCopy';
import { useProject } from '../core/useProject';
import { C, F, S } from '../design/theme';

/** L'appareil qui envoie : les codes défilent en boucle, l'autre appareil lit à son rythme. */
export function QrSend() {
  const dossier = useProject((s) => s.dossier);
  const [frames] = useState(() => {
    const d = dossier();
    return d ? makeFrames(d) : [];
  });
  const [i, setI] = useState(0);
  useEffect(() => {
    if (frames.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % frames.length), 400);
    return () => clearInterval(t);
  }, [frames.length]);
  if (!frames.length) return null;
  return (
    <View style={st.box} accessibilityLabel="Codes de copie">
      <View style={st.qr}>
        <QRCode value={frames[i]} size={300} ecl="M" />
      </View>
      <Text style={st.small}>
        Code {i + 1} sur {frames.length}. Pose l’autre appareil devant, sur « Recevoir une copie ». Rien ne passe par Internet.
      </Text>
    </View>
  );
}

/** L'appareil qui reçoit : la caméra lit les codes, dans n'importe quel ordre. */
export function QrReceive({ onDone }: { onDone: (msg: string) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const receiveCopy = useProject((s) => s.receiveCopy);
  const [collector] = useState(() => new Collector());
  const [progress, setProgress] = useState(collector.progress());
  const [msg, setMsg] = useState('');
  const [finished, setFinished] = useState(false);

  if (!permission) return null;
  if (!permission.granted) {
    return (
      <View style={st.box}>
        <Text style={st.small}>La caméra lit les codes de la copie. Aucune image n’est gardée.</Text>
        <Pressable accessibilityRole="button" onPress={requestPermission} style={st.btn}>
          <Text style={st.btnTxt}>Autoriser la caméra</Text>
        </Pressable>
      </View>
    );
  }
  const scanned = (data: string) => {
    if (finished) return;
    try {
      if (collector.add(data)) setProgress(collector.progress());
      if (collector.done()) {
        setFinished(true);
        const r = receiveCopy(collector.open());
        onDone(r.diverged ? 'La copie est arrivée à côté du dossier déjà présent : les deux ont changé chacun de leur côté. Compare-les.' : 'La copie est arrivée.');
      }
    } catch (e) {
      setMsg(e instanceof CopyRefusal ? e.message : "Cette copie ne s'ouvre pas.");
    }
  };
  return (
    <View style={st.box}>
      <CameraView style={st.camera} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={finished ? undefined : (r) => scanned(r.data)} />
      <Text style={st.small} accessibilityLiveRegion="polite">
        {progress.total ? `${progress.read} codes lus sur ${progress.total}` : 'En attente du premier code…'}
      </Text>
      {msg ? <Text style={st.warn}>{msg}</Text> : null}
    </View>
  );
}

const st = StyleSheet.create({
  box: { gap: 10, alignItems: 'center', padding: 14, borderRadius: S.radius, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  qr: { padding: 12, backgroundColor: C.onAccent, borderRadius: 12 },
  camera: { width: 300, height: 300, borderRadius: 12, overflow: 'hidden' },
  small: { fontFamily: F.body, fontSize: 14, color: C.muted, textAlign: 'center', maxWidth: 420 },
  warn: { fontFamily: F.bold, fontSize: 14, color: C.warn.ink, textAlign: 'center' },
  btn: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 18, borderRadius: S.radiusPill, backgroundColor: C.violetInk },
  btnTxt: { fontFamily: F.bold, fontSize: 16, color: C.onAccent },
});
