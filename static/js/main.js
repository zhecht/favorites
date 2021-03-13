
var DRAGGING, DROPPING;
var CURR_CAT;
var EDITING;
var ALL_CATS = [];
var changes = [];
var CONDENSE = false;

function reassign_ids(no_backend=undefined) {
	var cat_items = document.getElementsByClassName("cat_items");
	var new_order = [];
	var new_data = [];
	var isNew = 0, new_val = "";
	for (var i = 0; i < cat_items.length; ++i) {
		var sp = cat_items[i].id.split("_");
		new_order.push(sp[sp.length - 1]);
		if (sp[sp.length - 1] === "new") {
			isNew = 1;
			if (CURR_CAT == "riffs") {
				new_val = cat_items[i].getElementsByTagName("video")[0].src.split("/");
				new_val = new_val[new_val.length - 1].split(".mp4")[0];
			} else {
				new_val = cat_items[i].getElementsByTagName("div")[1].innerText;
			}
		}
		//reset ids
		cat_items[i].id = "cat_item_"+i;
		cat_items[i].getElementsByTagName("span")[0].id = i;
		cat_items[i].getElementsByClassName("circle")[0].innerText = i + 1;
		new_data.push(cat_items[i].getElementsByTagName("div")[1].innerText);
	}
	if (no_backend) {
		return;
	}
	var URL = "/profile/{}/reassign?cat={}&order={}&is_new={}".format(user, CURR_CAT, new_order.join(","), isNew);
	if (isNew) {
		URL += "&new_val={}".format(new_val);
	}
	var xhr = new XMLHttpRequest();
	xhr.open("POST", URL);
	xhr.send();
	if (isNew) {
		reset_add_div();
		increment_cat_count();
		user_data[CURR_CAT] = new_data;
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
	var item_content = document.getElementById("item_content");
	item_content.innerHTML = "";
	item_content.appendChild(get_category_add_html());

	//var section = document.createElement("div");
	//section.className = "section";
	var len = user_data[cat].length;
	var width = 100 / Math.ceil(len / 8);
	//section.style.width = width+"%";
	for (var i = 0; i < len; ++i) {
		if (CONDENSE) {
			item_content.appendChild(create_cat_item(i));
			/*
			section.appendChild(create_cat_item(i));
			if (i >= 8 && i % 8 == 0) {
				item_content.appendChild(section);
				section = document.createElement("div");
				section.className = "section";
				section.style.width = width+"%";
			}*/
		} else {
			item_content.appendChild(create_cat_item(i));
		}
	}
	if (CONDENSE) {
		//item_content.appendChild(section);
	}
	document.getElementById(cat).className = "clicked_header";
}

// from overview page -> detailed page
function expand_category(cat) {
	document.getElementById("content").style.height = "auto";
	document.getElementById("category_headers").style.display = "flex";
	var cats = document.getElementById("category_headers").getElementsByTagName("span");
	for (var i = 0; i < cats.length; ++i) {
		cats[i].style.opacity = 1;
	}
	click_category(cat);
}


// HANDLERS
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

var item_content = document.getElementById("item_content");
item_content.ondrop = function(event) {
	drop(event);
}

item_content.ondragover = function(event) {
	allowDrop(event);
}

var edit_dialog = document.getElementById("edit_dialog");
edit_dialog.getElementsByClassName("save")[0].onclick = function() {
	save_cat_item_edit();
};
edit_dialog.getElementsByClassName("remove")[0].onclick = function() {
	remove_cat_item();
};
edit_dialog.getElementsByClassName("cancel")[0].onclick = function() {
	cancel_edit();
};