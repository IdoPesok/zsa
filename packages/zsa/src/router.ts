import { TAnyZodSafeFunctionHandler } from "./types"
import {
  inferServerActionInput,
  inferServerActionReturnType,
} from "./zod-safe-function"

interface TAnyActionMap {
  [key: string]: TAnyZodSafeFunctionHandler
}

export interface TServerActionRouterFn<
  TActionMap extends TAnyActionMap,
  TActionKey extends keyof TActionMap,
> {
  (
    key: TActionKey,
    ...args: Parameters<TActionMap[TActionKey]>
  ): Promise<ReturnType<TActionMap[TActionKey]>>
}

export type TAnyServerActionRouterFn = TServerActionRouterFn<any, any>

type TOnStart<TActionMap extends TAnyActionMap> = {
  [TOnStartKey in keyof TActionMap]: {
    key: TOnStartKey
    input: inferServerActionInput<TActionMap[TOnStartKey]>
  }
}[keyof TActionMap]

type TOnComplete<TActionMap extends TAnyActionMap> = {
  [TOnCompleteKey in keyof TActionMap]: {
    key: TOnCompleteKey
    input: inferServerActionInput<TActionMap[TOnCompleteKey]>
    result: inferServerActionReturnType<TActionMap[TOnCompleteKey]>
  }
}[keyof TActionMap]

/**
 *  Create a router function from a map of actions
 */
export const createServerActionRouter = <
  const TActionMap extends TAnyActionMap,
>(
  actionMap: TActionMap,
  opts?: {
    onStart?: (args: TOnStart<TActionMap>) => void
    onComplete?: (args: TOnComplete<TActionMap>) => void
  }
): TServerActionRouterFn<TActionMap, keyof TActionMap> => {
  const routerFn = async <TActionKey extends keyof TActionMap>(
    key: TActionKey,
    ...args: Parameters<TActionMap[TActionKey]>
  ): Promise<ReturnType<TActionMap[TActionKey]>> => {
    await opts?.onStart?.({ key, input: args[0] })

    const action = actionMap[key]
    // @ts-expect-error
    const result = await action(...args)

    await opts?.onComplete?.({ key, input: args[0], result: result as any })

    // @ts-expect-error
    return result
  }

  return routerFn
}

export type inferMapFromServerActionRouterFn<T> =
  T extends TServerActionRouterFn<infer TActionMap, any> ? TActionMap : never
