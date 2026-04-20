/**
 * @jest-environment jsdom
 */
import {
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
  useMutation,
  useQuery,
} from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import React from "react"
import {
  createServerActionsKeyFactory,
  setupServerActionHooks,
} from "zsa-react-query"

const makeWrapper = () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { Wrapper, client }
}

const queryKeyFactory = createServerActionsKeyFactory({
  ping: () => ["ping"],
  search: (term: string) => ["search", term],
})

const mutationKeyFactory = createServerActionsKeyFactory({
  save: () => ["save"],
})

const {
  useServerActionQuery,
  useServerActionMutation,
  useServerActionInfiniteQuery,
} = setupServerActionHooks({
  hooks: {
    useQuery,
    useMutation,
    useInfiniteQuery,
  },
  queryKeyFactory,
  mutationKeyFactory,
})

describe("zsa-react-query", () => {
  describe("createServerActionsKeyFactory", () => {
    it("returns the factory unchanged and produces the expected keys", () => {
      const factory = createServerActionsKeyFactory({
        foo: () => ["foo"],
        bar: (id: string) => ["bar", id],
      })

      expect(factory.foo()).toEqual(["foo"])
      expect(factory.bar("123")).toEqual(["bar", "123"])
    })
  })

  describe("setupServerActionHooks", () => {
    it("returns the three configured hooks as functions", () => {
      const hooks = setupServerActionHooks({
        hooks: { useQuery, useMutation, useInfiniteQuery },
      })

      expect(typeof hooks.useServerActionQuery).toBe("function")
      expect(typeof hooks.useServerActionMutation).toBe("function")
      expect(typeof hooks.useServerActionInfiniteQuery).toBe("function")
    })

    it("accepts undefined key factories", () => {
      const hooks = setupServerActionHooks({
        hooks: { useQuery, useMutation, useInfiniteQuery },
        queryKeyFactory: undefined,
        mutationKeyFactory: undefined,
      })

      expect(typeof hooks.useServerActionQuery).toBe("function")
    })
  })

  describe("useServerActionQuery", () => {
    it("returns data from a successful action and forwards input", async () => {
      const { Wrapper } = makeWrapper()
      const action = jest.fn(async (input: { name: string }) => [
        { greeting: `hi ${input.name}` },
        null,
      ])

      const { result } = renderHook(
        () =>
          useServerActionQuery(action as any, {
            input: { name: "ada" },
            queryKey: queryKeyFactory.search("ada"),
          }),
        { wrapper: Wrapper }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual({ greeting: "hi ada" })
      expect(action).toHaveBeenCalledWith({ name: "ada" })
    })

    it("surfaces action errors as query errors", async () => {
      const { Wrapper } = makeWrapper()
      const err = new Error("boom")
      const action = jest.fn(async () => [null, err])

      const { result } = renderHook(
        () =>
          useServerActionQuery(action as any, {
            input: undefined as any,
            queryKey: queryKeyFactory.ping(),
          }),
        { wrapper: Wrapper }
      )

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBe(err)
    })

    it("invokes the action once per input change and suspends re-execution on stable input", async () => {
      const { Wrapper } = makeWrapper()
      const action = jest.fn(async (input: { term: string }) => [
        { found: input.term },
        null,
      ])

      const { result, rerender } = renderHook(
        ({ term }: { term: string }) =>
          useServerActionQuery(action as any, {
            input: { term },
            queryKey: queryKeyFactory.search(term),
          }),
        { wrapper: Wrapper, initialProps: { term: "alpha" } }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual({ found: "alpha" })
      expect(action).toHaveBeenCalledTimes(1)

      rerender({ term: "alpha" })
      expect(action).toHaveBeenCalledTimes(1)

      rerender({ term: "beta" })
      await waitFor(() =>
        expect(result.current.data).toEqual({ found: "beta" })
      )
      expect(action).toHaveBeenCalledTimes(2)
      expect(action).toHaveBeenLastCalledWith({ term: "beta" })
    })
  })

  describe("useServerActionMutation", () => {
    it("returns data from a successful mutation and forwards the variables", async () => {
      const { Wrapper } = makeWrapper()
      const action = jest.fn(async (input: { name: string }) => [
        { ok: true, name: input.name },
        null,
      ])

      const { result } = renderHook(
        () =>
          useServerActionMutation(action as any, {
            mutationKey: mutationKeyFactory.save(),
          }),
        { wrapper: Wrapper }
      )

      let value: unknown
      await act(async () => {
        value = await result.current.mutateAsync({ name: "zoe" } as any)
      })

      expect(value).toEqual({ ok: true, name: "zoe" })
      await waitFor(() =>
        expect(result.current.data).toEqual({ ok: true, name: "zoe" })
      )
      expect(action).toHaveBeenCalledWith({ name: "zoe" })
    })

    it("throws action errors when returnError is not set", async () => {
      const { Wrapper } = makeWrapper()
      const err = new Error("mutation failed")
      const action = jest.fn(async () => [null, err])

      const { result } = renderHook(
        () => useServerActionMutation(action as any),
        { wrapper: Wrapper }
      )

      await expect(result.current.mutateAsync(undefined as any)).rejects.toBe(
        err
      )
      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBe(err)
    })

    it("returns the [data, err] tuple without throwing when returnError is true", async () => {
      const { Wrapper } = makeWrapper()
      const err = new Error("soft error")
      const action = jest.fn(async () => [null, err])

      const { result } = renderHook(
        () =>
          useServerActionMutation(action as any, {
            returnError: true,
          }),
        { wrapper: Wrapper }
      )

      let value: unknown
      await act(async () => {
        value = await result.current.mutateAsync(undefined as any)
      })

      expect(value).toEqual([null, err])
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.isError).toBe(false)
      expect(result.current.data).toEqual([null, err])
    })

    it("resolves with undefined when the action yields a falsy result (e.g. redirect)", async () => {
      const { Wrapper } = makeWrapper()
      const action = jest.fn(async () => undefined)

      const { result } = renderHook(
        () => useServerActionMutation(action as any),
        { wrapper: Wrapper }
      )

      let value: unknown = "not-set"
      await act(async () => {
        value = await result.current.mutateAsync(undefined as any)
      })

      expect(value).toBeUndefined()
    })
  })

  describe("useServerActionInfiniteQuery", () => {
    const buildPageAction = () =>
      jest.fn(async (input: { page: number }) => [
        {
          items: Array.from({ length: 3 }, (_, i) => ({
            id: (input.page - 1) * 3 + i + 1,
          })),
          nextPage: input.page < 2 ? input.page + 1 : undefined,
        },
        null,
      ])

    it("loads the first page and calls the action with the computed input", async () => {
      const { Wrapper } = makeWrapper()
      const action = buildPageAction()

      const { result } = renderHook(
        () =>
          useServerActionInfiniteQuery(action as any, {
            queryKey: queryKeyFactory.ping(),
            initialPageParam: 1,
            input: ({ pageParam }: { pageParam: number }) => ({
              page: pageParam,
            }),
            getNextPageParam: (last: { nextPage?: number }) => last.nextPage,
          }),
        { wrapper: Wrapper }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.pages).toHaveLength(1)
      expect(action).toHaveBeenCalledWith({ page: 1 })
    })

    it("fetches additional pages via fetchNextPage", async () => {
      const { Wrapper } = makeWrapper()
      const action = buildPageAction()

      const { result } = renderHook(
        () =>
          useServerActionInfiniteQuery(action as any, {
            queryKey: queryKeyFactory.ping(),
            initialPageParam: 1,
            input: ({ pageParam }: { pageParam: number }) => ({
              page: pageParam,
            }),
            getNextPageParam: (last: { nextPage?: number }) => last.nextPage,
          }),
        { wrapper: Wrapper }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      await waitFor(() => expect(result.current.hasNextPage).toBe(true))

      await act(async () => {
        await result.current.fetchNextPage()
      })

      await waitFor(() => expect(result.current.data?.pages).toHaveLength(2))
      expect(action).toHaveBeenLastCalledWith({ page: 2 })
      await waitFor(() => expect(result.current.hasNextPage).toBe(false))
    })

    it("surfaces action errors as infinite-query errors", async () => {
      const { Wrapper } = makeWrapper()
      const err = new Error("infinite failure")
      const action = jest.fn(async () => [null, err])

      const { result } = renderHook(
        () =>
          useServerActionInfiniteQuery(action as any, {
            queryKey: queryKeyFactory.ping(),
            initialPageParam: 1,
            input: () => ({}) as any,
            getNextPageParam: () => undefined,
          }),
        { wrapper: Wrapper }
      )

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toBe(err)
    })

    it("treats a falsy action result as an undefined page (e.g. redirect)", async () => {
      const { Wrapper } = makeWrapper()
      const action = jest.fn(async () => undefined)

      const { result } = renderHook(
        () =>
          useServerActionInfiniteQuery(action as any, {
            queryKey: queryKeyFactory.ping(),
            initialPageParam: 1,
            input: () => ({}) as any,
            getNextPageParam: () => undefined,
          }),
        { wrapper: Wrapper }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.pages).toEqual([undefined])
    })
  })
})
