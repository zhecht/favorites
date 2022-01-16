from flask import *
from urllib.parse import quote_plus
from PIL import Image

import operator
import os
import json
import re
import controllers.users as users_controller

profile = Blueprint('profile', __name__, template_folder='views')

ALL_CATS = ["lyrics", "quotes", "shows", "podcasts", "games", "songs", "movies", "documentaries", "music_documentaries", "riffs", "books"]
def format_profile_html(category, item):
	html = "<div class='title'>{}</div>".format(item)
	if category in ["quotes", "lyrics"]:
		data = item.split("|")
		header = "{}".format(data[0]) if category == "quotes" else "{} - {}".format(data[1], data[0])
		html = "<div class='title'>{}</div>".format(header)
		html += "<div class='quote'>{}</div>".format(data[2].replace("\\n", "<br>"))
		html += "<div>-</div>"
	return html

def categories_sorted_by_count(favorites):
	cat_counts = []
	for cat in favorites:
		totRows = len(favorites[cat])
		cat_counts.append((cat, totRows))
	return sorted(cat_counts, key=operator.itemgetter(1), reverse=True)

def get_category_html(user, favorites):
	html = "<div id='categoryHeaders'>"
	sorted_categories = categories_sorted_by_count(favorites)
	data = []
	#html += "<span id='add_cat_btn'>Add Category (+)</span>"
	for idx, (cat, cat_count) in enumerate(sorted_categories):
		html += f"<div id='{cat}'><span class='badge'>{cat_count}</span><span>{cat.replace('_',' ')}</span></div>"
	#leftover_cats = list(set(ALL_CATS) - set([cat for cat in favorites]))
	#for cat in leftover_cats:
	#	html += "<span id='{}'>{} (0)</span>".format(cat, cat.replace("_", " "))
	html += "</div>"
	return html

def format_overview(cat, row):
	if cat in ["quotes"]:
		artist = row.split("|")[0]
		data = row.split("|")[2].replace("\\n", "<br>")
		return f"<div class='quote'>{data}</div><div>{artist}</div>"
	return row

def get_home_page_html(user, favorites):
	html = "<div id='home_page_div'>"
	sorted_categories = categories_sorted_by_count(favorites)
	for cat, cat_count in sorted_categories:
		html += "<div class='categoryBox'>"
		html += f"<div class='category_header'>{cat} ({cat_count})</div>"
		html += "<div style='display:flex;flex-wrap: wrap'>"
		for idx, r in enumerate(favorites[cat][:20]):
			row = format_overview(cat, r)
			formatted = row.replace(":", "").replace("(", "").replace(")", "").replace(" ", "").replace("&","").replace("'", "").replace("\"", "").replace(".", "")
			if cat == "quotes":
				p = r.split("|")[0]+" "+r.split("|")[1]
				formatted = quote_plus(p)
			url = ""
			if os.path.exists(f"static/pics/{cat}/{formatted}.jpg"):
				url = f"/static/pics/{cat}/{formatted}.jpg"
			elif os.path.exists(f"static/pics/{cat}/{formatted}.png"):
				url = f"/static/pics/{cat}/{formatted}.png"
			html += f"<img src='{url}' loading='lazy'/>"
			#html += f"<div class='row'><div class='circle'>{idx+1}</div><div class='text'>{row}</div></div>"
		html += "<div class='shadow'>Expand</div>"
		html += "</div></div>"
	html += "</div>"
	return html

def get_autocomplete_arr(favorites):
	data = {}
	for key in favorites:
		favorites_arr = []
		if os.path.exists("static/scrape/{}.txt".format(key)):
			with open("static/scrape/{}.txt".format(key)) as fh:
				favorites_arr = fh.read().split("\n")
		data[key] = list(set(favorites_arr))
	return data

def parse_start(start):
	sec = 0
	m = re.search(r"(\d+)h", start)
	if m:
		sec += int(m.group(1)) * 60 * 60
	m = re.search(r"(\d+)m", start)
	if m:
		sec += int(m.group(1)) * 60
	m = re.search(r"(\d+)s", start)
	if m:
		sec += int(m.group(1))
	return sec

def format_data(favorites):
	data = {}
	for cat in favorites:
		data[cat] = []
		for tier in favorites[cat]:
			data[cat] = ["<br>".join(res.replace("\"", "&#34;").split("\\n")) for res in favorites[cat]]
	
	data["riff_titles"] = []
	with open("static/videos/youtube_ids") as fh:
		youtube_ids = json.loads(fh.read())

	for riffId in favorites["riffs"]:
		data["riff_titles"].append(youtube_ids[riffId])
	return data

@profile.route("/profile/<user>", methods=["GET"])
def profile_route(user):
	favorites = users_controller.read_favorites_json(user)
	category_header_html = get_category_html(user, favorites)
	category_html = get_home_page_html(user, favorites)
	autocomplete_arr = get_autocomplete_arr(favorites)
	return render_template("profile.html",user=user, category_html=category_html, category_header_html=category_header_html, profile_data=format_data(favorites), autocomplete_arr=autocomplete_arr, condense=True)

@profile.route("/profile/<user>/get_pic", methods=["POST"])
def profile_get_pic(user):
	from urllib.parse import unquote
	adding = request.args.get("adding")
	url = unquote(request.args.get("url"))
	cat = request.args.get("cat")
	title = unquote(request.args.get("title"))

	if adding == "true":
		favorites = users_controller.read_favorites_json(user)
		favorites[cat].append(title)
		users_controller.write_favorites_json(favorites, user)
	title = title.replace(":", "").replace("(", "").replace(")", "").replace(" ", "").replace("&","").replace("'", "").replace("\"", "").replace(".", "")
	extension = "jpg"
	if ".png" in url:
		extension = "png"
	os.system(f"curl -sk \"{url}\" -o static/pics/{cat}/{title}.jpg")
	im = Image.open(f"static/pics/{cat}/{title}.jpg")
	if cat in ["beer", "books"]:
		ratio = float(500 / im.size[1])
		im = im.resize((int(ratio*im.size[0]), 500))
	else:
		ratio = float(500 / im.size[0])
		im = im.resize((500,int(ratio*im.size[1])))
	im = im.convert("RGB")
	im.save(f"static/pics/{cat}/{title}.jpg")
	return jsonify({"success": 1})

@profile.route("/profile/<user>/get_video", methods=["POST"])
def profile_get_video(user):
	youtube = request.args.get("url")
	duration = request.args.get("duration")

	if not youtube.startswith("https://youtube.com") and not youtube.startswith("https://www.youtube.com") and not youtube.startswith("youtube.com") and youtube.find("&t=") == -1:
		return jsonify({"error": 1})
	start = parse_start(youtube.split("&t=")[1].split("&")[0])

	os.system("rm -f static/videos/vid.mp4")
	os.system("youtube-dl -f mp4 '{}' --write-info-json -o static/videos/vid.mp4".format(youtube))
	
	with open("static/videos/vid.info.json") as fh:
		vid_info = json.loads(fh.read())
	
	with open("static/videos/youtube_ids") as fh:
		youtube_ids = json.loads(fh.read())
	youtube_ids[vid_info["id"]] = {
		"start": start,
		"duration": duration,
		"title": vid_info["title"] 
	}
	with open("static/videos/youtube_ids", "w") as fh:
		json.dump(youtube_ids, fh, indent=4)

	duration_arg = ""
	if duration and duration != "end":
		duration_arg = "-t {}".format(duration)
	os.system("ffmpeg -f mp4 -y -i static/videos/vid.mp4 -ss {} {} static/videos/{}.mp4".format(start, duration_arg, vid_info["id"]))
	return jsonify({
		"success": 1,
		"youtube_id": vid_info["id"],
		"title": vid_info["title"]
	})

@profile.route("/profile/<user>/screenshot", methods=["POST"])
def profile_screenshot(user):
	import base64
	shot = request.form["screenshot"]
	path = quote_plus(request.form["path"])
	imgdata = base64.b64decode(shot)
	with open(f"static/pics/quotes/{path}.png", "wb") as fh:
		fh.write(imgdata)
	return jsonify({"success": 1})

@profile.route("/profile/<user>/add_cat", methods=["POST"])
def profile_add_cat(user):
	new_cat = request.args.get("cat").replace(" ", "_").lower()
	favorites = users_controller.read_favorites_json(user)
	favorites[new_cat] = []
	users_controller.write_favorites_json(favorites, user)
	return jsonify({"success": 1})

@profile.route("/profile/<user>/edit_cat_item", methods=["POST"])
def profile_edit_cat_item(user):
	cat = request.args.get("cat")
	idx = int(request.args.get("idx"))
	remove = request.args.get("remove")
	# need tier
	favorites = users_controller.read_favorites_json(user)
	if remove:
		del favorites[cat][idx]
		users_controller.write_favorites_json(favorites, user)
		return jsonify({"success": 1})


@profile.route("/profile/<user>/reassign", methods=["POST"])
def profile_reassign_ranks(user):
	cat = request.args.get("cat")
	fromId = int(request.args.get("fromId"))
	toId = int(request.args.get("toId"))
	isNew = request.args.get("isNew")
	newVal = request.args.get("newVal")

	favorites = users_controller.read_favorites_json(user)
	fromVal = favorites[cat][fromId]
	del favorites[cat][fromId]

	if fromId < toId:
		favorites[cat].insert(toId - 1, fromVal)
	else:
		favorites[cat].insert(toId, fromVal)
	users_controller.write_favorites_json(favorites, user)
	return jsonify({"success": 1})