
String.prototype.format = function() {
	var args = arguments;
	this.unkeyed_index = 0;
	return this.replace(/\{(\w*)\}/g, function(match, key) { 
		if (key === '') {
			key = this.unkeyed_index;
			this.unkeyed_index++
		}
		if (key == +key) {
			return args[key] !== 'undefined'
				? args[key]
				: match;
		} else {
			for (var i = 0; i < args.length; i++) {
				if (typeof args[i] === 'object' && typeof args[i][key] !== 'undefined') {
					return args[i][key];
				}
			}
			return match;
		}
	}.bind(this));
};

function get_category_add_html() {
	var div = document.createElement("div");
	div.id = "cat_item_add";
	div.onclick = function() {
		add_category_item();
	};
	var span = document.createElement("span");
	span.id = "add_text";
	span.innerText = "Add [+]";
	span.style.color = "green";
	div.appendChild(span);

	var autocompleteDiv = document.createElement("div");
	autocompleteDiv.id = "cat_item_autocomplete_div"
	var autocomplete = document.createElement("div");
	autocomplete.id = "cat_item_add_autocomplete";
	autocomplete.className = "autocomplete";

	var input = document.createElement("input");
	input.placeholder = "Add / Search Favorite";
	input.id = "cat_item_add_input";
	input.type = "text";

	autocomplete.appendChild(input);

	input = document.createElement("input");
	input.placeholder = "Song";
	input.id = "cat_item_add_song_input";
	input.type = "text";

	autocomplete.appendChild(input);

	var innerdiv = document.createElement("div");
	innerdiv.id = "cat_item_add_input_duration_div";

	var input = document.createElement("input");
	input.placeholder = "10";
	input.id = "cat_item_add_input_duration";
	input.type = "text";

	innerdiv.appendChild(document.createTextNode("duration:"));
	innerdiv.appendChild(input);
	innerdiv.appendChild(document.createTextNode("seconds"));

	autocomplete.appendChild(innerdiv);

	var span = document.createElement("span");
	span.id = "cat_item_add_text";
	span.innerText = "Drag to desired rank when complete";
	span.style.display = "none";

	autocompleteDiv.appendChild(autocomplete);
	div.appendChild(autocompleteDiv);
	div.appendChild(span);

	return div;
}

function cancel_edit() {
	document.getElementById("darkened_back").style.display = "none";
	document.getElementById("edit_dialog").style.display = "none";
}

function remove_cat_item() {
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "/profile/{}/edit_cat_item?remove=1&cat={}&idx={}".format(user, CURR_CAT, EDITING));
	xhr.send();
	document.getElementsByClassName("cat_items")[EDITING].remove();
	cancel_edit();
	var no_backend = true;
	reassign_ids(no_backend);

}

function save_cat_item_edit() {

}

function edit_cat_item(el) {
	var idx = parseInt(el.target.id);
	EDITING = idx;
	document.getElementById("darkened_back").style.display = "flex";
	document.getElementById("edit_dialog").style.display = "flex";
	var txt = user_data[CURR_CAT][idx];
	document.getElementById("edit_input").value = txt;
}

function hover(el) {
	if (CURR_CAT == "quotes" || CURR_CAT == "lyrics") {
		//console.log(el.target.getElementsByTagName("div")[1]);
		//el.target.getElementsByTagName("div")[1].style.overflow = "visible";
	}
}

function create_cat_item(num) {
	var div = document.createElement("div");
	var source;
	div.className = "cat_items";
	div.id = "cat_item_"+num;
	div.draggable = true;
	if (CURR_CAT == "quotes" || CURR_CAT == "lyrics" || CURR_CAT == "riffs") {
		div.style.width = "300px";
		div.style.height = "400px";
		document.getElementById("cat_item_add").style.width = "300px";
	}

	div.onclick = function(event) {
		edit_cat_item(event);
	};
	div.ondragstart = function(event){
		drag(event);
	};
	div.onmouseenter = function(event) {
		hover(event);
	};
	var span = document.createElement("span");
	var circle = document.createElement("div");
	var body = document.createElement("div");
	circle.className = "circle";
	circle.innerText = num+1;
	span.id = num;
	span.appendChild(circle);
	body.style["padding-left"] = "10px";
	if (num === "new") {
		var new_text = document.getElementById("cat_item_add_input").value;
		if (CURR_CAT == "songs") {
			var song = document.getElementById("cat_item_add_song_input").value;
			
			if (!new_text || !song || user_data[CURR_CAT].indexOf(song) !== -1) {
				return false;
			}
		} else if (!new_text || user_data[CURR_CAT].indexOf(new_text) !== -1) {
			return false;
		}
		if (CURR_CAT == "riffs") {
			var duration = document.getElementById("cat_item_add_input_duration").value;
			if (!duration) { duration = "end"; }

			var URL = "/profile/{}/get_video?url={}&duration={}".format(user, encodeURIComponent(new_text), duration);
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {
					var res = JSON.parse(xhr.responseText);
					var vid = document.createElement("video");
					vid.controls = true;
					vid.volume = 0.5;
					vid.src = "/static/videos/"+res["youtube_id"]+".mp4";
					vid.style.width = "250px";
					body.appendChild(vid);
					body.appendChild(document.createTextNode(res["title"]));
					span.appendChild(body);
					div.appendChild(span);
					var drop_in;
					if (DROPPING == 0) {
						// making #1 rank
						drop_in = document.getElementById("cat_item_add");
					} else {
						drop_in = document.getElementById("cat_item_"+(DROPPING-1));
					}
					insertAfter(drop_in, div);
					vid.pause();
					reassign_ids();
				}
			};
			xhr.open("POST", URL);
			xhr.send();
			return;
		}
		body.appendChild(document.createTextNode(new_text));
	} else {
		var data, extra_data = {};
		if (user_data[CURR_CAT][num].indexOf("|") != -1) {
			body.style["margin"] = "10px 0";
			body.style["overflow"] = "hidden";
			body.style["max-height"] = "300px";
			data = user_data[CURR_CAT][num].split("|");
			if (CURR_CAT == "lyrics" || CURR_CAT == "quotes") {
				extra_data["artist"] = data[0];
				extra_data["source"] = data[1];
			}
			data = data[2].split("<br>");

			/*
			if (CURR_CAT == "lyrics") { // Song - Artist
				span.appendChild(document.createTextNode("{}".format(data[1])));
				span.appendChild(document.createElement("br"));
				span.appendChild(document.createTextNode("by {}".format(data[0])));
			} else if (CURR_CAT == "quotes") {
				span.appendChild(document.createTextNode(data[1]));
				source = data[0];
			}
			span.appendChild(document.createElement("br")); */
			
		} else if (CURR_CAT == "riffs") {
			var vid = document.createElement("video");
			vid.controls = true;
			vid.volume = 0.5;
			vid.src = "/static/videos/"+user_data[CURR_CAT][num].split("\t")[0]+".mp4";
			vid.style.width = "250px";
			body.appendChild(vid);
			data = [user_data["riff_titles"][num].title];
		} else {
			data = user_data[CURR_CAT][num].split("<br>");
		}
		for (var j = 0; j < data.length; ++j) {
			var txt = data[j].replace(/&#34;/g, "\"");
			body.appendChild(document.createTextNode(txt));
			if (j + 1 != data.length) {
				body.appendChild(document.createElement("br"));
			}
		}
	}
	if (CURR_CAT == "quotes") {
		span.appendChild(body);
		span.appendChild(document.createTextNode(extra_data["artist"]));
		//span.appendChild(document.createTextNode("{} ({})".format(extra_data["artist"],extra_data["source"])));
	} else if (CURR_CAT == "lyrics") {
		span.appendChild(body);
		span.appendChild(document.createTextNode(extra_data["source"]));
		span.appendChild(document.createElement("br"));
		span.appendChild(document.createTextNode(extra_data["artist"]));
	} else {
		span.appendChild(body);
	}
	div.appendChild(span);
	return div;
}

function increment_cat_count() {
	var cat = document.getElementById(CURR_CAT);
	var num = parseInt(cat.innerText.split("(")[1].split(")")[0]);
	cat.innerText = "{} ({})".format(CURR_CAT.replace("_", " "), num + 1);
}

function show_darkened_back() {
	document.getElementById("darkened_back").style.display = "flex";
}

function hide_darkened_back() {
	document.getElementById("darkened_back").style.display = "none";
}

function insertAfter(ref_node, new_node) {
	ref_node.parentNode.insertBefore(new_node, ref_node.nextSibling);
}

function allowDrop(ev) {
	ev.preventDefault();
}

function drop(ev) {
	ev.preventDefault();
	var sp = ev.target.id.split("_");
	DROPPING = parseInt(sp[sp.length - 1]);
	var data = ev.dataTransfer.getData("text");
	data = document.getElementById(data);

	console.log(ev, ev.target.id, DRAGGING, DROPPING);
	var target_id = ev.target.id;
	if (ev.tagName == "VIDEO") {
		target_id = ev.target.parentNode.parentNode.id;
		DROPPING = target_id;
	} else if (!target_id || target_id == "") {
		target_id = ev.target.parentNode.id;
		DROPPING = target_id;
	}
	if (DRAGGING === "add") {
		data = create_cat_item("new");
		if (!data) { return; }
	}

	if (target_id !== "item_content") {
		if (DRAGGING !== "add" && DRAGGING < DROPPING) {
			if (target_id.startsWith("cat_item_")) {
				insertAfter(ev.target, data);
			} else {
				// id is just a NUM (dropped inside a span)
				var div = document.getElementById("cat_item_"+target_id);
				insertAfter(div, data);
			}
		} else {
			var div;
			if (DROPPING == 0) {
				// making #1 rank
				div = document.getElementById("cat_item_add");
			} else {
				div = document.getElementById("cat_item_"+(DROPPING-1));
			}
			insertAfter(div, data);
		}
	} else {
		ev.target.appendChild(data);
	}
	reassign_ids();
}

function drag(ev) {
	console.log("DRAG",ev);
	var sp = ev.target.id.split("_");
	if (sp[sp.length - 1] === "add") {
		DRAGGING = "add";
	} else {
		DRAGGING = parseInt(sp[sp.length - 1]);
	}
	ev.dataTransfer.setData("text", ev.target.id);
}