import { desc, eq } from "drizzle-orm";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { events } from "@db/schema";

export const eventsRouter = createRouter({
  /** Feed de atividades do usuário (timeline). */
  feed: authedQuery.query(async ({ ctx }) => {
    return getDb()
      .select()
      .from(events)
      .where(eq(events.userId, ctx.user.id))
      .orderBy(desc(events.createdAt))
      .limit(50);
  }),
});
