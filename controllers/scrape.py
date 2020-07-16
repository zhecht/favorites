
import argparse
import urllib.request

from bs4 import BeautifulSoup as BS

def scrape_imdb(filename, title_type, start=1):
	done = False
	all_tv = []
	while not done:
		print(start)
		imdb_url = "https://www.imdb.com/search/title/?title_type={}&view=simple&start={}".format(title_type, start)
		html = urllib.request.urlopen(imdb_url).read().decode("utf-8")
		rows = BS(html, "lxml").find_all("div", class_="lister-item-content")
		for row in rows:
			show = row.find("a").text
			all_tv.append(show)
		
		start += 50
		if start >= 1001 and start % 1001 == 0:
			with open("static/scrape/{}.txt".format(filename), "w") as fh:
				fh.write("\n".join(all_tv))

	with open("static/scrape/{}.txt".format(filename), "w") as fh:
		fh.write("\n".join(all_tv))

def scrape_podcasts():
	done = False
	all_pods = []
	while not done:
		print(start)
		url = "https://www.chartable.com/charts/itunes/us-all-podcasts-podcasts"
		html = urllib.request.urlopen(url).read().decode("utf-8")
		rows = BS(html, "lxml").find("table").find_all("tr")
		for row in rows:
			pod = row.find("a", class_="link").text
			all_pods.append(pod)
		print(all_pods)
		return
		start += 100
		if start >= 1001 and start % 1001 == 0:
			with open("static/scrape/podcasts.txt", "w") as fh:
				fh.write("\n".join(all_pods))

	with open("static/scrape/podcasts.txt", "w") as fh:
		fh.write("\n".join(all_pods))

if __name__ == '__main__':
	parser = argparse.ArgumentParser()
	parser.add_argument("-tv", "--tv", help="Scrape TV from IMDB", action="store_true")
	parser.add_argument("-m", "--movies", help="Scrape Movies from IMDB", action="store_true")
	parser.add_argument("-p", "--podcasts", help="Scrape Podcasts from chartable", action="store_true")
	parser.add_argument("-d", "--documentary", help="Scrape Documentaries from IMDB", action="store_true")
	parser.add_argument("-s", "--start", help="Start IDX", type=int)
	args = parser.parse_args()

	start = 1
	if args.start:
		start = args.start

	if args.podcasts:
		scrape_podcasts(start)
		exit()

	title_type = None
	if args.tv:
		title_type = "tv_series"
		filename = "tv"
	elif args.movies:
		title_type = "feature,short"
		filename = "movies"
	elif args.documentary:
		title_type = "documentary"
		filename = "documentaries"

	scrape_imdb(filename, title_type, start)