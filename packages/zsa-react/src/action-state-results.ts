import {
  TAnyZodSafeFunctionHandler,
  TZSAError,
  inferInputSchemaFromHandler,
  inferServerActionReturnData,
} from "zsa"

export type TServerActionActionStateResult<
  TServerAction extends TAnyZodSafeFunctionHandler,
> =
  | {
      data: undefined
      isError: false
      error: undefined
      isSuccess: false
      status: "idle"
    }
  | {
      data: undefined
      isError: true
      error: TZSAError<inferInputSchemaFromHandler<TServerAction>>
      isSuccess: false
      status: "error"
    }
  | {
      data: inferServerActionReturnData<TServerAction>
      isError: false
      error: undefined
      isSuccess: true
      status: "success"
    }
