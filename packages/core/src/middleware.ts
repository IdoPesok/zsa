import { createZodSafeFunction } from "./safe-zod-function";

export const createServerActionMiddleware = () => {
  return createZodSafeFunction();
};
