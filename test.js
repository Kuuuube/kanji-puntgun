let selected_radicals = [];
let selected_four_corners = {top_left: -1, top_right: -1, bottom_left: -1, bottom_right: -1, extra: -1};
const ALL_KANJI = get_all_kanji();

function get_all_kanji() {
    let all_kanji = new Set([]);
    for (const value of Object.values(RADKFILEX)) {
        value.kanji.forEach(x => all_kanji.add(x));
    }
    for (const corner of Object.values(FOUR_CORNER)) {
        for (const shape of Object.values(corner)) {
            shape.forEach(x => all_kanji.add(x));
        }
    }
    let all_kanji_array = Array.from(all_kanji)
    all_kanji_array.sort((a, b) => KANJI_STROKE_COUNTS[a] - KANJI_STROKE_COUNTS[b]);
    return all_kanji_array;
}

function prepare_radicals_selection() {
    const radicals_selection = document.querySelector("#radicals-selection");

    let current_stroke_count = 1;
    let radicals_selection_innerHTML_string = "";
    for (const [radical, data] of Object.entries(RADKFILEX)) {
        if (data.stroke_count !== current_stroke_count) {
            current_stroke_count = data.stroke_count;
            if (data.stroke_count !== 0) {
                radicals_selection_innerHTML_string += "</div>";
            }
            radicals_selection_innerHTML_string += "<div id=\"count-" + current_stroke_count + "\">";
        }
        radicals_selection_innerHTML_string += "<span>" + radical + "</span>";
    }
    radicals_selection_innerHTML_string += "</div>"
    radicals_selection.innerHTML = radicals_selection_innerHTML_string;

    radicals_selection.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();

        const radical = e.target.textContent;
        if (radical.length > 1) { return; }
        if (selected_radicals.indexOf(radical) == -1) {
            selected_radicals.push(radical);
            e.target.style.color = "red";
        } else {
            selected_radicals.splice(selected_radicals.indexOf(radical), 1);
            e.target.style.color = "";
        }

        find_possible_kanji();
    });
}

function prepare_four_corners_selection() {
    const four_corners_ids = ["four-corners-top-left", "four-corners-top-right", "four-corners-bottom-left", "four-corners-bottom-right", "four-corners-extra"];
    for (let i = 0; i < four_corners_ids.length; i++) {
        const four_corners_element = document.querySelector("#" + four_corners_ids[i]);
        for (let j = 0; j < 10; j++) {
            four_corners_element.innerHTML += "<span>" + j + "</span>";
        }
        four_corners_element.addEventListener("click", (e) => {
            const corner_selection = e.target.innerHTML;
            if (corner_selection.length > 1) { return; }
            for (const corner_selector of e.target.parentNode.children) {
                corner_selector.style.color = "";
            }
            const corner_name = Object.keys(selected_four_corners)[i];
            if (selected_four_corners[corner_name] === corner_selection) {
                selected_four_corners[corner_name] = -1;
            } else {
                selected_four_corners[corner_name] = corner_selection;
                e.target.style.color = "red";
            }

            find_possible_kanji();
        });
    }
}

function find_possible_kanji() {
    let possible_kanji = ALL_KANJI;
    for (let i = 0; i < selected_radicals.length; i++) {
        possible_kanji = possible_kanji.filter((x) => RADKFILEX[selected_radicals[i]]["kanji"].includes(x))
    }
    for (const [corner, shape] of Object.entries(selected_four_corners)) {
        if (shape === -1) { continue; }
        possible_kanji = possible_kanji.filter((x) => FOUR_CORNER[corner][shape].includes(x))
    }


    document.querySelector("#kanji").innerHTML = possible_kanji.length ? possible_kanji.join("") : "&nbsp;";
}


prepare_radicals_selection();
prepare_four_corners_selection();
find_possible_kanji();
