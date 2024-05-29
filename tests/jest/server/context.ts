// ---
// title: "Introduction"
// group: "Getting Started"
// groupOrder: 0
// ---

// #### Welcome to `zsa`! 👋

// # ZSA

// `zsa` is the best library for building typesafe server actions in NextJS. Built for a simple, scalable developer experience. Some majors features include...

// - Validated inputs/outputs with zod (hence the name *Zod Server Actions*)
// - Procedures (aka middleware) that pass context to your server actions
// - [React Query](https://tanstack.com/query/latest/docs/framework/react/overview) integration for querying server actions in client components

// _and much more!_

// To get started, you can install `zsa` using any package manager:

// ```bash:terminal
// npm i zsa zsa-react zod
// ```

// <Note>
//   [Zod](https://zod.dev/) provides a simple way to define and validate types in
//   your code.
// </Note>

// ## Creating your first action

// There's plenty of functionality with `zsa`, but to start, here is how you make a simple, validated server action:

// _(we know this function is silly but it gets the point across)_

// ```typescript:actions.ts
// "use server"

// import { createServerAction } from "zsa"
// import z from "zod"

// export const incrementNumberAction = createServerAction() <|highlight|>
//     .input(z.object({
//         number: z.number()
//     }))
//     .handler(async ({ input }) => {
//         // Sleep for .5 seconds
//         await new Promise((resolve) => setTimeout(resolve, 500))
//         // Increment the input number by 1
//         return input.number + 1;
//     });
// ```

// Let's break down the code:

// - `createServerAction` initializes a server action.
// - `input` sets the input schema for the action using a Zod schema.
// - `handler` sets the handler function for the action. **The input is automatically validated based on the input schema.**

// <Info>
//   A `ZSAError` with the code `INPUT_PARSE_ERROR` will be returned if the
//   handler's input is does not match input schema.
// </Info>

// ## Calling from the server

// Server actions can also be called directly from the server without the need for a try/catch block.

// ```typescript:example.ts
// "use server"

// const [data, err] = await incrementNumberAction({ number: 24 }); <|highlight|>

// if (err) {
//     return;
// } else {
//     console.log(data); // 25
// }
// ```

// The action will return either `[data, null]` on success or `[null, err]` on error.

// ## Calling from the client

// The most lightweight way to call your server action is to just call it! That is the beauty of server actions.

// ```typescript:increment-example.tsx
// "use client"

// import { incrementNumberAction } from "./actions";
// import { useState } from "react";
// import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "ui";

// export default function IncrementExample() {
//     const [counter, setCounter] = useState(0);
//     return (
//         <Card>
//             <CardHeader>
//                 <CardTitle>Increment Number</CardTitle>
//             </CardHeader>
//             <CardContent className="flex flex-col gap-4">
//                 <Button
//                 onClick={async () => {
//                     const [data, err] = await incrementNumberAction({ <|highlight|>
//                         number: counter, <|highlight|>
//                     }) <|highlight|>

//                     if (err) {
//                         // handle error
//                         return
//                     }

//                     setCounter(data);
//                 }}
//                 >
//                 Invoke action
//                 </Button>
//                 <p>Count:</p>
//             </CardContent>
//         </Card>
//     );
// }
// ```

// However, usually you will want to use the `useServerAction` hook to make your life easier.

// Server actions come with built-in loading states, making it easy to handle asynchronous operations. Here's an example of using the `incrementNumberAction` as a mutation:

// ```typescript:increment-example.tsx
// "use client"

// import { incrementNumberAction } from "./actions";
// import { useServerAction } from "zsa-react";
// import { useState } from "react";
// import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "ui";

// export default function IncrementExample() {
//     const [counter, setCounter] = useState(0);
//     const { isPending, execute, data } = useServerAction(incrementNumberAction); <|highlight|>

//     return (
//         <Card>
//             <CardHeader>
//                 <CardTitle>Increment Number</CardTitle>
//             </CardHeader>
//             <CardContent className="flex flex-col gap-4">
//                 <Button
//                 onClick={async () => {
//                     const [data, err] = await execute({ <|highlight|>
//                         number: counter, <|highlight|>
//                     }) <|highlight|>

//                     if (err) {
//                         // handle error
//                         return
//                     }

//                     setCounter(data);
//                 }}
//                 >
//                 Invoke action
//                 </Button>
//                 <p>Count:</p>
//                 <div>{isPending ? "saving..." : data}</div> <|highlight|>
//             </CardContent>
//         </Card>
//     );
// }
// ```

// - `useServerAction` allows you to use this server action from within your client components.
// - `execute` executes the server action endpoint with the typesafe input directly from `onClick`.

// Here is the result:

// <ExampleComponent id="increment-example" />

// Thats just the beginning... Continue reading to learn more about `zsa`!

// <Note>
//   To use server actions for querying/refetching data from the client side, visit
//   the [Client Side Usage](/react-query) section.
// </Note>

// ---
// title: "Procedures"
// group: "Getting Started"
// groupOrder: 2
// ---

// # Procedures

// Procedures allow you to add additional context to a set of server actions, such as the `userId` of the caller. They are useful for ensuring certain actions can only be called if specific conditions are met, like the user being logged in or having certain permissions.

// ## Creating a basic procedure

// Here is an example of a simple procedure that ensures a user is logged in, and passes that information to the ctx of the handler

// ```typescript:actions.ts
// "use server"
// import { createServerActionProcedure } from "zsa"

// const authedProcedure = createServerActionProcedure() <|highlight|>
//   .handler(async () => {
//     try {
//       const { email, id } = await getUser();

//       return {
//         user: {
//           email,
//           id,
//         }
//       }
//     } catch {
//       throw new Error("User not authenticated")
//     }
//   })

// export const updateEmail = authedProcedure <|highlight|>
//   .createServerAction()  <|highlight|>
//   .input(z.object({
//     newEmail: z.string()
//   })).handler(async ({input, ctx}) => {
//     const {user} = ctx

//     // Update user's email in the database
//     await db.update(users).set({
//       email: newEmail,
//     }).where(eq(users.id, user.id))

//     return input.newEmail
//   })
// ```

// In this example:

// 1. We create a `authedProcedure` that verifies the user is logged in by calling `getUser()`.
// 2. If successful, it returns the user's email and id. If not, it throws an error.
// 3. We create an `updateEmail` by chaining `createServerAction()` off the procedure. Invoking this action will now the procedure's handler before running its own handler, thus ensuring that only authed users can use this server action.

// ## Chaining procedures

// What if you need to restrict an action based on additional conditions, like the user being an admin? You can create an chained procedure that to run a procedure AFTER another procedure and feed forward that `ctx`.

// ```typescript:actions.ts
// const isAdminProcedure = createServerActionProcedure(authedProcedure) <|highlight|>
//   .handler(async ({ ctx }) => {
//     const role = getUserRole(ctx.user.id)

//     if (role !== "admin") {
//       throw new Error("User is not an admin")
//     }

//     return {
//       user: {
//           id: ctx.user.id,
//           email: ctx.user.email,
//           role: role
//       }
//     }
// });

// const deleteUser = isAdminProcedure <|highlight|>
//   .createServerAction()
//   .input(z.object({
//     userIdToDelete: z.string()
//   })).handler(async ({ input, ctx }) => {
//     const { userIdToDelete } = input
//     const { user } = ctx // receive the context from the procedures

//     // Delete user from database
//     await db.delete(users).where(eq(users.id, userIdToDelete));

//     return userIdToDelete;
// });

// ```

// In this example:

// 1. We call `createServerActionProcedure` and chain off of `authedProcedure` by passing it as an argument.
// 2. We use the `ctx` from the `authedProcedure`'s handler and further determine if the user is an admin.
// 3. We create a `deleteUser` action that runs the two procedures, in order before the actions handler and also has access to the `isAdminProcedure`'s return value in the `ctx`. The action will now only run it's handler if the user is an admin and the inital procedure's don't throw an error.

// ## Procedures with input

// You can also create procedures that require certain input, such as requiring a `postId`, and validate that the user has access to that resource:

// ```typescript:actions.ts
// const ownsPostProcedure = createServerActionProcedure(isAdminProcedure) <|highlight|>
//     .input(
//         z.object({ postId: z.string() })
//     )
//     .handler(async ({ input, ctx }) => {

//         //validate post ownership
//         const ownsPost = await checkUserOwnsPost(ctx.user.id, input.postId)

//         if (!ownsPost) {
//             throw new Error("UNAUTHORIZED")
//         }

//         return {
//             user: ctx.user,
//             post: {
//                 id: input.postId,
//             },
//         }
// })
// ```

// Actions using this `ownsPostProcedure` will now always require a `postId` in the `input`. It will now validate the user's ownership before executing the action's handler:

// ```typescript:actions.ts
// const updatePostName = ownsPostProcedure <|highlight|>
//   .createServerAction()
//   .input(z.object({ newPostName: z.string() }))
//   .handler(async ({ input, ctx }) => {

//     console.log({
//       // input contains postId and newPostName
//       newPostName: input.newPostName, <|highlight|>
//       postId: input.postId, <|highlight|>
//       // ctx contains user and post returned by procedures
//       user: ctx.user, <|highlight|>
//       post: ctx.post, <|highlight|>
//     })

//     return "GREAT SUCCESS"
//   })
// ```

// Now, when we call the `updatePostName`, both `postId` and `newPostName` will be required in the input.

// ```typescript:example.ts
// const [data, err] = await updatePostName({
//   newPostName: "hello world",
//   postId: "post_id_123", <|highlight|>
// })
// ```

// Chaining procedures is a powerful way to pass context into your actions and ensure that certain conditions are met before running the action's handler.

// import { cookies } from "next/headers"
// import { ZSAError } from "zsa"

// export const TEST_USER_ID = 123
// export const TEST_USER_ADMIN_ID = 1337
// export const TEST_USER_EMAIL = "test@example.com"

// export const auth = () => {
//   const cookieStore = cookies()
//   const cookie = cookieStore.get("session")

//   if (!cookie) {
//     throw new ZSAError("NOT_AUTHORIZED", "Not authorized")
//   }

//   if (cookie.value === "admin") {
//     return {
//       id: TEST_USER_ADMIN_ID,
//       email: TEST_USER_EMAIL,
//       name: "Sally Smith",
//     }
//   }

//   return {
//     id: TEST_USER_ID,
//     email: TEST_USER_EMAIL,
//     name: "Bob Jones",
//   }
// }

// export const getPostById = (id: "testUserAuthor" | "notTestUserAuthor") => {
//   const posts = {
//     testUserAuthor: {
//       id: "testUserAuthor",
//       name: "testUserAuthor",
//     },
//     notTestUserAuthor: {
//       id: "notTestUserAuthor",
//       name: "notTestUserAuthor",
//     },
//   } as const

//   return posts[id]
// }

// import { z } from "zod"
// import {
//   ZSAError,
//   chainServerActionProcedures,
//   createServerAction,
//   createServerActionProcedure,
// } from "zsa"
// import { TEST_USER_ADMIN_ID, auth, getPostById } from "./data"

// export const publicAction = createServerAction()

// const protectedProcedure = createServerActionProcedure().handler(async () => {
//   return {
//     auth: auth(),
//   }
// })

// export const protectedAction = protectedProcedure.createServerAction()

// const isAdminProcedure = createServerActionProcedure(
//   protectedProcedure
// ).handler(async ({ ctx }) => {
//   if (ctx.auth.id !== TEST_USER_ADMIN_ID) {
//     throw new ZSAError("NOT_AUTHORIZED", "Not authorized")
//   }

//   return {
//     auth: {
//       ...ctx.auth,
//       isAdmin: true as const,
//     },
//   }
// })

// export const adminAction = isAdminProcedure.createServerAction()

// const ownsPostProcedure = createServerActionProcedure(protectedProcedure)
//   .input(z.object({ postId: z.enum(["testUserAuthor", "notTestUserAuthor"]) }))
//   .handler(async ({ ctx, input }) => {
//     const post = getPostById(input.postId)

//     if (!post || post.id === "notTestUserAuthor") {
//       throw new ZSAError("NOT_AUTHORIZED", "Not authorized")
//     }

//     return {
//       user: ctx.auth,
//       post,
//     }
//   })

// export const ownsPostAction = ownsPostProcedure.createServerAction()

// const ownsPostIsAdminProcedure = chainServerActionProcedures(
//   isAdminProcedure,
//   ownsPostProcedure
// )

// export const ownsPostIsAdminAction =
//   ownsPostIsAdminProcedure.createServerAction()

// "use server"

// import {
//   adminAction,
//   ownsPostAction,
//   ownsPostIsAdminAction,
//   protectedAction,
//   publicAction,
// } from "./procedures"

// export const helloWorldAction = publicAction.handler(async () => {
//   return "hello world" as const
// })

// export const getUserIdAction = protectedAction.handler(async ({ ctx }) => {
//   return ctx.auth.id
// })

// export const getUserGreetingAction = protectedAction.handler(
//   async ({ ctx }) => {
//     return `Hello, ${ctx.auth.name}!` as const
//   }
// )

// export const getAdminGreetingAction = adminAction.handler(async ({ ctx }) => {
//   return `Hello, ${ctx.auth.name}!` as const
// })

// export const getPostByIdAction = ownsPostAction.handler(async ({ ctx }) => {
//   return ctx.post
// })

// export const getPostByIdIsAdminAction = ownsPostIsAdminAction.handler(
//   async ({ ctx }) => {
//     return ctx.post
//   }
// )
