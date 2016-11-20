import os
import re
import time

import lda
import nltk
import numpy as np
from nltk.tokenize import word_tokenize
from pymongo import MongoClient
from sklearn.feature_extraction.text import CountVectorizer, TfidfTransformer
from sklearn.decomposition import NMF, LatentDirichletAllocation
from scipy.sparse import dok_matrix

urls = []
DAY = 86400000
HOUR = 3600000

MONGO_URL = 'mongodb://um.media.mit.edu:27017/super-glue'
db = MongoClient(MONGO_URL).get_default_database()
collection = db['media']

def millis():
    return int(round(time.time() * 1000))

def millis_since(num_days='2'):
    days = int(os.environ.get('TIME_FRAME_DAYS', num_days))
    return millis() - days*DAY

def get_vectors(media):
    segs = media["story_segments"]
    media_url = "media_url_no_comm"
    if not media["module_reports"]["commercial_skip_module"]["removed_commercials"]:
        media_url = "media_url"
    segs_vectors = []
    file_name = lambda x:''.join(x.split('.')[4:])
    for i in range (len(segs)):
        start = segs[i]["start"]
        end = segs[i]["end"]
        thumb = "/static/images/blank.jpg"
        if "thumbnail_image" in segs[i]:
            thumb = segs[i]["thumbnail_image"]
        url = "%s#t=%.2f,%.2f"%(media[media_url],start/1000.0,end/1000.0)
        air_date = media["date_added"]
        length = float(end)-float(start)
        if "word_count" in segs[i]:
            vector = segs[i]["word_count"]
            if len(vector.keys())>3 and length>4000:
                segs_vectors.append({
                    "start":start,
                    "end":end,
                    "url":url,
                    "channel":media["channel"],
                    "length":length,
                    "date":air_date,
                    "thumbnail":thumb,
                    "media_id": str(media["_id"]),
                    "segment_index": i,
                    "vector":vector})
    return segs_vectors

def get_all_segments():
    all_media_has_segments = collection.find({"date_added": {"$gt": millis_since('1')},"story_segments":{"$exists": True},"is_news":{"$eq": True}})
    num_of_videos = all_media_has_segments.count()
    print "%d videos"%num_of_videos
    # total_segments = 0
    all_segments = []
    for media in all_media_has_segments:
        segs = get_vectors(media)
        all_segments.extend(segs)
    print "%d total segments"%len(all_segments)
    return all_segments

def vectors(all_segments, n_features):
    S = dok_matrix((len(all_segments), n_features), dtype=np.int32)
    for i, seg in enumerate(all_segments):
        vec = seg["vector"]
        for ind in vec.keys():
            S[i, int(ind)] = int(vec[ind])
        seg.pop("vector")
    return S

def get_topic_words(topic_word, n_top_words, vocab):
    topic_summaries = []
    for i, topic_dist in enumerate(topic_word):
        topic_words = np.array(vocab)[np.argsort(topic_dist)][:-(n_top_words+1):-1]
        topic_summaries.append('-'.join(topic_words))
    return topic_summaries


def run_lda(all_segments, vectors, vocab):
    # normalize the tf matrix to tf-idf matrix
    # transformer = TfidfTransformer(norm=u'l2', use_idf=True, smooth_idf=True, sublinear_tf=False)
    # tf_idf_matrix = transformer.fit_transform(vectors)

    #calculate lda
    n_topics = int(len(all_segments)/9)
    alpha = 0.1
    eta = 0.01
    print "%d topics"%n_topics
    n_iter = 1000 #1000
    lda_model = lda.LDA(n_topics=n_topics, n_iter=n_iter)
    X_topics = lda_model.fit_transform(vectors)


    n_top_words = 8
    n_words_long = 40
    topic_summaries = get_topic_words(lda_model.topic_word_, n_top_words, vocab)
    long_topic_summaries = get_topic_words(lda_model.topic_word_, n_words_long, vocab)

    clusters = []
    for i in range(n_topics):
        clusters.append([])
    doc_topic = lda_model.doc_topic_
    for i, seg in enumerate(all_segments):
        clusters[doc_topic[i].argmax()].append(seg)


    print
    results = []
    long_results = []
    words_sizes = vectors.sum(axis=0)
    for i, topic in enumerate(topic_summaries):
        #print topic + " - " + str(len(clusters[i]))
        channels = list(set([seg["channel"] for seg in clusters[i] ]))
        segs_by_channel = [{"channel":channel,"videos":sorted([segm for segm in clusters[i] if segm["channel"]==channel],key=lambda x:x["date"])} for channel in channels]
        sorted_segs_by_channel = sorted(segs_by_channel, key=lambda x:len(x["videos"]), reverse=True)
        words = [{"text":word, "size":words_sizes[0, vocab.index(word)]} for word in topic.split('-')]
        res = {
            'id':i,
            'summary':topic,
            'value':len(clusters[i]),
            'segments':sorted_segs_by_channel,
            'words':words,
            'ratio':(len(clusters[i])*1.0)/(len(all_segments)*1.0)
            }

        results.append(res)
        # more data for clustering clusters
        long_topic = long_topic_summaries[i]
        long_res = {
            'id':i,
            'summary':long_topic,
            'value':len(clusters[i]),
            'segments':sorted_segs_by_channel,
            'words':[{"text":word, "size":words_sizes[0, vocab.index(word)]} for word in long_topic.split('-')],
            'ratio':(len(clusters[i])*1.0)/(len(all_segments)*1.0)
            }

        long_results.append(long_res)
        # else:
        #     print topic
    topics_to_return = 16 #if n_topics>30 else 9
    return {'data': {'children':sorted(results, key=lambda k:k['value'], reverse=True)[:topics_to_return],
                      'max_size':words_sizes[0,words_sizes.argmax()]},
            'all_clusters':{'children':long_results}}

def get_data():
    # get stopwords and vocabulary from db
    nlp_data = db['nlp_data'].find_one()
    stopwords = nlp_data["stopwords"]
    vocab = nlp_data["vocab_non_stemmed"]

    all_segments = get_all_segments()
    count_vectors = vectors(all_segments, len(vocab))
    print ("got vectors")
    print ('finished processing segments, running LDA')
    return run_lda(all_segments, count_vectors, vocab)


if __name__ == '__main__':
    all_segments = get_all_segments()
    processed_segments = process_texts(all_segments)
    run_lda(all_segments, processed_segments)
