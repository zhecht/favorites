
var DRAGGING, DROPPING;
var changes = [];

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

function insertAfter(ref_node, new_node) {
	ref_node.parentNode.insertBefore(new_node, ref_node.nextSibling);
}

function allowDrop(ev) {
	ev.preventDefault();
}

function reassign_ids() {
	var cat_items = document.getElementsByClassName("cat_items");
	for (var i = 0; i < cat_items.length; ++i) {
		cat_items[i].id = "cat_item_"+i;
	}
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "/profile/{}/reassign?cat={}".format(user))
}

function drop(ev) {
	ev.preventDefault();
	var sp = ev.target.id.split("_");
	DROPPING = parseInt(sp[sp.length - 1]);
	var data = ev.dataTransfer.getData("text");
	if (ev.target.id !== "item_content") {
		console.log(DRAGGING, DROPPING);
		if (DRAGGING < DROPPING) {
			insertAfter(ev.target, document.getElementById(data));
		} else {
			var div = document.getElementById("cat_item_"+(DROPPING-1));
			insertAfter(div, document.getElementById(data));
		}
	} else {
		ev.target.appendChild(document.getElementById(data));
	}
	reassign_ids();
}

function drag(ev) {
	var sp = ev.target.id.split("_");
	DRAGGING = parseInt(sp[sp.length - 1]);
	console.log("DRAG",ev);
	ev.dataTransfer.setData("text", ev.target.id);
}

function click_category(cat) {
	var item_content = document.getElementById("item_content");
	item_content.innerHTML = "";
	var cat_data = user_data[cat];
	for (var i = 0; i < cat_data.length; ++i) {
		var div = document.createElement("div");
		div.className = "cat_items";
		div.id = "cat_item_"+i;
		div.draggable = true;
		div.ondragstart = function(event){
			drag(event);
		};
		for (var j = 0; j < cat_data[i].length; ++j) {
			div.appendChild(document.createTextNode(cat_data[i][j]));
			if (j + 1 != cat_data[i].length) {
				div.appendChild(document.createElement("br"));
			}
		}
		item_content.appendChild(div);
	}
}


// HANDLERS
var categories = document.getElementById("category_headers").getElementsByTagName("span");
for (var i = 0; i < categories.length; ++i) {
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