const radicals_selection = document.querySelector("#radicals-selection");
let selected_radicals = [];

let current_stroke_count = 1;

let radicals_selection_innerHTML_string = "";
for (const [radical, data] of Object.entries(RADKFILEX)) {
    if (data.stroke_count !== current_stroke_count) {
        current_stroke_count = data.stroke_count;
        console.log(radical);
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
    const radical = e.target.textContent;
    if (radical.length > 1) { return; }
    if (selected_radicals.indexOf(radical) == -1) {
        selected_radicals.push(radical);
        e.target.style.color = "red";
    } else {
        selected_radicals.splice(selected_radicals.indexOf(radical), 1);
        e.target.style.color = "";
    }

    let possible_kanji = selected_radicals.length > 0 ? RADKFILEX[selected_radicals[0]]["kanji"] : [];
    for (let i = 1; i < selected_radicals.length; i++) {
        possible_kanji = possible_kanji.filter((x) => RADKFILEX[selected_radicals[i]]["kanji"].includes(x))
    }
    document.querySelector("#kanji").innerHTML = possible_kanji.join("") + "&nbsp;";
});
