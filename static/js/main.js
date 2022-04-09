
var DRAGGING, DROPPING;
var CURR_CAT;
let EDITING = "";
var ALL_CATS = [];
var changes = [];
var CONDENSE = false;

function reassign_ids(fromId, toId, no_backend=undefined) {
	// rearrange frontend ids
	let tierOrder = {};
	let isNew = 0, newVal = "";

	let catItems = document.getElementsByClassName("cat_items");
	let idx = 0;
	for (let item of catItems) {
		item.id = `catItem${idx}`;
		item.getElementsByTagName("div")[0].id = idx;
		item.getElementsByTagName("img")[0].id = idx;
		idx++;
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
	var div = document.createElement("div");
	const badge = document.createElement("span");
	badge.className = "badge";
	badge.innerText = "0";
	div.id = cat_id;
	div.onclick = (function(cat) {
		return function() {
			click_category(cat)
		}
	})(cat_id);
	div.appendChild(badge);
	const name = document.createElement("p");
	name.innerText = val;
	div.appendChild(name);
	div.appendChild(document.createTextNode(val));
	var last_cat = document.getElementById(ALL_CATS[ALL_CATS.length - 1]);
	ALL_CATS.push(cat_id);
	user_data[cat_id] = [];
	autocomplete[cat_id] = [];

	document.getElementById("add_cat_span").remove();
	insertAfter(last_cat, div);
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
	if (cat === "add_cat_btn") {
		add_category();
		return;
	} else if (CURR_CAT === cat) {
		return;
	}

	if (CURR_CAT !== undefined) {
		document.getElementById(CURR_CAT).className = "";
	}
	CURR_CAT = cat;
	let mainContent = document.getElementById("main_content");
	let itemContent = document.createElement("div");
	itemContent.id = "item_content";
	mainContent.innerHTML = "";

	// favorites row
	const favoritesDiv = document.createElement("div");
	favoritesDiv.id = "favoritesDiv";
	// 7 first are the favorites
	const len = user_data[cat].length < 7 ? user_data[cat].length : 7;
	for (let i = 0; i < len; ++i) {
		favoritesDiv.appendChild(createCatSeperator(i));
		favoritesDiv.appendChild(createCatItem(i));
	}
	favoritesDiv.appendChild(createCatSeperator(7));
	itemContent.appendChild(favoritesDiv);

	// add row
	if (cat != "quotes") {
		const addRow = document.createElement("div");
		addRow.className = "addRow";
		addRow.innerText = "Add Item [+]";
		addRow.onclick = function(event) {
			editCatItem("adding");
		};
		itemContent.appendChild(addRow);
	}
	
	let tierDiv = document.createElement("div");
	tierDiv.id = "tier_div";
	for (var i = 7; i < user_data[cat].length; ++i) {
		tierDiv.appendChild(createCatSeperator(i));
		tierDiv.appendChild(createCatItem(i));
	}
	itemContent.appendChild(tierDiv);

	document.getElementById(cat).className = "clicked_header";
	mainContent.appendChild(itemContent);

}

// from overview page -> detailed page
function expand_category(cat) {
	document.getElementById("categoryHeaders").style.display = "flex";
	var cats = document.getElementById("categoryHeaders").getElementsByTagName("span");
	for (var i = 0; i < cats.length; ++i) {
		cats[i].style.opacity = 1;
	}
	click_category(cat);
}

// HANDLERS

function saveItem() {
	let url = document.getElementById("urlInput").value;
	let adding = false;
	let num;
	let title;
	const totItems = user_data[CURR_CAT].length;
	if (EDITING == "adding") {
		adding = true;
		num = totItems;
		title = document.getElementById("searchInput").value;
	} else {
		num = parseInt(EDITING);
		title = user_data[CURR_CAT][num];
	}

	let xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			document.body.classList.remove("wait");
			document.getElementById("darkened_back").style.display = "none";
			document.getElementById("edit_dialog").style.display = "none";

			if (EDITING == "adding") {
				user_data[CURR_CAT].push(title);
				let div = document.getElementById("tier_div");
				if (totItems < 7) {
					div = document.getElementById("favoritesDiv");
				}

				div.append(createCatSeperator(num));
				div.append(createCatItem(num));
				document.getElementById("tier_div").scrollTo(0, document.body.scrollHeight)
			} else {
				let img = document.getElementById("catItem"+num).getElementsByTagName("img")[0];
				img.src = "/static/pics/"+CURR_CAT+"/"+title.replace(/ |:|&|'|"|\(|\)|\./g, "")+".jpg";
			}
			document.getElementById("urlInput").value = "";
		}
	};
	if (url && title) {
		document.body.classList.add("wait");
		const encodedUrl = `/profile/${user}/get_pic?url=${encodeURIComponent(url)}&cat=${CURR_CAT}&title=${encodeURIComponent(title)}&adding=${adding}`;
		xhr.open("POST", encodedUrl);
		xhr.send();
	}
}

document.getElementById("saveItemButton").onclick = function() {
	saveItem();
};

document.getElementById("urlInput").addEventListener("keyup", function(event) {
	if (event.keyCode == 13) {
		event.preventDefault();
		saveItem();
	}
});

document.getElementById("header").getElementsByTagName("h1")[0].onclick = function() {
	window.location.reload();
};

var categories = document.getElementsByClassName("categoryBox");
for (var i = 0; i < categories.length; ++i) {
	var cat_name = categories[i].getElementsByClassName("category_header")[0].innerText.split(" (")[0];
	categories[i].onclick = (function(cat) {
		return function() {
			expand_category(cat);
		}
	})(cat_name);
}

categories = document.getElementById("categoryHeaders").getElementsByTagName("div");
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

/*
document.getElementById("screenshot").onclick = function() {
	const items = document.getElementsByClassName("cat_items");

	for (let item of items) {
		html2canvas(item).then((canvas) => {
			let base64image = canvas.toDataURL("image/png");
			let formData = new FormData();
			formData.append("screenshot", base64image.replace("data:image/png;base64,", ""));
			const caption = item.getElementsByTagName("figcaption");
			const title = caption[0].innerText.replace("\n", " ");
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
*/

function downloadImage(data) {
	let a = document.createElement("a");
	a.href = data;
	a.download = "/static/"+user+"/screenshot";
	document.body.appendChild(a);
	a.click();
}
