from flask import *

import operator
import json
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
	leftover_cats = list(set(ALL_CATS) - set([cat for cat in favorites]))
	for cat in leftover_cats:
		html += "<span id='{}'>{} (0)</span>".format(cat, cat.replace("_", " "))
	html += "</div>"
	return html

def format_data(favorites):
	data = {}
	for cat in ALL_CATS:
		data[cat] = {}
		if cat in favorites:
			data[cat] = [res.replace("\"", "&#34;").split("\\n") for res in favorites[cat]]
	return data

@profile.route("/profile/<user>", methods=["GET"])
def profile_route(user):
	favorites = users_controller.read_favorites_json(user)
	category_html = get_category_html(user, favorites)
	#print(json.dumps(favorites))
	return render_template("profile.html", user=user, category_html=category_html, profile_data=format_data(favorites))

@profile.route("/profile/<user>/reassign", methods=["POST"])
def profile_reassign_ranks(user):