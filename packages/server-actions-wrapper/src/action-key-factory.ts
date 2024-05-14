/**
 * A factory of action keys. This should be an object with keys that are strings
 * and values that are functions that return an array of strings.
 */
export type ServerActionsKeyFactory<TKey extends string[]> = {
  [key: string]: (...args: any[]) => TKey
}

/** Get all the possible action keys array from a factory */
export type ServerActionKeys<
  TFactory extends ServerActionsKeyFactory<string[]>,
> = ReturnType<TFactory[keyof TFactory]>

/**
 * Create a strongly typed action key factory
 *
 * @param factory A factory of action keys. This should be an object with keys that are strings
 * and values that are functions that return an array of strings.
 * @example
 * ```ts
 * const actionKeyFactory = createServerActionsKeyFactory({
 *   posts: () => ["posts"],
 *   postsList: () => ["posts", "list"],
 *   postDetails: (id: string) => ["posts", "details", id],
 * })
 * ```
 */
export const createServerActionsKeyFactory = <
  const TKeys extends string[],
  const TFactory extends ServerActionsKeyFactory<TKeys>,
>(
  factory: TFactory
) => {
  return factory
}
