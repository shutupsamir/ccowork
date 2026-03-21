import { SignJWT, importPKCS8 } from 'jose';

const JAAS_APP_ID = process.env.JAAS_APP_ID;
const JAAS_API_KEY_ID = process.env.JAAS_API_KEY_ID;
const JAAS_PRIVATE_KEY = process.env.JAAS_PRIVATE_KEY;

/**
 * Whether JaaS (Jitsi as a Service) is configured.
 */
export function isJaasConfigured(): boolean {
  return !!(JAAS_APP_ID && JAAS_API_KEY_ID && JAAS_PRIVATE_KEY);
}

/**
 * Generate a Jitsi meeting URL. Uses JaaS (8x8.vc) if configured,
 * falls back to meet.jit.si for development.
 */
export function getJitsiUrl(roomId: string): string {
  const roomName = createRoomName(roomId);
  if (JAAS_APP_ID) {
    return `https://8x8.vc/${JAAS_APP_ID}/${roomName}`;
  }
  return `https://meet.jit.si/${roomName}`;
}

/**
 * Generate a JaaS JWT for authenticated embedding.
 * Returns null if JaaS is not configured.
 */
export async function generateJaasToken(
  roomId: string,
  user: { name: string; email?: string; avatar?: string; isModerator?: boolean }
): Promise<string | null> {
  if (!JAAS_APP_ID || !JAAS_API_KEY_ID || !JAAS_PRIVATE_KEY) {
    return null;
  }

  const privateKey = await importPKCS8(
    JAAS_PRIVATE_KEY.replace(/\\n/g, '\n'),
    'RS256'
  );

  const now = Math.floor(Date.now() / 1000);
  const roomName = createRoomName(roomId);

  const token = await new SignJWT({
    aud: 'jitsi',
    iss: 'chat',
    sub: JAAS_APP_ID,
    room: roomName,
    context: {
      user: {
        name: user.name,
        email: user.email ?? '',
        avatar: user.avatar ?? '',
        moderator: user.isModerator ? 'true' : 'false',
      },
      features: {
        livestreaming: 'false',
        recording: 'false',
        'outbound-call': 'false',
        transcription: 'false',
      },
    },
  })
    .setProtectedHeader({ alg: 'RS256', kid: JAAS_API_KEY_ID, typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(now + 3 * 60 * 60) // 3 hours
    .setNotBefore(now - 10)
    .sign(privateKey);

  return token;
}

/**
 * Get the full embeddable meeting URL with JWT if JaaS is configured.
 * Falls back to plain Jitsi URL without JWT.
 */
export async function getMeetingUrl(
  roomId: string,
  user: { name: string; email?: string; avatar?: string; isModerator?: boolean }
): Promise<string> {
  const baseUrl = getJitsiUrl(roomId);
  const token = await generateJaasToken(roomId, user);
  if (token) {
    return `${baseUrl}?jwt=${token}`;
  }
  return baseUrl;
}

/**
 * Generate a deterministic room name from a session ID.
 */
export function createRoomName(sessionId: string): string {
  return `ccowork-${sessionId}`;
}
