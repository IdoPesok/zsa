import { useMutation, useQuery } from "@tanstack/react-query"
import { setupReactQueryHooksWithServerActions } from "server-actions-wrapper"

const { useQuery: useServerActionQuery, useMutation: useServerActionMutation } =
  setupReactQueryHooksWithServerActions(useQuery, useMutation)

export { useServerActionMutation, useServerActionQuery }
