"use server"

import { setupApiHandler } from "zsa-openapi";
import { getReply } from "./actions";

export const { GET } = setupApiHandler("/posts/{postId}/replies/{replyId}", getReply)