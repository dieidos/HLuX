// Ouvrir un fichier choisi par la personne (restauration d'un dossier) : rien ne passe par le réseau.
import { Platform } from 'react-native';

export async function pickTextFile(): Promise<string | null> {
  const DocumentPicker = await import('expo-document-picker');
  const r = await DocumentPicker.getDocumentAsync({ type: ['application/json', '*/*'], copyToCacheDirectory: true });
  if (r.canceled || !r.assets?.[0]) return null;
  const asset = r.assets[0];
  if (Platform.OS === 'web' && asset.file) return asset.file.text();
  const { File } = await import('expo-file-system');
  return new File(asset.uri).text();
}
