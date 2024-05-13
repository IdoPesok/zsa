"use client"

import {
  createServerActionsKeyFactory,
  setupServerActionHooks,
} from "server-actions-wrapper/hooks"

export const ActionKeyFactory = createServerActionsKeyFactory({
  getRandomNumber: () => ["getRandomNumber"],
  posts: () => ["posts"],
  postsList: () => ["posts", "list"],
  postDetails: (id: string) => ["posts", "details", id],
})

export const { useServerActionsUtils, useServerAction } =
  setupServerActionHooks(ActionKeyFactory)
