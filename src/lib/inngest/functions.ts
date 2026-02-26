import { inngest } from './client';
import { runMatchmaker, expireOldRequests } from '../matchmaking';

/**
 * Runs the matchmaker every minute, pairing SEARCHING users into sessions.
 */
export const matchmake = inngest.createFunction(
  { id: 'matchmake', name: 'Matchmaker' },
  { cron: '* * * * *' },
  async ({ step }) => {
    const matchCount = await step.run('run-matchmaker', async () => {
      return runMatchmaker();
    });

    console.log(`[matchmake] Created ${matchCount} match(es)`);
    return { matchCount };
  }
);

/**
 * Expires stale SEARCHING requests every minute.
 */
export const expireRequests = inngest.createFunction(
  { id: 'expire-requests', name: 'Expire Old Match Requests' },
  { cron: '* * * * *' },
  async ({ step }) => {
    const expiredCount = await step.run('expire-old-requests', async () => {
      return expireOldRequests();
    });

    console.log(`[expire-requests] Expired ${expiredCount} request(s)`);
    return { expiredCount };
  }
);
