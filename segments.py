import os
import re
import time

import lda
import nltk
import numpy as np
from nltk.tokenize import word_tokenize
from pymongo import MongoClient
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.decomposition import PCA
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.manifold import MDS
from scipy.cluster.hierarchy import ward, dendrogram, to_tree

MDS()

urls = []
DAY = 86400000
HOUR = 3600000
def millis():
    return int(round(time.time() * 1000))

def millis_since(num_days='2'):
    days = int(os.environ.get('TIME_FRAME_DAYS', num_days))
    return millis() - days*DAY

def get_texts(media):
    segs = media["story_segments"]
    # com_caps = media["commercials_captions"]
    captions = "closed_captions_no_comm"
    media_url = "media_url_no_comm"
    if not media["module_reports"]["commercial_skip_module"]["removed_commercials"]:
        media_url = "media_url"
        if "closed_captions_aligned" in media:
            captions = "closed_captions_aligned"
        else:
            captions = "closed_captions"
    texts = []
    file_name = lambda x:''.join(x.split('.')[4:])
    for i in range (len(segs)):
        start = segs[i]["start"]
        end = segs[i]["end"]
        thumb = "/static/images/blank.jpg"
        if "thumbnail_image" in segs[i]:
            thumb = segs[i]["thumbnail_image"]
        text = ""
        if "text" in segs[i]:
            text = segs[i]["text"]

        url = "%s#t=%.2f,%.2f"%(media[media_url],start/1000.0,end/1000.0)
        air_date = media["date_added"]
        length = float(end)-float(start)
        temp_name = file_name(url)
        if len(text.strip())>200 and length>4000:
            texts.append({
                "text":text,
                "start":start,
                "end":end,
                "url":url,
                "channel":media["channel"],
                "length":length,
                "date":air_date,
                "thumbnail":thumb})
            urls.append(temp_name)
    return texts

def get_all_segments():
    MONGO_URL = 'mongodb://um.media.mit.edu:27017/super-glue'
    collection = MongoClient(MONGO_URL).get_default_database()['media']

    all_media_has_segments = collection.find({"date_added": {"$gt": millis_since('1')},"story_segments":{"$exists": True},"is_news":{"$eq": True}})
    num_of_videos = all_media_has_segments.count()
    print "%d videos"%num_of_videos
    # total_segments = 0
    all_segments = []
    for media in all_media_has_segments:
        segs = get_texts(media)
        all_segments.extend(segs)
    print "%d total segments"%len(all_segments)
    return all_segments

def process_texts(all_segments):
    print ("starting to precess texts")
    # load nltk's English stopwords as variable called 'stopwords'
    stopwords = nltk.corpus.stopwords.words('english')
    print ("got stopwords!")
    pattern = re.compile('[\W_]+')
    nouns = ['NN', 'NNS', 'NNPS', 'NNP']

    for seg in all_segments:
        clean = [token[0] for token in nltk.pos_tag(word_tokenize(seg["text"])) if re.findall('[a-zA-Z]', token[0])>2 and token[1] in nouns and token[0] not in stopwords]
        #parts = [pattern.sub('', word).lower() for word in word_tokenize(seg["text"])]
        #clean = [i for i in parts if i not in stopwords and len(re.findall('[a-zA-Z]', i))>2]
        seg["processed"] = clean

    seg_texts = [seg["text"] for seg in all_segments] # list of all tweet texts
    seg_texts_processed = [str.join(" ", seg["processed"]) for seg in all_segments] # list of pre-processed tweet texts
    for seg in all_segments:
        seg.pop("processed")
    return seg_texts_processed

def run_lda(all_segments, seg_texts_processed):
    stopwords = nltk.corpus.stopwords.words('english')
    stopwords.extend(['going','just','like','lot','really','reporter','tonight','people','go'])
    cvectorizer = CountVectorizer(max_df=0.7, min_df=3, max_features=150000, stop_words=stopwords, ngram_range=(1,1))
    cvz = cvectorizer.fit_transform(seg_texts_processed)

    n_topics = int(len(all_segments)/9)
    print "%d topics"%n_topics
    n_iter = 1000
    lda_model = lda.LDA(n_topics=n_topics, n_iter=n_iter)
    X_topics = lda_model.fit_transform(cvz)

    n_top_words = 8
    topic_summaries = []

    topic_word = lda_model.topic_word_  # get the topic words
    vocab = cvectorizer.get_feature_names()
    for i, topic_dist in enumerate(topic_word):
        topic_words = np.array(vocab)[np.argsort(topic_dist)][:-(n_top_words+1):-1]
        topic_summaries.append('-'.join(topic_words))
        # print('Topic {}: {}'.format(i, ' '.join(topic_words)))

    print "running svd"
    U, s, V = np.linalg.svd(cvz.toarray(), full_matrices=True)

    print "running pca"
    pca = PCA(n_components=2, copy=True)
    pca_results  = pca.fit(cvz.toarray())
    pca_components = pca.components_

    print "calculate distances"
    dist = 1 - cosine_similarity(cvz)

    print "run mds"
    # convert two components as we're plotting points in a two-dimensional plane
    # "precomputed" because we provide a distance matrix
    # we will also specify `random_state` so the plot is reproducible.
    mds = MDS(n_components=2, dissimilarity="precomputed", random_state=1)
    pos = mds.fit_transform(dist)  # shape (n_components, n_samples)

    print "linkage matrix"
    linkage_matrix = ward(dist) #define the linkage_matrix using ward clustering pre-computed distances
    T = to_tree( linkage_matrix , rd=False )

    # Create dictionary for labeling nodes by their IDs
    id2seg = dict(zip(range(len(all_segments)), all_segments))

    # Create a nested dictionary from the ClusterNode's returned by SciPy
    def add_node(node, parent ):
    	# First create the new node and append it to its parent's children
    	newNode = dict( node_id=node.id, children=[] )
    	parent["children"].append( newNode )

    	# Recursively add the current node's children
    	if node.left: add_node( node.left, newNode )
    	if node.right: add_node( node.right, newNode )

    # Initialize nested dictionary for d3, then recursively iterate through tree
    d3Dendro = dict(children=[], name="Root1")
    add_node( T, d3Dendro )


    clusters = []
    for i in range(n_topics):
        clusters.append([])
    doc_topic = lda_model.doc_topic_
    for i, seg in enumerate(all_segments):
        cluster_id = doc_topic[i].argmax()
        clusters[cluster_id].append(seg)
        seg["cluster"] = cluster_id
        seg["pca"] = {"x":pca_components[0][i], "y":pca_components[1][i]}
        seg["svd"] = {"x": U[i][0], "y": U[i][1]}
        seg["mds"] = {"x": pos[i][0], "y": pos[i][1]}
    print

    results = []
    for i, topic in enumerate(topic_summaries):
        #print topic + " - " + str(len(clusters[i]))
        channels = list(set([seg["channel"] for seg in clusters[i] ]))
        segs_by_channel = [{"channel":channel,"videos":sorted([segm for segm in clusters[i] if segm["channel"]==channel],key=lambda x:x["date"])} for channel in channels]
        sorted_segs_by_channel = sorted(segs_by_channel, key=lambda x:len(x["videos"]), reverse=True)
        words = [{"text":word, "size":vocab.index(word)} for word in topic.split('-')]
        # if len(segs_by_channel)>1:
        results.append({
            'id':i,
            'summary':topic,
            'value':len(clusters[i]),
            'segments':sorted_segs_by_channel,
            'images':[],
            'words':words
            })
        # else:
        #     print topic
    topics_to_return = 16 #if n_topics>30 else 9
    return {'children':sorted(results, key=lambda k:k['value'], reverse=True)[:topics_to_return],
            'vocab_size':len(vocab),
            'pca_components': pca_components.tolist(),
            'all_segments': all_segments,
            'topic_summaries': topic_summaries,
            'linkage_matrix': linkage_matrix.tolist(),
            'dendrogram': d3Dendro}

def get_data():
    del urls[:]
    all_segments = get_all_segments()
    processed_segments = process_texts(all_segments)
    print ('finished processing segments, running LDA')
    return run_lda(all_segments, processed_segments)

# if __name__ == '__main__':
#     all_segments = get_all_segments()
#     processed_segments = process_texts(all_segments)
#     run_lda(all_segments, processed_segments)
