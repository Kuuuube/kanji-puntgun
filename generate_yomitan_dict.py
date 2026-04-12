import json
import os
import datetime
import zipfile

import asset_builder


kanji_data_json = json.loads(open(asset_builder.generated_assets_dir + "kanji_data.json").read())

tags = [
    {
        "key": "radical",
        "name": "Radical",
    },
    {
        "key": "components",
        "name": "Components",
    },
    {
        "key": "four_corner",
        "name": "Four Corner",
    },
    {
        "key": "skip",
        "name": "SKIP Code",
    },
    {
        "key": "deroo",
        "name": "De Roo",
    },
    {
        "key": "voyager",
        "name": "Voyager",
    },
    {
        "key": "stroke_count",
        "name": "Stroke Count",
    },
    {
        "key": "cjkvi_components",
        "name": "Decomposition",
    },
    {
        "key": "cjkvi_components_recursive",
        "name": "Decomposition Extras",
    },
    {
        "key": "cjkvi_constructions",
        "name": "Construction",
    },
    {
        "key": "cjkvi_raw_constructions",
        "name": "Raw Construction",
    },
]

output_kanji_bank = []
output_tag_bank = [[x["key"], "class", i, x["name"], 0] for i, x in enumerate(tags)]

for kanji, kanji_values in kanji_data_json.items():
    output_kanji_bank_entry = [
        kanji,
        "",
        "",
        "",
        [],
        {
            "stroke_count": str(kanji_values["stroke_count"]) if "stroke_count" in kanji_values else "",
            "components": "".join(kanji_values["components"]) if "components" in kanji_values else "",
            "cjkvi_components": "".join(kanji_values["cjkvi_components"]) if "cjkvi_components" in kanji_values else "",
            "cjkvi_components_recursive": "".join(kanji_values["cjkvi_components_recursive"]) if "cjkvi_components_recursive" in kanji_values else "",
            "deroo": "".join(kanji_values["deroo"].values()) if "deroo" in kanji_values else "",
            "four_corner": "".join(kanji_values["four_corner"].values()) if "four_corner" in kanji_values else "",
            "skip": "".join(list(map(str, kanji_values["skip"].values()))) if "skip" in kanji_values else "",
            "radical": str(kanji_values["radical"]["id"]) + "(" + "".join([element["character"] + ")" for element in kanji_values["radical"]["characters"]]) if "radical" in kanji_values else "",
            "voyager": ", ".join(map(str, kanji_values["voyager"]["regions"])) + " : " + ", ".join(map(str, kanji_values["voyager"]["components"])) if "voyager" in kanji_values else "",
            "cjkvi_constructions": ", ".join(kanji_values["cjkvi_constructions"]) if "cjkvi_constructions" in kanji_values else "",
            "cjkvi_raw_constructions": ", ".join(kanji_values["cjkvi_raw_constructions"]) if "cjkvi_raw_constructions" in kanji_values else ""
        }
    ]

    output_kanji_bank.append(output_kanji_bank_entry)

with zipfile.ZipFile("./yomitan/kanji_puntgun_dict.zip", "w") as dict_zip:
    index_file = open("./yomitan/index_template.json").read().replace("{{date}}", datetime.date.today().strftime("%Y-%m-%d"))
    dict_zip.writestr("index.json", index_file)

    kanji_bank = json.dumps(output_kanji_bank, ensure_ascii = False, indent = 4)
    dict_zip.writestr("kanji_bank_1.json", kanji_bank)

    tag_bank = json.dumps(output_tag_bank, ensure_ascii = False, indent = 4)
    dict_zip.writestr("tag_bank_1.json", tag_bank)
