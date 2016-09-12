import os
import re
import time

import lda
import nltk
import numpy as np
from nltk.tokenize import word_tokenize
from pymongo import MongoClient
from sklearn.feature_extraction.text import CountVectorizer

DAY = 86400000
HOUR = 3600000
def millis():
    return int(round(time.time() * 1000))

def millis_since(num_days='2'):
    days = int(os.environ.get('TIME_FRAME_DAYS', num_days))
    return millis() - days*DAY


def get_captions_segments(media):
    """
    Get the segments based on '>>>' appearence in the closed captions

    input: media object (from the Super Glue database)
    output: list of segments and list of indices of the captions identified as commercials
    """
    closed_captions = "closed_captions"
    if media["module_reports"]["commercial_skip_module"]["removed_commercials"]:
        closed_captions = "closed_captions_no_comm"
    stories = []
    text = ""
    start = 0
    commercial_captions = []
    segment_break_captions = []
    commercial_segments = []
    in_commercial = False
    sorted_captions = sorted(media[closed_captions], key=lambda k: k["start"])
    for i in range(1,len(sorted_captions)):
        caption = sorted_captions[i]
        if '<i>' in caption["text"] or (len(re.findall("[a-z]", caption["text"]))/((len(caption["text"])+1)*1.0)>0.35) or "announcer" in caption["text"].lower():
            commercial_captions.append(i)
            continue
        idx = caption["text"].find('>>>')
        if idx>-1:
            segment_break_captions.append(i)
            text+=caption["text"][:idx]
            new_story = {"start":start, "end":sorted_captions[i-1]["end"], "text":text}
            stories.append(new_story)
            text = caption["text"][idx:]
            start = caption["start"]
        else:
            text+=caption["text"]
    # add the last segment
    if len(sorted_captions)>1:
        new_story = {"start":start, "end":sorted_captions[i]["end"], "text":text}
        stories.append(new_story)

    if len(commercial_captions)/((len(sorted_captions)+1)*1.0)>0.6 or len(stories)==0:
        # this is not a news video! return no stories
        stories = None
    elif len(commercial_captions)>1:
        tolerance = 6
        start = sorted_captions[commercial_captions[0]]["start"]
        count = 1
        for i in range(len(commercial_captions)-1):
            if commercial_captions[i+1]-commercial_captions[i]<=tolerance:
                count+=1
            else:
                if count>1:
                    com_seg = {"start":start, "end":sorted_captions[commercial_captions[i]+1]["start"]}
                    commercial_segments.append(com_seg)
                    #stories.append(com_seg)
                start = sorted_captions[commercial_captions[i+1]]["end"]
                count=1
        if count > 1:
            com_seg = {"start": start, "end": sorted_captions[commercial_captions[-1]]["start"]}
            commercial_segments.append(com_seg)
            #stories.append(com_seg)

    if len(segment_break_captions)==0:
        # this is not a news video! return no stories
        stories=None
    return stories, commercial_segments, commercial_captions


def get_story_boundries(media):
    """
    Get the segments based on commercials detection and the closed captions

    input: media object (from the Super Glue database)
    output: list of segments and list of indices of the captions identified as commercials
    """
    boundries = []
    segs = []
    segments = "clean_segments"
    captions = "closed_captions_no_comm"
    if not media["module_reports"]["commercial_skip_module"]["removed_commercials"]:
        segments="original_segments"
        captions = "closed_captions"
    for seg in media["no_comm_segments"][segments]:
            boundries.append(seg["start"])
    stories, com_segs, com_caps = get_captions_segments(media)
    if not stories:
        boundries = []
        #print media["media_url_no_comm"]
    else:
        for story in stories:
            boundries.append(story["end"])
        boundries.append(media["duration"]*1000)
        com_caps_idx = 0
        sorted_boundries = sorted(set(boundries))
        temp_start = sorted_boundries[0]
        while com_caps_idx < len(com_segs) and com_segs[com_caps_idx]["start"] < temp_start:
            com_caps_idx += 1
        for i in range(1,len(sorted_boundries)):
            if sorted_boundries[i]<temp_start:
                continue
            if com_caps_idx<len(com_segs) and com_segs[com_caps_idx]["start"]<=sorted_boundries[i]:
                temp_end = com_segs[com_caps_idx]["start"]
                segs.append({"start": temp_start, "end": temp_end})
                temp_start = com_segs[com_caps_idx]["end"]
                if sorted_boundries[i]>temp_start:
                    segs.append({"start": temp_start, "end": sorted_boundries[i]})
                    temp_start = sorted_boundries[i]
                com_caps_idx += 1
            else:
                temp_end = sorted_boundries[i]
                segs.append({"start": temp_start, "end": temp_end})
                temp_start = temp_end

    return sorted(set(boundries)), com_caps, segs


urls = set()
def get_segments_text(media):
    """
    returns a list of video segments including the segments closed captions text
    """
    captions = "closed_captions_no_comm"
    if not media["module_reports"]["commercial_skip_module"]["removed_commercials"]:
        captions = "closed_captions"
    # captions_list = sorted(media[captions], key=lambda k:k["start"])
    # caption_idx = 0
    bounds, com_caps, segs = get_story_boundries(media)
    if len(bounds)<3:
        # This is most probably not a news video, we can ignore!
        return []
    
    #get text for each segment
    texts = []
    file_name = lambda x:''.join(x.split('.')[4:])
    for i in range (len(segs)):
        start = segs[i]["start"]
        end = segs[i]["end"]
        text = ""
        seg_caps = [cap["text"] for i,cap in enumerate(media[captions]) if cap["start"]>=start and cap["start"]<end and i not in com_caps ]
        text = " ".join(seg_caps)
        url = "%s#t=%.2f,%.2f"%(media["media_url_no_comm"],start/1000.0,end/1000)
        length = float(end)-float(start)
        temp_name = file_name(url)
        if len(text.strip())>200 and length>4000 and temp_name not in urls:
            texts.append({"text":text, "start":start, "end":end, "url":url, "channel":media["channel"], "length":length})
            urls.add(temp_name)
        # elif file_name(url) in urls:
        #     print media["_id"]
    return texts

def get_all_segments():
    MONGO_URL = 'mongodb://um.media.mit.edu:27017/super-glue'
    collection = MongoClient(MONGO_URL).get_default_database()['media']

    all_media_has_segments = collection.find({"date_added": {"$gt": millis_since('1')},"no_comm_segments":{"$exists": True}})
    num_of_videos = all_media_has_segments.count()
    print "%d videos"%num_of_videos
    total_segments = 0
    all_segments = []
    for media in all_media_has_segments:
        segs = get_segments_text(media)
        all_segments.extend(segs)
    print "%d total segments"%len(all_segments)
    return all_segments

def process_texts(all_segments):
    # load nltk's English stopwords as variable called 'stopwords'
    stopwords = nltk.corpus.stopwords.words('english')
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

    n_topics = int(len(all_segments)/6)
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

    clusters = []
    for i in range(n_topics):
        clusters.append([])
    doc_topic = lda_model.doc_topic_
    for i, seg in enumerate(all_segments):
        clusters[doc_topic[i].argmax()].append(seg)

    # for i, topic in enumerate(topic_summaries):
    #     print topic + " - " + str(len(clusters[i]))
    #     print

    print
    results = []#{'children':[]}
    for i, topic in enumerate(topic_summaries):
        #print topic + " - " + str(len(clusters[i]))
        channels = list(set([seg["channel"] for seg in clusters[i] ]))
        segs_by_channel = [{"channel":channel,"videos":[segm for segm in clusters[i] if segm["channel"]==channel]} for channel in channels]
        words = [{"text":word, "size":vocab.index(word)} for word in topic.split('-')]
        # if len(segs_by_channel)>1:
        results.append({
            'id':i,
            'summary':topic,
            'value':len(clusters[i]),
            'segments':segs_by_channel,
            'images':[],
            'words':words
            })
        # else:
        #     print topic
    topics_to_return = 16 if n_topics>30 else 9
    return {'children':sorted(results, key=lambda k:k['value'], reverse=True)[:topics_to_return],
            'vocab_size':len(vocab)}

def get_data():
    all_segments = get_all_segments()
    processed_segments = process_texts(all_segments)
    return run_lda(all_segments, processed_segments)


if __name__ == '__main__':
    all_segments = get_all_segments()
    processed_segments = process_texts(all_segments)
    run_lda(all_segments, processed_segments)