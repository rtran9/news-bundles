import pymongo

from sklearn.feature_extraction import DictVectorizer
from sklearn.cluster import DBSCAN

# connect to database
MONGO="mongodb://um.media.mit.edu:27017/super-glue"
client = pymongo.MongoClient(MONGO, connect=False)
db = client['perspectives']
clusters = db['clusters']

# extract documents
documents = clusters.find({}, {
    "children.ratio": 1,
    "children.summary": 1,
    "children.words": 1,
    "timestamp": 1}) \
    .sort([("timestamp", -1)])

# every story is defined by (vector, summary, ratio, timestamp)
data = []
labels = []
score = []
timestamp = []

for doc in documents:

    for story in doc["children"]:
        if "ratio" not in story:
            # ignore stories without ratios
            continue

        labels.append(story["summary"])
        story_vector = {}
        for word in story["words"]:
            text = word["text"]

            # let the length of the component be 1.0
            story_vector[text] = 1.0

        data.append(story_vector)
        score.append(story["ratio"])

        # timestamp as defined by when it was inserted into the mongo db
        timestamp.append(doc["timestamp"])

# classifier
matrix = DictVectorizer().fit_transform(data).toarray()
db = DBSCAN(eps=2.2, min_samples=1).fit_predict(matrix)

# convert results back
# a classification is given some id
# contains { "points" : [(timestamp, ratio), ...], "stories" : [string, ...]}
results = {}
for i in range(len(db)):
    classification = db[i]

    if classification in results:
        results[classification]["stories"].append(labels[i])
        results[classification]["points"].append((timestamp[i], score[i]))

    else:
        results[classification] = {
            "stories": [labels[i]],
            "points": [(timestamp[i], score[i])]
        }

# visualization
def create_graph(data):

    import numpy as np
    import matplotlib.pyplot as plt

    plt.figure(1)

    for classification in data:

        story = data[classification]

        points = {}
        for point in story["points"]:
            x = point[0]
            y = point[1]

            if x in points:
                points[x]["total"] += y
                points[x]["number"] += 1.0
            else:
                points[x] = {
                    "total": y,
                    "number": 1.0
                }

        z = []

        for x in points:
            # should this ratios add up?
            z.append((x, points[x]["total"]))
            #z.append((x, points[x]["total"] / points[x]["number"] ))

        z = sorted(z, key=lambda x: x[0])

        x = []
        y = []
        for j in z:
            x.append(j[0])
            y.append(j[1])

        plt.plot(x, y)

    plt.show()

print results
create_graph(results)