/*
 * Copyright (C) 2024-2025  Yomitan Authors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// Taken from https://github.com/yomidevs/yomitan at commit 3970918e05949d3f3191156c3a7fbef094b3f6bb

function kana_ime_on_search(element, event) {
    const platform = getPlatform();
    const browser = getBrowser(platform);
    if (isComposing(event, platform, browser)) { return; }

    const {kanaString, newSelectionStart} = convertToKanaIME(element.value, element.selectionStart);
    element.value = kanaString;
    element.setSelectionRange(newSelectionStart, newSelectionStart);
}

function isComposing(event, platform, browser) {
    // Desktop Composing
    if (event.isComposing && platform !== 'android') { return true; }

    // Android Composing
    // eslint-disable-next-line sonarjs/prefer-single-boolean-return
    if (event.isComposing && !isFakeComposing(event) && platform === 'android' && browser !== 'firefox-mobile') { return true; }

    return false;
}

function isFakeComposing(event) {
    return !!event.data?.match(/^[A-Za-z]$/);
}

function convertToKanaIME(text, selectionStart) {
    const prevSelectionStart = selectionStart;
    const prevLength = text.length;
    let kanaString = '';

    // If the user starts typing a single `n`, hide it from the converter. (This only applies when using the converter as an IME)
    // The converter must only allow the n to become ん when the user's text cursor is at least one character ahead of it.
    // If `n` occurs directly behind the user's text cursor, it should be hidden from the converter.
    // If `ny` occurs directly behind the user's text cursor, it must also be hidden from the converter as the user may be trying to type `nya` `nyi` `nyu` `nye` `nyo`.
    // Examples (`|` shall be the user's text cursor):
    // `たn|` does not convert to `たん|`. The `n` should be hidden from the converter and `た` should only be sent.
    // `n|の` also does not convert to `ん|の`. Even though the cursor is not at the end of the line, the `n` should still be hidden since it is directly behind the user's text cursor.
    // `ny|` does not convert to `んy|`. The `ny` must be hidden since the user may be trying to type something starting with `ny` such as `nya`.
    // `たnt|` does convert to `たんt|`. The user's text cursor is one character ahead of the `n` so it does not need to be hidden and can be converted.
    // `nとあ|` also converts to `んとあ|` The user's text cursor is two characters away from the `n`.
    // `なno|` will still convert to `なの` instead of `なんお` without issue since the `no` -> `の` conversion will be found before `n` -> `ん` and `o` -> `お`.
    // `nn|` will still convert to `ん` instead of `んん` since `nn` -> `ん` will be found before `n` -> `ん`.
    // If the user pastes in a long string of `n` such as `nnnnn|` it should leave the last `n` and convert to `んんn`
    const textLowered = text.toLowerCase();
    if (textLowered[prevSelectionStart - 1] === 'n' && textLowered.slice(0, prevSelectionStart - 1).replaceAll('nn', '').at(-1) !== 'n') {
        const n = text.slice(prevSelectionStart - 1, prevSelectionStart);
        const beforeN = text.slice(0, prevSelectionStart - 1);
        const afterN = text.slice(prevSelectionStart);
        kanaString = convertToKana(beforeN) + n + convertToKana(afterN);
    } else if (textLowered.slice(prevSelectionStart - 2, prevSelectionStart) === 'ny') {
        const ny = text.slice(prevSelectionStart - 2, prevSelectionStart);
        const beforeN = text.slice(0, prevSelectionStart - 2);
        const afterN = text.slice(prevSelectionStart);
        kanaString = convertToKana(beforeN) + ny + convertToKana(afterN);
    } else {
        kanaString = convertToKana(text);
    }

    const selectionOffset = kanaString.length - prevLength;

    return {kanaString, newSelectionStart: prevSelectionStart + selectionOffset};
}

function convertToKana(text) {
    let newText = text;
    for (const [romaji, kana] of Object.entries(ROMAJI_TO_HIRAGANA)) {
        newText = newText.replaceAll(romaji, kana);
        // Uppercase text converts to katakana
        newText = newText.replaceAll(romaji.toUpperCase(), convertHiraganaToKatakana(kana).toUpperCase());
    }
    return fillSokuonGaps(newText);
}

function fillSokuonGaps(text) {
    return text.replaceAll(/っ[a-z](?=っ)/g, 'っっ').replaceAll(/ッ[A-Z](?=ッ)/g, 'ッッ');
}

const HIRAGANA_CONVERSION_RANGE = [0x3041, 0x3096];
const KATAKANA_CONVERSION_RANGE = [0x30a1, 0x30f6];
function convertHiraganaToKatakana(text) {
    let result = '';
    const offset = (KATAKANA_CONVERSION_RANGE[0] - HIRAGANA_CONVERSION_RANGE[0]);
    for (let char of text) {
        const codePoint = /** @type {number} */ (char.codePointAt(0));
        if (isCodePointInRange(codePoint, HIRAGANA_CONVERSION_RANGE)) {
            char = String.fromCodePoint(codePoint + offset);
        }
        result += char;
    }
    return result;
}

function isCodePointInRange(codePoint, [min, max]) {
    return (codePoint >= min && codePoint <= max);
}

// Platform Info Grabber

function getPlatform() {
    const user_agent = navigator.userAgent;
    if (/Android/.test(user_agent)) {
        return "android";
    }
    if (/Linux/.test(user_agent)) {
        return "linux";
    }
    if (/Windows/.test(user_agent)) {
        return "windows";
    }
    if (/Macintosh/.test(user_agent)) {
        return "macos";
    }
    if (/(iPhone|iPad)/.test(user_agent)) {
        return "ios";
    }
    return "linux";
}

function getBrowser(platform) {
    const user_agent = navigator.userAgent;
    if (/\bEdge?\//.test(user_agent)) {
        return "edge";
    }
    if (/\bChrome\//.test(user_agent)) {
        return "chrome";
    }
    if (/\bSafari\//.test(user_agent)) {
        return "safari";
    }
    if (/\bFirefox\//.test(user_agent)) {
        if (platform === "android") {
            return "firefox-mobile";
        }
        return "firefox";
    }
    return "chrome";
}

function isSafari() {
    const {vendor, userAgent} = navigator;
    return (
        typeof vendor === 'string' &&
        typeof userAgent === 'string' &&
        vendor.includes('Apple') &&
        !userAgent.includes('CriOS') &&
        !userAgent.includes('FxiOS')
    );
}

// IME Dict
// ---------------------------------------------

// Mozc's default Romaji to Hiragana list referenced to create ROMAJI_TO_HIRAGANA
// https://github.com/google/mozc/blob/035668c3452fa98ac09462fd2cf556948964aad7/src/data/preedit/romanji-hiragana.tsv
const ROMAJI_TO_HIRAGANA = {
    // Double letters - these **must** always be matched first or further down matches may cause inserting `っ` from double letters to require extra logic
    // There **must** be an entry for every accepted double letter
    // To not disturb further matches, an extra letter must be appended after the `っ`
    'qq': 'っq',
    'vv': 'っv',
    'll': 'っl',
    'xx': 'っx',
    'kk': 'っk',
    'gg': 'っg',
    'ss': 'っs',
    'zz': 'っz',
    'jj': 'っj',
    'tt': 'っt',
    'dd': 'っd',
    'hh': 'っh',
    'ff': 'っf',
    'bb': 'っb',
    'pp': 'っp',
    'mm': 'っm',
    'yy': 'っy',
    'rr': 'っr',
    'ww': 'っw',
    'cc': 'っc',

    // Length 4 - longest matches
    'hwyu': 'ふゅ',
    'xtsu': 'っ',
    'ltsu': 'っ',

    // Length 3
    'vya': 'ゔゃ',
    'vyi': 'ゔぃ',
    'vyu': 'ゔゅ',
    'vye': 'ゔぇ',
    'vyo': 'ゔょ',
    'kya': 'きゃ',
    'kyi': 'きぃ',
    'kyu': 'きゅ',
    'kye': 'きぇ',
    'kyo': 'きょ',
    'gya': 'ぎゃ',
    'gyi': 'ぎぃ',
    'gyu': 'ぎゅ',
    'gye': 'ぎぇ',
    'gyo': 'ぎょ',
    'sya': 'しゃ',
    'syi': 'しぃ',
    'syu': 'しゅ',
    'sye': 'しぇ',
    'syo': 'しょ',
    'sha': 'しゃ',
    'shi': 'し',
    'shu': 'しゅ',
    'she': 'しぇ',
    'sho': 'しょ',
    'zya': 'じゃ',
    'zyi': 'じぃ',
    'zyu': 'じゅ',
    'zye': 'じぇ',
    'zyo': 'じょ',
    'tya': 'ちゃ',
    'tyi': 'ちぃ',
    'tyu': 'ちゅ',
    'tye': 'ちぇ',
    'tyo': 'ちょ',
    'cha': 'ちゃ',
    'chi': 'ち',
    'chu': 'ちゅ',
    'che': 'ちぇ',
    'cho': 'ちょ',
    'cya': 'ちゃ',
    'cyi': 'ちぃ',
    'cyu': 'ちゅ',
    'cye': 'ちぇ',
    'cyo': 'ちょ',
    'dya': 'ぢゃ',
    'dyi': 'ぢぃ',
    'dyu': 'ぢゅ',
    'dye': 'ぢぇ',
    'dyo': 'ぢょ',
    'tsa': 'つぁ',
    'tsi': 'つぃ',
    'tse': 'つぇ',
    'tso': 'つぉ',
    'tha': 'てゃ',
    'thi': 'てぃ',
    'thu': 'てゅ',
    'the': 'てぇ',
    'tho': 'てょ',
    'dha': 'でゃ',
    'dhi': 'でぃ',
    'dhu': 'でゅ',
    'dhe': 'でぇ',
    'dho': 'でょ',
    'twa': 'とぁ',
    'twi': 'とぃ',
    'twu': 'とぅ',
    'twe': 'とぇ',
    'two': 'とぉ',
    'dwa': 'どぁ',
    'dwi': 'どぃ',
    'dwu': 'どぅ',
    'dwe': 'どぇ',
    'dwo': 'どぉ',
    'nya': 'にゃ',
    'nyi': 'にぃ',
    'nyu': 'にゅ',
    'nye': 'にぇ',
    'nyo': 'にょ',
    'hya': 'ひゃ',
    'hyi': 'ひぃ',
    'hyu': 'ひゅ',
    'hye': 'ひぇ',
    'hyo': 'ひょ',
    'bya': 'びゃ',
    'byi': 'びぃ',
    'byu': 'びゅ',
    'bye': 'びぇ',
    'byo': 'びょ',
    'pya': 'ぴゃ',
    'pyi': 'ぴぃ',
    'pyu': 'ぴゅ',
    'pye': 'ぴぇ',
    'pyo': 'ぴょ',
    'fya': 'ふゃ',
    'fyu': 'ふゅ',
    'fyo': 'ふょ',
    'hwa': 'ふぁ',
    'hwi': 'ふぃ',
    'hwe': 'ふぇ',
    'hwo': 'ふぉ',
    'mya': 'みゃ',
    'myi': 'みぃ',
    'myu': 'みゅ',
    'mye': 'みぇ',
    'myo': 'みょ',
    'rya': 'りゃ',
    'ryi': 'りぃ',
    'ryu': 'りゅ',
    'rye': 'りぇ',
    'ryo': 'りょ',
    'lyi': 'ぃ',
    'xyi': 'ぃ',
    'lye': 'ぇ',
    'xye': 'ぇ',
    'xka': 'ヵ',
    'xke': 'ヶ',
    'lka': 'ヵ',
    'lke': 'ヶ',
    'kwa': 'くぁ',
    'kwi': 'くぃ',
    'kwu': 'くぅ',
    'kwe': 'くぇ',
    'kwo': 'くぉ',
    'gwa': 'ぐぁ',
    'gwi': 'ぐぃ',
    'gwu': 'ぐぅ',
    'gwe': 'ぐぇ',
    'gwo': 'ぐぉ',
    'swa': 'すぁ',
    'swi': 'すぃ',
    'swu': 'すぅ',
    'swe': 'すぇ',
    'swo': 'すぉ',
    'zwa': 'ずぁ',
    'zwi': 'ずぃ',
    'zwu': 'ずぅ',
    'zwe': 'ずぇ',
    'zwo': 'ずぉ',
    'jya': 'じゃ',
    'jyi': 'じぃ',
    'jyu': 'じゅ',
    'jye': 'じぇ',
    'jyo': 'じょ',
    'tsu': 'つ',
    'xtu': 'っ',
    'ltu': 'っ',
    'xya': 'ゃ',
    'lya': 'ゃ',
    'wyi': 'ゐ',
    'xyu': 'ゅ',
    'lyu': 'ゅ',
    'wye': 'ゑ',
    'xyo': 'ょ',
    'lyo': 'ょ',
    'xwa': 'ゎ',
    'lwa': 'ゎ',
    'wha': 'うぁ',
    'whi': 'うぃ',
    'whu': 'う',
    'whe': 'うぇ',
    'who': 'うぉ',

    // Length 2
    'nn': 'ん',
    'n\'': 'ん',
    'va': 'ゔぁ',
    'vi': 'ゔぃ',
    'vu': 'ゔ',
    've': 'ゔぇ',
    'vo': 'ゔぉ',
    'fa': 'ふぁ',
    'fi': 'ふぃ',
    'fe': 'ふぇ',
    'fo': 'ふぉ',
    'xn': 'ん',
    'wu': 'う',
    'xa': 'ぁ',
    'xi': 'ぃ',
    'xu': 'ぅ',
    'xe': 'ぇ',
    'xo': 'ぉ',
    'la': 'ぁ',
    'li': 'ぃ',
    'lu': 'ぅ',
    'le': 'ぇ',
    'lo': 'ぉ',
    'ye': 'いぇ',
    'ka': 'か',
    'ki': 'き',
    'ku': 'く',
    'ke': 'け',
    'ko': 'こ',
    'ga': 'が',
    'gi': 'ぎ',
    'gu': 'ぐ',
    'ge': 'げ',
    'go': 'ご',
    'sa': 'さ',
    'si': 'し',
    'su': 'す',
    'se': 'せ',
    'so': 'そ',
    'ca': 'か',
    'ci': 'し',
    'cu': 'く',
    'ce': 'せ',
    'co': 'こ',
    'qa': 'くぁ',
    'qi': 'くぃ',
    'qu': 'く',
    'qe': 'くぇ',
    'qo': 'くぉ',
    'za': 'ざ',
    'zi': 'じ',
    'zu': 'ず',
    'ze': 'ぜ',
    'zo': 'ぞ',
    'ja': 'じゃ',
    'ji': 'じ',
    'ju': 'じゅ',
    'je': 'じぇ',
    'jo': 'じょ',
    'ta': 'た',
    'ti': 'ち',
    'tu': 'つ',
    'te': 'て',
    'to': 'と',
    'da': 'だ',
    'di': 'ぢ',
    'du': 'づ',
    'de': 'で',
    'do': 'ど',
    'na': 'な',
    'ni': 'に',
    'nu': 'ぬ',
    'ne': 'ね',
    'no': 'の',
    'ha': 'は',
    'hi': 'ひ',
    'hu': 'ふ',
    'fu': 'ふ',
    'he': 'へ',
    'ho': 'ほ',
    'ba': 'ば',
    'bi': 'び',
    'bu': 'ぶ',
    'be': 'べ',
    'bo': 'ぼ',
    'pa': 'ぱ',
    'pi': 'ぴ',
    'pu': 'ぷ',
    'pe': 'ぺ',
    'po': 'ぽ',
    'ma': 'ま',
    'mi': 'み',
    'mu': 'む',
    'me': 'め',
    'mo': 'も',
    'ya': 'や',
    'yu': 'ゆ',
    'yo': 'よ',
    'ra': 'ら',
    'ri': 'り',
    'ru': 'る',
    're': 'れ',
    'ro': 'ろ',
    'wa': 'わ',
    'wi': 'うぃ',
    'we': 'うぇ',
    'wo': 'を',

    // Length 1 - shortest matches
    'a': 'あ',
    'i': 'い',
    'u': 'う',
    'e': 'え',
    'o': 'お',

    // Length 1 Special/Symbols
    '.': '。',
    ',': '、',
    ':': '：',
    '/': '・',
    '!': '！',
    '?': '？',
    '~': '〜',
    '-': 'ー',
    '‘': '「',
    '’': '」',
    '“': '『',
    '”': '』',
    '[': '［',
    ']': '］',
    '(': '（',
    ')': '）',
    '{': '｛',
    '}': '｝',
    ' ': '　',

    // n -> ん is a special case.
    'n': 'ん',
};

const HIRAGANA_TO_ROMAJI = {
    // Length 2
    'んい': 'n\'i',
    'ゔぁ': 'va',
    'ゔぃ': 'vi',
    'ゔぉ': 'vo',
    'ゔゃ': 'vya',
    'ゔゅ': 'vyu',
    'ゔぇ': 've',
    'ゔょ': 'vyo',
    'きゃ': 'kya',
    'きぃ': 'kyi',
    'きゅ': 'kyu',
    'きぇ': 'kye',
    'きょ': 'kyo',
    'ぎゃ': 'gya',
    'ぎぃ': 'gyi',
    'ぎゅ': 'gyu',
    'ぎぇ': 'gye',
    'ぎょ': 'gyo',
    'しゃ': 'sha',
    'しぃ': 'syi',
    'しゅ': 'shu',
    'しぇ': 'she',
    'しょ': 'sho',
    'ちゃ': 'cya',
    'ちゅ': 'chu',
    'ちぇ': 'che',
    'ちょ': 'cho',
    'ちぃ': 'cyi',
    'ぢゃ': 'dya',
    'ぢぃ': 'dyi',
    'ぢゅ': 'dyu',
    'ぢぇ': 'dye',
    'ぢょ': 'dyo',
    'つぁ': 'tsa',
    'つぃ': 'tsi',
    'つぇ': 'tse',
    'つぉ': 'tso',
    'てゃ': 'tha',
    'てぃ': 'thi',
    'てゅ': 'thu',
    'てぇ': 'the',
    'てょ': 'tho',
    'でゃ': 'dha',
    'でぃ': 'dhi',
    'でゅ': 'dhu',
    'でぇ': 'dhe',
    'でょ': 'dho',
    'とぁ': 'twa',
    'とぃ': 'twi',
    'とぅ': 'twu',
    'とぇ': 'twe',
    'とぉ': 'two',
    'どぁ': 'dwa',
    'どぃ': 'dwi',
    'どぅ': 'dwu',
    'どぇ': 'dwe',
    'どぉ': 'dwo',
    'にゃ': 'nya',
    'にぃ': 'nyi',
    'にゅ': 'nyu',
    'にぇ': 'nye',
    'にょ': 'nyo',
    'ひゃ': 'hya',
    'ひぃ': 'hyi',
    'ひゅ': 'hyu',
    'ひぇ': 'hye',
    'ひょ': 'hyo',
    'びゃ': 'bya',
    'びぃ': 'byi',
    'びゅ': 'byu',
    'びぇ': 'bye',
    'びょ': 'byo',
    'ぴゃ': 'pya',
    'ぴぃ': 'pyi',
    'ぴゅ': 'pyu',
    'ぴぇ': 'pye',
    'ぴょ': 'pyo',
    'ふゃ': 'fya',
    'ふょ': 'fyo',
    'ふぁ': 'fa',
    'ふゅ': 'fyu',
    'ふぃ': 'fi',
    'ふぇ': 'fe',
    'ふぉ': 'fo',
    'みゃ': 'mya',
    'みぃ': 'myi',
    'みゅ': 'myu',
    'みぇ': 'mye',
    'みょ': 'myo',
    'りゃ': 'rya',
    'りぃ': 'ryi',
    'りゅ': 'ryu',
    'りぇ': 'rye',
    'りょ': 'ryo',
    'くぁ': 'kwa',
    'くぃ': 'kwi',
    'くぅ': 'kwu',
    'くぇ': 'kwe',
    'くぉ': 'kwo',
    'ぐぁ': 'gwa',
    'ぐぃ': 'gwi',
    'ぐぅ': 'gwu',
    'ぐぇ': 'gwe',
    'ぐぉ': 'gwo',
    'すぁ': 'swa',
    'すぃ': 'swi',
    'すぅ': 'swu',
    'すぇ': 'swe',
    'すぉ': 'swo',
    'ずぁ': 'zwa',
    'ずぃ': 'zwi',
    'ずぅ': 'zwu',
    'ずぇ': 'zwe',
    'ずぉ': 'zwo',
    'じゃ': 'ja',
    'じぃ': 'jyi',
    'じゅ': 'ju',
    'じぇ': 'je',
    'じょ': 'jo',
    'うぁ': 'wha',
    'うぃ': 'wi',
    'うぇ': 'we',
    'うぉ': 'who',
    'いぇ': 'ye',

    // Length 1
    'ん': 'n',
    'あ': 'a',
    'い': 'i',
    'う': 'u',
    'え': 'e',
    'お': 'o',
    'ゔ': 'vu',
    'か': 'ka',
    'き': 'ki',
    'く': 'ku',
    'け': 'ke',
    'こ': 'ko',
    'が': 'ga',
    'ぎ': 'gi',
    'ぐ': 'gu',
    'げ': 'ge',
    'ご': 'go',
    'さ': 'sa',
    'し': 'shi',
    'す': 'su',
    'せ': 'se',
    'そ': 'so',
    'ざ': 'za',
    'じ': 'ji',
    'ず': 'zu',
    'ぜ': 'ze',
    'ぞ': 'zo',
    'た': 'ta',
    'ち': 'chi',
    'つ': 'tsu',
    'て': 'te',
    'と': 'to',
    'だ': 'da',
    'ぢ': 'di',
    'づ': 'du',
    'で': 'de',
    'ど': 'do',
    'な': 'na',
    'に': 'ni',
    'ぬ': 'nu',
    'ね': 'ne',
    'の': 'no',
    'は': 'ha',
    'ひ': 'hi',
    'ふ': 'fu',
    'へ': 'he',
    'ほ': 'ho',
    'ば': 'ba',
    'び': 'bi',
    'ぶ': 'bu',
    'べ': 'be',
    'ぼ': 'bo',
    'ぱ': 'pa',
    'ぴ': 'pi',
    'ぷ': 'pu',
    'ぺ': 'pe',
    'ぽ': 'po',
    'ま': 'ma',
    'み': 'mi',
    'む': 'mu',
    'め': 'me',
    'も': 'mo',
    'や': 'ya',
    'ゆ': 'yu',
    'よ': 'yo',
    'ら': 'ra',
    'り': 'ri',
    'る': 'ru',
    'れ': 're',
    'ろ': 'ro',
    'わ': 'wa',
    'ゐ': 'wi',
    'ゑ': 'we',
    'を': 'wo',

    // Length 1 Special/Symbols
    '。': '.',
    '、': ',',
    '：': ':',
    '・': '/',
    '！': '!',
    '？': '?',
    '〜': '~',
    'ー': '-',
    '「': '‘',
    '」': '’',
    '『': '“',
    '』': '”',
    '［': '[',
    '］': ']',
    '（': '(',
    '）': ')',
    '｛': '{',
    '｝': '}',
    '　': ' ',

    // Length 1 Small - Even though these are usually represented with `x` or `l` prepending them, in romaji it makes the most sense to not do that
    'ゃ': 'ya',
    'ゅ': 'yu',
    'ょ': 'yo',
    'ゎ': 'wa',
    'ぁ': 'a',
    'ぃ': 'i',
    'ぅ': 'u',
    'ぇ': 'e',
    'ぉ': 'o',
    'ヵ': 'ka',
    'ヶ': 'ke',

    // Double letters - these **must** always be matched last or they will break previous maches
    'っq': 'qq',
    'っv': 'vv',
    'っx': 'xx',
    'っk': 'kk',
    'っg': 'gg',
    'っs': 'ss',
    'っz': 'zz',
    'っj': 'jj',
    'っt': 'tt',
    'っd': 'dd',
    'っh': 'hh',
    'っf': 'ff',
    'っb': 'bb',
    'っp': 'pp',
    'っm': 'mm',
    'っy': 'yy',
    'っr': 'rr',
    'っw': 'ww',
    'っc': 'cc',

    // `っん` is a special case
    'っn': 'n',

    // single `っ` is weird, some converters just remove it, some leave the `っ` in kana, some replace with `xtsu` or `ltsu`
    'っ': '',
};
