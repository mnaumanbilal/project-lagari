import { env } from "../config/env";
import { AnalyticsSession, AnalyticsVisitor } from "../db/models";

export async function resolveVisitor(visitorId?: string | null): Promise<AnalyticsVisitor> {
  const now = new Date();
  if (visitorId) {
    const existing = await AnalyticsVisitor.findByPk(visitorId);
    if (existing) {
      await existing.update({ lastSeenAt: now });
      return existing;
    }
  }
  return AnalyticsVisitor.create({
    firstSeenAt: now,
    lastSeenAt: now,
  });
}

export async function createSession(input: {
  userAgent?: string;
  referrer?: string;
  visitorId?: string | null;
}): Promise<AnalyticsSession> {
  const now = new Date();
  const visitor = await resolveVisitor(input.visitorId);

  return AnalyticsSession.create({
    visitorId: visitor.id,
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
  if (session.visitorId) {
    await AnalyticsVisitor.update(
      { lastSeenAt: now },
      { where: { id: session.visitorId } },
    );
  }
  return true;
}
