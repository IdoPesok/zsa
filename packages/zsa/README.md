# zsa - Typesafe Server Actions for Next.js

`zsa` is a library for building typesafe server actions in Next.js. It provides a simple, scalable developer experience with features like validated inputs/outputs, procedures (middleware) for passing context to server actions, and React Query integration for querying server actions in client components.

## Installation

Install `zsa` using your preferred package manager:

```bash
npm i zsa zsa-react zod
```

## Features

- Validated inputs and outputs using Zod schemas
- Procedures for adding context and authorization to server actions
- Callbacks for running additional logic based on server action lifecycle
- Built-in loading states and error handling
- React Query integration for querying server actions on the client side
- Support for FormData as input type
- Retry functionality and timeouts for server actions
- TypeScript support for a fully typesafe experience

## Getting Started

Create a simple, validated server action:

```typescript
"use server"

import { createServerAction } from "zsa"
import z from "zod"

export const incrementNumberAction = createServerAction()
  .input(
    z.object({
      number: z.number(),
    })
  )
  .handler(async ({ input }) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return input.number + 1
  })
```

Call the server action from the server:

```typescript
const [data, err] = await incrementNumberAction({ number: 24 })

if (err) {
  return
} else {
  console.log(data) // 25
}
```

Call the server action from the client:

```typescript
"use client"

import { incrementNumberAction } from "./actions";
import { useServerAction } from "zsa-react";

export default function IncrementExample() {
    return (
        // ...
        <Button
            onClick={async () => {
                const [data, err] = await incrementNumberAction({ number: counter });
                // ...
            }}
        >
            Invoke action
        </Button>
        // ...
    );
}
```

Call the server action from the client using our hook:

```typescript
"use client"

import { incrementNumberAction } from "./actions";
import { useServerAction } from "zsa-react";

export default function IncrementExample() {
    const { isPending, execute, data } = useServerAction(incrementNumberAction);

    return (
        // ...
        <Button
            onClick={async () => {
                const [data, err] = await execute({ number: counter });
                // ...
            }}
        >
            Invoke action
        </Button>
        // ...
    );
}
```

## Procedures

Procedures allow you to add additional context to a set of server actions, such as the `userId` of the caller. They are useful for ensuring certain actions can only be called if specific conditions are met, like the user being logged in or having certain permissions.

Here's an example of creating a simple procedure:

```typescript
import { createServerActionProcedure } from "zsa"

const authedProcedure = createServerActionProcedure().handler(async () => {
  try {
    const { email, id } = await getUser()
    return {
      user: {
        email,
        id,
      },
    }
  } catch {
    throw new Error("User not authenticated")
  }
})

export const updateEmail = authedProcedure
  .createServerAction()
  .input(
    z.object({
      newEmail: z.string(),
    })
  )
  .handler(async ({ input, ctx }) => {
    const { user } = ctx
    await db
      .update(users)
      .set({
        email: newEmail,
      })
      .where(eq(users.id, user.id))
    return input.newEmail
  })
```

For more detailed documentation and examples, please refer to the [full documentation](https://zsa.vercel.app).

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on the [GitHub repository](https://github.com/IdoPesok/zsa).

## License

`zsa` is released under the [MIT License](https://github.com/IdoPesok/zsa/blob/main/LICENSE).
