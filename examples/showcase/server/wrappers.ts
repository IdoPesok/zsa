"use server";

import {
  createServerActionWrapper,
  createServerActionMiddleware,
} from "server-actions-wrapper";
import { z } from "zod";

const protectedProcedure = createServerActionMiddleware().noInputHandler(() => {
  return {
    user: {
      name: "IDO",
      id: 1,
    },
  };
});

const admin = createServerActionMiddleware()
  .input(z.object({ user: z.object({ id: z.number(), name: z.string() }) }))
  .handler(({ input }) => {
    if (input.user.id !== 1) throw new Error("You are not authorized");
    return {
      user: input.user,
    };
  });

export const protectedWrapper =
  createServerActionWrapper().middleware(protectedProcedure);

export const adminWrapper = createServerActionWrapper()
  .middleware(protectedProcedure)
  .chainMiddleware(admin);
