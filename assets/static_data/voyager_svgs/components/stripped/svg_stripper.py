import re
import os

raws_path = "../raw/"

def strip_svg(svg_filename):
    svg_string = open(raws_path + svg_filename).read()

    valid_paths = re.findall(r"\[id\$=(s\d+)\]", svg_string)
    regex_string = "<path id=\"kvg.*?-(?!(?:" + "\"|".join(valid_paths) + r"\"))s\d+\" (.|\n|\r)*?/>"
    svg_string = re.sub(regex_string, "", svg_string)

    svg_string = re.sub(r"(\n|\r)+", "\n", svg_string)
    svg_string = re.sub(r"<g id=\"kvg:StrokeNumbers(.|\n)*?</g>", "", svg_string)
    svg_string = re.sub(r"id=\".*?\"", "", svg_string)
    svg_string = re.sub(r"(id=\")?kvg.*?=\".*?\"", "", svg_string)
    svg_string = re.sub(r"<!DOCTYPE(.|\n)*?]>", "", svg_string)
    svg_string = re.sub(r"<!--(.|\n)*?-->", "", svg_string)
    svg_string = re.sub(r"<style>(.|\n)*?</style>", "", svg_string)
    svg_string = re.sub(r"<\?xml.*?\?>", "", svg_string)
    svg_string = re.sub(r"(^|\n)\s*", "", svg_string)
    svg_string = re.sub(r"\s*>", ">", svg_string)
    svg_string = re.sub(r"\s*/>", "/>", svg_string)
    svg_string = re.sub(r"\s+", " ", svg_string)

    svg_string = re.sub(r"<g></g>", "", svg_string)

    svg_string = re.sub(r"<svg", "<svg class=\"voyager-component-icon icon\"", svg_string)

    svg_string = re.sub(r"stroke-width:\d+(.\d+)?", "stroke-width:8.5", svg_string)
    svg_string = re.sub(r"stroke-linecap:round", "stroke-linecap:square", svg_string)
    svg_string = re.sub(r"stroke-linejoin:round", "stroke-linejoin:miter", svg_string)

    with open(svg_filename, "w") as output_svg:
        output_svg.write(svg_string)

dir_files = os.listdir(raws_path)
for dir_file in dir_files:
    if ".svg" in dir_file and "_stripped" not in dir_file:
        # print("Processing:", dir_file)
        strip_svg(dir_file)
