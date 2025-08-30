import json
import re
import os

assets_dir = "./assets/"
data_assets_dir = assets_dir + "data/"
generated_assets_dir = assets_dir + "generated/"
static_assets_dir = assets_dir + "static_data/"

def write_js_json(json_object, name):
    os.makedirs(generated_assets_dir, exist_ok = True)
    json_string = json.dumps(json_object, ensure_ascii = False, indent = 4)
    with open(generated_assets_dir + name + ".json", "w", encoding = "utf8") as components_json:
        components_json.write(json_string)
    with open(generated_assets_dir + name + ".js", "w", encoding = "utf8") as components_js:
        components_js.write("const " + name.upper() + " = " + json_string)

def generate_components_file():
    kanji_stroke_counts = generate_kanjidic_stroke_count()
    radkfile_lines = list(map(str.strip, open(data_assets_dir + "radkfilex", "r", encoding = "euc_jisx0213").readlines()))

    header = ""
    components_dict = {}
    for radkfile_line in radkfile_lines:
        if len(radkfile_line) <= 0 or radkfile_line[0] == "#":
            continue
        if radkfile_line[0] == "$":
            header = radkfile_line.split()[1]
            components_dict[header] = {"kanji": [], "stroke_count": radkfile_line.split()[2]}
            continue

        components_dict[header]["kanji"] += list(radkfile_line)
        components_dict[header]["kanji"].sort(key = lambda x: kanji_stroke_counts[x])

    write_js_json(components_dict, "components")

def generate_kanjidic_stroke_count():
    kanji_stroke_counts = {}

    kanjidic = open(data_assets_dir + "kanjidic2.xml").read().replace("\n", "").replace("\r", "")
    for character_data in re.findall("<character>.*?</character>", kanjidic):
        character = re.search(r"(?<=<literal>).*?(?=</literal>)", character_data)
        stroke_count = re.search(r"(?<=<stroke_count>)\d+(?=</stroke_count>)", character_data)

        if character and stroke_count:
            kanji_stroke_counts[character[0]] = int(stroke_count[0])

    write_js_json(kanji_stroke_counts, "kanji_stroke_counts")
    return kanji_stroke_counts

def generate_four_corner_file():
    four_corner_codes_dict = {
        "top_left": {"0": [], "1": [], "2": [], "3": [], "4": [], "5": [], "6": [], "7": [], "8": [], "9": []},
        "top_right": {"0": [], "1": [], "2": [], "3": [], "4": [], "5": [], "6": [], "7": [], "8": [], "9": []},
        "bottom_left": {"0": [], "1": [], "2": [], "3": [], "4": [], "5": [], "6": [], "7": [], "8": [], "9": []},
        "bottom_right": {"0": [], "1": [], "2": [], "3": [], "4": [], "5": [], "6": [], "7": [], "8": [], "9": []},
        "extra": {"0": [], "1": [], "2": [], "3": [], "4": [], "5": [], "6": [], "7": [], "8": [], "9": []},
    }

    kanjidic = open(data_assets_dir + "kanjidic2.xml").read().replace("\n", "").replace("\r", "")
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

    write_js_json(four_corner_codes_dict, "four_corner")

    with open(generated_assets_dir + "four_corner.js", "a") as four_corner_js_output:
        four_corner_js_output.write("\n")
        four_corner_js_output.write("const FOUR_CORNER_INFO = ")
        four_corner_js_output.write(open(static_assets_dir + "four_corner_info.json").read())

def generate_radicals_file():
    radicals_dict = {}

    radicals_info = json.loads(open(static_assets_dir + "radicals_info.json").read())
    for radical_info in radicals_info:
        radical_id = radical_info["radical_id"]
        if radical_id not in radicals_dict.keys():
            radicals_dict[radical_info["radical_id"]] = {
                "kanji": [], "radical_characters": [
                    {
                        "character": radical_info["character"], "stroke_count": radical_info["stroke_count"]
                    }
                ]
            }
        else:
            radicals_dict[radical_info["radical_id"]]["radical_characters"].append({"character": radical_info["character"], "stroke_count": radical_info["stroke_count"]})

    kanjidic = open(data_assets_dir + "kanjidic2.xml").read().replace("\n", "").replace("\r", "")
    for character_data in re.findall("<character>.*?</character>", kanjidic):
        character = re.search(r"(?<=<literal>).*?(?=</literal>)", character_data)[0]
        radical = re.search(r"(?<=<rad_value rad_type=\"classical\">).*?(?=</rad_value>)", character_data)
        if radical:
            radical_id = int(radical[0])
            radicals_dict[radical_id]["kanji"].append(character)

    write_js_json(radicals_dict, "radicals")

generate_radicals_file()
generate_components_file()
generate_four_corner_file()
