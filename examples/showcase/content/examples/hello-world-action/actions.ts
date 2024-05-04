"use server"

import { createServerActionWrapper } from "server-actions-wrapper"
import z from "zod"

export const helloWorldAction = createServerActionWrapper()
    .createAction()
    .input(z.object({
        message: z.string()
    }))
    .handler(async ({ input }) => {
        console.log(input.message)
        return input.message + " How is your day?"
    })

export const incrementNumberAction = createServerActionWrapper()
    .createAction()
    .input(z.object({
        number: z.number()
    }))
    .handler(async ({ input }) => {
        console.log(input.number)
        return input.number + 1
    })