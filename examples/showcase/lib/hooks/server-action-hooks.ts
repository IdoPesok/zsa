import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query"
import { setupServerActionHooks } from "zsa-react-query"

const { useServerActionQuery, useServerActionMutation } =
  setupServerActionHooks({
    useQuery: useQuery,
    useMutation: useMutation,
    useInfiniteQuery: useInfiniteQuery,
  })

export { useServerActionMutation, useServerActionQuery }
