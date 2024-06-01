"use client"

import ReactQueryProvider from "app/_providers/react-query-provider"
import {
  QueryKeyFactory,
  useServerActionInfiniteQuery,
} from "lib/hooks/server-action-hooks"
import { infiniteQueryAction } from "server/actions"

function InfiniteQueryUI() {
  const { data, isFetching, isError, error, fetchNextPage, hasNextPage } =
    useServerActionInfiniteQuery(infiniteQueryAction, {
      queryKey: QueryKeyFactory.infinite(),
      initialPageParam: 1,
      input: ({ pageParam = 1 }: { pageParam?: number }) => ({
        page: pageParam,
      }),
      getNextPageParam: (lastPage) => lastPage.nextPage,
    })

  return (
    <div>
      {isFetching && <div role="loading">Loading...</div>}
      {isError && <div role="error">{error?.message}</div>}
      {data &&
        data.pages.map((page, i) => {
          return (
            <div role={"page-" + i}>
              {page.items.map((item: { id: number; name: string }) => {
                return <div key={item.id}>{item.name}</div>
              })}
            </div>
          )
        })}
      <button onClick={() => fetchNextPage()} role="loadMore">
        Load More
      </button>
    </div>
  )
}

export default function InfiniteQueryUIWithProvider() {
  return (
    <ReactQueryProvider>
      <InfiniteQueryUI />
    </ReactQueryProvider>
  )
}
