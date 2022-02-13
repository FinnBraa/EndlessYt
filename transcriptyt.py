import sys 

from youtube_transcript_api import YouTubeTranscriptApi

trans = YouTubeTranscriptApi.get_transcript(sys.argv[1],languages=['de', 'en'])

print(trans)
sys.stdout.flush()

