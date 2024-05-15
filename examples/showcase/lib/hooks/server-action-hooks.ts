import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query"
import { setupServerActionHooks } from "@za/react-query"

const { useServerActionQuery, useServerActionMutation } =
  setupServerActionHooks({
    useQuery: useQuery,
    useMutation: useMutation,
    useInfiniteQuery: useInfiniteQuery,
  })

export { useServerActionMutation, useServerActionQuery }
