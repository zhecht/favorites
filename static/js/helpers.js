
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

	var autocomplete = document.createElement("div");
	autocomplete.id = "cat_item_add_autocomplete";
	autocomplete.className = "autocomplete";

	var input = document.createElement("input");
	input.placeholder = "Add / Search Favorite";
	input.id = "cat_item_add_input";
	input.type = "text";

	autocomplete.appendChild(input);

	var span = document.createElement("span");
	span.id = "cat_item_add_text";
	span.innerText = "Drag to desired rank when complete";
	span.style.display = "none";

	div.appendChild(autocomplete);
	div.appendChild(span);

	return div;
}

function create_cat_item(num) {
	var div = document.createElement("div");
	var source;
	div.className = "cat_items";
	div.id = "cat_item_"+num;
	div.draggable = true;
	if (CURR_CAT == "quotes" || CURR_CAT == "lyrics") {
		div.style.width = "300px";
	}

	div.ondragstart = function(event){
		drag(event);
	};
	var span = document.createElement("span");
	var circle = document.createElement("div");
	var body = document.createElement("div");
	circle.className = "circle";
	circle.innerText = num+1;
	span.id = num;
	span.appendChild(circle);
	if (num === "new") {
		var new_text = document.getElementById("cat_item_add_input").value;
		if (!new_text || user_data[CURR_CAT].indexOf(new_text) !== -1) {
			return false;
		}
		body.appendChild(document.createTextNode(new_text));
	} else {
		var data, extra_data = {};
		if (user_data[CURR_CAT][num].indexOf("|") != -1) {
			body.style["text-align"] = "left";
			data = user_data[CURR_CAT][num].split("|");
			if (CURR_CAT == "lyrics" || CURR_CAT == "quotes") {
				body.appendChild(document.createTextNode("\""));
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
			
		} else {
			data = user_data[CURR_CAT][num].split("<br>");
		}
		for (var j = 0; j < data.length; ++j) {
			body.appendChild(document.createTextNode(data[j]));
			if (j + 1 != data.length) {
				body.appendChild(document.createElement("br"));
			}
		}
	}
	if (CURR_CAT == "lyrics" || CURR_CAT == "quotes") {
		body.appendChild(document.createTextNode("\""));
		//span.appendChild(document.createElement("br"));
		span.appendChild(body);
		span.appendChild(document.createTextNode("{} ({})".format(extra_data["artist"],extra_data["source"])));
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
	console.log(ev.target.id, DRAGGING, DROPPING);
	if (DRAGGING === "add") {
		data = create_cat_item("new");
		if (!data) { return; }
	}

	if (ev.target.id !== "item_content") {
		if (DRAGGING !== "add" && DRAGGING < DROPPING) {
			if (ev.target.id.startsWith("cat_item_")) {
				insertAfter(ev.target, data);
			} else {
				// id is just a NUM (dropped inside a span)
				var div = document.getElementById("cat_item_"+ev.target.id);
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