import pymongo
import time

import numpy

from sklearn.feature_extraction import DictVectorizer
from sklearn.cluster import DBSCAN
from sklearn import metrics


t = time.time()

# number of documents to pull
PARTITION_SIZE = 6
NUM_DOCUMENTS = 24

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


def cluster(documents):
    # cluster a set of documents
    data = []
    labels = []
    score = []
    timestamp = []

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

    #print "avg distance ", distance/number

    cluster = DBSCAN(eps=0.75, min_samples=1, n_jobs=-1)
    db = cluster.fit_predict(matrix)

    r = {}
    for i in range(len(db)):
        classification = db[i]

        if classification in r:
            r[classification].append((data[i], labels[i], score[i], timestamp[i]))

        else:
            r[classification] = [(data[i], labels[i], score[i], timestamp[i])]

    return r

def pick_best_vector(vectors):
    return vectors[0]

def merge_clusters(clusters):
    if len(clusters) <= 1:
        return clusters
    mid = len(clusters)/2
    left = merge_clusters(clusters[:mid])
    right = merge_clusters(clusters[mid:])
    return merge(left, right)

def merge(l, r):
    if not l:
        return r
    if not r:
        return l

    left = l[0]
    right = r[0]

    count = 1
    data = []
    id = []

    m_left = {}
    m_right = {}

    for cluster in left:
        points = []
        for point in left[cluster]:
            points.append(point[0])
        # pick the best vector
        #reduce number of vectors here
        best = pick_best_vector(points)
        data.append(best)
        id.append(count)
        m_left[count] = cluster

        count += 1

    for cluster in right:

        points = []
        #print cluster
        for point in right[cluster]:
            points.append(point[0])

        # pick the best vector
        best = pick_best_vector(points)
        data.append(best)
        id.append(count)
        m_right[count] = cluster
        count += 1

    matrix = DictVectorizer().fit_transform(data).toarray()
    cluster = DBSCAN(eps=0.75, min_samples=1, n_jobs=-1)
    db = cluster.fit_predict(matrix)

    r = {}

    for i in range(len(db)):
        classification = db[i]
        point_id = id[i]

        if classification in r:
            if point_id in m_left:
                r[classification].extend(left[m_left[point_id]])
            elif point_id in m_right:
                r[classification].extend(right[m_right[point_id]])

        else:
            if point_id in m_left:
                r[classification] = left[m_left[point_id]]
            elif point_id in m_right:
                r[classification] = right[m_right[point_id]]

    return [r]


def initialize(docs, n):
    #partition into groups of n
    documents = list(docs)
    clusters = []
    while len(documents) > n:
        temp = documents[:n]
        clusters.append(cluster(temp))
        documents = documents[n:]
    clusters.append(cluster(documents))

    return clusters

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

def clean_results(results):
    r = {}

    for i in results:
        #print i
        #print results[i][0]
        r[i] = {
            "size": len(results[i]),
            "stories": [],
            "points": []
        }

        #print r[i]["size"]

        for j in results[i]:
            label = j[1]
            point = (j[3], j[2])
            r[i]["stories"].append(label)
            r[i]["points"].append(point)

        # for j in results[i]:
        #     print type(j)
        #     r[i]["stories"].append(j[1])
        #     r[i]["points"].append((j[2], j[3]))

    return r

# partitioned
results = merge_clusters(initialize(documents, PARTITION_SIZE))[0]
print "time", time.time() - t
print len(results)
results = clean_results(results)

# single go
t = time.time()
without = cluster(documents)
print "time", time.time() - t
print len(without)


create_graph(results)

