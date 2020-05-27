
import argparse
import os
import json


# Before throwing files back on github, make a central JSON file for each user. 
# This way, we don't have to save thousands of files
def convert_to_json(all_users):
	for user in all_users:
		j = {}
		files = os.listdir("static/users/{}".format(user))
		for f in files:
			if f == "favorites.json":
				continue
			j[f] = []
			lines = open("static/users/{}/{}".format(user, f))
			for line in lines:
				j[f].append(line.rstrip())
			os.remove("static/users/{}/{}".format(user, f))
		with open("static/users/{}/favorites.json".format(user), "w") as fh:
			json.dump(j, fh, indent=4)
	return

# Take the single JSON file and make all the text files
def convert_from_json(all_users):
	for user in all_users:
		if not os.path.exists("static/users/{}/favorites.json".format(user)):
			continue
		with open("static/users/{}/favorites.json".format(user)) as fh:
			j = json.loads(fh.read())

		for f in j:
			data = "\n".join(j[f])
			with open("static/users/{}/{}".format(user, f), "w") as fh:
				fh.write(data)
	return

def read_favorites_json(user):
	with open("static/users/{}/favorites.json".format(user)) as fh:
		j = json.loads(fh.read())
	return j

def write_favorites_json(favorites, user):
	with open("static/users/{}/favorites.json".format(user), "w") as fh:
		json.dump(favorites, fh, indent=4)
	return

if __name__ == '__main__':
	parser = argparse.ArgumentParser()
	parser.add_argument("-convert_to_json", "--convert_to_json", action="store_true", help="Convert users data to JSON")
	parser.add_argument("-convert_from_json", "--convert_from_json", action="store_true", help="Convert users JSON into individual files")
	parser.add_argument("-u", "--user", help="Choose a specific user rather than ALL")

	args = parser.parse_args()

	all_users = os.listdir("static/users")
	if args.user:
		all_users = [args.user]

	if args.convert_to_json:
		convert_to_json(all_users)
	elif args.convert_from_json:
		convert_from_json(all_users)