let selected_radical = -1;
let selected_components = [];
let selected_four_corners = {top_left: -1, top_right: -1, bottom_left: -1, bottom_right: -1, extra: -1};
let selected_skip = {part_one: -1, part_two: 0, part_two_deviation: 0, part_three: 0, part_three_deviation: 0};
let word_parts = {"1": "", "2": "", "3": "", "4": ""};
let stroke_count_filter = 0;
const ALL_KANJI = get_all_kanji();

function get_all_kanji() {
    let all_kanji = new Set([]);
    for (const component_value of Object.values(COMPONENTS)) {
        component_value.kanji.forEach(x => all_kanji.add(x));
    }
    for (const corner of Object.values(FOUR_CORNER)) {
        for (const shape of Object.values(corner)) {
            shape.forEach(x => all_kanji.add(x));
        }
    }
    for (const radical_value of Object.values(RADICALS)) {
        radical_value.kanji.forEach(x => all_kanji.add(x));
    }
    let all_kanji_array = Array.from(all_kanji)
    all_kanji_array.sort((a, b) => KANJI_STROKE_COUNTS[a] - KANJI_STROKE_COUNTS[b]);
    return all_kanji_array;
}

function prepare_components_selection() {
    const components_selection = document.querySelector("#components-selection");

    let current_stroke_count = 0;
    let components_selection_innerHTML_string = "";
    for (const [component, data] of Object.entries(COMPONENTS)) {
        if (data.stroke_count !== current_stroke_count) {
            current_stroke_count = data.stroke_count;
            if (data.stroke_count !== 0) {
                components_selection_innerHTML_string += "</div><div id=\"component-count-" + current_stroke_count + "\"><span class=\"stroke-count table-item\">" + current_stroke_count + "</span>";
            }
        }
        components_selection_innerHTML_string += "<span class=\"table-item\">" + component + "</span>";
    }
    components_selection_innerHTML_string += "</span>"
    components_selection.innerHTML = components_selection_innerHTML_string;

    components_selection.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();

        const component = e.target.textContent;
        if (component.length > 1) { return; }
        if (selected_components.indexOf(component) == -1) {
            selected_components.push(component);
            e.target.classList.add("selected");
        } else {
            selected_components.splice(selected_components.indexOf(component), 1);
            e.target.classList.remove("selected");
        }

        find_possible_kanji();
    });
}

function prepare_radicals_selection() {
    const radicals_selection = document.querySelector("#radicals-selection");

    let current_stroke_count = 0;
    let radicals_selection_innerHTML_string = "";
    let radical_characters = [];
    for (const [radical_id, data] of Object.entries(RADICALS)) {
        for (const radical_character of data.radical_characters) {
            radical_characters.push({character: radical_character.character, radical_id: radical_id, stroke_count: radical_character.stroke_count});
        }
    }
    radical_characters.sort((a, b) => a.stroke_count - b.stroke_count);

    for (const radical_character of radical_characters) {
        if (radical_character.stroke_count !== current_stroke_count) {
            current_stroke_count = radical_character.stroke_count;
            if (radical_character.stroke_count !== 0) {
                radicals_selection_innerHTML_string += "</div><div id=\"radical-count-" + current_stroke_count + "\"><span class=\"stroke-count table-item\">" + current_stroke_count + "</span>";
            }
        }
        radicals_selection_innerHTML_string += "<span class=\"table-item radical-id-" + radical_character.radical_id + "\">" + radical_character.character + "</span>";
    }
    radicals_selection_innerHTML_string += "</span>"
    radicals_selection.innerHTML = radicals_selection_innerHTML_string;

    radicals_selection.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();

        let radical = -1;
        for (const classItem of e.target.classList) {
            if (classItem.includes("radical-id-")) {
                radical = classItem.replace("radical-id-", "");
            }
        }
        if (radical === -1) { return; }
        if (selected_radical === radical) {
            selected_radical = -1;
        } else {
            selected_radical = radical;
        }
        for (const radical_selection of e.target.parentNode.parentNode.children) {
            for (const radical_selection_child of radical_selection.children) {
                radical_selection_child.classList.remove("selected");
                if (selected_radical === -1) { continue; }
                for (const classItem of radical_selection_child.classList) {
                    if (classItem === "radical-id-" + radical) {
                        radical_selection_child.classList.add("selected");
                    }
                }
            }
        }
        find_possible_kanji();
    });
}

function prepare_four_corners_selection() {
    const four_corners_ids = ["four-corners-top-left", "four-corners-top-right", "four-corners-bottom-left", "four-corners-bottom-right", "four-corners-extra"];
    for (let i = 0; i < four_corners_ids.length; i++) {
        const four_corners_element = document.querySelector("#" + four_corners_ids[i]);
        for (let j = 0; j < 10; j++) {
            four_corners_element.innerHTML += "<span class=\"table-item four-corner-id-" + j + "\">" + FOUR_CORNER_INFO[j].character + "</span>";
        }
        four_corners_element.addEventListener("click", (e) => {
            let corner_selection = -1;
            for (const classItem of e.target.classList) {
                if (classItem.includes("four-corner-id-")) {
                    corner_selection = classItem.replace("four-corner-id-", "");
                }
            }
            if (corner_selection === -1) { return; }
            for (const corner_selector of e.target.parentNode.children) {
                corner_selector.classList.remove("selected");
            }
            const corner_name = Object.keys(selected_four_corners)[i];
            if (selected_four_corners[corner_name] === corner_selection) {
                selected_four_corners[corner_name] = -1;
            } else {
                selected_four_corners[corner_name] = corner_selection;
                e.target.classList.add("selected");
            }

            find_possible_kanji();
        });
    }
}

function prepare_skip_selection() {
    const skip_part_one_element = document.querySelector("#skip-part-1");
    for (const skip_part_one_child of skip_part_one_element.children) {
        skip_part_one_child.addEventListener("click", (e) => {
            for (const target_siblings of e.target.parentNode.children) {
                target_siblings.classList.remove("selected");
            }
            let skip_part_one_selection = -1;
            for (const classItem of e.target.classList) {
                if (classItem.includes("skip-part-1-val-")) {
                    skip_part_one_selection = classItem.replace("skip-part-1-val-", "");
                }
            }
            if (selected_skip.part_one === skip_part_one_selection) {
                skip_part_one_selection = -1;
            } else {
                e.target.classList.add("selected");
            }
            selected_skip.part_one = skip_part_one_selection;

            find_possible_kanji();
        });
    }
    const skip_part_two_input = document.querySelector("#skip-part-2-input");
    const skip_part_two_deviation_input = document.querySelector("#skip-part-2-input-deviation");
    skip_part_two_input.addEventListener("change", (e) => {selected_skip.part_two = Number(e.target.value); find_possible_kanji();});
    skip_part_two_deviation_input.addEventListener("change", (e) => {selected_skip.part_two_deviation = Number(e.target.value); find_possible_kanji();});

    const skip_part_three_input = document.querySelector("#skip-part-3-input");
    const skip_part_three_deviation_input = document.querySelector("#skip-part-3-input-deviation");
    skip_part_three_input.addEventListener("change", (e) => {selected_skip.part_three = Number(e.target.value); find_possible_kanji();});
    skip_part_three_deviation_input.addEventListener("change", (e) => {selected_skip.part_three_deviation = Number(e.target.value); find_possible_kanji();});
}

function prepare_partial_word() {
    const word_part_ids = ["word-part-1", "word-part-2", "word-part-3", "word-part-4"]
    for (const word_part_id of word_part_ids) {
        const word_part_input = document.querySelector("#" + word_part_id);
        word_part_input.addEventListener("input", (e) => {
            kana_ime_on_search(word_part_input, e);
        });
        word_part_input.addEventListener("change", (e) => {
            const value = e.target.value;
            if (value.length !== 1) {
                word_parts[word_part_id.replace("word-part-", "")] = "";
            } else {
                word_parts[word_part_id.replace("word-part-", "")] = value;
            }
            find_possible_kanji();
        });
    }
}

function prepare_stroke_count() {
    const stroke_count_input = document.querySelector("#stroke-count-input");
    stroke_count_input.addEventListener("change", (e) => {
        if (e.target.value.length === 0) {
            stroke_count_filter = 0;
        } else {
            stroke_count_filter = Number(e.target.value);
        }
        find_possible_kanji();
    });
}

function find_possible_kanji() {
    let possible_kanji = ALL_KANJI;

    for (let i = 0; i < selected_components.length; i++) {
        possible_kanji = possible_kanji.filter((x) => COMPONENTS[selected_components[i]]["kanji"].includes(x))
    }

    for (const [corner, shape] of Object.entries(selected_four_corners)) {
        if (shape === -1) { continue; }
        possible_kanji = possible_kanji.filter((x) => FOUR_CORNER[corner][shape].includes(x))
    }

    if (selected_radical !== -1) {
        possible_kanji = possible_kanji.filter((x) => RADICALS[selected_radical]["kanji"].includes(x));
    }

    if (selected_skip.part_one !== -1) {
        possible_kanji = possible_kanji.filter((x) => SKIP.part_one[selected_skip.part_one].includes(x));
        if (selected_skip.part_two > 0) {
            let part_two_filter = [];
            for (const [part_two_skip_number, kanji_array] of Object.entries(SKIP.part_two)) {
                if (selected_skip.part_two + selected_skip.part_two_deviation >= Number(part_two_skip_number) && selected_skip.part_two - selected_skip.part_two_deviation <= Number(part_two_skip_number)) {
                    part_two_filter = part_two_filter.concat(kanji_array);
                }
            }
            possible_kanji = possible_kanji.filter((x) => part_two_filter.includes(x));
        }
        if (selected_skip.part_three > 0) {
            let part_three_filter = [];
            for (const [part_three_skip_number, kanji_array] of Object.entries(SKIP.part_three)) {
                if (selected_skip.part_three + selected_skip.part_three_deviation >= Number(part_three_skip_number) && selected_skip.part_three - selected_skip.part_three_deviation <= Number(part_three_skip_number)) {
                    part_three_filter = part_three_filter.concat(kanji_array);
                }
            }
            possible_kanji = possible_kanji.filter((x) => part_three_filter.includes(x));
        }
    }

    if (Object.values(word_parts).join("").length > 0) {
        let word_parts_kanji = new Set([]);
        let word_lengths = ["2", "3", "4"];
        if (word_parts["4"].length > 0) { word_lengths = ["4"] }
        if (word_parts["3"].length > 0) { word_lengths = ["3", "4"] }
        const word_parts_values = Object.values(word_parts);
        for (const word_length of word_lengths) {
            for (const word of WORDS_LIST[word_length]) {
                const word_indexable = [...word];
                let matched = true;
                for (let i = 0; i < word_parts_values.length; i++) {
                    const word_part_value = word_parts_values[i];
                    if (word_part_value.length !== 1) { continue; }
                    if (word_indexable[i] !== word_part_value) {
                        matched = false;
                        break;
                    }
                }
                if (matched) {
                    word_indexable.forEach(x => word_parts_kanji.add(x));
                }
            }
        }
        possible_kanji = possible_kanji.filter((x) => word_parts_kanji.has(x));
    }

    if (stroke_count_filter > 0) {
        let matching_stroke_counts = [];
        for (const [kanji, stroke_count] of Object.entries(KANJI_STROKE_COUNTS)) {
            if (stroke_count === stroke_count_filter) {
                matching_stroke_counts.push(kanji);
            }
        }
        possible_kanji = possible_kanji.filter((x) => matching_stroke_counts.includes(x));
    }

    const result_item_class = "table-item";
    document.querySelector("#kanji-results").innerHTML = possible_kanji.length ? "<span class=\"" + result_item_class + "\">" + possible_kanji.join("</span><span class=\"" + result_item_class + "\">") + "</span>" : "&nbsp;";
}

function prepare_jisho_search() {
    const jisho_search = document.querySelector("#jisho-search");
    document.querySelector("#header-input").addEventListener("input", (e) => {
        jisho_search.href = "https://jisho.org/search/" + e.target.value
    });
}

function prepare_header_results_selector() {
    const kanji_results = document.querySelector("#kanji-results");
    const header_input = document.querySelector("#header-input");
    kanji_results.addEventListener("click", (e) => {
        if (e.target.textContent.length > 1) { return; }
        header_input.value += e.target.textContent;
    });
}

prepare_radicals_selection();
prepare_components_selection();
prepare_four_corners_selection();
prepare_skip_selection();
prepare_partial_word();
prepare_stroke_count();
prepare_jisho_search();
prepare_header_results_selector();
find_possible_kanji();
