

from controllers.users import *
from subprocess import check_output, call

import textwrap

def print_categories(favorites, state):
	categories = list(favorites.keys())
	for idx, c in enumerate(categories):
		print("\t{}: {}".format(idx, c))
	print("Which category: ", end="")
	cat_idx = input()
	state["category"] = categories[int(cat_idx)]

def print_question(favorites, state):
	if "category" not in state or not state["category"]:
		print_categories(favorites, state)

	print("cat: {}".format(state["category"]))
	if state["category"] in ["quotes", "lyrics"] or len(favorites[state["category"]]) < 10:
		for idx, data in enumerate(favorites[state["category"]]):
			print("\n\t{}: ".format(idx), end="")
			print_item(data, state["category"])
			#print("{0:8}{1}: {2}".format("", idx, print_item(data, state["category"])))
	else:
		tot_per_column = int(len(favorites[state["category"]]) / 3)
		data1 = favorites[state["category"]][:tot_per_column]
		data2 = favorites[state["category"]][tot_per_column:tot_per_column*2]
		data3 = favorites[state["category"]][tot_per_column*2:]
		for idx, (d1, d2, d3) in enumerate(zip(data1, data2, data3)):
			space = ":"
			if idx < 10:
				space = " :"
			print("\t{0}{1} {2:40} {3}: {4:40} {5}: {6}".format(idx, space, d1, idx + tot_per_column, d2, idx + (tot_per_column * 2), d3))
		if len(data3) > tot_per_column:
			for idx, item in enumerate(data3[tot_per_column:]):
				print("\t{0:92}: {1}".format(idx + tot_per_column + (tot_per_column*2), item))
		
	print("(a)dd, (d)elete, (e)dit, (r)ank, (c)hange, (s)ave: ", end="")
	return input()

def print_item(item, category):
	if category in ["quotes", "lyrics"]:
		data = item.split("|")
		print("{0} - {1}".format(data[0], data[1]))
		lines = data[2].split("\\n")
		for line in lines:
			print(textwrap.fill(line, width=100, initial_indent='\t\t', subsequent_indent='\t\t'))
		return
		#return "{0} - {1}\n\t\t{2}".format(data[0], data[1], data[2].replace("\\n", "\n\t\t"))
	print(item)

def rotate_item(favorites, state, idx, delta):
	item = favorites[state["category"]][idx]
	del favorites[state["category"]][idx]

	if delta == "top":
		new_idx = 0
	elif delta == "bottom":
		new_idx = len(favorites[state["category"]])
	elif delta[0] in ["+", "-"]:
		# +3 means subtract rank by 3 (why we flip the sign)
		new_idx = (int(delta) * -1) + idx
	else:
		new_idx = int(delta)

	favorites[state["category"]].insert(new_idx, item)
	write_favorites_json(favorites, state["user"])

def rank_item(favorites, state, action):
	item_idx = int(action.split(" ")[1])
	delta = action.split(" ")[2]
	rotate_item(favorites, state, item_idx, delta)

def add_item(favorites, state, action):
	new_idx = len(favorites[state["category"]])
	item = " ".join(action.split(" ")[1:])

	if not item:
		# open vim for longer input
		call(["rm", "-f", "add.txt"])
		call(["vim", "add.txt"])
		add_text = open("add.txt").read()
		if add_text:
			item = add_text
	else:
		try:
			# if ranking was given
			new_idx = int(action[-1])
			item = item[:-2]
		except:
			print("no ranking, adding to bottom")

	favorites[state["category"]].insert(new_idx, item.replace("\"", ""))
	write_favorites_json(favorites, state["user"])

def delete_item(favorites, state, action):
	idx = int(action.split(" ")[-1])
	del favorites[state["category"]][idx]
	write_favorites_json(favorites, state["user"])

def save(favorites, state):
	divider = '-'*50
	git_log = check_output(["git", "log"])
	last_commit = "\n".join(git_log.decode("utf8").split("\n")[:6])
	print(divider, "\nGIT LOG\n", divider, "\n", last_commit)

	git_status = check_output(["git", "status"])
	print(divider, "\nGIT STATUS\n", divider, "\n", git_status.decode("utf8"))

	print("Look good? y/n: ", end="")
	should_save = input()

	if should_save == "y":
		check_output(["git", "commit", "-a", "--amend", "--no-edit"]) 
		check_output(["git", "push", "-f"])

if __name__ == '__main__':
	state = {}
	state["user"] = "zhecht"
	if "user" not in state:
		print("enter user: ", end="")
		state["user"] = input()
	favorites = read_favorites_json(state["user"])
	loop = True
	while loop:
		action = print_question(favorites, state)
		command = action.split(" ")[0]
		if command in ["q", "e"]:
			exit()
		elif command in ["s", "save"]:
			save(favorites, state)
		elif command in ["a", "add"]:
			add_item(favorites, state, action)
		elif command in ["d", "delete"]:
			delete_item(favorites, state, action)
		elif command in ["e", "edit"]:
			edit_item(favorites, state, action)
		elif command in ["c", "change"]:
			state["category"] = action[len(command) + 1:]
		elif command == "r" or command == "rank":
			rank_item(favorites, state, action)

