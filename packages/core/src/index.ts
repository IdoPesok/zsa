import z from "zod";
import { createServerActionProcedure } from "./procedure";
import { createServerActionWrapper } from "./wrapper";
import { SAWError } from "./errors";

export {
  createServerActionProcedure as createServerActionMiddleware,
  createServerActionWrapper,
};

const userSchema = z.object({
  username: z.string(),
  id: z.number(),
});

const auth = () => {
  let num = 5;
  if (num < 5) return null;
  return {
    username: "idopesok",
    id: 1,
  };
};

const main = async () => {
  const protectedProcedure = createServerActionProcedure().noInputHandler(
    () => {
      const user = auth();
      if (!user) throw new SAWError("NOT_AUTHORIZED");
      return { user };
    },
  );

  const adminProcedure = createServerActionProcedure()
    .input(z.object({ user: userSchema }))
    .handler(({ input }) => {
      if (input.user.id !== 1) throw new SAWError("NOT_AUTHORIZED");
      return {
        user: {
          ...input.user,
          isAdmin: true,
        },
      } as const;
    });

  const protectedAction = createServerActionWrapper()
    .onError((err) => {
      console.log("LOGGIN ERROR", err);
    })
    .procedure(protectedProcedure);

  const adminAction = protectedAction.chainProcedure(adminProcedure);

  const getAdminGreeting = adminAction
    .createAction()
    .input(z.object({ message: z.string() }).default({ message: "Take care!" }))
    .onError((err) => {
      console.log("LOGGIN ERROR", err);
    })
    .handler(({ input, ctx }) => {
      return {
        greeting: `Hi ${ctx.user.username}. ${input.message}`,
      };
    });

  const [data, err] = getAdminGreeting({ message: "Have a wonderful day!" });

  if (err) {
    return;
  }

  console.log("GOT DATA");
  console.log(data);
};

main();
