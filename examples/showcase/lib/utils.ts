import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import {
  createServerActionsKeyFactory,
  setupServerActionHooks,
} from "../../../packages/server-actions-wrapper/dist"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const ActionKeyFactory = createServerActionsKeyFactory({
  posts: () => ["posts"],
  postsList: () => ["posts", "list"],
  postDetails: (id: string) => ["posts", "details", id],
})

export const { useServerActionsUtils, useServerAction } =
  setupServerActionHooks(ActionKeyFactory)
