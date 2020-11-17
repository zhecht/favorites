from flask import *
from urllib.parse import urlparse

import operator
import os
import json
import re
import controllers.users as users_controller

profile = Blueprint('profile', __name__, template_folder='views')

ALL_CATS = ["lyrics", "quotes", "television", "podcasts", "games", "songs", "movies", "documentaries", "music_documentaries", "riffs", "books"]
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
		cat_counts.append((cat, len(favorites[cat])))
	return sorted(cat_counts, key=operator.itemgetter(1), reverse=True)

def get_category_html(user, favorites):
	html = "<div id='category_headers'>"
	sorted_categories = categories_sorted_by_count(favorites)
	for idx, (cat, cat_count) in enumerate(sorted_categories):
		html += "<span id='{}'>{} ({})</span>".format(cat, cat.replace("_", " "), cat_count)
	#leftover_cats = list(set(ALL_CATS) - set([cat for cat in favorites]))
	#for cat in leftover_cats:
	#	html += "<span id='{}'>{} (0)</span>".format(cat, cat.replace("_", " "))
	html += "<span id='add_cat_btn'>Add (+)</span>"
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
		data[cat] = ["<br>".join(res.replace("\"", "&#34;").split("\\n")) for res in favorites[cat]]
	
	data["riff_titles"] = []
	with open("static/videos/youtube_ids") as fh:
		youtube_ids = json.loads(fh.read())
	for riff_id in favorites["riffs"]:
		data["riff_titles"].append(youtube_ids[riff_id])
	return data

@profile.route("/profile/<user>", methods=["GET"])
def profile_route(user):
	favorites = users_controller.read_favorites_json(user)
	category_html = get_category_html(user, favorites)
	autocomplete_arr = get_autocomplete_arr(favorites)
	return render_template("profile.html",user=user, category_html=category_html, profile_data=format_data(favorites), autocomplete_arr=autocomplete_arr, condense=True)


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

	favorites = users_controller.read_favorites_json(user)
	if remove:
		del favorites[cat][idx]
		users_controller.write_favorites_json(favorites, user)
		return jsonify({"success": 1})


@profile.route("/profile/<user>/reassign", methods=["POST"])
def profile_reassign_ranks(user):
	cat = request.args.get("cat")
	order = request.args.get("order").split(",")
	is_new = request.args.get("is_new")
	new_val = request.args.get("new_val")
	
	# VALIDATE
	favorites = users_controller.read_favorites_json(user)
	new_arr = []
	for idx in order:
		if idx == "new":
			new_arr.append(new_val)
		else:
			new_arr.append(favorites[cat][int(idx)])
	favorites[cat] = new_arr
	users_controller.write_favorites_json(favorites, user)
	return jsonify({"success": 1})