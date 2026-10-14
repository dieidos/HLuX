// Donner un fichier à la personne : sur la tablette, la feuille de partage ; sur le web, un téléchargement.
import { Platform } from 'react-native';

export async function saveFile(name: string, content: string): Promise<void> {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const { File, Paths } = await import('expo-file-system');
  const Sharing = await import('expo-sharing');
  const f = new File(Paths.cache, name);
  if (f.exists) f.delete();
  f.create();
  f.write(content);
  await Sharing.shareAsync(f.uri, { mimeType: 'application/json', dialogTitle: 'Emporter mon dossier' });
}
