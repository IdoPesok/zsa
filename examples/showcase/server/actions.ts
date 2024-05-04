"use server"

import { CONTACTS_DATA } from "@/contacts/contacts-data"
import { z } from "zod"
import { adminAction, protectedAction } from "./wrappers"

export const generateRandomNumber = protectedAction
  .createActionWithProcedureInput({
    test: "sdfsdfasf",
  })
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

export const searchContacts = protectedAction
  .createActionWithProcedureInput({
    test: "sdflkjsdfsa",
  })
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

export const getFakeData = protectedAction
  .createActionWithProcedureInput({
    test: "dsfsfdsakfjlsdjf",
  })
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

const testAction = adminAction
  .createActionWithProcedureInput({
    test: "sdfdsfsafafsd",
  })
  .noInputHandler(({ ctx }) => { })
