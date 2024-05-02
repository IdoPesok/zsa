import { z } from "zod";
import { createServerActionMiddleware } from "./middleware";
import { createServerActionWrapper } from "./wrapper";

const main = async () => {
  const first = createServerActionMiddleware().noInputHandler(() => {
    return {
      name: "IDO",
    };
  });

  const second = createServerActionMiddleware()
    .input(z.object({ name: z.string() }))
    .ouptut(z.object({ greeting: z.string() }))
    .handler(({ input }) => {
      return {
        greeting: `Hello ${input.name}!`,
      } as const;
    });

  const wrapper = createServerActionWrapper()
    .middleware(first)
    .chainMiddleware(second);

  const myAction = wrapper
    .createAction()
    .onError((err) => {
      console.log("LOGGIN ERROR", err);
    })
    .noInputHandler(({ ctx }) => {
      return ctx.greeting;
    });

  const [data, err] = myAction();

  if (err) {
    return;
  }

  console.log("GOT DATA");
  console.log(data);
};

main();

// export const createServerActionWrapper = <
//   TMiddlewareInput extends TMiddlewareObject<any> | undefined,
// >(args?: {
//   middleware?: TMiddlewareInput
// }) => {};

// createServerActionWrapper({
//   middleware: {
//     input: z.object({
//       name: z.string()
//     }),
//     handler: (args) => {
//       args.name
//     }
//   }
// })

// class ServerAction<
//   TInputSchema extends z.AnyZodObject | undefined,
//   TOutputSchema extends z.AnyZodObject | undefined,
//   TMiddlewareFn extends TFunc,
// > {
//   public inputSchema: TInputSchema;
//   public outputSchema: TOutputSchema;
//   public middlewareFn: TMiddlewareFn;

//   constructor(params: {
//     middlewareFn: TMiddlewareFn;
//     inputSchema: TInputSchema;
//     outputSchema: TOutputSchema;
//   }) {
//     this.inputSchema = params.inputSchema;
//     this.outputSchema = params.outputSchema;
//     this.middlewareFn = params.middlewareFn;
//   }

//   public input(schema: z.AnyZodObject) {
//     return new ServerAction({
//       middlewareFn: this.middlewareFn,
//       inputSchema: schema,
//       outputSchema: this.outputSchema,
//     });
//   }

//   public ouptut(schema: z.AnyZodObject) {
//     return new ServerAction({
//       middlewareFn: this.middlewareFn,
//       inputSchema: this.inputSchema,
//       outputSchema: schema,
//     });
//   }

//   public handler<
//     TReturnType extends TOutputSchema extends z.AnyZodObject
//       ? z.output<TOutputSchema>
//       : any,
//   >(
//     fn: (
//       args: (Parameters<TMiddlewareFn>[0] extends infer T
//         ? T extends z.AnyZodObject
//           ? z.input<T>
//           : {}
//         : {}) &
//         (TInputSchema extends z.AnyZodObject ? z.input<TInputSchema> : {}),
//       context: ReturnType<TMiddlewareFn>
//     ) => TReturnType
//   ) {
//     const wrapper = (args: Parameters<typeof fn>[0]) => {
//       const context = this.middlewareFn(fn);
//       const data = fn(args, context);

//       if (!this.outputSchema) return data;

//       return this.outputSchema.parse(data);
//     };

//     return wrapper;
//   }
// }
