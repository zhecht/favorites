
import argparse
import json
import os
import re
import urllib.request

from bs4 import BeautifulSoup as BS

def formatUrl(txt):
	return txt.replace(":", "").replace("(", "").replace(")", "").replace(" ", "").replace("&","").replace("'", "").replace("\"", "").replace(".", "")

def scrape_imdb(filename, title_type, start=1):
	done = False
	all_tv = []
	while not done:
		print(start)
		imdb_url = "https://www.imdb.com/search/title/?title_type={}&view=simple&start={}".format(title_type, start)
		html = urllib.request.urlopen(imdb_url).read().decode("utf-8")
		soup = BS(html, "lxml")
		#with open("out.html", "w") as fh:
		#	fh.write(html)
		rows = soup.find_all("div", class_="lister-item-content")
		imgs = soup.find_all("div", class_="lister-item-image")
		for idx, row in enumerate(rows):
			url = imgs[idx].find("img").get("loadlate")
			try:
				idx = url.index("_UY") if "_UY" in url else url.index("_UX")
				url = url[:idx] + "_UX182_CRO,0,182,268_AL_.jpg"
			except:
				print(url)
				continue
			show = row.find("a").text
			formattedShow = formatUrl(show)
			all_tv.append(show)
			os.system(f"curl -ks \"{url}\" -o static/pics/{filename}/{formattedShow}.jpg")
		start += 50
		if start >= 1001 and start % 1001 == 0:
			with open("static/scrape/{}.txt".format("shows" if filename == "tv" else filename), "w") as fh:
				fh.write("\n".join(all_tv))

	with open("static/scrape/{}.txt".format(filename), "w") as fh:
		fh.write("\n".join(all_tv))

def scrapeGames(start=1):
	url = "https://store.steampowered.com/search/?category1=998%2C996&filter=topsellers"
	html = urllib.request.urlopen(url).read().decode("utf-8")
	soup = BS(html, "lxml")
	#with open("out.html", "w") as fh:
	#	fh.write(html)
	allGames = []
	if 0:
		for row in soup.find("a", class_="search_result_row"):
			url = row.find("img").get("src").replace("capsule_sm_120", "header")
			title = row.find("span", class_="title").text.replace("™","").replace("®","")
			allGames.append(title)
			os.system(f"curl -ks \"{url}\" -o static/pics/games/{formatUrl(title)}.jpg")

	start = 50
	while 1:
		url = f"https://store.steampowered.com/search/results/?query=&start={start}&count=50&dynamic_data=&force_infinite=1&category1=998,996&filter=topsellers&snr=1_7_7_7000_7&infinite=1"
		os.system(f"curl -ks \"{url}\" -o static/scrape/out")
		with open("static/scrape/out") as fh:
			html = json.load(fh)

		titles = re.findall(r"<span class=\"title\">(.*)<\/span>", html["results_html"])
		urls = re.findall(r"<img src=\"(.*)\"", html["results_html"])
		for idx, title in enumerate(titles):
			title = title.replace("™","").replace("®","")
			url = urls[idx].replace("capsule_sm_120", "header")
			allGames.append(title)
			os.system(f"curl -ks \"{url}\" -o static/pics/games/{formatUrl(title)}.jpg")
		
		start += 50
		if start >= 501 and start % 501 == 0:
			with open("static/scrape/games.txt", "w") as fh:
				fh.write("\n".join(allGames))

	with open("static/scrape/games.txt", "w") as fh:
		fh.write("\n".join(allGames))

def scrape_podcasts(start=1):
	done = False
	all_pods = []
	while not done:
		print(start)
		url = "https://www.chartable.com/charts/itunes/us-all-podcasts-podcasts"
		html = urllib.request.urlopen(url).read().decode("utf-8")
		rows = BS(html, "lxml").find("table").find_all("tr")
		#with open("out.html", "w") as fh:
		#	fh.write(html)
		for row in rows:
			url = row.find("img").get("data-src")
			pod = row.find("a", class_="link").text
			all_pods.append(pod)
			formattedPod = formatUrl(pod)
			os.system(f"curl -ks \"{url}\" -o static/pics/podcasts/{formattedPod}.png")
			#print(pod, img)
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
	parser.add_argument("-g", "--games", help="Scrape Games from Metacritic", action="store_true")
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
	elif args.games:
		scrapeGames(start)
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