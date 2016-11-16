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
                "thumbnail":thumb,
                "media_id": str(media["_id"]),
                "segment_index": i})
    return texts


def vocab():
    all_segments = get_all_segments()
    processed_segments = segments.process_texts(all_segments)
    stopwords = nltk.corpus.stopwords.words('english')
    stopwords.extend(['going','just','like','lot','really','reporter','tonight','people','go'])
    cvectorizer = CountVectorizer(max_df=0.9, min_df=2, max_features=150000, stop_words=stopwords, ngram_range=(1,1))
    cvz = cvectorizer.fit_transform(processed_segments)
    return cvectorizer.get_feature_names()
