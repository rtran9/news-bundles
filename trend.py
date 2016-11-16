import pymongo

from sklearn.feature_extraction import DictVectorizer
from sklearn.cluster import DBSCAN


MONGO="mongodb://viral:viralviral@ds145667.mlab.com:45667/news-clusters"

#connect to database
client = pymongo.MongoClient(MONGO, connect=False)
db = client['news-clusters']
clusters = db['clusters']


#documents are created every 2 hours
documents = clusters.find({}, {"children.summary": 1, "children.words": 1, "timestamp": 1}).sort([("timestamp", -1)]).limit(24)

data = []
labels = []
score = []
timestamp = []

for doc in documents:

    # find the total number of words in document
    total = 0.0
    for story in doc["children"]:
        for word in story["words"]:
            count = word["size"]
            total += count

    for story in doc["children"]:
        labels.append(story["summary"])

        story_vector = {}

        word_count = 0.0
        for word in story["words"]:
            text = word["text"]
            story_vector[text] = 1.0
            word_count += word["size"]

        ratio = word_count/total

        data.append(story_vector)
        score.append(ratio)
        timestamp.append(doc["timestamp"])

matrix = DictVectorizer().fit_transform(data).toarray()
db = DBSCAN(eps=2.5, min_samples=1).fit_predict(matrix)

# convert results back
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

print results
