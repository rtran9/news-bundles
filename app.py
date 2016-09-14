import json
from flask import Flask, render_template, jsonify
from segments import get_data
from apscheduler.schedulers.background import BackgroundScheduler

app = Flask(__name__)

@app.before_first_request
def initialize():
    scheduler = BackgroundScheduler()
    scheduler.add_job(cach_data, 'interval', hours=1)
    scheduler.start()


def cach_data():
	data = get_data()
	with open('static/data/data.json', 'w') as outfile:
		json.dump(data, outfile)

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/data")
def data():
	with open('static/data/data.json') as json_data:
		d = json.load(json_data)
	return jsonify(d)

@app.route("/get_data")
def get_now_data():
	return jsonify(get_data())


if __name__ == "__main__":
    app.run(debug=True)
