"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ThumbsUp,
  Music,
  Play,
  LogOut,
  Share2,
  Plus,
  ThumbsDown,
} from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import axios from "axios";
//@ts-expect-error
import YoutubePlayer from "youtube-player";

interface Video {
  id: string;
  type: string;
  url: string;
  extractedId: string;
  title: string;
  smallImg: string;
  bigImg: string;
  active: boolean;
  userId: string;
  upvotes: number;
  haveUpvoted: boolean;
}

const REFRESH_INTERVAL_MS = 10 * 1000;

export default function StreamingPage({
  creatorId,
  playVideo,
}: {
  creatorId: string;
  playVideo: boolean;
}) {
  const [queue, setQueue] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<any>(null);
  const [newVideoUrl, setNewVideoUrl] = useState("");

  const videoPlayerRef = useRef<HTMLDivElement>(null);

  const refreshStreams = async () => {
    const response = await axios.get(`/api/streams/?creatorId=${creatorId}`);
    const { streams, activeStream } = response.data;
    setQueue(
      streams
        .map((stream: any) => ({
          id: stream.id,
          title: stream.title,
          smallImg: stream.smallImg,
          bigImg: stream.bigImg,
          upvotes: stream.upvotes,
          haveUpvoted: stream.haveUpvoted,
        }))
        .sort((a: any, b: any) => b.upvotes - a.upvotes)
    );
    setCurrentVideo((video: any) => {
      if (video?.id === activeStream?.stream?.id) {
        return video;
      }

      return activeStream?.stream;
    });
  };

  useEffect(() => {
    refreshStreams();
    const interval = setInterval(refreshStreams, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!videoPlayerRef.current) return;
    let player = YoutubePlayer(videoPlayerRef.current);

    player.loadVideoById(currentVideo?.extractedId);
    player.playVideo();
    function eventHandler(event: any) {
      if (event.data === 0) {
        playNext();
      }
    }
    player.on("stateChange", eventHandler);

    return () => {
      player.destroy();
    };
  }, [currentVideo, videoPlayerRef]);

  const handleVote = (id: any, isUpvote: boolean) => {
    setQueue(
      queue
        .map((video) =>
          video.id === id
            ? {
                ...video,
                upvotes: isUpvote ? video.upvotes + 1 : video.upvotes - 1,
                haveUpvoted: !video.haveUpvoted,
              }
            : video
        )
        .sort((a, b) => b.upvotes - a.upvotes)
    );

    axios.post(`/api/streams/${isUpvote ? "upvote" : "downvote"}`, {
      streamId: id,
    });
  };

  const playNext = async () => {
    if (queue.length > 0) {
      const response = await axios.get(`/api/streams/next`);
      setCurrentVideo(response.data.currentStream);
      setQueue(queue.slice(1));
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(
      window.location.hostname + `/creator/${creatorId}`
    );
  };

  const handleLogout = () => {
    signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
      <header className="bg-white border-b border-purple-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="#" className="flex items-center space-x-2">
            <Music className="h-6 w-6 text-purple-600" />
            <span className="text-xl font-semibold text-purple-800">
              UpYourTune
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="text-purple-600 border-purple-300 hover:bg-purple-50"
            >
              <Share2 className="sm:mr-2 h-4 w-4" />{" "}
              <p className="hidden sm:block">Share</p>
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="text-pink-600 border-pink-300 hover:bg-pink-50"
            >
              <LogOut className="sm:mr-2 h-4 w-4" />{" "}
              <p className="hidden sm:block">Logout</p>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Video Player */}
        <div className="aspect-video bg-gradient-to-br from-purple-900 to-pink-900 rounded-lg overflow-hidden shadow-md flex items-center justify-center">
          {currentVideo ? (
            <div className="w-full h-full flex flex-col justify-between">
              <div className="w-full h-full text-white text-center">
                <div className="w-full h-full">
                  {playVideo ? (
                    <div ref={videoPlayerRef} className="w-full h-full" />
                  ) : (
                    // <iframe
                    //   src={`https://www.youtube.com/embed/${currentVideo.extractedId}?autplay=1`}
                    //   allow="autoplay"
                    //   className="w-full h-full"
                    // />
                    // <img
                    //   src={currentVideo.bigImg}
                    //   alt={currentVideo.title}
                    //   className="w-full h-full object-cover"
                    // />
                    <>
                      <p>Now Playing</p>
                      <img
                        src={currentVideo.bigImg}
                        alt={currentVideo.title}
                        className="w-full h-full object-cover"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-white text-center">
              <h2 className="text-xl font-semibold mb-2">
                Welcome to UpYourTune!
              </h2>
              <p>Add a song to queue to start playing</p>
            </div>
          )}
        </div>

        {/* Controls */}
        {playVideo && (
          <div className="flex justify-center">
            <Button
              onClick={playNext}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-md"
            >
              <Play className="mr-2 h-5 w-5" /> Play Next
            </Button>
          </div>
        )}

        {/* Add Video Form */}
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Paste YouTube URL here"
            value={newVideoUrl}
            onChange={(e) => setNewVideoUrl(e.target.value)}
            className="flex-grow shadow-sm"
          />
          <Button
            onClick={() => {
              axios.post(`/api/streams`, {
                creatorId: creatorId,
                url: newVideoUrl,
              });
              setNewVideoUrl("");
            }}
            className="bg-green-500 hover:bg-green-600 text-white shadow-sm"
          >
            <Plus className="sm:mr-2 h-4 w-4" />{" "}
            <p className="hidden sm:block"> Add to Queue</p>
          </Button>
        </div>

        {/* Queue */}
        <div className="bg-white rounded-lg shadow-md p-4 border border-purple-100">
          <h2 className="text-lg font-semibold mb-4 text-purple-800">
            Up Next
          </h2>
          <ul className="space-y-4">
            {queue.map((video, index) => (
              <li
                key={video.id}
                className={`flex items-center gap-4 p-2 rounded-md transition-colors ${
                  index === 0
                    ? "bg-purple-100"
                    : "bg-purple-50 hover:bg-purple-100"
                }`}
              >
                <img
                  src={video.smallImg}
                  alt={video.title}
                  className="w-20 h-12 object-cover rounded shadow-sm"
                />
                <div className="flex-grow">
                  <h3 className="font-medium text-purple-900">{video.title}</h3>
                  <p className="text-sm text-purple-600">
                    {video.upvotes} votes
                  </p>
                </div>
                <Button
                  onClick={() =>
                    handleVote(video.id, video.haveUpvoted ? false : true)
                  }
                  variant="outline"
                  size="sm"
                  className={`text-purple-600  ${
                    video.haveUpvoted && "bg-purple-500 text-white"
                  } border-purple-300 hover:bg-purple-100 shadow-sm`}
                >
                  {video.haveUpvoted ? (
                    <ThumbsDown className="h-4 w-4" />
                  ) : (
                    <ThumbsUp className="h-4 w-4" />
                  )}{" "}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
