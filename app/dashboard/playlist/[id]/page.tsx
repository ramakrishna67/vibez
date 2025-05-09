"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
  Home,
  Heart,
  Sparkles,
  Mic,
  Library,
  Clock,
  Music,
  Search,
  PlayCircle,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

interface Track {
  id: string;
  name: string;
  artist: string;
  coverUrl: string;
  album?: string;
  duration: number;
  type: string;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  tracks: Track[];
}

const formatDuration = (durationMs: number): string => {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export default function PlaylistPage() {
  const params = useParams();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [embedHtml, setEmbedHtml] = useState<string>("");
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  const fetchAllTracks = async (url: string, accessToken: string) => {
    let allTracks: Track[] = [];

    while (url) {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tracks");
      }

      const data = await response.json();
      const playlistTracks = data.items.map((item: any) => ({
        id: item.track.id,
        name: item.track.name,
        artist: item.track.artists.map((artist: any) => artist.name).join(", "),
        coverUrl: item.track.album.images[0]?.url || "/placeholder.svg",
        album: item.track.album.name,
        duration: item.track.duration_ms,
        type: "track", // Assuming all items are tracks
      }));

      allTracks = [...allTracks, ...playlistTracks];
      url = data.next;
    }

    return allTracks;
  };

  useEffect(() => {
    const fetchPlaylistData = async () => {
      try {
        const tokenResponse = await fetch("/api/token");
        const { access_token } = await tokenResponse.json();

        if (!access_token) {
          throw new Error("No access token found");
        }

        const playlistResponse = await fetch(
          `https://api.spotify.com/v1/playlists/${params.id}`,
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          }
        );

        if (!playlistResponse.ok) {
          throw new Error("Failed to fetch playlist");
        }

        const playlistData = await playlistResponse.json();
        const initialUrl = `https://api.spotify.com/v1/playlists/${params.id}/tracks?limit=50`;
        const allTracks = await fetchAllTracks(initialUrl, access_token);

        setPlaylist({
          id: playlistData.id,
          name: playlistData.name,
          description: playlistData.description || "No description",
          coverUrl: playlistData.images[0]?.url || "/placeholder.svg",
          tracks: allTracks,
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching playlist data:", error);
        setError("Failed to load playlist data");
        setLoading(false);
      }
    };

    fetchPlaylistData();
  }, [params.id]);

  const getSpotifyEmbed = useCallback(async (track: Track) => {
    if (!track || !track.id) {
      console.error("Invalid track object", track);
      return;
    }

    setSelectedTrack(track);
    setLoading(true);
    setError(null);

    try {
      const type = track.type || "track";
      const embedHtml = `<iframe
          id="spotify-iframe"
          src="https://open.spotify.com/embed/track/${track.id}?utm_source=generator&autoplay=1"
          width="100%"
          height="80"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          style="border-radius: 8px;"
        ></iframe>`;

      setEmbedHtml(embedHtml);
    } catch (error: unknown) {
      console.error("Error setting up Spotify embed:", error);
      setError(
        `Could not load Spotify player for "${track.name}". Please try again.`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="border-b">
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Music className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">VibeSync</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search songs, artists, albums..."
                className="w-full rounded-full bg-muted pl-8 md:w-[300px] lg:w-[400px]"
              />
            </div>
          </div>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-[240px] flex-col border-r bg-muted/40 sm:flex">
          <div className="flex h-14 items-center border-b px-4">
            <h2 className="text-lg font-semibold">Menu</h2>
          </div>
          <nav className="grid gap-2 px-2 py-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground bg-muted"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link
              href="/dashboard/library"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
            >
              <Library className="h-4 w-4" />
              Your Library
            </Link>
            <Link
              href="/dashboard/recent"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
            >
              <Clock className="h-4 w-4" />
              Recently Played
            </Link>
            <Link
              href="/dashboard/liked"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
            >
              <Heart className="h-4 w-4" />
              Liked Songs
            </Link>
            <div className="my-2 border-t" />
            <h3 className="mb-2 px-4 text-xs font-semibold">AI FEATURES</h3>
            <Link
              href="/dashboard/mood"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
            >
              <Sparkles className="h-4 w-4" />
              Mood Search
            </Link>
            <Link
              href="/dashboard/voice"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
            >
              <Mic className="h-4 w-4" />
              Voice Commands
            </Link>
          </nav>
        </aside>
        <main className="flex-1 overflow-y-auto p-6 pb-24">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="aspect-square bg-muted rounded-lg"
                  ></div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : playlist ? (
            <>
              <div>
                <Image
                  src={playlist.coverUrl}
                  alt="playlist Image"
                  height={100}
                  width={100}
                  priority
                />
              </div>
              <h1 className="text-2xl font-bold mb-6">{playlist.name}</h1>
              <p className="text-muted-foreground mb-6">
                {playlist.description}
              </p>
              <div className="border-t border-gray-300 mb-6"></div>

              {/* Track list */}
              <div className="space-y-3">
                {playlist.tracks.map(
                  (track, index) =>
                    track.name && (
                      <div
                        key={track.id}
                        className="flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative h-12 w-12">
                            <Image
                              src={track.coverUrl}
                              alt={track.name}
                              fill
                              className="rounded-lg object-cover"
                            />
                          </div>
                          <div className="items-start">
                            <h4 className="font-medium">{track.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {track.artist}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {track.album}
                        </div>
                        <button
                          className="p-2 rounded-full hover:bg-gray-100 transition-all"
                          onClick={() => getSpotifyEmbed(track)}
                          aria-label={`Play ${track.name}`}
                        >
                          <PlayCircle className="h-6 w-6" />
                        </button>
                      </div>
                    )
                )}
              </div>
            </>
          ) : (
            <div>No playlist data found.</div>
          )}
        </main>
      </div>
      {embedHtml && (
        <div
          className="spotify-embed w-full h-25 fixed-bottom p-4 bg-white"
          dangerouslySetInnerHTML={{ __html: embedHtml }}
        />
      )}
    </div>
  );
}
