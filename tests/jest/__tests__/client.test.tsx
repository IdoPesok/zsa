import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import CallbacksUI from "app/tests/client/callbacks/page"
import ErrorStatesUI from "app/tests/client/error-states/page"
import UserGreetingUI from "app/tests/client/get-user-greeting-action/page"
import HelloWorldUI from "app/tests/client/hello-world-action/page"
import OptimisticUpdatesUI from "app/tests/client/optimistic-updates/page"
import PersistedErrorStatesUI from "app/tests/client/persisted-error-states/page"
import ResetUI from "app/tests/client/reset/page"
import RetryStatesUI from "app/tests/client/retry-states/page"
import StatesUI from "app/tests/client/states/page"
import UndefinedSuccessActionUI from "app/tests/client/undefined-success-action/page"
import InfiniteQueryUI from "app/tests/client/use-server-action-infinite-query/page"
import MutationUI from "app/tests/client/use-server-action-mutation/page"
import QueryUI from "app/tests/client/use-server-action-query/page"
import { sleep } from "lib/utils"
import { cookies } from "next/headers"
import { act } from "react"
import { CLIENT_TEST_DATA, TEST_DATA } from "server/data"

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}))

describe("client", () => {
  describe("basic useServerAction execute", () => {
    it('basic useServerAction that returns "hello world"', async () => {
      render(<HelloWorldUI />)

      let resultElement = screen.getByRole(CLIENT_TEST_DATA.roles.result)

      expect(resultElement).toHaveTextContent(CLIENT_TEST_DATA.initialMessage)

      // Try using getByText if getByRole is not working
      const invokeButton = screen.getByRole(CLIENT_TEST_DATA.roles.invoke)
      fireEvent.click(invokeButton)

      await waitFor(() => {
        resultElement = screen.getByRole(CLIENT_TEST_DATA.roles.result)
        expect(resultElement).toHaveTextContent(CLIENT_TEST_DATA.loadingMessage)
      })

      await waitFor(() => {
        resultElement = screen.getByRole(CLIENT_TEST_DATA.roles.result)
        expect(resultElement).toHaveTextContent(
          CLIENT_TEST_DATA.resultMessages.helloWorldAction
        )
      })
    })
  })

  describe("undefined success execute", () => {
    it('basic useServerAction that returns "hello world"', async () => {
      render(<UndefinedSuccessActionUI />)

      let resultElement = screen.getByRole(CLIENT_TEST_DATA.roles.result)

      expect(resultElement).toHaveTextContent("false")

      // Try using getByText if getByRole is not working
      const invokeButton = screen.getByRole(CLIENT_TEST_DATA.roles.invoke)
      fireEvent.click(invokeButton)

      await waitFor(() => {
        resultElement = screen.getByRole(CLIENT_TEST_DATA.roles.result)
        expect(resultElement).toHaveTextContent(CLIENT_TEST_DATA.loadingMessage)
      })

      await waitFor(() => {
        resultElement = screen.getByRole(CLIENT_TEST_DATA.roles.result)
        expect(resultElement).toHaveTextContent("true")
      })
    })
  })

  describe("useServerAction execute with procedure context", () => {
    it("useServerAction that returns procedure context", async () => {
      ;(cookies as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue({ value: "session" }),
      })

      render(<UserGreetingUI />)

      let resultElement = screen.getByRole(CLIENT_TEST_DATA.roles.result)

      expect(resultElement).toHaveTextContent(CLIENT_TEST_DATA.initialMessage)

      const invokeButton = screen.getByRole(CLIENT_TEST_DATA.roles.invoke)
      fireEvent.click(invokeButton)

      await waitFor(() => {
        resultElement = screen.getByRole(CLIENT_TEST_DATA.roles.result)
        expect(resultElement).toHaveTextContent(CLIENT_TEST_DATA.loadingMessage)
      })

      await waitFor(() => {
        resultElement = screen.getByRole(CLIENT_TEST_DATA.roles.result)
        expect(resultElement).toHaveTextContent(
          CLIENT_TEST_DATA.resultMessages.getUserGreetingAction
        )
      })
    })
  })

  describe("useServerAction callbacks", () => {
    it("successful example: calls onStart, onSuccess, onError, and onFinish callbacks", async () => {
      render(<CallbacksUI />)

      let resultElement = screen.getByRole(CLIENT_TEST_DATA.roles.result)
      expect(resultElement).toHaveTextContent(CLIENT_TEST_DATA.initialMessage)

      const onStartElement = screen.getByRole("onStart")
      expect(onStartElement).toHaveTextContent(CLIENT_TEST_DATA.initialMessage)
      const onSuccessElement = screen.getByRole("onSuccess")
      expect(onSuccessElement).toHaveTextContent(
        CLIENT_TEST_DATA.initialMessage
      )
      const onErrorElement = screen.getByRole("onError")
      expect(onErrorElement).toHaveTextContent(CLIENT_TEST_DATA.initialMessage)
      const onFinishElement = screen.getByRole("onFinish")
      expect(onFinishElement).toHaveTextContent(CLIENT_TEST_DATA.initialMessage)

      const invokeButton = screen.getByRole(CLIENT_TEST_DATA.roles.invoke)
      fireEvent.click(invokeButton)

      await waitFor(() => {
        const onStartElement = screen.getByRole("onStart")
        expect(onStartElement).toHaveTextContent(CLIENT_TEST_DATA.dummyMessage)
      })

      await waitFor(() => {
        const onSuccessElement = screen.getByRole("onSuccess")
        expect(onSuccessElement).toHaveTextContent(
          CLIENT_TEST_DATA.dummyMessage
        )
      })

      await waitFor(() => {
        const onErrorElement = screen.getByRole("onError")
        expect(onErrorElement).toHaveTextContent(
          CLIENT_TEST_DATA.initialMessage
        )
      })

      await waitFor(() => {
        const onFinishElement = screen.getByRole("onFinish")
        expect(onFinishElement).toHaveTextContent(
          CLIENT_TEST_DATA.resultMessages.callbacksAction
        )
      })

      await waitFor(() => {
        resultElement = screen.getByRole(CLIENT_TEST_DATA.roles.result)
        expect(resultElement).toHaveTextContent(
          CLIENT_TEST_DATA.resultMessages.callbacksAction
        )
      })
    })

    it("error example: calls onStart, onSuccess, and onError callbacks", async () => {
      render(<CallbacksUI />)

      let resultElement = screen.getByRole(CLIENT_TEST_DATA.roles.result)
      expect(resultElement).toHaveTextContent(CLIENT_TEST_DATA.initialMessage)

      const onStartElement = screen.getByRole("onStart")
      expect(onStartElement).toHaveTextContent(CLIENT_TEST_DATA.initialMessage)
      const onSuccessElement = screen.getByRole("onSuccess")
      expect(onSuccessElement).toHaveTextContent(
        CLIENT_TEST_DATA.initialMessage
      )
      const onErrorElement = screen.getByRole("onError")
      expect(onErrorElement).toHaveTextContent(CLIENT_TEST_DATA.initialMessage)
      const onFinishElement = screen.getByRole("onFinish")
      expect(onFinishElement).toHaveTextContent(CLIENT_TEST_DATA.initialMessage)

      const invokeErrorButton = screen.getByRole(
        CLIENT_TEST_DATA.roles.invokeError
      )
      fireEvent.click(invokeErrorButton)

      await waitFor(() => {
        const onStartElement = screen.getByRole("onStart")
        expect(onStartElement).toHaveTextContent(CLIENT_TEST_DATA.dummyMessage)
      })

      await waitFor(() => {
        const onSuccessElement = screen.getByRole("onSuccess")
        expect(onSuccessElement).toHaveTextContent(
          CLIENT_TEST_DATA.initialMessage
        )
      })

      await waitFor(() => {
        const onErrorElement = screen.getByRole("onError")
        expect(onErrorElement).toHaveTextContent(CLIENT_TEST_DATA.dummyMessage)
      })

      await waitFor(() => {
        const onFinishElement = screen.getByRole("onFinish")
        expect(onFinishElement).toHaveTextContent("ERROR")
      })

      await waitFor(() => {
        resultElement = screen.getByRole(CLIENT_TEST_DATA.roles.result)
        expect(resultElement).toHaveTextContent(CLIENT_TEST_DATA.initialMessage)
      })
    })
  })

  describe("useServerAction optimistic updates", () => {
    it("sets initial data and performs optimistic updates", async () => {
      render(<OptimisticUpdatesUI />)

      const dataElement = screen.getByRole(CLIENT_TEST_DATA.roles.data)
      expect(dataElement).toHaveTextContent(CLIENT_TEST_DATA.initialMessage)

      const invokeButton = screen.getByRole(CLIENT_TEST_DATA.roles.invoke)
      fireEvent.click(invokeButton)

      await waitFor(() => {
        const isOptimisticElement = screen.getByRole("isOptimistic")
        expect(isOptimisticElement).toHaveTextContent("true")
      })

      await waitFor(() => {
        const resultElement = screen.getByRole(CLIENT_TEST_DATA.roles.result)
        expect(resultElement).toHaveTextContent("Optimistic Action Result")
      })
    })
  })

  describe("useServerAction optimistic updates", () => {
    it("sets initial data and performs optimistic updates", async () => {
      render(<OptimisticUpdatesUI />)

      // Check initial state
      const dataElement = screen.getByRole(CLIENT_TEST_DATA.roles.data)
      expect(dataElement).toHaveTextContent(CLIENT_TEST_DATA.initialMessage)

      const invokeButton = screen.getByRole(CLIENT_TEST_DATA.roles.invoke)
      fireEvent.click(invokeButton)

      // Check optimistic state
      await waitFor(() => {
        const isOptimisticElement = screen.getByRole("isOptimistic")
        expect(isOptimisticElement).toHaveTextContent("true")
        expect(dataElement).toHaveTextContent(CLIENT_TEST_DATA.dummyMessage)
      })

      // Check loading state
      await waitFor(() => {
        const isPendingElement = screen.getByRole("isPending")
        expect(isPendingElement).toHaveTextContent("true")
      })

      // Check final state
      await waitFor(() => {
        const resultElement = screen.getByRole(CLIENT_TEST_DATA.roles.result)
        expect(resultElement).toHaveTextContent(
          CLIENT_TEST_DATA.resultMessages.optimisticUpdates
        )
        expect(dataElement).toHaveTextContent(
          CLIENT_TEST_DATA.resultMessages.optimisticUpdates
        )
        const isOptimisticElement = screen.getByRole("isOptimistic")
        expect(isOptimisticElement).toHaveTextContent("false")
        const isPendingElement = screen.getByRole("isPending")
        expect(isPendingElement).toHaveTextContent("false")
      })
    })
  })

  describe.only("useServerAction error states", () => {
    it("handles error states correctly", async () => {
      render(<ErrorStatesUI />)

      const isErrorElement = screen.getByRole("isError")
      expect(isErrorElement).toHaveTextContent("false")

      const invokeButton = screen.getByRole(CLIENT_TEST_DATA.roles.invoke)
      fireEvent.click(invokeButton)

      await waitFor(() => {
        const isErrorElement = screen.getByRole("isError")
        expect(isErrorElement).toHaveTextContent("true")

        const fieldErrorsElement = screen.getByRole("field-errors")
        expect(fieldErrorsElement).toHaveTextContent(
          `["Number must be greater than or equal to 10"]`
        )

        const manualErrorElement = screen.getByRole("manual-error")
        expect(manualErrorElement).toHaveTextContent(
          `["Number must be greater than or equal to 10"]`
        )
      })
    })

    it("handles persisted error states correctly", async () => {
      render(<PersistedErrorStatesUI />)

      let invokeButton = screen.getByRole(CLIENT_TEST_DATA.roles.invoke)
      fireEvent.click(invokeButton)

      const checkErrors = () => {
        const fieldErrorsElement = screen.getByRole("field-errors")
        expect(fieldErrorsElement).toHaveTextContent(
          `["Number must be greater than or equal to 10"]`
        )
      }

      // check initial errors
      await waitFor(
        () => {
          expect(invokeButton).toBeEnabled()
          checkErrors()
        },
        { timeout: 5000 }
      )

      // click button again
      invokeButton = screen.getByRole(CLIENT_TEST_DATA.roles.invoke)
      fireEvent.click(invokeButton)

      // wait for load to start
      await new Promise((r) => setTimeout(r, 1000)) // wait for 1 second

      // check isPending && errors (persisted)
      await waitFor(() => {
        expect(invokeButton).toBeDisabled()
        checkErrors()
      })

      // check once pending is over error is still there
      await waitFor(
        () => {
          expect(invokeButton).toBeEnabled()
          checkErrors()
        },
        {
          timeout: 5000,
        }
      )
    })
  })

  describe("useServerAction retries", () => {
    it("handles retry states correctly", async () => {
      render(<RetryStatesUI />)

      const isErrorElement = screen.getByRole("isError")
      expect(isErrorElement).toHaveTextContent("false")

      const invokeButton = screen.getByRole("invoke")
      fireEvent.click(invokeButton)

      // Check that isPending is true immediately after clicking the button
      const isPendingElement = screen.getByRole("isPending")
      expect(isPendingElement).toHaveTextContent("yes")
      expect(isErrorElement).toHaveTextContent("false")

      // Calculate the expected retry time
      const expectedRetryTime =
        (TEST_DATA.retries.maxAttempts - 1) * TEST_DATA.retries.delay

      // make sure pending is still true for the entire expected retry time
      let batches = 10
      for (let i = 0; i < batches; i++) {
        await act(async () => {
          await sleep((expectedRetryTime - batches) / batches)
          expect(isPendingElement).toHaveTextContent("yes")
          expect(isErrorElement).toHaveTextContent("false")
        })
      }

      await act(async () => {
        await sleep(50)
      })

      expect(isPendingElement).toHaveTextContent("no")
      expect(isErrorElement).toHaveTextContent("true")
    })
  })

  describe("useServerAction reset", () => {
    it("resets the state to initial values", async () => {
      render(<ResetUI />)

      let resultElement = screen.getByRole(CLIENT_TEST_DATA.roles.result)
      expect(resultElement).toHaveTextContent(CLIENT_TEST_DATA.initialMessage)

      const invokeButton = screen.getByRole(CLIENT_TEST_DATA.roles.invoke)
      fireEvent.click(invokeButton)

      await waitFor(() => {
        resultElement = screen.getByRole(CLIENT_TEST_DATA.roles.result)
        expect(resultElement).toHaveTextContent(
          CLIENT_TEST_DATA.resultMessages.resetAction
        )
      })

      const resetButton = screen.getByRole("reset")
      fireEvent.click(resetButton)

      const dataElement = screen.getByRole("data")
      expect(dataElement).toHaveTextContent(CLIENT_TEST_DATA.initialMessage)
    })
  })

  describe("useServerAction states", () => {
    it("displays the correct states during action execution", async () => {
      render(<StatesUI />)

      // Check initial state
      expect(screen.getByRole("data")).toHaveTextContent(
        CLIENT_TEST_DATA.initialMessage
      )
      expect(screen.getByRole("status")).toHaveTextContent("idle")
      expect(screen.getByRole("isPending")).toHaveTextContent("false")
      expect(screen.getByRole("isSuccess")).toHaveTextContent("false")
      expect(screen.getByRole("isError")).toHaveTextContent("false")

      const invokeSuccessButton = screen.getByRole("invoke")
      fireEvent.click(invokeSuccessButton)

      // Check pending state
      await waitFor(() => {
        expect(screen.getByRole("status")).toHaveTextContent("pending")
        expect(screen.getByRole("isPending")).toHaveTextContent("true")
      })

      // Check success state
      await waitFor(() => {
        expect(screen.getByRole("data")).toHaveTextContent("Success")
        expect(screen.getByRole("status")).toHaveTextContent("success")
        expect(screen.getByRole("isPending")).toHaveTextContent("false")
        expect(screen.getByRole("isSuccess")).toHaveTextContent("true")
        expect(screen.getByRole("isError")).toHaveTextContent("false")
      })

      const invokeErrorButton = screen.getByRole("invoke-error")
      fireEvent.click(invokeErrorButton)

      // Check error state
      await waitFor(() => {
        expect(screen.getByRole("status")).toHaveTextContent("error")
        expect(screen.getByRole("isPending")).toHaveTextContent("false")
        expect(screen.getByRole("isSuccess")).toHaveTextContent("false")
        expect(screen.getByRole("isError")).toHaveTextContent("true")
        expect(screen.getByRole("error")).toHaveTextContent("Error")
      })
    })
  })

  describe("useServerActionQuery", () => {
    it("fetches data and updates the UI", async () => {
      render(<QueryUI />)

      const input = screen.getByPlaceholderText("Search...")
      fireEvent.change(input, { target: { value: "test" } })

      await waitFor(() => {
        expect(screen.getByRole("loading")).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByRole("data")).toHaveTextContent("Query Result: test")
      })
    })
  })

  describe("useServerActionMutation", () => {
    it("submits data and updates the UI", async () => {
      render(<MutationUI />)

      const input = screen.getByPlaceholderText("Name")
      const submitButton = screen.getByText("Submit")

      fireEvent.change(input, { target: { value: "John" } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole("loading")).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByRole("result")).toHaveTextContent(
          "Mutation Result: John"
        )
      })
    })
  })

  describe("useServerActionInfiniteQuery", () => {
    it("renders loading state initially", async () => {
      render(<InfiniteQueryUI />)

      expect(screen.getByRole("loading")).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByRole("page-0")).toBeInTheDocument()
      })

      const loadMoreButton = screen.getByRole("loadMore")
      fireEvent.click(loadMoreButton)

      await waitFor(() => {
        expect(screen.getByRole("loading")).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByRole("page-1")).toBeInTheDocument()
      })
    })
  })
})
