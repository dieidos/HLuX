import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { C } from '../design/theme';

export default function Root() {
  // Aqua (titres) est embarquée ; Quicksand, Source Sans 3 et Noto Naskh viennent des paquets Google Fonts (lot 1).
  const [ready] = useFonts({ Aqua: require('../../assets/fonts/Aqua.ttf') });
  if (!ready) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.bg }}>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </GestureHandlerRootView>
  );
}
