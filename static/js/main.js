
var DRAGGING, DROPPING;
var CURR_CAT;
let EDITING = "";
var ALL_CATS = [];
var changes = [];
var CONDENSE = false;

function reassign_ids(fromId, toId, no_backend=undefined) {
	let tierDivs = document.getElementsByClassName("tier_div");
	let tierOrder = {};
	let isNew = 0, newVal = "";

	for (let tierDiv of tierDivs) {
		let tier = tierDiv.getElementsByTagName("label")[0].id;
		let catItems = tierDiv.getElementsByClassName("cat_items");
		let idx = 0;
		for (let item of catItems) {
			item.id = `cat_item_${tier}_${idx}`;
			item.getElementsByTagName("div")[0].id = idx;
			idx++;
		}
	}
	if (no_backend) {
		return;
	}
	let URL = `/profile/${user}/reassign?cat=${CURR_CAT}&isNew=${isNew}&fromId=${fromId}&toId=${toId}`;
	if (isNew) {
		URL += `&newVal=${newVal}`;
	}
	var xhr = new XMLHttpRequest();
	xhr.open("POST", URL);
	xhr.send();
	if (isNew) {
		reset_add_div();
		increment_cat_count();
		user_data[CURR_CAT] = newData;
	}
}

function reset_add_div() {
	var add_div = document.getElementById("cat_item_add");
	var add_input = document.getElementById("cat_item_add_input");
	add_div.draggable = false;
	add_input.value = "";
	for (var i = 0; i < add_div.children.length; ++i) {
		if (add_div.children[i].id === "add_text") {
			add_div.children[i].style["vertical-align"] = "middle";
			add_div.children[i].style["padding-top"] = "0";
			add_div.children[i].style.display = "table-cell";
		} else {
			add_div.children[i].style.display = "none";
		}
	}
}

function save_category() {
	var val = document.getElementById("add_cat_input").value;
	if (!val) {
		return;
	}
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "/profile/{}/add_cat?cat={}".format(user, val));
	xhr.send();

	var cat_id = val.replace(" ", "_").toLowerCase();
	var span = document.createElement("span");
	span.id = cat_id;
	span.innerText = "{} (0)".format(val);
	span.onclick = (function(cat) {
		return function() {
			click_category(cat)
		}
	})(cat_id);
	var last_cat = document.getElementById(ALL_CATS[ALL_CATS.length - 1]);
	ALL_CATS.push(cat_id);
	user_data[cat_id] = [];
	autocomplete[cat_id] = [];

	document.getElementById("add_cat_span").remove();
	insertAfter(last_cat, span);
	document.getElementById(cat_id).click();
}

function add_category() {
	var last_cat = document.getElementById(ALL_CATS[ALL_CATS.length - 1]);
	var span = document.createElement("span");
	var input = document.createElement("input");
	var btn = document.createElement("button");
	span.id = "add_cat_span";
	
	input.id = "add_cat_input";
	input.type = "text";
	input.placeholder = "Add / Search New Category";
	
	btn.id = "add_cat_save";
	btn.innerText = "Save";
	btn.onclick = function() {
		save_category();
	}

	span.appendChild(input);
	span.appendChild(btn);
	insertAfter(last_cat, span);
	input.focus();
}

function add_category_item() {
	var add_div = document.getElementById("cat_item_add");
	var add_div_span = add_div.getElementsByTagName("span")[0];
	add_div_span.style["vertical-align"] = "top";
	document.getElementById("add_text").style.display = "block";
	document.getElementById("cat_item_add_text").style.display = "block";
	var input = document.getElementById("cat_item_add_input");
	var duration_div = document.getElementById("cat_item_add_input_duration_div");

	if (CURR_CAT == "riffs") {
		duration_div.style.display = "flex";
		input.placeholder = "Youtube timestamped link";
	} else if (CURR_CAT == "songs") {
		input.placeholder = "Artist";
		var song_input = document.getElementById("cat_item_add_song_input");
		song_input.style.display = "inline-flex";
	} else {
		duration_div.style.display = "none";
		input.placeholder = "Add / Search Favorite"
		init_autocomplete(input, autocomplete[CURR_CAT]);
	}
	add_div.draggable = true;
	add_div.ondragstart = function(event) {
		drag(event);
	}
	document.getElementById("cat_item_autocomplete_div").style.display = "flex";
	if (CURR_CAT != "riffs") {
		input.focus();
	}
}

function parseTier(label) {
	if (label == "infinite") {
		return "Infinite Replayability";
	}
	return label.charAt(0).toUpperCase()+label.substr(1);
}

function click_category(cat) {
	if (CURR_CAT !== undefined) {
		document.getElementById(CURR_CAT).className = "";
	}
	if (cat === "add_cat_btn") {
		add_category();
		return;
	} else if (CURR_CAT === cat) {
		return;
	}
	CURR_CAT = cat;
	let mainContent = document.getElementById("main_content");
	let itemContent = document.createElement("div");
	itemContent.id = "item_content";
	mainContent.innerHTML = "";

	// add row
	const addRow = document.createElement("div");
	addRow.className = "addRow";
	addRow.innerText = "Add (+)";
	itemContent.appendChild(addRow);
	
	let tierDiv = document.createElement("div");
	tierDiv.className = "tier_div";
	for (var i = 0; i < user_data[cat].length; ++i) {
		tierDiv.appendChild(create_cat_item(i));
	}
	itemContent.appendChild(tierDiv);

	document.getElementById(cat).className = "clicked_header";
	mainContent.appendChild(itemContent);

	if (cat == "quotes") {
		for (let item of document.getElementsByClassName("cat_items")) {
			item.style.width = "25%";
		}
	} else if (cat == "riffs" || cat == "memories") {
		for (let item of document.getElementsByClassName("cat_items")) {
			item.style.width = "20%";
		}
	} else if (cat == "lyrics") {
		for (let item of document.getElementsByClassName("cat_items")) {
			item.style.width = "33%";
		}
	} else {
		for (item of document.getElementsByClassName("cat_items")) {
			item.style.width = "15%";
		}
	}
}

// from overview page -> detailed page
function expand_category(cat) {
	document.getElementById("content").style["flex-direction"] = "row";
	document.getElementById("main_content").style["width"] = "80%";
	document.getElementById("category_headers").style.display = "flex";
	var cats = document.getElementById("category_headers").getElementsByTagName("span");
	for (var i = 0; i < cats.length; ++i) {
		cats[i].style.opacity = 1;
	}
	click_category(cat);
}


// HANDLERS
document.getElementById("downloadUrl").onclick = function() {
	let url = document.getElementById("urlInput").value;
	let tier = EDITING.split("_")[0];
	let num = parseInt(EDITING.split("_")[1]);
	let title = user_data[CURR_CAT][tier][num];
	let xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			document.getElementById("darkened_back").style.display = "none";
			document.getElementById("edit_dialog").style.display = "none";
			console.log(tier, document.getElementById(tier).parentNode);
			let img = document.getElementById(tier).parentNode.getElementsByTagName("div")[num].getElementsByTagName("img")[0];
			img.src = "/static/pics/"+tier+"/"+title.replace(/ |:|&|'|"|\(|\)|\./g, "")+".jpg";
			document.getElementById("urlInput").value = "";
		}
	};
	xhr.open("POST", `/profile/${user}/get_pic?url=${url}&cat=${CURR_CAT}&title=${title}`);
	xhr.send();
};

document.getElementById("header").onclick = function() {
	window.location.reload();
};

var categories = document.getElementsByClassName("category_box");
for (var i = 0; i < categories.length; ++i) {
	var cat_name = categories[i].getElementsByClassName("category_header")[0].innerText.split(" (")[0];
	categories[i].onclick = (function(cat) {
		return function() {
			expand_category(cat);
		}
	})(cat_name);
}

categories = document.getElementById("category_headers").getElementsByTagName("span");
for (var i = 0; i < categories.length; ++i) {
	if (categories[i].id !== "add_cat_btn") {
		ALL_CATS.push(categories[i].id);
	}
	categories[i].onclick = (function(cat) {
		return function() {
			click_category(cat);
		}
	})(categories[i].id);
}

var main_content = document.getElementById("main_content");
main_content.ondrop = function(event) {
	drop(event);
}

main_content.ondragover = function(event) {
	allowDrop(event);
}

document.getElementById("screenshot").onclick = function() {
	const items = document.getElementsByClassName("cat_items");

	for (let item of items) {
		html2canvas(item).then((canvas) => {
			let base64image = canvas.toDataURL("image/png");
			let formData = new FormData();
			formData.append("screenshot", base64image.replace("data:image/png;base64,", ""));
			const divs = item.getElementsByTagName("div");
			const title = divs[0].innerText+divs[1].innerText;
			formData.append("path", title);
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {
					
				}
			};
			//console.log("/static/"+user+"/screenshot?data="+encodeURI(base64image))
			//xhr.open("POST", "/static/"+user+"/screenshot?data="+encodeURI(base64image.split("base64,")[1]));
			xhr.open("POST", "/profile/"+user+"/screenshot");
			xhr.send(formData);
			//window.location.href = base64image;
		});
	}
}

function downloadImage(data) {
	let a = document.createElement("a");
	a.href = data;
	a.download = "/static/"+user+"/screenshot";
	document.body.appendChild(a);
	a.click();
}

/*
var edit_dialog = document.getElementById("edit_dialog");
edit_dialog.getElementsByClassName("save")[0].onclick = function() {
	save_cat_item_edit();
};
edit_dialog.getElementsByClassName("remove")[0].onclick = function() {
	remove_cat_item();
};
edit_dialog.getElementsByClassName("cancel")[0].onclick = function() {
	cancel_edit();
};*/