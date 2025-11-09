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
  Loader2,
  AlertCircle,
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
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [isPlayingNext, setIsPlayingNext] = useState(false);
  const [addVideoError, setAddVideoError] = useState<string | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const videoPlayerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  const refreshStreams = async () => {
    try {
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
            extractedId: stream.extractedId,
          }))
          .sort((a: any, b: any) => b.upvotes - a.upvotes)
      );
      setCurrentVideo((video: any) => {
        if (video?.id === activeStream?.stream?.id) {
          return video;
        }
        return activeStream?.stream;
      });
    } catch (error) {
      console.error("Failed to refresh streams:", error);
    }
  };

  useEffect(() => {
    refreshStreams();
    const interval = setInterval(refreshStreams, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!videoPlayerRef.current || !playVideo) return;
    
    // Clear previous error
    setPlayerError(null);

    // Cleanup previous player
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        console.error("Error destroying player:", e);
      }
    }

    if (!currentVideo?.extractedId) return;

    try {
      const player = YoutubePlayer(videoPlayerRef.current, {
        playerVars: {
          autoplay: 1,
          controls: 1,
        },
      });
      
      playerRef.current = player;

      // Load and play video
      player.loadVideoById(currentVideo.extractedId);
      player.playVideo();

      // Handle video end
      player.on("stateChange", (event: any) => {
        // 0 = ended
        if (event.data === 0) {
          playNext();
        }
      });

      // Handle errors
      player.on("error", (event: any) => {
        console.error("YouTube player error:", event);
        setPlayerError("Video unavailable. It may be restricted or removed.");
      });

    } catch (error) {
      console.error("Error initializing YouTube player:", error);
      setPlayerError("Failed to load video player.");
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.error("Error destroying player:", e);
        }
      }
    };
  }, [currentVideo?.id, videoPlayerRef, playVideo]);

  const handleVote = (id: any, isUpvote: boolean) => {
    // Optimistic update
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

    // Send to server
    axios
      .post(`/api/streams/${isUpvote ? "upvote" : "downvote"}`, {
        streamId: id,
      })
      .catch((error) => {
        console.error("Failed to vote:", error);
        // Revert optimistic update on error
        refreshStreams();
      });
  };

  const playNext = async () => {
    if (queue.length === 0) return;
    
    setIsPlayingNext(true);
    setPlayerError(null);

    try {
      // Optimistically update UI
      const nextVideo = queue[0];
      setCurrentVideo(nextVideo);
      setQueue(queue.slice(1));

      // Call API to update backend
      const response = await axios.get(`/api/streams/next`);
      
      // Update with actual data from server
      if (response.data.stream) {
        setCurrentVideo(response.data.stream);
      }
    } catch (error) {
      console.error("Failed to play next:", error);
      // Revert on error
      refreshStreams();
    } finally {
      setIsPlayingNext(false);
    }
  };

  const handleAddVideo = async () => {
    if (!newVideoUrl.trim()) return;

    setIsAddingVideo(true);
    setAddVideoError(null);

    try {
      const response = await axios.post(`/api/streams`, {
        creatorId: creatorId,
        url: newVideoUrl,
      });

      // Optimistically add to queue
      if (response.data.stream) {
        setQueue([...queue, response.data.stream]);
      }

      setNewVideoUrl("");
      
      // Refresh to get accurate data
      setTimeout(refreshStreams, 500);
    } catch (error: any) {
      console.error("Failed to add video:", error);
      setAddVideoError(
        error.response?.data?.message || "Failed to add video. Please check the URL."
      );
    } finally {
      setIsAddingVideo(false);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.protocol}//${window.location.host}/creator/${creatorId}`;
    navigator.clipboard.writeText(shareUrl);
    alert("Link copied to clipboard!");
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
                {playVideo ? (
                  <div className="w-full h-full relative">
                    <div ref={videoPlayerRef} className="w-full h-full" />
                    {playerError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
                        <div className="text-center p-4">
                          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-2" />
                          <p className="text-white">{playerError}</p>
                          <Button
                            onClick={playNext}
                            className="mt-4 bg-purple-600 hover:bg-purple-700"
                            disabled={queue.length === 0}
                          >
                            Skip to Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4">
                    <p className="text-xl mb-4">Now Playing</p>
                    <img
                      src={currentVideo.bigImg}
                      alt={currentVideo.title}
                      className="max-w-full max-h-[80%] object-contain rounded"
                    />
                    <p className="mt-4 text-lg">{currentVideo.title}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-white text-center">
              <Music className="h-16 w-16 mx-auto mb-4 opacity-50" />
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
              disabled={queue.length === 0 || isPlayingNext}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-md disabled:opacity-50"
            >
              {isPlayingNext ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" /> Play Next
                </>
              )}
            </Button>
          </div>
        )}

        {/* Add Video Form */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Paste YouTube URL here"
              value={newVideoUrl}
              onChange={(e) => {
                setNewVideoUrl(e.target.value);
                setAddVideoError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isAddingVideo) {
                  handleAddVideo();
                }
              }}
              className="flex-grow shadow-sm"
              disabled={isAddingVideo}
            />
            <Button
              onClick={handleAddVideo}
              disabled={!newVideoUrl.trim() || isAddingVideo}
              className="bg-green-500 hover:bg-green-600 text-white shadow-sm disabled:opacity-50"
            >
              {isAddingVideo ? (
                <>
                  <Loader2 className="sm:mr-2 h-4 w-4 animate-spin" />
                  <p className="hidden sm:block">Adding...</p>
                </>
              ) : (
                <>
                  <Plus className="sm:mr-2 h-4 w-4" />
                  <p className="hidden sm:block">Add to Queue</p>
                </>
              )}
            </Button>
          </div>
          {addVideoError && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded">
              <AlertCircle className="h-4 w-4" />
              <span>{addVideoError}</span>
            </div>
          )}
        </div>

        {/* Queue */}
        <div className="bg-white rounded-lg shadow-md p-4 border border-purple-100">
          <h2 className="text-lg font-semibold mb-4 text-purple-800">
            Up Next ({queue.length})
          </h2>
          {queue.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Music className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Queue is empty. Add some videos!</p>
            </div>
          ) : (
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
                    <h3 className="font-medium text-purple-900">
                      {video.title}
                    </h3>
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
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
