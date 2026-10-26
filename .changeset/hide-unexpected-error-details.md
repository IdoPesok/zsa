---
"zsa": minor
"zsa-openapi": minor
---

Unexpected errors (anything thrown that is not a `ZSAError` or a string) no longer expose their `message` or `data` to the caller. They are returned as `{ code: "ERROR", message: "Internal Server Error" }`, and OpenAPI routes no longer serialize raw thrown errors into the response body. `onError` / `onComplete` callbacks and `experimental_shapeError` still receive the original error. Throw a `ZSAError` to return a message to the client.
