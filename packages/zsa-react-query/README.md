# zsa-react-query - React Query Integration for zsa

`zsa-react-query` is a companion library for `zsa` that provides seamless integration with [React Query](https://tanstack.com/query/latest/docs/framework/react/overview) for querying and mutating server actions from client components in Next.js applications.

## Installation

Install `zsa-react-query` and its peer dependencies using your preferred package manager:

```bash
npm i zsa-react-query @tanstack/react-query
```

## Setup

Wrap your application with a React Query provider:

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

function ReactQueryProvider({ children }: React.PropsWithChildren) {
  const [client] = useState(new QueryClient())

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

export default ReactQueryProvider
```

Set up your hooks:

```typescript
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query"
import { setupServerActionHooks } from "zsa-react-query"

const {
  useServerActionQuery,
  useServerActionMutation,
  useServerActionInfiniteQuery,
} = setupServerActionHooks({
  hooks: {
    useQuery: useQuery,
    useMutation: useMutation,
    useInfiniteQuery: useInfiniteQuery,
  },
})

export {
  useServerActionInfiniteQuery,
  useServerActionMutation,
  useServerActionQuery,
}
```

## Usage

Query a server action:

```typescript
import { useServerActionQuery } from "@/lib/hooks/server-action-hooks"
import { getRandomNumber } from "./actions"

export default function RandomNumberDisplay() {
  const { isLoading, isRefetching, isSuccess, data } = useServerActionQuery(
    getRandomNumber,
    {
      input: {
        min: 0,
        max: 100,
      },
      queryKey: ["getRandomNumber"],
    }
  )

  // ...
}
```

Mutate a server action:

```typescript
import { useServerActionMutation } from "@/lib/hooks/server-action-hooks"
import { updateEmail } from "./actions"

export default function UpdateEmailForm() {
  const { mutate, isLoading } = useServerActionMutation(updateEmail)

  const handleSubmit = (e) => {
    e.preventDefault()
    const newEmail = e.target.email.value
    mutate({ newEmail })
  }

  // ...
}
```

For more detailed documentation and examples, please refer to the [full documentation](https://zsa.vercel.app).

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on the [GitHub repository](https://github.com/IdoPesok/zsa).

## License

`zsa-react-query` is released under the [MIT License](https://github.com/IdoPesok/zsa/blob/main/LICENSE).
