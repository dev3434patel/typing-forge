/** Original, deliberately small practice corpora. No third-party word list is bundled. */
export type LayoutId = 'qwerty' | 'dvorak' | 'colemak' | 'colemak-dh' | 'azerty' | 'qwertz' | 'native';
export interface ContentPack {
  id: string;
  label: string;
  revision: string;
  script: string;
  direction: 'ltr' | 'rtl';
  font: string;
  normalization: 'NFC';
  segmentation: 'grapheme';
  words: readonly string[];
  alphabet: readonly string[];
  introductionOrder: readonly string[];
  defaultLayout: LayoutId;
  capabilities: { adaptive: boolean; composition: boolean; ranked: boolean };
  provenance: { author: string; license: string; note: string };
}

export const LAYOUTS: Readonly<Record<LayoutId, { label: string; rows: readonly (readonly string[])[] }>> = {
  qwerty: { label: 'QWERTY', rows: ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'].map(row => [...row]) },
  dvorak: { label: 'Dvorak', rows: ["',.pyfgcrl", 'aoeuidhtns', ';qjkxbmwvz'].map(row => [...row]) },
  colemak: { label: 'Colemak', rows: ['qwfpgjluy;', 'arstdhneio', 'zxcvbkm,.'].map(row => [...row]) },
  'colemak-dh': { label: 'Colemak-DH', rows: ['qwfpbjluy;', 'arstgmneio', 'zxcdvkh,.'].map(row => [...row]) },
  azerty: { label: 'AZERTY', rows: ['azertyuiop', 'qsdfghjklm', 'wxcvbn'].map(row => [...row]) },
  qwertz: { label: 'QWERTZ', rows: ['qwertzuiopü', 'asdfghjklöä', 'yxcvbnm'].map(row => [...row]) },
  native: { label: 'Native / unmapped', rows: [] },
};

export function graphemes(text: string, language = 'en'): string[] {
  const normalized = text.normalize('NFC');
  if (typeof Intl.Segmenter === 'function') {
    return Array.from(new Intl.Segmenter(language, { granularity: 'grapheme' }).segment(normalized), part => part.segment);
  }
  // Unicode-property fallback keeps combining marks attached on older browsers.
  return normalized.match(/\P{M}\p{M}*|\p{M}+/gu) ?? [];
}

function pack(id: string, label: string, script: string, direction: 'ltr' | 'rtl', order: string, source: string, defaultLayout: LayoutId = 'qwerty'): ContentPack {
  const words = [...new Set(source.normalize('NFC').split(/\s+/u).filter(Boolean))];
  const alphabet = [...new Set(words.flatMap(word => graphemes(word, id === 'gu-Latn' ? 'gu' : id)))];
  const introductionOrder = [...new Set([...graphemes(order, id === 'gu-Latn' ? 'gu' : id).filter(char => alphabet.includes(char)), ...alphabet])];
  return {
    id, label, script, direction, words, alphabet, introductionOrder, defaultLayout,
    revision: 'forge-curated-2026.10.15', normalization: 'NFC', segmentation: 'grapheme',
    font: script === 'Devanagari' ? '"Nirmala UI", "Noto Sans Devanagari", sans-serif' : script === 'Arabic' ? '"Noto Sans Arabic", Tahoma, sans-serif' : 'var(--font-mono, ui-monospace, monospace)',
    capabilities: { adaptive: true, composition: true, ranked: false },
    provenance: { author: 'Typing Forge', license: 'CC0-1.0', note: 'Original curated vocabulary compilation. Introduction order is editorial, not a measured frequency ranking. Ranked language cohorts await backend validation.' },
  };
}

export const CONTENT_PACKS: readonly ContentPack[] = [
  pack('en', 'English', 'Latin', 'ltr', 'etaoinshrdlcumwfgypbvkjxqz',
    'a i an at in it on no to one ten tin ton tan net not into note tone none neon nine teen neat oat eat tea toe tie ant ante innate nation notion onion attention retain rain train terrain ration retina iron air are ear era near earn arise raise stair star start stare state seat east taste test sent tent set nest rest rent rose sore sort soot root riot ratio rate tire tear tier tree street stone store story shore short shine share these those three there their then this that the he her here she his has is as so us our out use see sea ease seed need seen sane same name mean main mine time line lane lean learn slow quick quiet calm clear focus forge fire flow word work world home hand head hard heart kind keep key keen kite life light little late last left right road read ready good great green ground grow new now next north open old over paper page place plain play part point person practice path please blue brown black back book bright bring build can care clean close cold code come copy day deep dark dear door down draw dream each early earth end even every eye face fair far fast feel few find fine first five food foot for form free from full fun game give glass go gold grand grass group guide happy help high hill hold hope house how idea if just jump joy join joke know lake land large later letter let long look love low made make many map may me meet more most move much must my nature never nice night number off often only or order other own paint pair park people pink plan poem power pretty put queen question quite race red room round run safe said save say school second send seven shape ship show side silver simple six sky small smile snow soft some sound south space speak speed spring stand step still stop strong study summer sun sure take talk tall task team tell than thank thing think think though thought through together too top town true try turn two under up very view voice wait walk want warm watch water way week well west what when where which white who why wide wind window wish with woman wood write year yellow yes yet you young your zero zone zinc'),
  pack('es', 'Español', 'Latin', 'ltr', 'eaosrnidlctumpbgvyqhfzjñxkwáéíóúü',
    'a al el la de en no se te es ese esa eso ser estar era eres entre tren traer aire arena rato tiene tiene sol son sal sala sano casa cosa casi como camino calma campo claro cielo comer cuenta día dos donde ella él ellas feliz forma fuego fuerte gente gracias grande grupo hablar hacer hasta hay hijo historia hora hoy idea ir isla juego junto leer libro luz llama luego lugar luna mano mar más mes mirar mucho mundo muy nada noche nombre nos nuevo ojo otra otro pan para parte paso paz pero persona poco poder por porque pueblo puerta querer qué quien razón red río rojo saber salir sentir siempre sin sobre solo somos sueño su sus tal también tarde tener tiempo tierra todo tomar trabajo tres tu tú una uno usar valor ver verde vez vida vivir voz ya yo año azúcar rápido árbol acción corazón'),
  pack('fr', 'Français', 'Latin', 'ltr', 'esaitnrulodcmpévqfbghjxzèyàêçùôîûëïü',
    'a à ai an au ce ces cet chat chez ciel clair comme dans de des deux dire donc eau elle en encore entre est et être fait faire feu fille fin fois forêt forme fort froid grand groupe haut heure ici idée il ils île je jour jouer juste la le les leur libre livre loin long lui lumière lune ma main mais maison mal matin me mer merci mes moi moins monde mon mot même ne neuf nom non nos notre nous nuit on or ou où oui paix par parler pas père petit peu plus pour près puis quand que quel qui quoi raison rien rire route rue sa sans savoir se sel ses si soir soleil son sont sous sur ta table tant te temps terre tes tête toi ton tôt tout très tu un une va vert vie ville voir voix vous vrai y yeux été école élève garçon café déjà cœur', 'azerty'),
  pack('de', 'Deutsch', 'Latin', 'ltr', 'enisratdhulcgmobwfkzpvüäößjqxy',
    'ab alle alt am an anders auch auf aus bei bin bis bist bitte blau bleiben brief brot buch da dabei dann das dass dein dem den der des die dies dir doch dort drei du durch ein eine einfach ende er es essen etwas euch euer fahren fallen fast fein feld finden fluss folgen frage frau frei freude freund früh für ganz geben gehen gelb gern gesicht gestern gibt grün groß gut guten haben halb hand hart haus heißt helfen hell her herz heute hier hoch hören ich ihr im immer in ist ja jahr jetzt jung kalt kann kein kind klein kommen kopf kurz land lang langsam laufen leben leer lernen lesen letzte licht lieb liegen luft machen mal mann mehr mein mensch mit morgen muss mut nach nacht nah name natur neben neu nicht nie noch nun nur ob oder oft ohne ort paar platz rot ruhe sagen schön schule schwarz schwer sehen sehr sein seit selbst sich sie sind so sonne spaß spielen sprache stehen stein stern still stunde tag teil tief tier ton tür tun über uhr um und uns unter viel vier von vor wald warm warten warum was wasser weg weil weiß weit welche welt wenn wer werden wie wieder wir wissen wo wohl wort zeit zu zum zur zwölf üben öl äpfel', 'qwertz'),
  pack('pt', 'Português', 'Latin', 'ltr', 'aeosridmntuclpvghqbfzjãçáéíóúâêôõxkw',
    'a ao aos as até ar arte ano anos abrir água agora ainda algo alto amor andar aqui assim azul bem bom boa cada calma casa céu cidade cinco claro coisa com como conta cor coração dar da das de dela dele depois dia dizer dois do dos durante e ela ele em então entre era escola esse esta estar eu fazer faz feliz ficar fim flor fogo foi forma forte grande grupo há hoje homem hora ideia ir isso já junto lá ler letra livro logo longe lugar luz lua mais mal mão mar mas me mesmo meu minha menos mesa muito mundo na nada não nas natural nem no nome noite nos nova novo nós o olho onde os outra outro ouvir pai paz pela pelo para parte passo pedir pequeno perto pessoa pode poder pouco por porta porque praça primeira quando que quem querer razão rede rio rosa rua saber sair se sem sempre ser seu sim sobre sol som sua tal também tanto tarde tem tempo ter terra todo trabalho três tudo tu um uma usar valor ver verde vez vida vir viver você voz água cão pão manhã português ação açúcar'),
  pack('it', 'Italiano', 'Latin', 'ltr', 'eaionlrtusc dpvmghbfzqòàèéìùjkxyw'.replace(/ /g, ''),
    'a ad ai al alla alto amare amico amore anche ancora andare anno aprire acqua aria arte bene bella bello bianco bocca buono calma campo casa che chi cielo cinque città come con cosa così cuore da dal dare dei del della dentro di dire dopo dove due e è ed era essere fare fatto felice figlio fine fiore forma forte fra freddo fuori fuoco gente giorno già gioco giù grande grazie gruppo guardare ha hai hanno ho i idea il in insieme io isola la lago le lei leggere lento lettera libero libro lì lo loro luce lui luna ma mai male mamma mano mare me meglio meno mese mio modo molto mondo montagna ne nei nel nero nessuno noi nome non nostra notte nuovo o oggi ogni oltre ora oro padre pane parole parte passo per perché persona piccolo più poco poi porta potere primo prima quando quanto quasi questo qui ragazzo ragione re resto ricco riga rispondere rosso sapere scuola se sei sempre senza sera si sì sia sole solo sono sopra sotto spazio stare stella strada su sua subito sul suo tavola te tempo terra tre tu tuo tutti tutto un una uno usare va valle veloce venire verde vero via vita vivere voce voi vuole zero'),
  pack('ru', 'Русский', 'Cyrillic', 'ltr', 'оаеинтсрвлкмдпуяыьгзбчйхжшюцщэфъё',
    'а и в во на не но он она оно они мы вы я ты да нет это то так там тут как когда где кто что день дом мир мама папа брат друг вода река море гора лес поле небо солнце луна звезда свет тень ночь утро вечер весна лето осень зима время год час минута слово буква книга школа урок дело труд работа путь дорога город улица окно дверь стол стул рука нога лицо глаз голос сердце ум душа жизнь сила мысль имя люди человек ребёнок хлеб молоко чай сок сад цветок трава дерево лист ветер дождь снег огонь земля воздух птица рыба кот собака идти идти читать писать жить знать видеть слышать говорить думать делать учить любить ждать играть найти взять дать есть быть хорошо тихо быстро медленно новый старый малый большой белый синий красный зелёный добрый тёплый холодный мой твой наш ваш его её их один два три четыре пять шесть семь восемь девять десять ещё уже лишь без для под над при от до за из если или чтобы потому очень вместе рядом снова теперь здесь счастье учёба язык', 'native'),
  pack('hi', 'हिन्दी', 'Devanagari', 'ltr', 'कमनरहसतपवलदबगयअआइईउऊएऐओऔ',
    'मन तन वन धन जन जल घर नाम काम राम रात बात साथ हाथ दिन दिल मिल फिर सिर तुम हम सब अब कब तब यह वह और पर बस कल फल बल चल पल नमक कमल नगर मगर समय सहज सरल सफल पहला नया हवा दवा कला काला काली खाना पानी कहानी किताब भाषा भारत अपना सपन सपना सपना पढ़ना लिखना सीखना सूरज चाँद नदी धरती फूल मित्र ज्ञान जीवन सुबह शाम देश लोग छोटा बड़ा अच्छा धीरे तेज़ खुशी रास्ता विद्यालय संगीत प्रकाश विश्वास अभ्यास', 'native'),
  pack('ar', 'العربية', 'Arabic', 'rtl', 'اليمونرتبكعسفدهحجقشصطزذثخضظغءأإآؤئىة',
    'من في ما لا لو لم لن لن من هل هو هي هم هن أنا أنت نحن أن إن إلى على عن مع كل كان كما كتاب كتب كلمة قلم علم عمل عالم نور نار نوم يوم بيت باب ماء هواء أرض بحر نهر جبل شمس قمر ليل صباح مساء وقت ساعة سنة شهر عمر حياة قلب حب حلم سلام صبر صدق حق خير اسم صوت عين يد رأس وجه طفل أم أب أخ أخت أسرة صديق مدينة طريق مدرسة جامعة درس لغة تعلم قراءة كتابة فرح أمل جديد قديم صغير كبير جميل هادئ سريع بطيء قريب بعيد أبيض أسود أزرق أخضر أحمر فوق تحت بين عند أمام خلف هنا هناك نعم مرحبا شكرا اليوم غدا أمس واحد اثنان ثلاثة أربعة خمسة ستة سبعة ثمانية تسعة عشرة', 'native'),
  pack('gu-Latn', 'Gujarati transliteration (Latin)', 'Latin', 'ltr', 'aenirutkmsvhopdlgcbjyfzqwx',
    'a aa ae ai ame amaro anek aap aaje aakash aag aagal aakho aasha abhyas ahi akshar ane aram avaj avu banne balak baari bap bapor bhai bhasha bhumi book bolvu cha chalo chandra che chokro chokri divas dil disha dost door ek em ghar gagan gaam gamvu garam gati geet gnan gujarati ha have hava hath hriday hu jagat jal jaldi jamin jan janu jivan jovo jyot kaam kalam kal katha kem ketlu khabar kharu khushi kitab koi kon lakho lakhvu laal lakh lakshya leelo loko ma maro man marg mitra moto nadi naam namak namaste nano navi navo na ne nathi navu nichi nirmal nishal pachhi paani pahad pan pahelu pankhi paper par parivar pashe pavan peelo pivu prakash prem pruthvi pustak ramvu rang raat rasto roj sakal samay sanj saro saral sathe sachu shabd shakti shala shant shikhvu shital shubh shun sneh sukh sundar suraj tamaru tame tap te tej tran tu upar uthvu van vanchvu varta varsh vayu vichar vikas vishvas vita vruksh yaad yatra', 'qwerty'),
];

export function getContentPack(id: string): ContentPack {
  const normalized = id === 'gu' || id.toLowerCase().startsWith('gu-latn') ? 'gu-Latn' : id.split('-')[0].toLowerCase();
  return CONTENT_PACKS.find(item => item.id === normalized) ?? CONTENT_PACKS[0];
}

export function getLayout(id: string): typeof LAYOUTS[LayoutId] {
  return LAYOUTS[id.toLowerCase() as LayoutId] ?? LAYOUTS.native;
}

/** Mulberry32: injected/reproducible content selection, never a security RNG. */
export function seededRandom(seed: string): () => number {
  let value = 2166136261;
  for (const char of seed) value = Math.imul(value ^ char.codePointAt(0)!, 16777619);
  return () => {
    value += 0x6D2B79F5;
    let next = Math.imul(value ^ value >>> 15, value | 1);
    next ^= next + Math.imul(next ^ next >>> 7, next | 61);
    return ((next ^ next >>> 14) >>> 0) / 4294967296;
  };
}

export function generatePackText(language: string, count: number, seed: string): string {
  const content = getContentPack(language);
  const random = seededRandom(seed);
  return Array.from({ length: Math.max(1, Math.min(2000, Math.floor(count) || 1)) }, () => content.words[Math.floor(random() * content.words.length)]).join(' ');
}

