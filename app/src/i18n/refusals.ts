// Les refus du cœur (aides, sauvegarde, copie, dictée) sont écrits en français dans la logique, qui les teste
// mot pour mot. À l'écran de la personne en arabe, ils se disent en arabe : cette table les traduit.
import { MIN_WORDS } from '../core/backup';

export const REFUSALS_AR: Record<string, string> = {
  'Rien à reformuler.': 'لا شيء لإعادة صياغته.',
  "Ce texte parle de santé : il reste sur l'appareil, l'aide IA ne l'envoie pas.": 'هذا النص يتحدّث عن الصحّة: يبقى على الجهاز، ولا ترسله المساعدة.',
  "Ce texte contient un numéro ou une adresse : il reste sur l'appareil.": 'هذا النص فيه رقم أو عنوان: يبقى على الجهاز.',
  "L'aide n'a pas répondu. Rien n'a changé.": 'لم تُجب المساعدة. لم يتغيّر شيء.',
  [`La phrase doit avoir au moins ${MIN_WORDS} mots.`]: `يجب أن تكون الجملة من ${MIN_WORDS} كلمات على الأقلّ.`,
  "Ce fichier n'est pas un dossier HLuX.": 'هذا الملف ليس ملفّاً من HLuX.',
  'Ce fichier demande un coût anormal.': 'هذا الملف يطلب جهداً غير عاديّ.',
  "Ce fichier n'a pas la forme d'un dossier.": 'هذا الملف ليس على شكل ملفّ شخصيّ.',
  "Cette phrase n'ouvre pas ce dossier.": 'هذه الجملة لا تفتح هذا الملف.',
  'Deux copies différentes se mélangent. Recommence la lecture.': 'نسختان مختلفتان تختلطان. أعيدي القراءة.',
  'Il manque encore des codes.': 'ما زالت بعض الرموز ناقصة.',
  "Cette copie ne s'ouvre pas : un code a été mal lu. Recommence la lecture.": 'هذه النسخة لا تُفتح: قُرئ رمز بشكل خاطئ. أعيدي القراءة.',
  'La dictée se fait sur la tablette ou le téléphone, pas dans le navigateur.': 'الإملاء يتمّ على الجهاز اللوحي أو الهاتف، لا في المتصفّح.',
  "Cet appareil ne sait pas reconnaître la voix sans Internet : écris, ou choisis une image.": 'هذا الجهاز لا يتعرّف على الصوت دون إنترنت: اكتبي، أو اختاري صورة.',
  "La langue arabe n'est pas installée pour la dictée hors ligne sur cet appareil.": 'اللغة العربية غير مثبّتة للإملاء دون اتصال على هذا الجهاز.',
  "La langue française n'est pas installée pour la dictée hors ligne sur cet appareil.": 'اللغة الفرنسية غير مثبّتة للإملاء دون اتصال على هذا الجهاز.',
};

/** Un refus, dans la langue de l'écran : `said(e.message)` avec `tNow` ou `t`. */
export const refusalAr = (fr: string) => REFUSALS_AR[fr] ?? fr;
