import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HelloWorldUI from "app/tests/use-server-action/hello-world-action/page";
import UserGreetingUI from "app/tests/use-server-action/get-user-greeting-action/page";
import { cookies } from "next/headers";
import { CLIENT_TEST_DATA, TEST_DATA } from "server/data";
import CallbacksUI from "app/tests/use-server-action/callbacks/page";
import OptimisticUpdatesUI from "app/tests/use-server-action/optimistic-updates/page";
import ErrorStatesUI from "app/tests/use-server-action/error-states/page"

jest.mock("next/headers", () => ({
    cookies: jest.fn(),
}));

describe("client", () => {
    describe("helloWorldAction", () => {
        it('basic useServerAction that returns "hello world"', async () => {
            render(<HelloWorldUI />);

            let resultElement = screen.getByRole(CLIENT_TEST_DATA.roles.result);

            expect(resultElement).toHaveTextContent(CLIENT_TEST_DATA.initialMessage);

            // Try using getByText if getByRole is not working
            const invokeButton = screen.getByRole(CLIENT_TEST_DATA.roles.invoke);
            fireEvent.click(invokeButton);

            await waitFor(() => {
                resultElement = screen.getByRole(CLIENT_TEST_DATA.roles.result);
                expect(resultElement).toHaveTextContent(CLIENT_TEST_DATA.loadingMessage);
            });

            await waitFor(() => {
                resultElement = screen.getByRole(CLIENT_TEST_DATA.roles.result);
                expect(resultElement).toHaveTextContent(CLIENT_TEST_DATA.resultMessages.helloWorldAction);
            });
        });
    });

    describe("getUserGreetingAction", () => {
        it("useServerAction that returns procedure context", async () => {
            ; (cookies as jest.Mock).mockReturnValue({
                get: jest.fn().mockReturnValue({ value: "session" }),
            })

            render(<UserGreetingUI />);

            let resultElement = screen.getByRole(CLIENT_TEST_DATA.roles.result);

            expect(resultElement).toHaveTextContent(CLIENT_TEST_DATA.initialMessage);

            const invokeButton = screen.getByRole(CLIENT_TEST_DATA.roles.invoke);
            fireEvent.click(invokeButton);

            await waitFor(() => {
                resultElement = screen.getByRole(CLIENT_TEST_DATA.roles.result);
                expect(resultElement).toHaveTextContent(CLIENT_TEST_DATA.loadingMessage);
            });

            await waitFor(() => {
                resultElement = screen.getByRole(CLIENT_TEST_DATA.roles.result);
                expect(resultElement).toHaveTextContent(CLIENT_TEST_DATA.resultMessages.getUserGreetingAction);
            })
        })
    })

    describe("useServerAction callbacks", () => {
        it("successful example: calls onStart, onSuccess, and onError callbacks", async () => {
            render(<CallbacksUI />)



            let resultElement = screen.getByRole(CLIENT_TEST_DATA.roles.result);
            expect(resultElement).toHaveTextContent(CLIENT_TEST_DATA.initialMessage);

            const onStartElement = screen.getByRole("onStart")
            expect(onStartElement).toHaveTextContent(CLIENT_TEST_DATA.initialMessage)
            const onSuccessElement = screen.getByRole("onSuccess")
            expect(onSuccessElement).toHaveTextContent(CLIENT_TEST_DATA.initialMessage)
            const onErrorElement = screen.getByRole("onError")
            expect(onErrorElement).toHaveTextContent(CLIENT_TEST_DATA.initialMessage)

            const invokeButton = screen.getByRole(CLIENT_TEST_DATA.roles.invoke)
            fireEvent.click(invokeButton)

            await waitFor(() => {
                const onStartElement = screen.getByRole("onStart")
                expect(onStartElement).toHaveTextContent(CLIENT_TEST_DATA.dummyMessage)
            })

            await waitFor(() => {
                const onSuccessElement = screen.getByRole("onSuccess")
                expect(onSuccessElement).toHaveTextContent(CLIENT_TEST_DATA.dummyMessage)
            })

            await waitFor(() => {
                const onErrorElement = screen.getByRole("onError")
                expect(onErrorElement).toHaveTextContent(CLIENT_TEST_DATA.initialMessage)
            })

            await waitFor(() => {
                resultElement = screen.getByRole(CLIENT_TEST_DATA.roles.result);
                expect(resultElement).toHaveTextContent(CLIENT_TEST_DATA.resultMessages.callbacksAction);
            });
        })

        it("error example: calls onStart, onSuccess, and onError callbacks", async () => {
            render(<CallbacksUI />)


            let resultElement = screen.getByRole(CLIENT_TEST_DATA.roles.result);
            expect(resultElement).toHaveTextContent(CLIENT_TEST_DATA.initialMessage);

            const onStartElement = screen.getByRole("onStart")
            expect(onStartElement).toHaveTextContent(CLIENT_TEST_DATA.initialMessage)
            const onSuccessElement = screen.getByRole("onSuccess")
            expect(onSuccessElement).toHaveTextContent(CLIENT_TEST_DATA.initialMessage)
            const onErrorElement = screen.getByRole("onError")
            expect(onErrorElement).toHaveTextContent(CLIENT_TEST_DATA.initialMessage)

            const invokeErrorButton = screen.getByRole(CLIENT_TEST_DATA.roles.invokeError)
            fireEvent.click(invokeErrorButton)


            await waitFor(() => {
                const onStartElement = screen.getByRole("onStart")
                expect(onStartElement).toHaveTextContent(CLIENT_TEST_DATA.dummyMessage)
            })

            await waitFor(() => {
                const onSuccessElement = screen.getByRole("onSuccess")
                expect(onSuccessElement).toHaveTextContent(CLIENT_TEST_DATA.initialMessage)
            })

            await waitFor(() => {
                const onErrorElement = screen.getByRole("onError")
                expect(onErrorElement).toHaveTextContent(CLIENT_TEST_DATA.dummyMessage)
            })

            await waitFor(() => {
                resultElement = screen.getByRole(CLIENT_TEST_DATA.roles.result);
                expect(resultElement).toHaveTextContent(CLIENT_TEST_DATA.initialMessage);
            });
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
                expect(resultElement).toHaveTextContent("Optimistic Action Result")
                expect(dataElement).toHaveTextContent("Optimistic Action Result")
                const isOptimisticElement = screen.getByRole("isOptimistic")
                expect(isOptimisticElement).toHaveTextContent("false")
                const isPendingElement = screen.getByRole("isPending")
                expect(isPendingElement).toHaveTextContent("false")
            })
        })
    })

    describe("useServerAction error states", () => {
        it("handles error states correctly", async () => {
            render(<ErrorStatesUI />)

            const invokeButton = screen.getByRole(CLIENT_TEST_DATA.roles.invoke)
            fireEvent.click(invokeButton)

            await waitFor(() => {
                const isErrorElement = screen.getByRole("isError")
                expect(isErrorElement).toHaveTextContent("true")
            })

            const resultElement = screen.getByRole(CLIENT_TEST_DATA.roles.result)
            expect(resultElement).toHaveTextContent(TEST_DATA.errors.string)
        })
    })
});
