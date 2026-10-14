import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { NotoNaskhArabic_400Regular } from '@expo-google-fonts/noto-naskh-arabic';
import { Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import { SourceSans3_400Regular, SourceSans3_700Bold } from '@expo-google-fonts/source-sans-3';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useReducedMotion } from '../design/motion';
import { DemoBanner } from '../components/DemoBanner';
import { C } from '../design/theme';

export default function Root() {
  const reduced = useReducedMotion();
  // Aqua (titres) est embarquée ; Quicksand (HLuX), Source Sans 3 (texte) et Noto Naskh (arabe) viennent de Google Fonts.
  const [ready] = useFonts({
    Aqua: require('../../assets/fonts/Aqua.ttf'),
    Quicksand: Quicksand_700Bold,
    SourceSans3: SourceSans3_400Regular,
    SourceSans3Bold: SourceSans3_700Bold,
    NotoNaskhArabic: NotoNaskhArabic_400Regular,
  });
  if (!ready) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.bg }}>
      <DemoBanner />
      <Stack screenOptions={{ headerShown: false, animation: reduced ? 'none' : 'fade' }} />
    </GestureHandlerRootView>
  );
}
