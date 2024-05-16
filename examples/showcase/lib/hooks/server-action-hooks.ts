import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query"
import {
  createServerActionsKeyFactory,
  setupServerActionHooks,
} from "zsa-react-query"

export const QueryKeyFactory = createServerActionsKeyFactory({
  getUser: () => ["getUser"],
  getPosts: () => ["getPosts"],
  somethingElse: (id: string) => ["somethingElse", id],
  getRandomNumber: () => ["getRandomNumber"],
})

const { useServerActionQuery, useServerActionMutation } =
  setupServerActionHooks({
    hooks: {
      useQuery: useQuery,
      useMutation: useMutation,
      useInfiniteQuery: useInfiniteQuery,
    },
    queryKeyFactory: QueryKeyFactory,
  })

export { useServerActionMutation, useServerActionQuery }
