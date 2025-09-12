import json
import re
import os
import unicodedata
import copy

assets_dir = "./assets/"
data_assets_dir = assets_dir + "data/"
generated_assets_dir = assets_dir + "generated/"
static_assets_dir = assets_dir + "static_data/"

dataset_info = {
    "totals": {
        "count": 0,
        "jouyou_count": 0,
        "jinmeiyou_count": 0,
    },
    "radical": {
        "count": 0,
        "jouyou_count": 0,
        "jinmeiyou_count": 0,
    },
    "components": {
        "count": 0,
        "jouyou_count": 0,
        "jinmeiyou_count": 0,
    },
    "four_corner": {
        "count": 0,
        "jouyou_count": 0,
        "jinmeiyou_count": 0,
    },
    "skip": {
        "count": 0,
        "jouyou_count": 0,
        "jinmeiyou_count": 0,
    },
    "stroke_count": {
        "count": 0,
        "jouyou_count": 0,
        "jinmeiyou_count": 0,
    },
    "cjkvi_components": {
        "count": 0,
        "jouyou_count": 0,
        "jinmeiyou_count": 0,
    },
    "deroo": {
        "count": 0,
        "jouyou_count": 0,
        "jinmeiyou_count": 0,
    },
    "frequency": {
        "count": 0,
        "jouyou_count": 0,
        "jinmeiyou_count": 0,
    },
    "words_list_length": 0,
}

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
    components_info = json.loads(open(static_assets_dir + "components_info.json").read())
    components_info_dict = {}
    for component in components_info:
        components_info_dict[component["component"]] = component

    header = ""
    components_dict = {}
    components_list = []
    for radkfile_line in radkfile_lines:
        if len(radkfile_line) <= 0 or radkfile_line[0] == "#":
            continue
        if radkfile_line[0] == "$":
            line_header = radkfile_line.split()[1]
            header = components_info_dict[line_header]["display_component"]

            stroke_count = radkfile_line.split()[2]
            components_dict[header] = {"kanji": [], "stroke_count": stroke_count}
            components_list.append({"component": header, "stroke_count": stroke_count})
            continue

        components_dict[header]["kanji"] += list(radkfile_line)
        components_dict[header]["kanji"].sort(key = lambda x: kanji_stroke_counts[x])

    if len(components_list) != len(components_info):
        print("Components list and info mismatch")
    write_js_json(components_list, "components_list")

    return components_dict

cjkvi_components_info = []

def recursive_cjkvi_parts_parser(cjkvi_dict, composition_parts):
    parts_collector = set([])
    for part in composition_parts:
        if part in parts_collector:
            continue
        if len(cjkvi_dict[part]["composition_parts"]) <= 1:
            parts_collector.add(part)
            continue
        if part in cjkvi_dict:
            parts_collector.update(recursive_cjkvi_parts_parser(cjkvi_dict, cjkvi_dict[part]["composition_parts"]))

    return parts_collector

def parse_cjkvi():
    unicode_description_characters = "⿰⿱⿲⿳⿴⿵⿶⿷⿸⿹⿺⿻⿼⿽⿾⿿"
    circled_number_characters = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳"

    stroke_counts = parse_ucs_strokes()

    cjkvi_lines = list(map(str.strip, open(static_assets_dir + "CJKVI.txt", "r").readlines()))
    cjkvi_dict = {}

    cjkvi_unique_components = set([])

    for line in cjkvi_lines:
        if line[0] == "#":
            continue
        line_working = line.split("\t", 2)

        unicode_id = line_working[0]
        character = line_working[1]
        compositions = line_working[2].split("\t")

        cjkvi_dict[character] = {
            "unicode": unicode_id,
            "raw_compositions": compositions,
            "composition_parts": dict([]),
            "recursive_composition_parts": dict([]),
        }

        for composition in compositions:
            working_composition = copy.deepcopy(composition)

            tag_regex = re.search(r"(?<=\[).*?(?=\])", composition)
            tag = ""
            if tag_regex:
                tag = tag_regex[0]
                cjkvi_dict[character]["tag"] = tag
            working_composition = re.sub(r"\[.*?\]", "", working_composition)

            composition_parts_only = re.sub("[" + unicode_description_characters + circled_number_characters + "]", "", working_composition)
            for composition_part in composition_parts_only:
                cjkvi_dict[character]["composition_parts"][composition_part] = None

                if composition_part not in cjkvi_unique_components:
                    cjkvi_unique_components.add(composition_part)

    for character, value in cjkvi_dict.items():
        cjkvi_dict[character]["composition_parts"] = list(cjkvi_dict[character]["composition_parts"])
        for recursive_composition_part in recursive_cjkvi_parts_parser(cjkvi_dict, cjkvi_dict[character]["composition_parts"]):
            if recursive_composition_part in cjkvi_dict[character]["composition_parts"]:
                continue
            cjkvi_dict[character]["recursive_composition_parts"][recursive_composition_part] = None

        cjkvi_dict[character]["recursive_composition_parts"] = list(cjkvi_dict[character]["recursive_composition_parts"])

    for unique_component in cjkvi_unique_components:
        cjkvi_components_info.append({
            "component": unique_component,
            "stroke_count": int(stroke_counts[unique_component]),
        })

    cjkvi_components_info.sort(key = lambda x: x["stroke_count"])

    return cjkvi_dict

def parse_ucs_strokes():
    ucs_strokes_lines = list(map(str.strip, open(static_assets_dir + "ucs-strokes.txt", "r").readlines()))
    ucs_strokes_dict = {}

    for line in ucs_strokes_lines:
        line_split = line.split("\t")
        ucs_strokes_dict[line_split[1]] = line_split[2].split(",")[0]

    return ucs_strokes_dict

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
        "cjkvi_components": [],
        "cjkvi_components_recursive": [],
        "deroo": {
            "top": -1,
            "bottom": -1,
        },
        "frequency": -1,
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

    jpdb_frequency_info = json.loads(open(static_assets_dir + "jpdb_frequency_info.json").read())

    cjkvi_data = parse_cjkvi()

    valid_cjkvi_components = set([])

    kanjidic = open(data_assets_dir + "kanjidic2.xml").read().replace("\n", "").replace("\r", "")
    for character_data in re.findall("<character>.*?</character>", kanjidic):
        character = re.search(r"(?<=<literal>).*?(?=</literal>)", character_data)[0]
        stroke_count = re.search(r"(?<=<stroke_count>)\d+(?=</stroke_count>)", character_data)
        four_corner_code = re.search(r"(?<=<q_code qc_type=\"four_corner\">).*?(?=</q_code>)", character_data)
        radical = re.search(r"(?<=<rad_value rad_type=\"classical\">).*?(?=</rad_value>)", character_data)
        skip_code = re.search(r"(?<=<q_code qc_type=\"skip\">).*?(?=</q_code>)", character_data)
        deroo_code = re.search(r"(?<=<q_code qc_type=\"deroo\">).*?(?=</q_code>)", character_data)

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

        if deroo_code:
            deroo_code_string = deroo_code[0]
            kanji_data[character]["deroo"]["bottom"] = deroo_code_string[-2:] # last two chars
            kanji_data[character]["deroo"]["top"] = deroo_code_string[:2] # everything before last two chars
        else:
            del kanji_data[character]["deroo"]

        if character in jpdb_frequency_info:
            kanji_data[character]["frequency"] = jpdb_frequency_info[character]
        else:
            del kanji_data[character]["frequency"]

        if character in cjkvi_data:
            cjkvi_composition = cjkvi_data[character]["composition_parts"]
            kanji_data[character]["cjkvi_components"] = cjkvi_composition
            kanji_data[character]["cjkvi_components_recursive"] = cjkvi_data[character]["recursive_composition_parts"]
            for valid_cjkvi_component in cjkvi_composition:
                valid_cjkvi_components.add(valid_cjkvi_component)
        else:
            del kanji_data[character]["cjkvi_components"]

    components_dict = generate_components_data()
    for component, component_info in components_dict.items():
        for component_kanji in component_info["kanji"]:
            kanji_data[component_kanji]["components"].append(component)

    for kanji in kanji_data:
        if len(kanji_data[kanji]["components"]) == 0:
            del kanji_data[kanji]["components"]

    i = 0
    while i < len(cjkvi_components_info):
        component = cjkvi_components_info[i]["component"]
        if component not in valid_cjkvi_components:
            del cjkvi_components_info[i]
            continue
        i += 1

    write_js_json(kanji_data, "kanji_data")

    kanji_lists = json.loads(open(static_assets_dir + "kanji_lists.json", encoding = "utf8").read())
    for kanji, kanji_info in kanji_data.items():
        for key, value in kanji_info.items():
            if key in ["cjkvi_components_recursive"]:
                continue
            dataset_info[key]["count"] += 1
            if kanji in kanji_lists["jouyou"]:
                dataset_info[key]["jouyou_count"] += 1
            if kanji in kanji_lists["jinmeiyou"]:
                dataset_info[key]["jinmeiyou_count"] += 1

    dataset_info["totals"]["count"] = len(kanji_data)
    dataset_info["totals"]["jouyou_count"] = len(kanji_lists["jouyou"])
    dataset_info["totals"]["jinmeiyou_count"] = len(kanji_lists["jinmeiyou"])

def pack_info_files():
    components_info = open(static_assets_dir + "components_info.json").read()
    four_corner_info = open(static_assets_dir + "four_corner_info.json").read()
    radicals_info = open(static_assets_dir + "radicals_info.json").read()
    dataset_data = json.dumps(dataset_info, indent = 4)
    # cjkvi_components_info_string = json.dumps(cjkvi_components_info, ensure_ascii = False, indent = 4)

    with open(generated_assets_dir + "packed_info.js", "w", encoding = "utf8") as packed_info:
        packed_info.write("const COMPONENTS_INFO = " + components_info + "\n")
        packed_info.write("const FOUR_CORNER_INFO = " + four_corner_info + "\n")
        packed_info.write("const RADICALS_INFO = " + radicals_info + "\n")
        packed_info.write("const DATASET_INFO = " + dataset_data + "\n")
        # packed_info.write("const CJKVI_COMPONENTS_INFO = " + cjkvi_components_info_string + "\n")


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

    for word_set in words.values():
        dataset_info["words_list_length"] += len(word_set)

parse_kanjidic_data()
generate_word_list()
pack_info_files()
