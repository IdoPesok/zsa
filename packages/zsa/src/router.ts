import { TAnyZodSafeFunctionHandler } from "./types"

interface TAnyActionMap {
  [key: string]: TAnyZodSafeFunctionHandler
}

export interface TRouterAction<TActionMap extends TAnyActionMap> {
  <TActionKey extends keyof TActionMap>(
    key: TActionKey,
    ...args: Parameters<TActionMap[TActionKey]>
  ): Promise<ReturnType<TActionMap[TActionKey]>>
}

export type TAnyRouterAction = TRouterAction<any>

type TMergeActionMap<
  T extends TAnyActionMap,
  U extends TAnyActionMap,
> = ServerActionRouter<{
  [K in keyof T | keyof U]: K extends keyof T
    ? T[K]
    : K extends keyof U
      ? U[K]
      : never
}>

class ServerActionRouter<const TActionMap extends TAnyActionMap> {
  $MAP: TActionMap

  constructor(map: TActionMap) {
    this.$MAP = map
  }

  public add<
    const TKey extends string,
    const TAction extends TAnyZodSafeFunctionHandler,
  >(
    key: TKey,
    action: TAction
  ): TKey extends keyof TActionMap
    ? `Duplicate key "${TKey}" found in router`
    : TMergeActionMap<Record<TKey, TAction>, TActionMap> {
    // @ts-expect-error
    return new ServerActionRouter({
      ...this.$MAP,
      [key]: action,
    })
  }

  public join<
    const TJoinKey extends string,
    const TRouter extends TAnyServerActionRouter,
  >(
    joinKey: TJoinKey,
    router: TRouter
  ): TJoinKey extends keyof TActionMap
    ? `Duplicate key "${TJoinKey}" found in router`
    : TMergeActionMap<inferJoinedMap<TRouter, TJoinKey>, TActionMap> {
    const joinedMap: typeof router.$MAP = {}

    for (const [key, value] of Object.entries(router.$MAP)) {
      joinedMap[`${joinKey}.${key}`] = value
    }

    // @ts-expect-error
    return new ServerActionRouter({
      ...this.$MAP,
      ...joinedMap,
    })
  }
}

type TAnyServerActionRouter = ServerActionRouter<any>

type inferJoinedMap<
  TRouter extends TAnyServerActionRouter,
  TJoinKey extends string,
> = {
  [Key in Exclude<
    keyof TRouter["$MAP"],
    symbol
  > as `${TJoinKey}.${Key}`]: TRouter["$MAP"][Key]
}

/**
 *  Create a router function from a map of actions
 */
export const createServerActionRouter = () => new ServerActionRouter({})

/**
 *  Create a router function from a map of actions
 */
export const createRouterAction = <
  const TRouter extends TAnyServerActionRouter,
>(
  router: TRouter
) => {
  type TRet = TRouterAction<TRouter["$MAP"]>

  const routerFn: TRet = async <const TActionKey extends keyof TRouter["$MAP"]>(
    /** The key of the action to execute */
    key: TActionKey,
    /** The input to the action */
    ...args: Parameters<TRouter["$MAP"][TActionKey]>
  ): Promise<ReturnType<TRouter["$MAP"][TActionKey]>> => {
    if (!router.$MAP[key]) {
      throw new Error(`Action "${key as string}" not found in router`)
    }
    return await router.$MAP[key](...args)
  }

  return routerFn
}

export type inferMapFromRouterAction<T extends TAnyRouterAction> =
  T extends TRouterAction<infer TActionMap> ? TActionMap : never
