import segments

import nltk
import numpy as np
from nltk.tokenize import word_tokenize
from pymongo import MongoClient
from sklearn.feature_extraction.text import CountVectorizer


def get_all_segments():
    MONGO_URL = 'mongodb://um.media.mit.edu:27017/super-glue'
    collection = MongoClient(MONGO_URL).get_default_database()['media']

    all_media_has_segments = collection.find({"story_segments":{"$exists": True},"is_news":{"$eq": True}})
    num_of_videos = all_media_has_segments.count()
    print "%d videos"%num_of_videos
    # total_segments = 0
    all_segments = []
    for media in all_media_has_segments:
        segs = get_texts(media)
        all_segments.extend(segs)
    print "%d total segments"%len(all_segments)
    return all_segments

def get_texts(media):
    segs = media["story_segments"]
    texts = []
    for i in range (len(segs)):
        text = ""
        if "text" in segs[i]:
            text = segs[i]["text"]
        if len(text.strip())>200 and length>4000:
            texts.append({"text":text})
    return texts


def vocab():
    all_segments = get_all_segments()
    processed_segments = segments.process_texts(all_segments)
    stopwords = nltk.corpus.stopwords.words('english')
    stopwords.extend(['going','just','like','lot','really','reporter','tonight','people','go'])
    cvectorizer = CountVectorizer(max_df=0.9, min_df=2, max_features=150000, stop_words=stopwords, ngram_range=(1,1))
    cvz = cvectorizer.fit_transform(processed_segments)
    return cvectorizer.get_feature_names()
