export const english = {
  test: 'Test', learn: 'Learn', lessons: 'Lessons', race: 'Race', games: 'Games', stats: 'Stats', rankings: 'Rankings', keyboardLab: 'Keyboard Lab',
  studio: 'Practice studio', studioIntro: 'Tune the space around your practice. Your typing rules stay the same.',
  language: 'Interface language', themes: 'Themes', localTheme: 'Local theme JSON', importTheme: 'Validate and apply theme', exportTheme: 'Export current theme',
  font: 'Local passage font', fontHelp: 'WOFF2 only, up to200KB. Parsed by your browser and kept on this device; never uploaded.', removeFont: 'Use default passage font',
  keycaps: 'Keyboard appearance', classic: 'Classic', flat: 'Flat', outline: 'Outline', ripple: 'Key press feedback',
  clear: 'Reset local studio choices', saved: 'Saved on this device.', memory: 'Available for this visit. Storage is unavailable; export before closing.',
  preview: 'The quick brown fox finds a calmer rhythm.', count: '{count, plural, one {# curated theme} other {# curated themes}}',
} as const;
export type MessageId = keyof typeof english;
export const hindi: Record<MessageId, string> = {
  test: 'टेस्ट', learn: 'अभ्यास', lessons: 'पाठ', race: 'रेस', games: 'खेल', stats: 'आँकड़े', rankings: 'रैंकिंग', keyboardLab: 'कीबोर्ड लैब',
  studio: 'अभ्यास स्टूडियो', studioIntro: 'अपने अभ्यास की जगह अपने अनुसार बनाएँ। टाइपिंग के नियम वही रहेंगे।',
  language: 'इंटरफ़ेस की भाषा', themes: 'थीम', localTheme: 'स्थानीय थीम JSON', importTheme: 'थीम जाँचें और लागू करें', exportTheme: 'वर्तमान थीम निर्यात करें',
  font: 'अभ्यास का स्थानीय फ़ॉन्ट', fontHelp: 'केवल WOFF2, अधिकतम200KB। आपका ब्राउज़र इसे पढ़ता है; यह इसी डिवाइस पर रहता है और अपलोड नहीं होता।', removeFont: 'डिफ़ॉल्ट फ़ॉन्ट इस्तेमाल करें',
  keycaps: 'कीबोर्ड का रूप', classic: 'क्लासिक', flat: 'समतल', outline: 'आउटलाइन', ripple: 'कुंजी दबाने का संकेत',
  clear: 'स्थानीय स्टूडियो विकल्प रीसेट करें', saved: 'इसी डिवाइस पर सहेजा गया।', memory: 'इस सत्र के लिए उपलब्ध। स्टोरेज उपलब्ध नहीं है; बंद करने से पहले निर्यात करें।',
  preview: 'धीरे और सही अभ्यास से टाइपिंग की लय बनाएँ।', count: '{count, plural, one {# चुनी हुई थीम} other {# चुनी हुई थीम}}',
};
