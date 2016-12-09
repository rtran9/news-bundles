import pymongo
import time

import numpy

from sklearn.feature_extraction import DictVectorizer
from sklearn.cluster import DBSCAN
from sklearn import metrics

t = time.time()

# number of documents to pull
NUM_DOCUMENTS = 36

# connect to database
MONGO="mongodb://um.media.mit.edu:27017/super-glue"
client = pymongo.MongoClient(MONGO, connect=False)
db = client['perspectives']
clusters = db['clusters_full']

# extract documents
documents = clusters.find({}, {
    "all_clusters.ratio": 1,
    "all_clusters.summary": 1,
    "all_clusters.words": 1,
    "timestamp": 1}).limit(NUM_DOCUMENTS)

# grab the most recent
documents = sorted(documents, key= lambda x: x["timestamp"])
documents = documents[:NUM_DOCUMENTS]

a = documents[0]["all_clusters"]

# every story is defined by (vector, summary, ratio, timestamp)
data = []
labels = []
score = []
timestamp = []

#exit()

for doc in documents:
    for story in doc["all_clusters"]:
        if "ratio" not in story:
            # some filtering required here,
            # ignore stories without ratios
            continue

        ratio = story["ratio"]
        labels.append(story["summary"])

        story_words = {}

        # sum word occurrence
        total = 0.0
        for word in story["words"]:
            total += word["size"]

        distance = 0.0
        for word in story["words"]:
            text = word["text"]
            word_ratio = word["size"]/total
            story_words[text] = word_ratio
            distance += word_ratio**2

        distance = distance**0.5

        # normalize to 1
        for word in story_words:
            # weight words in proportion to the other words in story
            story_words[word] = story_words[word]/distance

        data.append(story_words)
        score.append(ratio)

        # timestamp as defined by when it was inserted into the mongo db
        timestamp.append(doc["timestamp"])

matrix = DictVectorizer().fit_transform(data).toarray()


# calculate the avg distance between every pair of points
# used only to help find epsilon
distance = 0.0
number = 0.0

for i in range(len(matrix)):
    for j in range(len(matrix)):
        if i == j:
            continue
        number += 1
        dist = numpy.linalg.norm(matrix[i] - matrix[j])
        distance += dist

print "avg distance ", distance/number

cluster = DBSCAN(eps=0.75, min_samples=1, n_jobs=-1)
db = cluster.fit_predict(matrix)

# evaluate = {}
#
# e = 5.0
#
# while e < 7.5:
#     cluster = DBSCAN(eps=e, min_samples=1, n_jobs=-1)
#     print "Running DBSCAN on", len(documents), "documents.", e
#     start = time.time()
#
#
#     db = cluster.fit_predict(matrix)
#     score =  metrics.silhouette_score(matrix, cluster.labels_)
#     evaluate[e] = score
#     print("Silhouette Coefficient: %0.3f" % score)
#     e += 0.1


# convert results back
# a classification is given some id
# contains { "points" : [(timestamp, ratio), ...], "stories" : [string, ...], "size": int}
results = {}
for i in range(len(db)):
    classification = db[i]

    if classification in results:
        results[classification]["size"] += 1
        results[classification]["stories"].append(labels[i])
        results[classification]["points"].append((timestamp[i], score[i]))

    else:
        results[classification] = {
            "stories": [labels[i]],
            "points": [(timestamp[i], score[i])],
            "size": 1
        }


print results, len(results), len(matrix)

# visualization
def create_graph(data):

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

        # sort points based on time
        z = sorted(z, key=lambda x: x[0])
        x = []
        y = []
        for j in z:
            x.append(j[0])
            y.append(j[1])

        plt.plot(x, y)

    plt.show()

print time.time() - t
create_graph(results)