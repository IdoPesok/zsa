import {
  TAnyZodSafeFunctionHandler,
  TDataOrError,
  TDataOrErrorAsync,
  TZodSafeFunctionDefaultOmitted,
  ZodSafeFunction,
} from "./safe-zod-function";

export class ServerActionWrapper<
  TMiddlewareChainOutput extends any,
  TOmitted extends string,
  IsMiddlewareAsync extends boolean,
> {
  $middlewareChain: TAnyZodSafeFunctionHandler[] = [];

  public middleware<T extends () => TDataOrError<any>>(middleware: T) {
    type TNewOmitted = Exclude<TOmitted, "chainMiddleware"> | "middleware";
    this.$middlewareChain.push(middleware);
    return this as Omit<
      ServerActionWrapper<
        Awaited<
          ReturnType<T> extends TDataOrError<infer TData> ? TData : never
        >,
        TNewOmitted,
        ReturnType<T> extends TDataOrErrorAsync<any> ? true : IsMiddlewareAsync
      >,
      TNewOmitted
    >;
  }

  public chainMiddleware<
    T extends (input: TMiddlewareChainOutput) => TDataOrError<any>,
  >(middleware: T) {
    this.$middlewareChain.push(middleware);
    return this as Omit<
      ServerActionWrapper<
        Awaited<
          ReturnType<T> extends TDataOrError<infer TData> ? TData : never
        >,
        TOmitted,
        ReturnType<T> extends TDataOrErrorAsync<any> ? true : IsMiddlewareAsync
      >,
      TOmitted
    >;
  }

  public createAction() {
    return new ZodSafeFunction({
      inputSchema: undefined,
      outputSchema: undefined,
      middlewareChain: this.$middlewareChain,
    }) as Omit<
      ZodSafeFunction<
        undefined,
        undefined,
        TZodSafeFunctionDefaultOmitted,
        TMiddlewareChainOutput,
        IsMiddlewareAsync
      >,
      TZodSafeFunctionDefaultOmitted
    >;
  }
}

export const createServerActionWrapper = () => {
  return new ServerActionWrapper() as Omit<
    ServerActionWrapper<never, "$middlewareChain" | "chainMiddleware", false>,
    "$middlewareChain" | "chainMiddleware"
  >;
};
