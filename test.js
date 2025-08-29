const radicals_selection = document.querySelector("#radicals-selection");
let selected_radicals = [];

for (const [radical, _characters] of Object.entries(RADKFILEX)) {
    radicals_selection.innerHTML += "<span>" + radical + "</span>";
}

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

    let possible_kanji = selected_radicals.length > 0 ? RADKFILEX[selected_radicals[0]] : [];
    for (let i = 1; i < selected_radicals.length; i++) {
        possible_kanji = possible_kanji.filter((x) => RADKFILEX[selected_radicals[i]].includes(x))
    }
    document.querySelector("#kanji").innerHTML = possible_kanji.join("") + "&nbsp;";
});
