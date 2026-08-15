import { createRouter, publicQuery } from "./middleware";
import { authRouter } from "./routers/auth";
import { vehiclesRouter } from "./routers/vehicles";
import { simulatorRouter } from "./routers/simulator";
import { quizRouter } from "./routers/quiz";
import { leadsRouter } from "./routers/leads";
import { profileRouter } from "./routers/profile";
import { documentsRouter } from "./routers/documents";
import { stagesRouter } from "./routers/stages";
import { paymentsRouter } from "./routers/payments";
import { referralsRouter } from "./routers/referrals";
import { adminRouter } from "./routers/admin";
import { eventsRouter } from "./routers/events";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),

  auth: authRouter,
  vehicles: vehiclesRouter,
  simulator: simulatorRouter,
  quiz: quizRouter,
  leads: leadsRouter,
  profile: profileRouter,
  documents: documentsRouter,
  stages: stagesRouter,
  payments: paymentsRouter,
  referrals: referralsRouter,
  admin: adminRouter,
  events: eventsRouter,
});

export type AppRouter = typeof appRouter;
