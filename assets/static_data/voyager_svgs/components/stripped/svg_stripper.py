import re
import os
from svgpathtools import svg2paths

raws_path = "../raw/"
temp_dir = "temp/"
os.makedirs(temp_dir, exist_ok = True)

def get_bbox(svg_file):
    paths, _ = svg2paths(svg_file)

    for i, path in enumerate(paths):
        if i == 0:
            xmin, xmax, ymin, ymax = path.bbox()
        else:
            p_xmin, p_xmax, p_ymin, p_ymax = path.bbox()
            xmin = min(xmin, p_xmin)
            xmax = max(xmax, p_xmax)
            ymin = min(ymin, p_ymin)
            ymax = max(ymax, p_ymax)

    return (xmin, xmax, ymin, ymax)

def align_left(xmin, xmax, ymin, ymax, scaled_stroke_width):
    origin_x = xmin - scaled_stroke_width / 2
    origin_y = ymin - scaled_stroke_width / 2
    width = xmax - origin_x + scaled_stroke_width / 2
    height = ymax - origin_y + scaled_stroke_width / 2

    return (origin_x, origin_y, max(width, height), max(width, height))

def align_right(xmin, xmax, ymin, ymax, scaled_stroke_width):
    max_width_height = max(xmax - xmin, ymax - ymin) + scaled_stroke_width
    origin_x = xmax - max_width_height + scaled_stroke_width / 2
    origin_y = ymax - max_width_height + scaled_stroke_width / 2
    height = max_width_height
    width = max_width_height

    return (origin_x, origin_y, width, height)

def scale_svg(svg_string, svg_filename):
    stroke_width = 8.5
    expected_width_height = 109
    expected_width_height_stroked = 109 - stroke_width

    with open(temp_dir + svg_filename, "w") as tempfile_svg:
        tempfile_svg.write(svg_string)

    (xmin, xmax, ymin, ymax) = get_bbox(temp_dir + svg_filename)

    scale_factor = min(expected_width_height_stroked / (xmax - xmin), expected_width_height_stroked / (ymax - ymin))
    scaled_stroke_width = stroke_width / scale_factor
    expected_width_height_scale_stroked = 109 + scaled_stroke_width / 2

    (origin_x, origin_y, width, height) = align_right(xmin, xmax, ymin, ymax, scaled_stroke_width)

    svg_string = re.sub(r'viewBox="\d+ \d+ \d+ \d+"', "viewBox=\"" + str(origin_x) + " " + str(origin_y) + " " + str(width) + " " + str(height) + "\"", svg_string)

    svg_string = re.sub(r"stroke-width:\d+(.\d+)?", "stroke-width:" + str(scaled_stroke_width), svg_string)

    return svg_string

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

    svg_string = re.sub(r"stroke-linecap:round", "stroke-linecap:square", svg_string)
    svg_string = re.sub(r"stroke-linejoin:round", "stroke-linejoin:miter", svg_string)

    svg_string = scale_svg(svg_string, svg_filename)

    with open(svg_filename, "w") as output_svg:
        output_svg.write(svg_string)

dir_files = os.listdir(raws_path)
for dir_file in dir_files:
    if ".svg" in dir_file and "_stripped" not in dir_file:
        # print("Processing:", dir_file)
        strip_svg(dir_file)
