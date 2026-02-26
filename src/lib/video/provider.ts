import twilio from 'twilio';

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_API_KEY_SID,
  TWILIO_API_KEY_SECRET,
} = process.env;

/**
 * Generate a deterministic room name from a session ID.
 */
export function createRoomName(sessionId: string): string {
  return `ccowork_${sessionId}`;
}

/**
 * Generate a Twilio Video access token for a user to join a specific room.
 */
export function createAccessToken(
  userId: string,
  roomName: string
): string {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY_SID || !TWILIO_API_KEY_SECRET) {
    throw new Error('Twilio credentials not configured');
  }

  const AccessToken = twilio.jwt.AccessToken;
  const VideoGrant = AccessToken.VideoGrant;

  const token = new AccessToken(
    TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY_SID,
    TWILIO_API_KEY_SECRET,
    {
      identity: userId,
      ttl: 3600, // 1 hour
    }
  );

  const videoGrant = new VideoGrant({ room: roomName });
  token.addGrant(videoGrant);

  return token.toJwt();
}
