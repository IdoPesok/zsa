import {
  TAnyZodSafeFunctionHandler,
  inferServerActionError,
  inferServerActionReturnData,
  inferServerActionReturnType,
} from "zsa"
import { RetryConfig } from "./retries"

export interface TUseServerActionOpts<
  TServerAction extends TAnyZodSafeFunctionHandler,
  TPersistError extends boolean,
  TPersistData extends boolean,
  TUseRouterKey extends boolean,
> {
  onError?: (args: { err: inferServerActionError<TServerAction> }) => void
  onSuccess?: (args: {
    data: inferServerActionReturnData<TServerAction>
  }) => void
  onStart?: () => void
  onFinish?: (result: inferServerActionReturnType<TServerAction>) => void

  bind?: Parameters<TServerAction>[0] extends FormData
    ? Parameters<TServerAction>[1]
    : undefined

  initialData?: inferServerActionReturnData<TServerAction>
  retry?: RetryConfig<TServerAction>
  persistErrorWhilePending?: TPersistError
  persistDataWhilePending?: TPersistData

  routerKey?: TUseRouterKey extends true ? string : undefined
}
