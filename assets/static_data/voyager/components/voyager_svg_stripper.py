import re
import os

def strip_svg(svg_filename):
    svg = open("raw/" + svg_filename).read()

    svg = re.sub(r"(\n|\r)+", "\n", svg)
    svg = re.sub(r"<g id=\"kvg:StrokeNumbers(.|\n)*?</g>", "", svg)
    svg = re.sub(r"id=\".*?\"", "", svg)
    svg = re.sub(r"kvg.*?=\".*?\"", "", svg)
    svg = re.sub(r"<!DOCTYPE(.|\n)*?]>", "", svg)
    svg = re.sub(r"<!--(.|\n)*?-->", "", svg)
    svg = re.sub(r"<style>(.|\n)*?</style>", "", svg)
    svg = re.sub(r"<\?xml.*?\?>", "", svg)
    svg = re.sub(r"(^|\n)\s*", "", svg)
    svg = re.sub(r"\s*>", ">", svg)
    svg = re.sub(r"\s*/>", "/>", svg)
    svg = re.sub(r"\s+", " ", svg)

    with open(svg_filename.replace(".svg", "") + "_stripped.svg", "w") as output_svg:
        output_svg.write(svg)

dir_files = os.listdir("raw/")
for dir_file in dir_files:
    if ".svg" in dir_file and "_stripped" not in dir_file:
        print("Processing:", dir_file)
        strip_svg(dir_file)