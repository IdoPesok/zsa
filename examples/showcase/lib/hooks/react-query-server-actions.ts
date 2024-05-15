import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query"
import { setupReactQueryHooksWithServerActions } from "server-actions-wrapper"

const {
  useQuery: useServerActionQuery,
  useMutation: useServerActionMutation,
  useInfiniteQuery: useServerActionInfiniteQuery,
} = setupReactQueryHooksWithServerActions(
  useQuery,
  useMutation,
  useInfiniteQuery
)

export {
  useServerActionInfiniteQuery,
  useServerActionMutation,
  useServerActionQuery,
}
