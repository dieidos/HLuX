// Le Projet Personnalisé ne s'ouvre que dans une séance, sur le profil touché.
import { Redirect, Stack } from 'expo-router';

import { useProject } from '../../core/useProject';

export default function MonProjet() {
  const open = useProject((s) => !!s.pro && !!s.person);
  if (!open) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}
