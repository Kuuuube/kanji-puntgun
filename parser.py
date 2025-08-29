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
            radicals_dict[header] = {"kanji": [], "stroke_count": radkfile_line.split()[2]}
            continue

        radicals_dict[header]["kanji"] += list(radkfile_line)
        radicals_dict[header]["kanji"].sort(key = lambda x: kanji_stroke_counts[x])

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

    json_string = json.dumps(kanji_stroke_counts, ensure_ascii = False, indent = 4)
    with open("./assets/kanji_stroke_counts.json", "w", encoding = "utf8") as kanji_stroke_counts_json:
        kanji_stroke_counts_json.write(json_string)
    with open("./assets/kanji_stroke_counts.js", "w", encoding = "utf8") as kanji_stroke_counts_js:
        kanji_stroke_counts_js.write("const KANJI_STROKE_COUNTS = " + json_string)

    return kanji_stroke_counts

def parse_kanjidic_four_corner():
    four_corner_codes_dict = {
        "top_left": {"0": [], "1": [], "2": [], "3": [], "4": [], "5": [], "6": [], "7": [], "8": [], "9": []},
        "top_right": {"0": [], "1": [], "2": [], "3": [], "4": [], "5": [], "6": [], "7": [], "8": [], "9": []},
        "bottom_left": {"0": [], "1": [], "2": [], "3": [], "4": [], "5": [], "6": [], "7": [], "8": [], "9": []},
        "bottom_right": {"0": [], "1": [], "2": [], "3": [], "4": [], "5": [], "6": [], "7": [], "8": [], "9": []},
        "extra": {"0": [], "1": [], "2": [], "3": [], "4": [], "5": [], "6": [], "7": [], "8": [], "9": []},
    }

    kanjidic = open("./assets/kanjidic2.xml").read().replace("\n", "").replace("\r", "")
    for character_data in re.findall("<character>.*?</character>", kanjidic):
        character = re.search(r"(?<=<literal>).*?(?=</literal>)", character_data)[0]
        four_corner_code = re.search(r"(?<=<q_code qc_type=\"four_corner\">).*?(?=</q_code>)", character_data)
        if four_corner_code:
            four_corner_code_str = four_corner_code[0]
            four_corner_codes_dict["top_left"][four_corner_code_str[0]].append(character)
            four_corner_codes_dict["top_right"][four_corner_code_str[1]].append(character)
            four_corner_codes_dict["bottom_left"][four_corner_code_str[2]].append(character)
            four_corner_codes_dict["bottom_right"][four_corner_code_str[3]].append(character)
            four_corner_codes_dict["extra"][four_corner_code_str[5]].append(character)

    json_string = json.dumps(four_corner_codes_dict, ensure_ascii = False, indent = 4)
    with open("./assets/four_corner.json", "w", encoding = "utf8") as four_corner_json:
        four_corner_json.write(json_string)
    with open("./assets/four_corner.js", "w", encoding = "utf8") as four_corner_js:
        four_corner_js.write("const FOUR_CORNER = " + json_string)

parse_kanjidic_four_corner()
parse_radkfilex()
