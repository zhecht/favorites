
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

function closeEditDialog() {
	document.getElementById("darkened_back").style.display = "none";
	document.getElementById("edit_dialog").style.display = "none";
}

function editCatItem(el) {
	console.log("editing = ",el);
	const searchInput = document.getElementById("searchInput");
	if (el == "adding") {
		searchInput.value = "";
		EDITING = "adding";
	} else if (el.target.className == "cat_items") {
		EDITING = el.target.id.replace("catItem", "");
	} else if (el.target.tagName == "P") {
		EDITING = el.target.parentNode.parentNode.id.replace("catItem", "");
	} else {
		EDITING = el.target.parentNode.id.replace("catItem", "");
	}
	document.getElementById("darkened_back").style.display = "flex";
	const editDialog = document.getElementById("edit_dialog");
	editDialog.style.display = "flex";
	editDialog.getElementsByTagName("label")[0].innerText = CURR_CAT;
	if (EDITING != "adding") {
		const img = document.getElementById("catItem"+EDITING).getElementsByTagName("img")[0];
		searchInput.value = img.alt;
	}
	init_autocomplete(searchInput, autocomplete[CURR_CAT]);
	searchInput.focus();
}

function hover(el) {
	if (CURR_CAT == "quotes" || CURR_CAT == "lyrics") {
		//console.log(el.target.getElementsByTagName("div")[1]);
		//el.target.getElementsByTagName("div")[1].style.overflow = "visible";
	}
}

function createCatSeperator(num) {
	const div = document.createElement("div");
	div.id = "seperator"+num+"_"+(num+1);
	div.className = "seperator";
	return div;
}

function removeShowingSeperators() {
for (let show of document.querySelectorAll(".seperator.show")) {
		show.classList.remove("show");
	}
}

let DRAGOVER = -1;
function createCatItem(num) {
	let div = document.createElement("div");
	div.className = "cat_items";
	div.id = `catItem${num}`;
	div.draggable = true;

	div.onclick = function(event) {
		editCatItem(event);
	};
	div.ondragstart = function(event){
		drag(event);
	};
	div.onmouseenter = function(event) {
		hover(event);
	};
	div.ondragover = function(event) {
		let n = parseInt(this.id.replace("catItem", ""));
		if (n != DRAGGING && n != DRAGOVER) {
			removeShowingSeperators();
			document.getElementById("seperator"+n+"_"+(n + 1)).classList.add("show");
			DRAGOVER = n;
		}
	}

	let source;
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
		var data, extraData = {};
		// Assuming Quote..Artist..Source
		if (user_data[CURR_CAT][num].indexOf("|") >= 0) {
			data = user_data[CURR_CAT][num].split("|");
			const figure = document.createElement("figure");
			let artist;
			let source;
			if (CURR_CAT == "lyrics" || CURR_CAT == "quotes") {
				artist = data[0];
				source = data[1];
			}
			const str = data[2].split("<br>");
			if (CURR_CAT == "quotes") {
				const block = document.createElement("blockquote");
				for (s of str) {
					const d = document.createElement("div");
					d.innerText = s;
					block.appendChild(d);
				}
				const caption = document.createElement("figcaption");
				const dash = document.createElement("div");
				dash.innerHTML = "&mdash; "+artist;
				caption.appendChild(dash);
				if (source) {
					let cite = document.createElement("cite");
					cite.innerText = source;
					caption.appendChild(cite);
				}
				figure.appendChild(block);
				figure.appendChild(caption);
				div.appendChild(figure);
			}
			
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
			if (data.length == 1) {
				// just a regular field
				img.id = num;
				img.alt = data[0];
				let c = CURR_CAT;
				if (c == "music_documentaries") {
					c = "documentaries";
				}
				let path = user_data[CURR_CAT][num].replace(/ |:|&|'|"|\(|\)|\./g, "");
				img.src = `/static/pics/${c}/${path}.jpg`;
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
	if (CURR_CAT != "quotes") {
		div.appendChild(img);
	}
	div.appendChild(body);
	if (CURR_CAT == "lyrics") {
		let hr = document.createElement("hr");
		hr.style.width = "10%";
		let src = document.createElement("div");
		src.innerText = extra_data["source"] + " \u25CF " + extra_data["artist"];
		div.appendChild(src);
	}

	if (CURR_CAT == "quotes") {
		div.style.width = "33%";
	} else if (CURR_CAT == "riffs" || CURR_CAT == "memories") {
		div.style.width = "20%";
	} else if (CURR_CAT == "lyrics") {
		div.style.width = "33%";
	} else if (CURR_CAT == "books") {
		div.style.width = "7%";
	} else {
		div.style.width = "12%";
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

	// new logic uses seperator showing the placement of the new div
	const sep = document.querySelector(".seperator.show");
	const sepNum = parseInt(sep.id.replace("seperator", "").split("_")[0]);
	DROPPING = sepNum;

	if (DROPPING == DRAGGING || DROPPING == DRAGGING + 1) {
		removeShowingSeperators();
		return;
	}

	let dragEl;
	let dropEl;
	// if DRAGGING into favorites from outside of favorites, kick out last
	if (DRAGGING >= 7 && DROPPING < 7) {
		dragEl = document.getElementById("catItem6");
		dropEl = document.getElementById("catItem7");
		dropEl.before(dragEl);
	} else if (DRAGGING < 7 && DROPPING >= 7) {
		// if DRAGGING from favorites to outside, bring in the first outstanding
		dragEl = document.getElementById("catItem7");
		dropEl = document.getElementById("catItem6");
		dropEl.after(dragEl);
	}

	dragEl = document.getElementById(`catItem${DRAGGING}`);
	dropEl = document.getElementById(`catItem${DROPPING}`);
	// insert the div
	dropEl.before(dragEl);
	// remove any seperator showing
	removeShowingSeperators();
	reassign_ids(DRAGGING, DROPPING);
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