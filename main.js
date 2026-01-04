const DEFAULTS = {
    radical: -1,
    components: [],
    four_corners: {top_left: -1, top_right: -1, bottom_left: -1, bottom_right: -1, extra: -1},
    skip: {part_one: -1, part_two: 0, part_two_deviation: 0, part_three: 0, part_three_deviation: 0},
    deroo: {top: 0, bottom: 0},
    voyager: {region_one: 0, component_one: 0, region_two: 0, component_two: 0},
    word_parts: {"1": "", "2": "", "3": "", "4": ""},
    stroke_count: {greater: 0, equal: 0, less: 0},
    composition_parts: [],
    construction: {match_type: "contains", selected_parts: []},
}
const KANJI_RESULTS_LIMIT = 250;
const MAX_FREQUENCY_VALUE = 5000;

const DISABLED_CLASS = "disabled-item";
const SELECTED_CLASS = "selected";
const DECOMPOSITION_DISABLED_CLASS = "decomposition-already-selected";
const TABLE_ITEM_CLASS = "table-item";

let selected_filters = structuredClone(DEFAULTS);

let full_kanji_results = [];
let kanji_results_ellipsis_char = "⋯";
let kanji_results_index = 0;

let global_valid_cjkvi_components = new Set([]);

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

function get_sorting_value(character) {
    const character_data = KANJI_DATA[character];
    let frequency_decimal = character_data.frequency / (MAX_FREQUENCY_VALUE + 1);
    if (!frequency_decimal) {
        frequency_decimal = 1 - Number.EPSILON;
    }
    return character_data.stroke_count + frequency_decimal;
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
                components_selection_innerHTML_string += "</div><div id=\"component-count-" + current_stroke_count + "\"><span class=\"stroke-count " + TABLE_ITEM_CLASS + "\">" + current_stroke_count + "</span>";
            }
        }
        components_selection_innerHTML_string += "<span class=\"" + TABLE_ITEM_CLASS + " component-align-" + component_character.align + "\">" + component_character.display_component + "</span>";
    }
    components_selection_innerHTML_string += "</span>"
    components_selection.innerHTML = components_selection_innerHTML_string;

    components_selection.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();

        const component = e.target.textContent;
        if ([...component].length > 1) { return; }
        if (selected_filters.components.indexOf(component) == -1) {
            selected_filters.components.push(component);
            e.target.classList.add(SELECTED_CLASS);
        } else {
            selected_filters.components.splice(selected_filters.components.indexOf(component), 1);
            e.target.classList.remove(SELECTED_CLASS);
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
                radicals_selection_innerHTML_string += "</div><div id=\"radical-count-" + current_stroke_count + "\"><span class=\"stroke-count " + TABLE_ITEM_CLASS + "\">" + current_stroke_count + "</span>";
            }
        }
        radicals_selection_innerHTML_string += "<span class=\"" + TABLE_ITEM_CLASS + " radical-id-" + radical_character.radical_id + "\">" + radical_character.character + "</span>";
    }
    radicals_selection_innerHTML_string += "</span>"
    radicals_selection.innerHTML = radicals_selection_innerHTML_string;

    radicals_selection.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();

        let radical = Number(get_class_includes(e.target.classList, "radical-id-", -1));
        if (radical === -1) { return; }
        if (selected_filters.radical === radical) {
            selected_filters.radical = -1;
        } else {
            selected_filters.radical = radical;
        }
        for (const radical_selection of e.target.parentNode.parentNode.children) {
            for (const radical_selection_child of radical_selection.children) {
                radical_selection_child.classList.remove(SELECTED_CLASS);
                if (selected_filters.radical === -1) { continue; }
                for (const classItem of radical_selection_child.classList) {
                    if (classItem === "radical-id-" + radical) {
                        radical_selection_child.classList.add(SELECTED_CLASS);
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
            four_corners_element.innerHTML += "<span class=\"" + TABLE_ITEM_CLASS + " four-corner-id-" + j + "\">" + FOUR_CORNER_INFO[j].character + "</span>";
        }
        four_corners_element.addEventListener("click", (e) => {
            let corner_selection = get_class_includes(e.target.classList, "four-corner-id-", -1);
            if (corner_selection === -1) { return; }
            for (const corner_selector of e.target.parentNode.children) {
                corner_selector.classList.remove(SELECTED_CLASS);
            }
            const corner_name = Object.keys(selected_filters.four_corners)[i];
            if (selected_filters.four_corners[corner_name] === corner_selection) {
                selected_filters.four_corners[corner_name] = -1;
            } else {
                selected_filters.four_corners[corner_name] = corner_selection;
                e.target.classList.add(SELECTED_CLASS);
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
                target_siblings.classList.remove(SELECTED_CLASS);
            }
            let skip_part_one_selection = Number(get_class_includes(e.target.classList, "skip-part-1-val-", -1));
            if (selected_filters.skip.part_one === skip_part_one_selection) {
                skip_part_one_selection = -1;
            } else {
                e.target.classList.add(SELECTED_CLASS);
            }
            selected_filters.skip.part_one = skip_part_one_selection;

            find_possible_kanji();
        });
    }
    const skip_part_two_input = document.querySelector("#skip-part-2-input");
    const skip_part_two_deviation_input = document.querySelector("#skip-part-2-input-deviation");
    skip_part_two_input.addEventListener("change", (e) => {selected_filters.skip.part_two = Number(e.target.value); find_possible_kanji();});
    skip_part_two_deviation_input.addEventListener("change", (e) => {selected_filters.skip.part_two_deviation = Number(e.target.value); find_possible_kanji();});

    const skip_part_three_input = document.querySelector("#skip-part-3-input");
    const skip_part_three_deviation_input = document.querySelector("#skip-part-3-input-deviation");
    skip_part_three_input.addEventListener("change", (e) => {selected_filters.skip.part_three = Number(e.target.value); find_possible_kanji();});
    skip_part_three_deviation_input.addEventListener("change", (e) => {selected_filters.skip.part_three_deviation = Number(e.target.value); find_possible_kanji();});
}

function prepare_deroo_selection() {
    const deroo_container = document.querySelector("#deroo-container");
    const deroo_top_container = document.querySelector("#deroo-top");
    const deroo_bottom_container = document.querySelector("#deroo-bottom");

    let top_html_strings = [];
    for (const row of Object.values(DEROO_SVG_INFO["top"])) {
        let row_html_string = "";
        for (const [deroo_code, svg_string] of Object.entries(row)) {
            row_html_string += "<span class=\"table-item deroo-id-" + deroo_code + "\">" + svg_string + "</span>";
        }
        top_html_strings.push(row_html_string);
    }
    let bottom_html_strings = [];
    for (const row of Object.values(DEROO_SVG_INFO["bottom"])) {
        let row_html_string = "";
        for (const [deroo_code, svg_string] of Object.entries(row)) {
            row_html_string += "<span class=\"table-item deroo-id-" + deroo_code + "\">" + svg_string + "</span>";
        }
        bottom_html_strings.push(row_html_string);
    }
    deroo_bottom_container.innerHTML = bottom_html_strings.join("<span class=\"vertical-separator\"></span>");
    deroo_top_container.innerHTML = top_html_strings.join("<span class=\"vertical-separator\"></span>");

    deroo_container.addEventListener("click", (e) => {
        const deroo_id = get_class_includes(e.target.classList, "deroo-id-", 0);
        if (!deroo_id) { return; }
        for (const target_siblings of e.target.parentNode.children) {
            target_siblings.classList.remove(SELECTED_CLASS);
        }

        if (e.target.parentNode.id == "deroo-top") {
            if (selected_filters.deroo.top == deroo_id) {
                selected_filters.deroo.top = structuredClone(DEFAULTS.deroo.top);
            } else {
                selected_filters.deroo.top = Number(deroo_id);
                e.target.classList.add(SELECTED_CLASS);
            }
        } else if (e.target.parentNode.id == "deroo-bottom") {
            if (selected_filters.deroo.bottom == deroo_id) {
                selected_filters.deroo.bottom = structuredClone(DEFAULTS.deroo.bottom);
            } else {
                selected_filters.deroo.bottom = Number(deroo_id);
                e.target.classList.add(SELECTED_CLASS);
            }
        }

        find_possible_kanji();
    });
}

function prepare_voyager_selection() {
    const voyager_container = document.querySelector("#voyager-container");
    const tier_one_region_selection = document.querySelector("#voyager-tier-one-regions");
    const tier_one_component_selection = document.querySelector("#voyager-tier-one-components");
    const tier_two_region_selection = document.querySelector("#voyager-tier-two-regions");
    const tier_two_component_selection = document.querySelector("#voyager-tier-two-components");

    let region_svg_info_sorted = Object.entries(VOYAGER_SVG_INFO["regions"]);
    region_svg_info_sorted.sort((a, b) => parseFloat(a) > parseFloat(b));

    let region_html_string = "";
    for (const [region_id, region_svg] of region_svg_info_sorted) {
        region_html_string += "<span class=\"table-item icon-wrapper voyager-region-id-" + region_id + "\">" + region_svg + "</span>";
    }

    function get_voyager_components_svgs(region) {
        let components_html_string = "";
        for (const component_id of VOYAGER_REGION_COMPONENTS_INFO[region]) {
            const svg_data = VOYAGER_SVG_INFO["components"][component_id];
            if (!svg_data) { continue; }
            components_html_string += "<span class=\"table-item icon-wrapper voyager-component-id-" + component_id + "\">" + VOYAGER_SVG_INFO["components"][component_id] + "</span>";
        }
        return components_html_string;
    }

    voyager_container.addEventListener("click", (e) => {
        const voyager_region_id = get_class_includes(e.target.classList, "voyager-region-id-", 0);
        if (!voyager_region_id) { return; }
        for (const target_siblings of e.target.parentNode.children) {
            target_siblings.classList.remove(SELECTED_CLASS);
        }

        if (e.target.parentNode.id == "voyager-tier-one-regions") {
            tier_one_component_selection.innerHTML = "";
            selected_filters.voyager.component_one = structuredClone(DEFAULTS.voyager.component_one);
            if (selected_filters.voyager.region_one == voyager_region_id) {
                selected_filters.voyager.region_one = structuredClone(DEFAULTS.voyager.region_one);
            } else {
                selected_filters.voyager.region_one = voyager_region_id;
                e.target.classList.add(SELECTED_CLASS);
                tier_one_component_selection.innerHTML = get_voyager_components_svgs(voyager_region_id);
            }
        } else if (e.target.parentNode.id == "voyager-tier-two-regions") {
            tier_two_component_selection.innerHTML = "";
            selected_filters.voyager.component_two = structuredClone(DEFAULTS.voyager.component_one);
            if (selected_filters.voyager.region_two == voyager_region_id) {
                selected_filters.voyager.region_two = structuredClone(DEFAULTS.voyager.region_two);
            } else {
                selected_filters.voyager.region_two = voyager_region_id;
                e.target.classList.add(SELECTED_CLASS);
                tier_two_component_selection.innerHTML = get_voyager_components_svgs(voyager_region_id);
            }
        }

        find_possible_kanji();
    });

    voyager_container.addEventListener("click", (e) => {
        const voyager_component_id = get_class_includes(e.target.classList, "voyager-component-id-", 0);
        if (!voyager_component_id) { return; }
        for (const target_siblings of e.target.parentNode.children) {
            target_siblings.classList.remove(SELECTED_CLASS);
        }

        if (e.target.parentNode.id == "voyager-tier-one-components") {
            if (selected_filters.voyager.component_one == voyager_component_id) {
                selected_filters.voyager.component_one = structuredClone(DEFAULTS.voyager.component_one);
            } else {
                selected_filters.voyager.component_one = voyager_component_id;
                e.target.classList.add(SELECTED_CLASS);
            }
        } else if (e.target.parentNode.id == "voyager-tier-two-components") {
            if (selected_filters.voyager.component_two == voyager_component_id) {
                selected_filters.voyager.component_two = structuredClone(DEFAULTS.voyager.component_two);
            } else {
                selected_filters.voyager.component_two = voyager_component_id;
                e.target.classList.add(SELECTED_CLASS);
            }
        }

        find_possible_kanji();
    });

    tier_one_region_selection.innerHTML = region_html_string;
    tier_two_region_selection.innerHTML = region_html_string;
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
                selected_filters.word_parts[word_part_id.replace("word-part-", "")] = "";
            } else {
                selected_filters.word_parts[word_part_id.replace("word-part-", "")] = value;
            }

            word_part_input.classList.remove("invalid-input");
            if (value.length > 1) {
                word_part_input.classList.add("invalid-input");
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
            selected_filters.stroke_count.equal = 0;
        } else {
            selected_filters.stroke_count.equal = Number(e.target.value);
        }
        find_possible_kanji();
    });
    stroke_count_input_greater.addEventListener("change", (e) => {
        if (e.target.value.length === 0) {
            selected_filters.stroke_count.greater = 0;
        } else {
            selected_filters.stroke_count.greater = Number(e.target.value);
        }
        find_possible_kanji();
    });
    stroke_count_input_less.addEventListener("change", (e) => {
        if (e.target.value.length === 0) {
            selected_filters.stroke_count.less = 0;
        } else {
            selected_filters.stroke_count.less = Number(e.target.value);
        }
        find_possible_kanji();
    });
}

function prepare_composition() {
    const composition_selection_container = document.querySelector("#composition-selection-container");
    const decomposition_container = document.querySelector("#decomposition-container");
    decomposition_container.addEventListener("click", (e) => {
        const composition_component = e.target.textContent;
        if ([...composition_component].length > 1) { return; }
        if (composition_selection_container.textContent.includes(composition_component)) { return; }

        for (const table_item of decomposition_container.querySelectorAll("." + TABLE_ITEM_CLASS)) {
            if (table_item.textContent === composition_component) {
                table_item.classList.add(DECOMPOSITION_DISABLED_CLASS);
            }
        }
        document.querySelector("#composition-selection-container").innerHTML += "<span class=\"" + TABLE_ITEM_CLASS + " selected\">" + composition_component + "</span>";
        selected_filters.composition_parts.push(composition_component);

        find_possible_kanji();
    });
    composition_selection_container.addEventListener("click", (e) => {
        const composition_component = e.target.textContent;
        if ([...composition_component].length > 1) { return; }
        if (e.target.classList.contains(SELECTED_CLASS)) { e.target.remove(); }
        selected_filters.composition_parts.splice(selected_filters.composition_parts.indexOf(composition_component), 1);
        for (const table_item of decomposition_container.querySelectorAll("." + TABLE_ITEM_CLASS)) {
            if (table_item.textContent === composition_component) {
                table_item.classList.remove(DECOMPOSITION_DISABLED_CLASS);
            }
        }

        find_possible_kanji();
    });
}

function prepare_decomposition() {
    const decomposition_input = document.querySelector("#decomposition-input");
    decomposition_input.addEventListener("input", (e) => {
        const decomposition_targets = [...e.target.value].slice(0, 4); // decompose 4 characters maximum at once
        let decomposition_table = [];
        for (const decomposition_target of decomposition_targets) {
            const cjkvi_components = structuredClone(KANJI_DATA[decomposition_target]?.cjkvi_components ?? []);
            const cjkvi_components_recursive = structuredClone(KANJI_DATA[decomposition_target]?.cjkvi_components_recursive ?? []);
            if (cjkvi_components.length + ORPHANED_COMPONENTS_INFO[decomposition_target]?.cjkvi_components.length === 0) { continue; }

            let decomposition_data = cjkvi_components;
            let decomposition_data_recursive = cjkvi_components_recursive;
            if (ORPHANED_COMPONENTS_INFO[decomposition_target]) {
                decomposition_data = structuredClone(ORPHANED_COMPONENTS_INFO[decomposition_target].cjkvi_components);
                decomposition_data_recursive = structuredClone(ORPHANED_COMPONENTS_INFO[decomposition_target]?.cjkvi_components_recursive ?? []);
            }
            if (!decomposition_data.includes(decomposition_target)) {
                decomposition_data.push(decomposition_target);
            }

            let decomposition_html_string = "<span class=\"flexbox flexbox-vertical flexbox-wrap flexbox-center\">";
            function render_decomposition_row(decomposition_data) {
                let html_string = "<span>";
                for (const decomposition_item of decomposition_data) {
                    let current_item_classes = [TABLE_ITEM_CLASS];
                    if (selected_filters.composition_parts.includes(decomposition_item)) {
                        current_item_classes.push(DECOMPOSITION_DISABLED_CLASS);
                    }
                    if (!global_valid_cjkvi_components.has(decomposition_item)) {
                        current_item_classes.push(DISABLED_CLASS);
                    }
                    html_string += "<span class=\"" + current_item_classes.join(" ") + "\">" + decomposition_item + "</span>"
                }
                return html_string;
            }
            // primary composition items and target kanji itself
            decomposition_html_string += render_decomposition_row(decomposition_data);

            // secondary and further below components
            decomposition_html_string += "</span>";
            decomposition_html_string += render_decomposition_row(decomposition_data_recursive);

            decomposition_html_string += "</span></span>";
            decomposition_table.push(decomposition_html_string);
        }
        document.querySelector("#decomposition-container").innerHTML = decomposition_table.join("<span class=\"vertical-separator\"></span>");
    });
}

function prepare_construction() {
    const construction_match_type_select = document.querySelector("#construction-match-type-select");
    const construction_select_container = document.querySelector("#construction-selection-container");
    const construction_items_container = document.querySelector("#construction-items-container");

    for (const radio_button of construction_match_type_select.querySelectorAll("input[name=\"construction-match-type\"]")) {
        radio_button.addEventListener("change", (e) => {
            selected_filters.construction.match_type = e.target.value;
        });
    }

    let construction_selection_html_string = "";
    for (const [construction_id, construction_svg] of Object.entries(CONSTRUCTION_SVG_INFO)) {
        construction_selection_html_string += "<span class=\"table-item icon-wrapper construction-id-" + construction_id + "\">" + construction_svg + "</span>";
    }
    construction_select_container.innerHTML = construction_selection_html_string;

    construction_select_container.addEventListener("click", (e) => {
        const construction_id = get_class_includes(e.target.classList, "construction-id-", 0);
        if (!construction_id) { return; }
        if ((construction_id === "0" && selected_filters.construction.selected_parts.length > 0) || (selected_filters.construction.selected_parts.length > 0 && selected_filters.construction.selected_parts[0] === "0")) { return; }

        construction_items_container.innerHTML += "<span class=\"table-item icon-wrapper selected construction-id-" + construction_id + "\">" + CONSTRUCTION_SVG_INFO[construction_id] + "</span>";

        selected_filters.construction.selected_parts.push(construction_id);
        find_possible_kanji();
    });

    construction_items_container.addEventListener("click", (e) => {
        const construction_id = get_class_includes(e.target.classList, "construction-id-", 0);
        if (!construction_id) { return; }
        const parent = e.target.parentNode; // must grab parent before removing target
        e.target.remove();
        selected_filters.construction.selected_parts = structuredClone(DEFAULTS.construction.selected_parts);
        for (const target_sibling of parent.children) {
            const sibling_id = get_class_includes(target_sibling.classList, "construction-id-", 0);
            if (sibling_id) {
                selected_filters.construction.selected_parts.push(sibling_id);
            }
        }
    });
}

function gray_out_unavailable(remaining) {
    const radical_selection = document.querySelector("#radicals-selection");
    const radical_table_items = radical_selection.querySelectorAll("." + TABLE_ITEM_CLASS);
    for (const radical_table_item of radical_table_items) {
        if (radical_table_item.classList.contains("stroke-count")) { continue; }
        let radical = Number(get_class_includes(radical_table_item.classList, "radical-id-", -1));
        radical_table_item.classList.remove(DISABLED_CLASS);
        if (!remaining.radicals.has(radical)) {
            radical_table_item.classList.add(DISABLED_CLASS);
        }
    }

    const components_selection = document.querySelector("#components-selection");
    const components_table_items = components_selection.querySelectorAll("." + TABLE_ITEM_CLASS);
    for (const components_table_item of components_table_items) {
        if (components_table_item.classList.contains("stroke-count")) { continue; }
        let component = components_table_item.textContent;
        components_table_item.classList.remove(DISABLED_CLASS);
        if (!remaining.components.has(component)) {
            components_table_item.classList.add(DISABLED_CLASS);
        }
    }

    const four_corners_ids = ["four-corners-top-left", "four-corners-top-right", "four-corners-bottom-left", "four-corners-bottom-right", "four-corners-extra"];
    for (let i = 0; i < four_corners_ids.length; i++) {
        const four_corners_element = document.querySelector("#" + four_corners_ids[i]);
        const current_corner = four_corners_ids[i].replace("four-corners-", "").replace("-", "_");
        const shape_table_items = four_corners_element.querySelectorAll("." + TABLE_ITEM_CLASS);
        for (const shape_table_item of shape_table_items) {
            let four_corner_id = get_class_includes(shape_table_item.classList, "four-corner-id-", -1);
            shape_table_item.classList.remove(DISABLED_CLASS);
            if (!remaining.four_corner[current_corner].has(four_corner_id)) {
                shape_table_item.classList.add(DISABLED_CLASS);
            }
        }
    }

    const skip_part_one = document.querySelector("#skip-part-1");
    const skip_part_one_table_items = skip_part_one.querySelectorAll("." + TABLE_ITEM_CLASS);
    for (const skip_part_one_table_item of skip_part_one_table_items) {
        let skip_part_one_val = Number(get_class_includes(skip_part_one_table_item.classList, "skip-part-1-val-", -1));
        skip_part_one_table_item.classList.remove(DISABLED_CLASS);
        if (!remaining.skip.part_one.has(skip_part_one_val)) {
            skip_part_one_table_item.classList.add(DISABLED_CLASS);
        }
    }

    const deroo_top_container = document.querySelector("#deroo-top");
    const deroo_bottom_container = document.querySelector("#deroo-bottom");
    const deroo_top_container_table_items = deroo_top_container.querySelectorAll("." + TABLE_ITEM_CLASS);
    const deroo_bottom_container_table_items = deroo_bottom_container.querySelectorAll("." + TABLE_ITEM_CLASS);
    for (const deroo_top_container_table_item of deroo_top_container_table_items) {
        let deroo_id = Number(get_class_includes(deroo_top_container_table_item.classList, "deroo-id-", 0));
        deroo_top_container_table_item.classList.remove(DISABLED_CLASS);
        if (!remaining.deroo.top.has(deroo_id)) {
            deroo_top_container_table_item.classList.add(DISABLED_CLASS);
        }
    }
    for (const deroo_bottom_container_table_item of deroo_bottom_container_table_items) {
        let deroo_id = Number(get_class_includes(deroo_bottom_container_table_item.classList, "deroo-id-", 0));
        deroo_bottom_container_table_item.classList.remove(DISABLED_CLASS);
        if (!remaining.deroo.bottom.has(deroo_id)) {
            deroo_bottom_container_table_item.classList.add(DISABLED_CLASS);
        }
    }

    const voyager_tier_one_region_selection = document.querySelector("#voyager-tier-one-regions");
    const voyager_tier_one_component_selection = document.querySelector("#voyager-tier-one-components");
    const voyager_tier_two_region_selection = document.querySelector("#voyager-tier-two-regions");
    const voyager_tier_two_component_selection = document.querySelector("#voyager-tier-two-components");
    const voyager_tier_one_region_table_items = voyager_tier_one_region_selection.querySelectorAll("." + TABLE_ITEM_CLASS);
    const voyager_tier_one_component_table_items = voyager_tier_one_component_selection.querySelectorAll("." + TABLE_ITEM_CLASS);
    const voyager_tier_two_region_table_items = voyager_tier_two_region_selection.querySelectorAll("." + TABLE_ITEM_CLASS);
    const voyager_tier_two_component_table_items = voyager_tier_two_component_selection.querySelectorAll("." + TABLE_ITEM_CLASS);
    for (const voyager_tier_one_region_table_item of voyager_tier_one_region_table_items) {
        const tier_one_region_id = get_class_includes(voyager_tier_one_region_table_item.classList, "voyager-region-id-", 0);
        voyager_tier_one_region_table_item.classList.remove(DISABLED_CLASS);
        if (!remaining.voyager.region_one.has(tier_one_region_id) || selected_filters.voyager.region_two == tier_one_region_id) {
            voyager_tier_one_region_table_item.classList.add(DISABLED_CLASS);
        }
    }
    for (const voyager_tier_two_region_table_item of voyager_tier_two_region_table_items) {
        const tier_two_region_id = get_class_includes(voyager_tier_two_region_table_item.classList, "voyager-region-id-", 0);
        voyager_tier_two_region_table_item.classList.remove(DISABLED_CLASS);
        if (!remaining.voyager.region_two.has(tier_two_region_id) || selected_filters.voyager.region_one == tier_two_region_id) {
            voyager_tier_two_region_table_item.classList.add(DISABLED_CLASS);
        }
    }
    for (const voyager_tier_one_component_table_item of voyager_tier_one_component_table_items) {
        const tier_one_component_id = get_class_includes(voyager_tier_one_component_table_item.classList, "voyager-component-id-", 0);
        voyager_tier_one_component_table_item.classList.remove(DISABLED_CLASS);
        if (!remaining.voyager.component_one.has(tier_one_component_id)) {
            voyager_tier_one_component_table_item.classList.add(DISABLED_CLASS);
        }
    }
    for (const voyager_tier_two_component_table_item of voyager_tier_two_component_table_items) {
        const tier_two_component_id = get_class_includes(voyager_tier_two_component_table_item.classList, "voyager-component-id-", 0);
        voyager_tier_two_component_table_item.classList.remove(DISABLED_CLASS);
        if (!remaining.voyager.component_two.has(tier_two_component_id)) {
            voyager_tier_two_component_table_item.classList.add(DISABLED_CLASS);
        }
    }

    const decomposition_container = document.querySelector("#decomposition-container");
    const decomposition_table_items = decomposition_container.querySelectorAll("." + TABLE_ITEM_CLASS);
    for (const decomposition_table_item of decomposition_table_items) {
        const cjkvi_component = decomposition_table_item.textContent;
        decomposition_table_item.classList.remove(DISABLED_CLASS);
        if (!remaining.cjkvi_components.has(cjkvi_component)) {
            decomposition_table_item.classList.add(DISABLED_CLASS);
        }
    }
}

function find_possible_kanji() {
    let possible_kanji = [];

    let remaining = {
        radicals: new Set([]),
        components: new Set([]),
        four_corner: {
            top_left: new Set([]),
            top_right: new Set([]),
            bottom_left: new Set([]),
            bottom_right: new Set([]),
            extra: new Set([]),
        },
        skip: {
            part_one: new Set([]),
            part_two: new Set([]),
            part_three: new Set([]),
        },
        deroo: {
            top: new Set([]),
            bottom: new Set([]),
        },
        voyager: {
            region_one: new Set([]),
            component_one: new Set([]),
            region_two: new Set([]),
            component_two: new Set([]),
        },
        cjkvi_components: new Set([]),
    }

    function check_selected_radical(test_radical) {
        if (selected_filters.radical === -1) { return true; }
        return test_radical === selected_filters.radical;
    }

    function check_selected_components(test_components) {
        if (selected_filters.components.length > 0 && !test_components) { return false; }
        for (let i = 0; i < selected_filters.components.length; i++) {
            if (!test_components.includes(selected_filters.components[i])) {
                return false;
            }
        }
        return true;
    }

    function check_selected_four_corner(test_four_corner) {
        for (const [corner, shape] of Object.entries(selected_filters.four_corners)) {
            if (shape === -1) { continue; }
            if (!test_four_corner || test_four_corner[corner] !== shape) {
                return false;
            }
        }
        return true;
    }

    function check_selected_skip(test_skip) {
        if (selected_filters.skip.part_one !== -1) {
            if (test_skip.part_one !== selected_filters.skip.part_one) { return false; }
            if (selected_filters.skip.part_two > 0 && (test_skip.part_two > selected_filters.skip.part_two + selected_filters.skip.part_two_deviation || test_skip.part_two < selected_filters.skip.part_two - selected_filters.skip.part_two_deviation)) { return false; }
            if (selected_filters.skip.part_three > 0 && (test_skip.part_three > selected_filters.skip.part_three + selected_filters.skip.part_three_deviation || test_skip.part_three < selected_filters.skip.part_three - selected_filters.skip.part_three_deviation)) { return false; }
        }
        return true;
    }

    function check_selected_deroo(test_deroo) {
        if (!test_deroo && (selected_filters.deroo.top || selected_filters.deroo.bottom)) { return false; }
        if (!test_deroo) { return true; }
        if ((selected_filters.deroo.top && selected_filters.deroo.top != Number(test_deroo.top)) || (selected_filters.deroo.bottom && selected_filters.deroo.bottom != Number(test_deroo.bottom))) {
            return false;
        }
        return true;
    }

    function check_selected_voyager(test_voyager) {
        if (!test_voyager && (selected_filters.voyager.region_one || selected_filters.voyager.region_two || selected_filters.voyager.component_one || selected_filters.voyager.component_two)) {
            return false;
        }
        if ((selected_filters.voyager.region_one && !test_voyager.regions.includes(selected_filters.voyager.region_one)) ||
            (selected_filters.voyager.region_two && !test_voyager.regions.includes(selected_filters.voyager.region_two)) ||
            (selected_filters.voyager.component_one && !test_voyager.components.includes(selected_filters.voyager.component_one)) ||
            (selected_filters.voyager.component_two && !test_voyager.components.includes(selected_filters.voyager.component_two))) {
            return false;
        }
        return true;
    }

    function check_stroke_count(test_stroke_count) {
        if (selected_filters.stroke_count.equal + selected_filters.stroke_count.greater + selected_filters.stroke_count.less > 0) {
            if ((selected_filters.stroke_count.equal > 0 && test_stroke_count !== selected_filters.stroke_count.equal) ||
                (selected_filters.stroke_count.greater > 0 && test_stroke_count <= selected_filters.stroke_count.greater) ||
                (selected_filters.stroke_count.less > 0 && test_stroke_count >= selected_filters.stroke_count.less)) {
                return false;
            }
        }
        return true;
    }


    let word_parts_kanji = new Set([]);
    const word_parts_kanji_active = Object.values(selected_filters.word_parts).join("").length > 0;
    if (word_parts_kanji_active) {
        let word_lengths = ["2", "3", "4"];
        if (selected_filters.word_parts["4"].length > 0) { word_lengths = ["4"] }
        if (selected_filters.word_parts["3"].length > 0) { word_lengths = ["3", "4"] }
        const word_parts_values = Object.values(selected_filters.word_parts);
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
    }

    function check_word_parts_kanji(kanji) {
        if (word_parts_kanji_active && !word_parts_kanji.has(kanji)) { return false; }
        return true;
    }

    function check_composition_parts(kanji, cjkvi_components, cjkvi_components_recursive) {
        for (const composition_part of selected_filters.composition_parts) {
            if (![kanji, ...cjkvi_components, ...cjkvi_components_recursive].includes(composition_part)) {
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
        if (!check_selected_deroo(kanji_values.deroo)) { continue; }
        if (!check_selected_voyager(kanji_values.voyager)) { continue; }
        if (!check_stroke_count(kanji_values.stroke_count)) { continue; }
        if (!check_word_parts_kanji(kanji)) { continue; }
        if (!check_composition_parts(kanji, kanji_values.cjkvi_components, kanji_values.cjkvi_components_recursive)) { continue; }

        remaining.radicals.add(kanji_values.radical.id);
        if (kanji_values.components) {
            kanji_values.components.forEach((x) => remaining.components.add(x));
        }
        if (kanji_values.four_corner) {
            remaining.four_corner.top_left.add(kanji_values.four_corner.top_left);
            remaining.four_corner.top_right.add(kanji_values.four_corner.top_right);
            remaining.four_corner.bottom_left.add(kanji_values.four_corner.bottom_left);
            remaining.four_corner.bottom_right.add(kanji_values.four_corner.bottom_right);
            remaining.four_corner.extra.add(kanji_values.four_corner.extra);
        }
        if (kanji_values.skip) {
            remaining.skip.part_one.add(kanji_values.skip.part_one);
            remaining.skip.part_two.add(kanji_values.skip.part_two);
            remaining.skip.part_three.add(kanji_values.skip.part_three);
        }
        if (kanji_values.cjkvi_components) {
            kanji_values.cjkvi_components.forEach((x) => remaining.cjkvi_components.add(x));
            kanji_values.cjkvi_components_recursive.forEach((x) => remaining.cjkvi_components.add(x));
            remaining.cjkvi_components.add(kanji); // kanji can be included in the decomposition so they must be checked for
        }
        if (kanji_values.deroo) {
            remaining.deroo.top.add(Number(kanji_values.deroo.top));
            remaining.deroo.bottom.add(Number(kanji_values.deroo.bottom));
        }
        if (kanji_values.voyager) {
            kanji_values.voyager.regions.forEach((x) => {
                remaining.voyager.region_one.add(x);
                remaining.voyager.region_two.add(x);
            });
            kanji_values.voyager.components.forEach((x) => {
                remaining.voyager.component_one.add(x);
                remaining.voyager.component_two.add(x);
            });
        }
        global_valid_cjkvi_components = remaining.cjkvi_components;

        possible_kanji.push(kanji);
    }

    gray_out_unavailable(remaining);

    possible_kanji.sort((a, b) => get_sorting_value(a) - get_sorting_value(b));

    render_kanji_results(possible_kanji.slice(0, KANJI_RESULTS_LIMIT), possible_kanji.length > KANJI_RESULTS_LIMIT, false);
    full_kanji_results = possible_kanji;
    kanji_results_index = 0;
}

function render_kanji_results(kanji_list, ellide_end, ellide_start) {
    const result_item_class = TABLE_ITEM_CLASS;
    const kanji_results_element = document.querySelector("#kanji-results");
    kanji_results_element.innerHTML = kanji_list.length ? "<span class=\"" + result_item_class + "\">" + kanji_list.join("</span><span class=\"" + result_item_class + "\">") + "</span>" : "<span class=\"" + result_item_class + "\">&nbsp;</span>";
    if (ellide_end) {
        kanji_results_element.innerHTML += "<span id=\"kanji-results-ellipsis-end\" class=\"" + result_item_class + "\">" + kanji_results_ellipsis_char + "</span>";
    }
    if (ellide_start) {
        kanji_results_element.innerHTML = "<span id=\"kanji-results-ellipsis-start\" class=\"" + result_item_class + "\">" + kanji_results_ellipsis_char + "</span>" + kanji_results_element.innerHTML;
    }
    kanji_results_element.scrollLeft = 0;
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
        if ([...e.target.textContent].length > 1) { return; }
        if (e.target.classList.contains("no-click-select")) { return; }
        if (e.target.textContent === kanji_results_ellipsis_char) {
            if (e.target.id === "kanji-results-ellipsis-start") {
                kanji_results_index -= KANJI_RESULTS_LIMIT;
            } else {
                kanji_results_index += KANJI_RESULTS_LIMIT;
            }
            render_kanji_results(full_kanji_results.slice(kanji_results_index, kanji_results_index + KANJI_RESULTS_LIMIT), full_kanji_results.length > kanji_results_index + KANJI_RESULTS_LIMIT, kanji_results_index > 0);
            return;
        }

        const cursor_index = header_input.selectionStart;
        header_input.value = header_input.value.slice(0, cursor_index) + e.target.textContent + header_input.value.slice(cursor_index);

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
    for (const table_item of parent_element.querySelectorAll("." + TABLE_ITEM_CLASS)) {
        table_item.classList.remove(SELECTED_CLASS);
    }
}

function prepare_reset_buttons() {
    function reset_radicals(find = true) {
        selected_filters.radical = structuredClone(DEFAULTS.radical);
        deselect_table_items(document.querySelector("#radicals-container"));
        if (find) { find_possible_kanji(); }
    }
    document.querySelector("#radicals-reset").addEventListener("click", reset_radicals);

    function reset_components(find = true) {
        selected_filters.components = structuredClone(DEFAULTS.components);
        deselect_table_items(document.querySelector("#components-container"));
        if (find) { find_possible_kanji() };
    }
    document.querySelector("#components-reset").addEventListener("click", reset_components);

    function reset_four_corner(find = true) {
        selected_filters.four_corners = structuredClone(DEFAULTS.four_corners);
        deselect_table_items(document.querySelector("#four-corner-container"));
        if (find) { find_possible_kanji() };
    }
    document.querySelector("#four-corner-reset").addEventListener("click", reset_four_corner);

    function reset_skip(find = true) {
        selected_filters.skip = structuredClone(DEFAULTS.skip);
        deselect_table_items(document.querySelector("#skip-container"));
        document.querySelector("#skip-part-2-input").value = 0;
        document.querySelector("#skip-part-2-input-deviation").value = 0;
        document.querySelector("#skip-part-3-input").value = 0;
        document.querySelector("#skip-part-3-input-deviation").value = 0;
        if (find) { find_possible_kanji() };
    }
    document.querySelector("#skip-reset").addEventListener("click", reset_skip);

    function reset_deroo(find = true) {
        selected_filters.deroo = structuredClone(DEFAULTS.deroo);
        deselect_table_items(document.querySelector("#deroo-container"));
        if (find) { find_possible_kanji() };
    }
    document.querySelector("#deroo-reset").addEventListener("click", reset_deroo);

    function reset_voyager(find = true) {
        selected_filters.voyager = structuredClone(DEFAULTS.voyager);
        deselect_table_items(document.querySelector("#voyager-container"));
        document.querySelector("#voyager-tier-one-components").innerHTML = "";
        document.querySelector("#voyager-tier-two-components").innerHTML = "";
        if (find) { find_possible_kanji() };
    }
    document.querySelector("#voyager-reset").addEventListener("click", reset_voyager);

    function reset_partial_word(find = true) {
        selected_filters.word_parts = structuredClone(DEFAULTS.word_parts);
        document.querySelector("#word-part-1").value = "";
        document.querySelector("#word-part-2").value = "";
        document.querySelector("#word-part-3").value = "";
        document.querySelector("#word-part-4").value = "";
        if (find) { find_possible_kanji() };
    }
    document.querySelector("#partial-word-reset").addEventListener("click", reset_partial_word);

    function reset_stroke_count(find = true) {
        selected_filters.stroke_count = structuredClone(DEFAULTS.stroke_count);
        document.querySelector("#stroke-count-input-equals").value = 0;
        document.querySelector("#stroke-count-input-greater").value = 0;
        document.querySelector("#stroke-count-input-less").value = 0;
        if (find) { find_possible_kanji() };
    }
    document.querySelector("#stroke-count-reset").addEventListener("click", reset_stroke_count);

    function reset_composition(find = true) {
        document.querySelector("#composition-selection-container").innerHTML = "";
        selected_filters.composition_parts = structuredClone(DEFAULTS.composition_parts);
        for (const table_item of document.querySelector("#decomposition-container").querySelectorAll("." + TABLE_ITEM_CLASS)) {
            table_item.classList.remove(DECOMPOSITION_DISABLED_CLASS);
        }
        if (find) { find_possible_kanji() };
    }
    document.querySelector("#composition-reset").addEventListener("click", reset_composition);

    function reset_decomposition() {
        document.querySelector("#decomposition-input").value = "";
        document.querySelector("#decomposition-container").innerHTML = "";
    }
    document.querySelector("#decomposition-reset").addEventListener("click", reset_decomposition);

    function reset_all() {
        reset_radicals(false);
        reset_components(false);
        reset_four_corner(false);
        reset_skip(false);
        reset_deroo(false);
        reset_voyager(false);
        reset_partial_word(false);
        reset_stroke_count(false);
        reset_composition(false);
        reset_decomposition(); // resetting decomposition doesn't change any kanji finding data
        find_possible_kanji();
    }
    document.querySelector("#reset-all").addEventListener("click", reset_all);
}

function prepare_clear_text_button() {
    document.querySelector("#clear-text").addEventListener("click", () => {
        document.querySelector("#header-input").value = "";
        document.querySelector("#header-input-mirror").innerHTML = "&nbsp;";
    });
}

function prepare_dataset_info() {
    for (const element of document.querySelectorAll("[id^=dataset-]")) {
        const split_id = element.id.split("-");
        let element_dataset_info = DATASET_INFO[split_id[1]][split_id[2]];
        if (split_id.includes("percent")) {
            if (split_id.includes("jouyou")) {
                element_dataset_info /= DATASET_INFO["totals"]["jouyou_count"];
            } else if (split_id.includes("jinmeiyou")) {
                element_dataset_info /= DATASET_INFO["totals"]["jinmeiyou_count"];
            } else {
                element_dataset_info /= DATASET_INFO["totals"]["count"];
            }
            element_dataset_info = Math.floor(element_dataset_info * 100).toString() + "%";
        }
        element.textContent = element_dataset_info;
    }
}

function prepare_docs_kanji_search() {
    const search_results_element = document.querySelector("#docs-kanji-search-results");
    const search_results_radical = document.querySelector("#docs-kanji-search-radical");
    const search_results_components = document.querySelector("#docs-kanji-search-components");
    const search_results_four_corner = document.querySelector("#docs-kanji-search-four-corner");
    const search_results_skip = document.querySelector("#docs-kanji-search-skip");
    const search_results_deroo = document.querySelector("#docs-kanji-search-deroo");
    const search_results_voyager = document.querySelector("#docs-kanji-search-voyager");
    const search_results_stroke_count = document.querySelector("#docs-kanji-search-stroke-count");
    const search_results_decomposition = document.querySelector("#docs-kanji-search-decomposition");

    const deroo_top_values = Object.values(DEROO_SVG_INFO.top).reduce((acc, x) => {return {...acc, ...x}}, {});
    const deroo_bottom_values = Object.values(DEROO_SVG_INFO.bottom).reduce((acc, x) => {return {...acc, ...x}}, {});

    document.querySelector("#docs-kanji-search").addEventListener("input", (e) => {
        const search_target = [...e.target.value].slice(0, 1)[0]; // search 1 character maximum
        const search_kanji_info = KANJI_DATA[search_target];
        e.target.value.length > 1 || (!search_kanji_info && e.target.value.length !== 0) ? e.target.classList.add("invalid-input") : e.target.classList.remove("invalid-input");
        search_results_element.classList.add("hidden");
        if (search_kanji_info) {
            let not_found_text = "Not Found";
            search_results_radical.innerHTML = not_found_text;
            search_results_components.innerHTML = not_found_text;
            search_results_four_corner.innerHTML = not_found_text;
            search_results_skip.innerHTML = not_found_text;
            search_results_deroo.innerHTML = not_found_text;
            search_results_voyager.innerHTML = not_found_text;
            search_results_stroke_count.innerHTML = not_found_text;
            search_results_decomposition.innerHTML = not_found_text;

            if (search_kanji_info.radical) {
                const radical_characters = search_kanji_info.radical.characters.map((x) => x.character + "(" + x.stroke_count + ")");
                search_results_radical.innerHTML = search_kanji_info.radical.id + "<br>" + radical_characters.join(", ");
            }

            if (search_kanji_info.components) {
                search_results_components.innerHTML = search_kanji_info.components.map((x) => x + "(" + COMPONENTS_INFO.find(y => y.display_component === x).stroke_count + ")").join(", ");
            }

            if (search_kanji_info.four_corner) {
                const four_corner_ordered = Object.values(search_kanji_info.four_corner);
                search_results_four_corner.innerHTML = four_corner_ordered.join("") + "<br>" + four_corner_ordered.map((x) => FOUR_CORNER_INFO[x].character).join(" ");
            }

            if (search_kanji_info.skip) {
                const skip_ordered = Object.values(search_kanji_info.skip);
                const skip_part_1_svg = document.querySelector(".skip-part-1-val-" + search_kanji_info.skip.part_one).cloneNode(true);
                skip_part_1_svg.classList.remove(SELECTED_CLASS, DISABLED_CLASS);
                const skip_part_1_svg_wrapped = "<span class=\"skip-icon-kanji-search\">" + skip_part_1_svg.outerHTML + "</span>";
                search_results_skip.innerHTML = skip_ordered.join("") + "<br>" + skip_part_1_svg_wrapped + ", " + search_kanji_info.skip.part_two + ", " + search_kanji_info.skip.part_three;
            }

            if (search_kanji_info.deroo) {
                const deroo_ordered = Object.values(search_kanji_info.deroo);
                const deroo_svg_top = deroo_top_values[search_kanji_info.deroo.top.padStart(2, "0")];
                const deroo_svg_bottom = deroo_bottom_values[search_kanji_info.deroo.bottom.padStart(2, "0")];
                search_results_deroo.innerHTML = deroo_ordered.join("") + "<br>" + deroo_svg_top + ", " + deroo_svg_bottom;
            }

            if (search_kanji_info.voyager) {
                const voyager_regions = search_kanji_info.voyager.regions.map((region_id) => VOYAGER_SVG_INFO["regions"][region_id]);
                const voyager_components = search_kanji_info.voyager.components.map((component_id) => VOYAGER_SVG_INFO["components"][component_id]).filter((svg_string) => svg_string);
                search_results_voyager.innerHTML = voyager_regions.join(",") + "<br>" + voyager_components.join(",");
            }

            if (search_kanji_info.cjkvi_components) {
                let components_string = search_kanji_info.cjkvi_components.join(", ");
                if (search_kanji_info.cjkvi_components_recursive && search_kanji_info.cjkvi_components_recursive.length > 0) {
                    components_string += "<br>" + search_kanji_info.cjkvi_components_recursive.join(", ");
                }
                search_results_decomposition.innerHTML = components_string;
            }

            if (search_kanji_info.stroke_count) {
                search_results_stroke_count.innerHTML = search_kanji_info.stroke_count;
            }

            search_results_element.classList.remove("hidden");
        }
    });
}

prepare_radicals_selection();
prepare_components_selection();
prepare_four_corners_selection();
prepare_skip_selection();
prepare_deroo_selection();
prepare_voyager_selection();
prepare_partial_word();
prepare_stroke_count();
prepare_composition();
prepare_decomposition();
prepare_construction();
prepare_jisho_search();
prepare_header_results_selector();
prepare_no_select();
prepare_reset_buttons();
prepare_clear_text_button();
prepare_dataset_info();
prepare_docs_kanji_search();
find_possible_kanji();
