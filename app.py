import json
from flask import Flask, render_template, jsonify
from segments import get_data

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/data")
def data():
	with open('static/data2.json') as json_data:
		d = json.load(json_data)
	return jsonify(d)
    # return jsonify(get_data())


if __name__ == "__main__":
    app.run(debug=True)
