"use server"

import { createServerActionWrapper } from "server-actions-wrapper"
import z from "zod"


export const getRandomNumber = createServerActionWrapper()
    .createAction()

    .noInputHandler(async ({ ctx }) => {
        await new Promise((r) => setTimeout(r, 1000))
        return {
            number: Math.floor(Math.random() * (10)) + 0,
        }
    })