import { createZodSafeFunction } from "./safe-zod-function";

export const createServerActionProcedure = () => {
  return createZodSafeFunction();
};
