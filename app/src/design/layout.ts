// La mise en page suit l'écran : tablette d'abord (paysage, portrait), puis téléphone en une colonne.
import { useWindowDimensions } from 'react-native';

export const PHONE_MAX = 640;

export function useLayout() {
  const { width, height } = useWindowDimensions();
  return { width, height, phone: width < PHONE_MAX, portrait: height > width };
}
