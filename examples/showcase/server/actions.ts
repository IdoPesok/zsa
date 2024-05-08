"use server"

import { CONTACTS_DATA } from "@/contacts/contacts-data"
import { z } from "zod"
import { adminProcedure, protectedProcedure } from "./procedures"

export const generateRandomNumber = protectedProcedure
  .createServerAction()
  .input(
    z
      .object({
        min: z.number(),
        max: z.number(),
      })
      .refine((input) => input.min < input.max)
  )
  .handler(async ({ input, ctx }) => {
    await new Promise((r) => setTimeout(r, 3000))
    return {
      number: Math.floor(Math.random() * (input.max - input.min)) + input.min,
    }
  })

export const searchContacts = protectedProcedure
  .createServerAction()
  .input(
    z.object({
      query: z.string().min(1),
    })
  )
  .handler(async ({ input }) => {
    // fake loading state
    await new Promise((r) => setTimeout(r, 2000))

    return CONTACTS_DATA.filter((c) =>
      c.name.toLowerCase().includes(input.query.toLowerCase())
    ).slice(0, 10)
  })

export const getFakeData = protectedProcedure
  .createServerAction()
  .input(
    z
      .object({
        length: z.number(),
      })
      .default({ length: 10 })
  )
  .handler(async ({ input, ctx }) => {
    await new Promise((r) => setTimeout(r, 3000))
    if (!input) {
      return [1, 2, 3]
    }
    return Array.from({ length: input.length }, () => Math.random())
  })

const testAction = adminProcedure.createServerAction().handler(({ ctx }) => {})
