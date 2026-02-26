'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import * as Video from 'twilio-video';
import { Mic, MicOff, Video as VideoIcon, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoFrame } from './video-frame';

export interface VideoRoomProps {
  sessionId: string;
  token: string;
  roomName: string;
}

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

function tracksToStream(tracks: Map<string, Video.RemoteTrackPublication>): MediaStream | null {
  const stream = new MediaStream();
  let hasTrack = false;

  tracks.forEach((pub) => {
    if (pub.track && ('mediaStreamTrack' in pub.track)) {
      stream.addTrack((pub.track as Video.RemoteAudioTrack | Video.RemoteVideoTrack).mediaStreamTrack);
      hasTrack = true;
    }
  });

  return hasTrack ? stream : null;
}

function localTracksToStream(tracks: Video.LocalTrackPublication[]): MediaStream | null {
  const stream = new MediaStream();
  let hasTrack = false;

  tracks.forEach((pub) => {
    if (pub.track && ('mediaStreamTrack' in pub.track)) {
      stream.addTrack((pub.track as Video.LocalAudioTrack | Video.LocalVideoTrack).mediaStreamTrack);
      hasTrack = true;
    }
  });

  return hasTrack ? stream : null;
}

export function VideoRoom({ sessionId, token, roomName }: VideoRoomProps) {
  const roomRef = useRef<Video.Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remoteLabel, setRemoteLabel] = useState('Partner');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const updateRemoteStream = useCallback((participant: Video.RemoteParticipant) => {
    setRemoteLabel(participant.identity);
    const stream = tracksToStream(participant.tracks);
    setRemoteStream(stream);

    const handleTrackChange = () => {
      setRemoteStream(tracksToStream(participant.tracks));
    };

    participant.on('trackSubscribed', handleTrackChange);
    participant.on('trackUnsubscribed', handleTrackChange);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      try {
        const room = await Video.connect(token, {
          name: roomName,
          audio: true,
          video: { width: 640, height: 360 },
        });

        if (cancelled) {
          room.disconnect();
          return;
        }

        roomRef.current = room;
        setConnectionState('connected');

        // Local tracks
        const localPubs = Array.from(room.localParticipant.tracks.values());
        setLocalStream(localTracksToStream(localPubs));

        // Handle existing remote participants
        room.participants.forEach((participant) => {
          updateRemoteStream(participant);
        });

        // Handle new remote participants
        room.on('participantConnected', (participant) => {
          updateRemoteStream(participant);
        });

        room.on('participantDisconnected', () => {
          setRemoteStream(null);
          setRemoteLabel('Partner');
        });

        room.on('disconnected', () => {
          setConnectionState('disconnected');
        });
      } catch {
        if (!cancelled) {
          setConnectionState('error');
        }
      }
    }

    connect();

    return () => {
      cancelled = true;
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, [token, roomName, updateRemoteStream]);

  const toggleAudio = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;

    room.localParticipant.audioTracks.forEach((pub) => {
      if (pub.track) {
        if (isAudioEnabled) {
          pub.track.disable();
        } else {
          pub.track.enable();
        }
      }
    });
    setIsAudioEnabled((prev) => !prev);
  }, [isAudioEnabled]);

  const toggleVideo = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;

    room.localParticipant.videoTracks.forEach((pub) => {
      if (pub.track) {
        if (isVideoEnabled) {
          pub.track.disable();
        } else {
          pub.track.enable();
        }
      }
    });
    setIsVideoEnabled((prev) => !prev);
  }, [isVideoEnabled]);

  if (connectionState === 'connecting') {
    return (
      <div className="flex items-center justify-center py-16 text-textMuted text-sm">
        Connecting to session...
      </div>
    );
  }

  if (connectionState === 'error') {
    return (
      <div className="flex items-center justify-center py-16 text-error text-sm">
        Failed to connect. Please refresh and try again.
      </div>
    );
  }

  if (connectionState === 'disconnected') {
    return (
      <div className="flex items-center justify-center py-16 text-textMuted text-sm">
        Session ended.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Video grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <VideoFrame
          stream={localStream}
          muted
          label="You"
          isLocal
          isActive={isVideoEnabled}
        />
        <VideoFrame
          stream={remoteStream}
          muted={false}
          label={remoteLabel}
          isLocal={false}
          isActive={!!remoteStream}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <Button
          variant={isAudioEnabled ? 'secondary' : 'danger'}
          size="md"
          onClick={toggleAudio}
          aria-label={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
        >
          {isAudioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
        </Button>

        <Button
          variant={isVideoEnabled ? 'secondary' : 'danger'}
          size="md"
          onClick={toggleVideo}
          aria-label={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {isVideoEnabled ? <VideoIcon size={18} /> : <VideoOff size={18} />}
        </Button>
      </div>
    </div>
  );
}
