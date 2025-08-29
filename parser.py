import json
import re

def parse_radkfilex():
    kanji_stroke_counts = parse_kanjidic_stroke_count()
    radkfile_lines = list(map(str.strip, open("./assets/radkfilex", "r", encoding = "euc_jisx0213").readlines()))

    header = ""
    radicals_dict = {}
    for radkfile_line in radkfile_lines:
        if len(radkfile_line) <= 0 or radkfile_line[0] == "#":
            continue
        if radkfile_line[0] == "$":
            header = radkfile_line.split()[1]
            radicals_dict[header] = []
            continue

        radicals_dict[header] += list(radkfile_line)
        radicals_dict[header].sort(key = lambda x: kanji_stroke_counts[x])

    json_string = json.dumps(radicals_dict, ensure_ascii = False, indent = 4)
    with open("./assets/radkfilex.json", "w", encoding = "utf8") as radkfilex_json:
        radkfilex_json.write(json_string)
    with open("./assets/radkfilex.js", "w", encoding = "utf8") as radkfilex_js:
        radkfilex_js.write("const RADKFILEX = " + json_string)

def parse_kanjidic_stroke_count():
    kanji_stroke_counts = {}

    kanjidic = open("./assets/kanjidic2.xml").read().replace("\n", "").replace("\r", "")
    for character_data in re.findall("<character>.*?</character>", kanjidic):
        character = re.search(r"(?<=<literal>).*?(?=</literal>)", character_data)
        stroke_count = re.search(r"(?<=<stroke_count>)\d+(?=</stroke_count>)", character_data)

        if character and stroke_count:
            kanji_stroke_counts[character[0]] = int(stroke_count[0])
    
    return kanji_stroke_counts

parse_radkfilex()
