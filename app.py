import json
from flask import Flask, render_template, jsonify
from segments import get_data
from apscheduler.schedulers.background import BackgroundScheduler

app = Flask(__name__)

def my_listener(event):
    if event.exception:
        print('The job crashed :(')
    else:
        print('The job worked :)')


@app.before_first_request
def initialize():
    scheduler = BackgroundScheduler()
    scheduler.add_job(cach_data, 'interval', minutes=2)
    scheduler.add_listener(my_listener, EVENT_JOB_EXECUTED | EVENT_JOB_ERROR)
    scheduler.start()


def cach_data():
	print ("starting cach data")
	data = get_data()
	with open('static/data/data.json', 'w') as outfile:
		json.dump(data, outfile)
		print ('data saved to file')
	print ("cach data finished")

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
