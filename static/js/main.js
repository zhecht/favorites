
var DRAGGING, DROPPING;
var CURR_CAT;
var ALL_CATS = [];
var changes = [];

function reassign_ids() {
	var cat_items = document.getElementsByClassName("cat_items");
	var new_order = [];
	var new_data = [];
	var isNew = 0, new_val = "";
	for (var i = 0; i < cat_items.length; ++i) {
		var sp = cat_items[i].id.split("_");
		new_order.push(sp[sp.length - 1]);
		if (sp[sp.length - 1] === "new") {
			isNew = 1;
			new_val = cat_items[i].getElementsByTagName("div")[1].innerText;
		}
		//reset ids
		cat_items[i].id = "cat_item_"+i;
		cat_items[i].getElementsByTagName("span")[0].id = i;
		cat_items[i].getElementsByClassName("circle")[0].innerText = i + 1;
		new_data.push(cat_items[i].innerText);
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
	add_div_span.style["padding-top"] = "50px";
	document.getElementById("add_text").style.display = "block";
	document.getElementById("cat_item_add_text").style.display = "block";
	document.getElementById("cat_item_add_autocomplete").style.display = "block";
	add_div.draggable = true;
	add_div.ondragstart = function(event) {
		drag(event);
	}
	document.getElementById("cat_item_add_input").focus();
}

function click_category(cat) {
	if (CURR_CAT !== undefined) {
		document.getElementById(CURR_CAT).className = "";
	} else if (cat === "add_cat_btn") {
		add_category();
		return;
	} else if (CURR_CAT === cat) {
		return;
	}
	CURR_CAT = cat;
	var item_content = document.getElementById("item_content");
	item_content.innerHTML = "";
	item_content.appendChild(get_category_add_html());
	for (var i = 0; i < user_data[cat].length; ++i) {
		item_content.appendChild(create_cat_item(i));
	}
	document.getElementById(cat).className = "clicked_header";
	init_autocomplete(document.getElementById("cat_item_add_input"), ["test", "test1", "tyest", "testy", "testy2"]);
}


// HANDLERS
var categories = document.getElementById("category_headers").getElementsByTagName("span");
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