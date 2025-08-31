const DEFAULTS = {
    radical: -1,
    components: [],
    four_corners: {top_left: -1, top_right: -1, bottom_left: -1, bottom_right: -1, extra: -1},
    skip: {part_one: -1, part_two: 0, part_two_deviation: 0, part_three: 0, part_three_deviation: 0},
    word_parts: {"1": "", "2": "", "3": "", "4": ""},
    stroke_count: {greater: 0, equal: 0, less: 0},
}
const KANJI_RESULTS_LIMIT = 250;

let selected_radical = structuredClone(DEFAULTS.radical);
let selected_components = structuredClone(DEFAULTS.components);
let selected_four_corners = structuredClone(DEFAULTS.four_corners);
let selected_skip = structuredClone(DEFAULTS.skip);
let word_parts = structuredClone(DEFAULTS.word_parts);
let stroke_count_filter = structuredClone(DEFAULTS.stroke_count);

function prevent_double_triple_click_select(e) {
    if (e.detail > 1 && e.button === 0) {
        e.preventDefault();
    }
}

function get_class_includes(class_list, includes_string, default_result) {
    for (const class_item of class_list) {
        if (class_item.includes(includes_string)) {
            return class_item.replace(includes_string, "");
        }
    }
    return default_result;
}

function prepare_components_selection() {
    const components_selection = document.querySelector("#components-selection");

    let current_stroke_count = 0;
    let components_selection_innerHTML_string = "";
    let component_characters = COMPONENTS_INFO;
    component_characters.sort((a, b) => a.stroke_count - b.stroke_count);
    for (const component_character of component_characters) {
        if (component_character.stroke_count !== current_stroke_count) {
            current_stroke_count = component_character.stroke_count;
            if (component_character.stroke_count !== 0) {
                components_selection_innerHTML_string += "</div><div id=\"component-count-" + current_stroke_count + "\"><span class=\"stroke-count table-item\">" + current_stroke_count + "</span>";
            }
        }
        components_selection_innerHTML_string += "<span class=\"table-item\">" + component_character.component + "</span>";
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
    let radical_characters = RADICALS_INFO;
    radical_characters.sort((a, b) => a.stroke_count - b.stroke_count);

    for (const radical_character of RADICALS_INFO) {
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

        let radical = Number(get_class_includes(e.target.classList, "radical-id-", -1));
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
            let corner_selection = get_class_includes(e.target.classList, "four-corner-id-", -1);
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
            let skip_part_one_selection = Number(get_class_includes(e.target.classList, "skip-part-1-val-", -1));
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
    const stroke_count_input_equals = document.querySelector("#stroke-count-input-equals");
    const stroke_count_input_greater = document.querySelector("#stroke-count-input-greater");
    const stroke_count_input_less = document.querySelector("#stroke-count-input-less");
    stroke_count_input_equals.addEventListener("change", (e) => {
        if (e.target.value.length === 0) {
            stroke_count_filter.equal = 0;
        } else {
            stroke_count_filter.equal = Number(e.target.value);
        }
        find_possible_kanji();
    });
    stroke_count_input_greater.addEventListener("change", (e) => {
        if (e.target.value.length === 0) {
            stroke_count_filter.greater = 0;
        } else {
            stroke_count_filter.greater = Number(e.target.value);
        }
        find_possible_kanji();
    });
    stroke_count_input_less.addEventListener("change", (e) => {
        if (e.target.value.length === 0) {
            stroke_count_filter.less = 0;
        } else {
            stroke_count_filter.less = Number(e.target.value);
        }
        find_possible_kanji();
    });
}

function find_possible_kanji() {
    let possible_kanji = [];

    function check_selected_radical(test_radical) {
        if (selected_radical === -1) { return true; }
        return test_radical === selected_radical;
    }

    function check_selected_components(test_components) {
        if (selected_components.length > 0 && !test_components) { return false; }
        for (let i = 0; i < selected_components.length; i++) {
            if (!test_components.includes(selected_components[i])) {
                return false;
            }
        }
        return true;
    }

    function check_selected_four_corner(test_four_corner) {
        for (const [corner, shape] of Object.entries(selected_four_corners)) {
            if (shape === -1) { continue; }
            if (!test_four_corner || test_four_corner[corner] !== shape) {
                return false;
            }
        }
        return true;
    }

    function check_selected_skip(test_skip) {
        if (selected_skip.part_one !== -1) {
            if (test_skip.part_one !== selected_skip.part_one) { return false; }
            if (selected_skip.part_two > 0 && (test_skip.part_two > selected_skip.part_two + selected_skip.part_two_deviation || test_skip.part_two < selected_skip.part_two - selected_skip.part_two_deviation)) { return false; }
            if (selected_skip.part_three > 0 && (test_skip.part_three > selected_skip.part_three + selected_skip.part_three_deviation || test_skip.part_three < selected_skip.part_three - selected_skip.part_three_deviation)) { return false; }
        }
        return true;
    }

    function check_stroke_count(test_stroke_count) {
        if (stroke_count_filter.equal + stroke_count_filter.greater + stroke_count_filter.less > 0) {
            if ((stroke_count_filter.equal > 0 && test_stroke_count !== stroke_count_filter.equal) ||
                (stroke_count_filter.greater > 0 && test_stroke_count <= stroke_count_filter.greater) ||
                (stroke_count_filter.less > 0 && test_stroke_count >= stroke_count_filter.less)) {
                return false;
            }
        }
        return true;
    }

    for (const [kanji, kanji_values] of Object.entries(KANJI_DATA)) {
        if (!check_selected_radical(kanji_values.radical.id)) { continue; }
        if (!check_selected_components(kanji_values.components)) { continue; }
        if (!check_selected_four_corner(kanji_values.four_corner)) { continue; }
        if (!check_selected_skip(kanji_values.skip)) { continue; }
        if (!check_stroke_count(kanji_values.stroke_count)) { continue; }

        possible_kanji.push(kanji);
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

    possible_kanji.sort((a, b) => KANJI_DATA[a].stroke_count - KANJI_DATA[b].stroke_count);

    const result_item_class = "table-item";
    document.querySelector("#kanji-results").innerHTML = possible_kanji.length ? "<span class=\"" + result_item_class + "\">" + possible_kanji.slice(0, KANJI_RESULTS_LIMIT).join("</span><span class=\"" + result_item_class + "\">") + "</span>" : "<span class=\"" + result_item_class + "\">&nbsp;</span>";
}

function prepare_jisho_search() {
    document.querySelector("#header-input").addEventListener("input", () => {
        populate_jisho_search();
    });
}

function populate_jisho_search() {
    const jisho_search = document.querySelector("#jisho-search");
    const header_input = document.querySelector("#header-input");
    jisho_search.href = "https://jisho.org/search/" + header_input.value;
}

function prepare_header_results_selector() {
    const kanji_results = document.querySelector("#kanji-results");
    const header_input = document.querySelector("#header-input");
    kanji_results.addEventListener("click", (e) => {
        if (e.target.textContent.length > 1) { return; }
        header_input.value += e.target.textContent;

        e.target.classList.add("clicked");
        setTimeout(() => {
            e.target.classList.remove("clicked");
        }, 100);

        populate_jisho_search();
        document.querySelector("#header-input-mirror").innerHTML = header_input.value;
    });
    header_input.addEventListener("input", (e) => {
        kana_ime_on_search(header_input, e);
        populate_jisho_search();
        document.querySelector("#header-input-mirror").innerHTML = header_input.value.length ? header_input.value : "&nbsp;";
    });
}

function prepare_no_select() {
    const no_select_elements = document.querySelectorAll(".no-click-select");
    for (const no_select_element of no_select_elements) {
        no_select_element.addEventListener("mousedown", prevent_double_triple_click_select);
    }
}

function deselect_table_items(parent_element) {
    for (const table_item of parent_element.querySelectorAll(".table-item")) {
        table_item.classList.remove("selected");
    }
}

function prepare_reset_buttons() {
    function reset_radicals(find = true) {
        selected_radical = structuredClone(DEFAULTS.radical);
        deselect_table_items(document.querySelector("#radicals-container"));
        if (find) { find_possible_kanji(); }
    }
    document.querySelector("#radicals-reset").addEventListener("click", reset_radicals);

    function reset_components(find = true) {
        selected_components = structuredClone(DEFAULTS.components);
        deselect_table_items(document.querySelector("#components-container"));
        if (find) { find_possible_kanji() };
    }
    document.querySelector("#components-reset").addEventListener("click", reset_components);

    function reset_four_corner(find = true) {
        selected_four_corners = structuredClone(DEFAULTS.four_corners);
        deselect_table_items(document.querySelector("#four-corner-container"));
        if (find) { find_possible_kanji() };
    }
    document.querySelector("#four-corner-reset").addEventListener("click", reset_four_corner);

    function reset_skip(find = true) {
        selected_skip = structuredClone(DEFAULTS.skip);
        deselect_table_items(document.querySelector("#skip-container"));
        document.querySelector("#skip-part-2-input").value = 0;
        document.querySelector("#skip-part-2-input-deviation").value = 0;
        document.querySelector("#skip-part-3-input").value = 0;
        document.querySelector("#skip-part-3-input-deviation").value = 0;
        if (find) { find_possible_kanji() };
    }
    document.querySelector("#skip-reset").addEventListener("click", reset_skip);

    function reset_partial_word(find = true) {
        word_parts = structuredClone(DEFAULTS.word_parts);
        document.querySelector("#word-part-1").value = "";
        document.querySelector("#word-part-2").value = "";
        document.querySelector("#word-part-3").value = "";
        document.querySelector("#word-part-4").value = "";
        if (find) { find_possible_kanji() };
    }
    document.querySelector("#partial-word-reset").addEventListener("click", reset_partial_word);

    function reset_stroke_count(find = true) {
        stroke_count_filter = structuredClone(DEFAULTS.stroke_count);
        document.querySelector("#stroke-count-input-equals").value = 0;
        document.querySelector("#stroke-count-input-greater").value = 0;
        document.querySelector("#stroke-count-input-less").value = 0;
        if (find) { find_possible_kanji() };
    }
    document.querySelector("#stroke-count-reset").addEventListener("click", reset_stroke_count);

    function reset_all() {
        reset_radicals(false);
        reset_components(false);
        reset_four_corner(false);
        reset_skip(false);
        reset_partial_word(false);
        reset_stroke_count(false);
        find_possible_kanji();
    }
    document.querySelector("#reset-all").addEventListener("click", reset_all);
}

prepare_radicals_selection();
prepare_components_selection();
prepare_four_corners_selection();
prepare_skip_selection();
prepare_partial_word();
prepare_stroke_count();
prepare_jisho_search();
prepare_header_results_selector();
prepare_no_select();
prepare_reset_buttons();
find_possible_kanji();
