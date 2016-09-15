import atexit
import json
import time
from flask import Flask, render_template, jsonify
from segments import get_data
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR

app = Flask(__name__)

def my_listener(event):
    if event.exception:
        print('The job crashed :(')
        print ("error(%s): %s"%(event.exception.errno, event.exception.strerror))
    else:
        print('The job worked :)')

def print_date_time():
    print time.strftime("%A, %d. %B %Y %I:%M:%S %p")

@app.before_first_request
def initialize():
    scheduler = BackgroundScheduler()
    print_date_time()
    print("initializing app")
    scheduler.add_job(cache_data, 'interval', hours=1, replace_existing=True)
    scheduler.add_listener(my_listener, EVENT_JOB_EXECUTED | EVENT_JOB_ERROR)
    print("starting scheduler")
    scheduler.start()
    # Shut down the scheduler when exiting the app
    atexit.register(lambda: scheduler.shutdown())


def cache_data():
	print_date_time()
	print ("starting cache data")
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
