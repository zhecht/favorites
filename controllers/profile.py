from flask import *

import controllers.users as users_controller

profile = Blueprint('profile', __name__, template_folder='views')

def format_profile_html(category, item):
	html = "<div class='title'>{}</div>".format(item)
	if category in ["quotes", "lyrics"]:
		data = item.split("|")
		header = "{}".format(data[0]) if category == "quotes" else "{} - {}".format(data[1], data[0])
		html = "<div class='title'>{}</div>".format(header)
		html += "<div class='quote'>{}</div>".format(data[2].replace("\\n", "<br>"))
		html += "<div>—</div>"
	return html

def get_profile_html(user, favorites):
	html = ""
	for category in favorites:
		html += "<div id='{}_shortlist' class='shortlist'>".format(category)
		html += "<div class='header'>{}</div>".format(category.upper())
		for item in favorites[category]:
			html += format_profile_html(category, item)
		html += "</div>"
	return html

@profile.route("/profile/<user>", methods=["GET"])
def profile_route(user):
	favorites = users_controller.read_favorites_json(user)
	profile_html = get_profile_html(user, favorites)
	return render_template("profile.html", user=user, shortlist_html=profile_html)