import json
import re
import os
import unicodedata
import copy

assets_dir = "./assets/"
data_assets_dir = assets_dir + "data/"
generated_assets_dir = assets_dir + "generated/"
static_assets_dir = assets_dir + "static_data/"

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        # convert sets into lists
        if isinstance(obj, set):
            return list(obj)
        return json.JSONEncoder.default(self, obj)

def write_js_json(json_object, name):
    os.makedirs(generated_assets_dir, exist_ok = True)
    json_string = json.dumps(json_object, ensure_ascii = False, indent = 4, cls = CustomJSONEncoder)
    with open(generated_assets_dir + name + ".json", "w", encoding = "utf8") as components_json:
        components_json.write(json_string)
    with open(generated_assets_dir + name + ".js", "w", encoding = "utf8") as components_js:
        components_js.write("const " + name.upper() + " = " + json_string)

kanji_stroke_counts = {}

def generate_components_data():
    radkfile_lines = list(map(str.strip, open(data_assets_dir + "radkfilex", "r", encoding = "euc_jisx0213").readlines()))

    header = ""
    components_dict = {}
    components_list = []
    for radkfile_line in radkfile_lines:
        if len(radkfile_line) <= 0 or radkfile_line[0] == "#":
            continue
        if radkfile_line[0] == "$":
            header = radkfile_line.split()[1]
            stroke_count = radkfile_line.split()[2]
            components_dict[header] = {"kanji": [], "stroke_count": stroke_count}
            components_list.append({"component": header, "stroke_count": stroke_count})
            continue

        components_dict[header]["kanji"] += list(radkfile_line)
        components_dict[header]["kanji"].sort(key = lambda x: kanji_stroke_counts[x])

    write_js_json(components_list, "components_list")

    return components_dict

def parse_kanjidic_data():
    radicals_info_dict = {}

    kanji_data = {}

    default_kanji_data = {
    "skip": {
        "part_one": -1,
        "part_two": -1,
        "part_three": -1,
    },
    "four_corner": {
        "top_left": -1,
        "top_right": -1,
        "bottom_left": -1,
        "bottom_right": -1,
        "extra": -1,
    },
        "radical": {
            "id": -1,
            "characters": [],
        },
        "components": [],
    }


    radicals_info = json.loads(open(static_assets_dir + "radicals_info.json").read())
    for radical_info in radicals_info:
        radical_id = radical_info["radical_id"]
        if radical_id not in radicals_info_dict.keys():
            radicals_info_dict[radical_info["radical_id"]] = [
                    {
                        "character": radical_info["character"], "stroke_count": radical_info["stroke_count"]
                    }
                ]
        else:
            radicals_info_dict[radical_info["radical_id"]].append({"character": radical_info["character"], "stroke_count": radical_info["stroke_count"]})

    kanjidic = open(data_assets_dir + "kanjidic2.xml").read().replace("\n", "").replace("\r", "")
    for character_data in re.findall("<character>.*?</character>", kanjidic):
        character = re.search(r"(?<=<literal>).*?(?=</literal>)", character_data)[0]
        stroke_count = re.search(r"(?<=<stroke_count>)\d+(?=</stroke_count>)", character_data)
        four_corner_code = re.search(r"(?<=<q_code qc_type=\"four_corner\">).*?(?=</q_code>)", character_data)
        radical = re.search(r"(?<=<rad_value rad_type=\"classical\">).*?(?=</rad_value>)", character_data)
        skip_code = re.search(r"(?<=<q_code qc_type=\"skip\">).*?(?=</q_code>)", character_data)

        if character in kanji_data:
            print("dupe character found, this shouldnt happen")

        kanji_data[character] = copy.deepcopy(default_kanji_data)

        if stroke_count:
            kanji_data[character]["stroke_count"] = int(stroke_count[0])
            kanji_stroke_counts[character] = int(stroke_count[0])
        else:
            del kanji_data[character]["stroke_count"]

        if radical:
            radical_id = int(radical[0])
            kanji_data[character]["radical"]["id"] = radical_id
            kanji_data[character]["radical"]["characters"] = radicals_info_dict[radical_id]
        else:
            del kanji_data[character]["radical"]

        if four_corner_code:
            four_corner_code_str = four_corner_code[0]
            kanji_data[character]["four_corner"]["top_left"] = four_corner_code_str[0]
            kanji_data[character]["four_corner"]["top_right"] = four_corner_code_str[1]
            kanji_data[character]["four_corner"]["bottom_left"] = four_corner_code_str[2]
            kanji_data[character]["four_corner"]["bottom_right"] = four_corner_code_str[3]
            kanji_data[character]["four_corner"]["extra"] = four_corner_code_str[5]
        else:
            del kanji_data[character]["four_corner"]

        if skip_code:
            skip_code = list(map(int, skip_code[0].split("-"))) # remove random inconsistent zero padding
            kanji_data[character]["skip"]["part_one"] = skip_code[0]

            kanji_data[character]["skip"]["part_two"] = skip_code[1]

            kanji_data[character]["skip"]["part_three"] = skip_code[2]
        else:
            del kanji_data[character]["skip"]

    components_dict = generate_components_data()
    for component, component_info in components_dict.items():
        for component_kanji in component_info["kanji"]:
            kanji_data[component_kanji]["components"].append(component)

    for kanji in kanji_data:
        if len(kanji_data[kanji]["components"]) == 0:
            del kanji_data[kanji]["components"]

    write_js_json(kanji_data, "kanji_data")

def pack_info_files():
    components_info = open(static_assets_dir + "components_info.json").read()
    four_corner_info = open(static_assets_dir + "four_corner_info.json").read()
    radicals_info = open(static_assets_dir + "radicals_info.json").read()

    with open(generated_assets_dir + "packed_info.js", "w", encoding = "utf8") as packed_info:
        packed_info.write("const COMPONENTS_INFO = " + components_info + "\n")
        packed_info.write("const FOUR_CORNER_INFO = " + four_corner_info + "\n")
        packed_info.write("const RADICALS_INFO = " + radicals_info + "\n")


validation_regex = re.compile("(CJK (UNIFIED|COMPATIBILITY) IDEOGRAPH|HIRAGANA|IDEOGRAPHIC ITERATION MARK)")
kanji_regex = re.compile("(CJK (UNIFIED|COMPATIBILITY) IDEOGRAPH)")
def validate_word(string, min_length, max_length):
    string_len = len(string)
    if string_len > max_length or string_len < min_length:
        return False
    has_kanji = False
    for unichar in string:
        charname = unicodedata.name(unichar, "")
        if not bool(validation_regex.match(charname)):
            return False
        if not has_kanji:
            has_kanji = bool(kanji_regex.match(charname))

    return has_kanji

def generate_word_list():
    words = {
        2: set([]),
        3: set([]),
        4: set([]),
    }
    min_length = 2
    max_length = 4
    with open(data_assets_dir + "JMdict.xml") as jmdict_raw:
        for line in jmdict_raw:
            headword_with_kanji = re.search("(?<=<keb>).*?(?=</keb>)", line)
            if headword_with_kanji:
                headword_string = headword_with_kanji[0][:max_length]
                if not validate_word(headword_string, min_length, max_length):
                    continue
                words[len(headword_string)].add(headword_string)

    write_js_json(words, "words_list")

parse_kanjidic_data()
pack_info_files()
generate_word_list()
