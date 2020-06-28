



function init_autocomplete(input, arr) {
	var current_focus;
	input.addEventListener("input", function(e) {
		var div,match_div,val = this.value;
		closeAllLists();
		if (!val) { return false; }
		current_focus -=1;
		div = document.createElement("div");
		div.id = this.id+"autocomplete-list";
		div.className = "autocomplete-items";
		this.parentNode.appendChild(div);

		for (var i = 0; i < arr.length; ++i) {
			if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
				var bold = document.createElement("b");
				bold.innerText = arr[i].substr(0, val.length);
				match_div = document.createElement("div");
				match_div.appendChild(bold);
				match_div.appendChild(document.createTextNode(arr[i].substr(val.length)));
				// hidden val for array item's value
				match_div.addEventListener("click", function(e) {
					//input.value = this.getElementsByTagName("input")[0].value;
					input.value = this.innerText;
					closeAllLists();
				});
				div.appendChild(match_div);
			}
		}
	});
	input.addEventListener("keydown", function(e) {
		var div = document.getElementById(this.id + "autocomplete-list");
		if (div) div = div.getElementsByTagName("div");
		if (e.keyCode == 40) { // down
			current_focus++;
			addActive(div);
		} else if (e.keyCode == 38) { // up
			current_focus--;
			addActive(div);
		} else if (e.keyCode == 13) {
			e.preventDefault();
			if (current_focus > -1) {
				if (div) div[current_focus].click();
			}
		}
	});
	function addActive(div) {
		if (!div) return false;
		removeActive(div);
		if (current_focus >= div.length) current_focus = 0;
		if (current_focus < 0) current_focus = (div.length - 1);
		div[current_focus].classList.add("autocomplete-active");
	}
	function removeActive(div) {
		for (var i = 0; i < div.length; ++i) {
			div[i].classList.remove("autocomplete-active");
		}
	}
	function closeAllLists(el) {
		var div = document.getElementsByClassName("autocomplete-items");
		for (var i = 0; i < div.length; ++i) {
			if (el != div[i] && el != input) {
				div[i].parentNode.removeChild(div[i]);
			}
		}
	}
}

document.addEventListener("click", function(e) {
	//closeAllLists(e.target);
});