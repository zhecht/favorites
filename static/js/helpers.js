
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
	console.log("editing = ",el);
	if (el.target.className == "cat_items") {
		EDITING = el.target.id.split("cat_item_")[1];
	} else if (el.target.tagName == "P") {
		EDITING = el.target.parentNode.parentNode.id.split("cat_item_")[1];
	} else {
		EDITING = el.target.parentNode.id.split("cat_item_")[1];
	}
	document.getElementById("darkened_back").style.display = "flex";
	document.getElementById("edit_dialog").style.display = "flex";
	document.getElementById("urlInput").focus();
	//document.getElementById("edit_input").value = txt;
}

function hover(el) {
	if (CURR_CAT == "quotes" || CURR_CAT == "lyrics") {
		//console.log(el.target.getElementsByTagName("div")[1]);
		//el.target.getElementsByTagName("div")[1].style.overflow = "visible";
	}
}

function create_cat_item(tier, num) {
	let div = document.createElement("div");
	var source;
	div.className = "cat_items";
	div.id = `cat_item_${tier}_${num}`;
	div.draggable = true;
	if (CURR_CAT == "quotes" || CURR_CAT == "lyrics") {
		div.style["text-align"] = "left";
		//div.style.width = "300px";
		//div.style.height = "400px";
		//document.getElementById("cat_item_add").style.width = "300px";
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

	let imgDiv = document.createElement("div");
	imgDiv.className = "imgDiv";
	let img = document.createElement("img");
	let body = document.createElement("div");
	body.className = "itemBody";
	body.id = num;
	if (num === "new") {
		let new_text = document.getElementById("cat_item_add_input").value;
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
					div.appendChild(body);
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
		if (user_data[CURR_CAT][tier][num].indexOf("|") != -1) {
			body.style["overflow-y"] = "auto";
			body.style["max-height"] = "200px";
			body.style["width"] = "80%";
			data = user_data[CURR_CAT][tier][num].split("|");
			if (CURR_CAT == "lyrics" || CURR_CAT == "quotes") {
				extra_data["artist"] = data[0];
				extra_data["source"] = data[1];
			}
			data = data[2].split("<br>");

			img.id = num;
			img.alt = "";
			let c = CURR_CAT;
			let path = encodeURIComponent(extra_data["artist"]+extra_data["source"]);
			console.log(c, path);
			img.src = `/static/pics/${c}/${path}.png`;
			imgDiv.appendChild(img);

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
			vid.src = "/static/videos/"+user_data[CURR_CAT][tier][num].split("\t")[0]+".mp4";
			vid.style.width = "250px";
			body.appendChild(vid);
			data = [user_data["riff_titles"][num].title];
		} else {
			data = user_data[CURR_CAT][tier][num].split("<br>");
			if (data.length == 1) {
				// just a regular field
				img.id = num;
				img.alt = "";
				let c = CURR_CAT;
				if (c == "music_documentaries") {
					c = "documentaries";
				}
				let path = user_data[CURR_CAT][tier][num].replace(/ |:|&|'|"|\(|\)|\./g, "");
				img.src = `/static/pics/${c}/${path}.jpg`
				imgDiv.appendChild(img);
			}
		}
		for (var j = 0; j < data.length; ++j) {
			var txt = data[j].replace(/&#34;/g, "\"");
			let p = document.createElement("p");
			p.id = num;
			p.innerText = txt;
			body.appendChild(p);
		}
	}
	/*
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
	*/
	//div.appendChild(imgDiv);
	if (CURR_CAT == "quotes") {
		let d = document.createElement("div");
		d.style = "font-weight: bold; text-decoration: underline;";
		d.innerText = extra_data["artist"];
		let d2 = document.createElement("div");
		d2.style = "font-style:italic;text-align:center;";
		d2.innerText = extra_data["source"];
		div.appendChild(d);
		div.appendChild(d2);
	}
	div.appendChild(img);
	div.appendChild(body);
	if (CURR_CAT == "lyrics") {
		let hr = document.createElement("hr");
		hr.style.width = "10%";
		let src = document.createElement("div");
		src.innerText = extra_data["source"] + " \u25CF " + extra_data["artist"];
		div.appendChild(src);
	}
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
	let sp = ev.target.id.split("_");
	DROPPING = parseInt(sp[sp.length - 1]);
	let data = ev.dataTransfer.getData("text");
	let fromSplit = data.split("_");
	data = document.getElementById(data);

	var target_id = ev.target.id;
	if (ev.target.className == "tier_div") {
		target_id = ev.target.getElementsByTagName("label")[0].id;
	} else if (ev.tagName == "VIDEO") {
		target_id = ev.target.parentNode.parentNode.id;
		DROPPING = target_id;
	} else {
		if (sp.length == 1) {
			target_id = ev.target.parentNode.id;
		}
		DROPPING = parseInt(sp[sp.length - 1]);
	}

	console.log(ev, ev.target.className, target_id, DRAGGING, DROPPING);
	if (DRAGGING === "add") {
		data = create_cat_item("new");
		if (!data) { return; }
	}

	if (ev.target.tagName == "LABEL") {
		ev.target.parentNode.appendChild(data);
		reassign_ids(data.id, ev.target.id);
	} else if (ev.target.className == "tier_div") {
		ev.target.appendChild(data);
		reassign_ids(data.id, target_id);
	} else if (target_id !== "item_content") {
		let tier = target_id.split("_");
		let fromTier = data.id.split("_");
		let div;
		if (tier[tier.length-2] == fromTier[fromTier.length-2]) {
			let fromNum = parseInt(fromTier[fromTier.length-1]);
			let toNum = parseInt(tier[tier.length-1]);
			console.log(fromNum, toNum);
			if (fromNum < toNum) {
				div = document.getElementById(`cat_item_${tier[tier.length-2]}_${DROPPING}`);
			} else {
				div = document.getElementById(`cat_item_${tier[tier.length-2]}_${DROPPING-1}`);
			}
		} else {
			div = document.getElementById(`cat_item_${tier[tier.length-2]}_${DROPPING}`);
		}
		insertAfter(div, data);
		reassign_ids(data.id, target_id);
	}
	/*
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
	*/
}

function drag(ev) {
	console.log("DRAG",ev);
	let sp = ev.target.id.split("_");
	let tier = sp[sp.length - 2];
	if (sp[sp.length - 1] === "add") {
		DRAGGING = "add";
	} else {
		DRAGGING = parseInt(sp[sp.length - 1]);
	}
	if (ev.target.id.split("_") == 1) {
		ev.dataTransfer.setData("text", ev.target.parentNode.id);
	} else {
		ev.dataTransfer.setData("text", ev.target.id);
	}
}