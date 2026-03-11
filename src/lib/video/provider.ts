/**
 * Generate a deterministic Jitsi Meet URL from a session ID.
 */
export function getJitsiUrl(sessionId: string): string {
  return `https://meet.jit.si/ccowork-${sessionId}`;
}

/**
 * Generate a deterministic room name from a session ID.
 * Kept for compatibility with VideoRoom.roomName in the database.
 */
export function createRoomName(sessionId: string): string {
  return `ccowork-${sessionId}`;
}
