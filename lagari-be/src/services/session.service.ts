import { env } from "../config/env";
import { AnalyticsSession } from "../db/models";

export async function createSession(input: {
  userAgent?: string;
  referrer?: string;
}): Promise<AnalyticsSession> {
  const now = new Date();
  return AnalyticsSession.create({
    startedAt: now,
    lastActivityAt: now,
    endedAt: null,
    userAgent: input.userAgent ?? null,
    referrer: input.referrer ?? null,
  });
}

export async function touchSession(sessionId: string): Promise<boolean> {
  const session = await AnalyticsSession.findByPk(sessionId);
  if (!session || session.endedAt) return false;

  const idleMs = env.sessionIdleMinutes * 60 * 1000;
  const now = new Date();
  if (now.getTime() - session.lastActivityAt.getTime() > idleMs) {
    await session.update({ endedAt: now });
    return false;
  }

  await session.update({ lastActivityAt: now });
  return true;
}
