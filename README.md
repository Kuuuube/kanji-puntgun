# Kanji Punt Gun

Named after the largest shotguns ever built, Kanji Punt Gun provides just about every static visual way possible of searching kanji. **All at the same time**.

https://kuuuube.github.io/kanji-puntgun/

## Documentation and Instructions

### Radical

The main kanji part or component in a character. This differs from components which can occur multiple times in a character.

Most "radical searches" on websites and apps are actually component searches. Use the Components section of this page for a similar experience.

([More information](https://www.sljfaq.org/afaq/radicals.html))

### Components

Kanji parts that are found in many characters. Components in characters are often not shaped exactly like the original component. They may be stetched, squished, or otherwise distorted.

### Four Corner

Identifies kanji based on components present in each corner of the character. Not every corner component is strictly in the corner.

([More information](https://www.edrdg.org/wwwjdic/FOURCORNER.html))

### SKIP Code

Identifies kanji based on a pattern, the stroke order within the shaded or dark part of the pattern, and the stroke order within the unshaded or light part of the pattern.

Kanji which can be split vertically (left-right) are pattern 1, kanji which can be split horizontally (top-bottom) use pattern 2, kanji which are contained in an enclosure use pattern 3, and kanji which cannot be split use pattern 4.

Stroke count can be an imperfect measurement due to discrepancies in how characters are written. The ± option allows matching all characters with a stroke order within the specified range around the specified stroke order.

([More information](https://www.edrdg.org/wwwjdic/SKIP.html))

### De Roo

Identifies kanji by the extreme top or left top shape and the extreme bottom or right bottom shape.

The dots show potential strokes which may or may not be present. Ignore ⻌ and 囗 when used as enclosures. When 門 is present as an enclosure, consider it for the top or left top but ignore it for the bottom or right bottom.

([More Information](https://www.edrdg.org/wwwjdic/deroo.html))

### Voyager

Identifies kanji by selecting regions (similar to SKIP) and the component within the shaded part of that region.

Kanji that dont appear to fit in any region are likely a part of the solid region. The solid region does not contain any selectable components.

([More Information](https://christopherball.github.io/linguistics/kanjiVoyager/))

### Partial Word

Narrows down the search to kanji present in possible words.

For example, entering `　` `し` `　` `す` allows limiting to kanji that are contained in words which have し as the second character and す as the fourth character.

Filtering applies to words longer than four characters but only the first four characters may be filtered. Do not input characters that are part of conjugations or inflections.

Only one character may be input in each input box. Both kanji and hiragana are accepted. Katakana is not accepted. A kana IME is built into the page to convert romaji to hiragana.

### Stroke Count

Only show kanji with stroke counts greater than, equal to, and/or less than the specified numbers.

### Composition/Decomposition

Similar to the Components option but uses composition data containing thousands of unique kanji parts to filter kanji rather than a select few hundred key parts.

Input any character into the Decomposition input box then select one of the decomposition outputs to add it to the kanji filtering. The decomposition input is limited to 4 characters at once.

The first row shows primary decomposition results and the second row shows secondary and further results. Primary results will typically be characters with a higher stroke count.

Selected parts will appear under Composition. To remove a part, click or tap it under Composition.

### Construction

Construction filters kanji by the splits between composition components. The construction of a character goes top left to bottom right. Some characters have multiple different possible constructions.

To add a construction part, click or tap the list of parts. To remove a part, click or tap the highlighted part under the list of parts.

If a character cannot be split into any construction parts, the first construction part is used. No other parts can be selected while this part is.

To get a feel for how characters are split, try searching some of these using the kanji search: `化` `弼` `囜` `巫` `凷` `冏` `釁` `慶` `瘝`.

Four methods for matching construction parts are provided:

|          |                                                                                                                                     |
|----------|-------------------------------------------------------------------------------------------------------------------------------------|
| Contains | Matches the selected parts anywhere in a character, the character may have more construction parts.                                 |
| Exact    | Requires an exact full match between the selected parts and the character's construction.                                           |
| Start    | Matches the selected parts to the start of the character's construction, the character may have more construction parts at the end. |
| End      | Matches the selected parts to the end of the character's construction, the character may have more construction parts at the start. |
