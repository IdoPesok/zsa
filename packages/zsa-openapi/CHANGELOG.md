# zsa-openapi

## 0.2.0

### Minor Changes

- 9b5f4fb: Added support for input schema functions

### Patch Changes

- Updated dependencies [884cf8f]
  - zsa@0.4.0

## 0.1.2

### Patch Changes

- d2d27fd: 402 error code support
- Updated dependencies [d2d27fd]
  - zsa@0.3.5

## 0.1.1

### Patch Changes

- 322305a: Only validate content type for requests that are not GET and DELETE

## 0.1.0

### Minor Changes

- c03c5bf: Breaking change: you must now specify the allowed content types if it is not appliation/json. Please see the docs under Configuring OpenAPI > Content Types for how to set this up

## 0.0.12

### Patch Changes

- ffd71e5: Allow returning custom Responses in shape error

## 0.0.11

### Patch Changes

- b9f6162: Parse empty inputs correctly based on if schema can be undefined or empty object
- Updated dependencies [b9f6162]
- Updated dependencies [83f94d1]
  - zsa@0.3.4

## 0.0.10

### Patch Changes

- b8800d6: Support input formData entries with consistent field name
- Updated dependencies [b8800d6]
  - zsa@0.3.1

## 0.0.9

### Patch Changes

- 7b7615a: Small feature, shapeError option on routers

## 0.0.8

### Patch Changes

- b075c86: Added createRouteHandlersForAction

## 0.0.7

### Patch Changes

- 0dda6c1: Support :param in paths

## 0.0.6

### Patch Changes

- c358bbb: Return responses correctly

## 0.0.5

### Patch Changes

- 3b3f294: Use response instead of next response"

## 0.0.4

### Patch Changes

- cb93c39: Added responseMeta field
- Updated dependencies [cb93c39]
  - zsa@0.2.2

## 0.0.3

### Patch Changes

- 17ffd47: Returns json content type

## 0.0.2

### Patch Changes

- 4ce404a: Support notFound() and redirect() in openapi routes

## 0.0.1

### Patch Changes

- 07daba7: Initial release
- Updated dependencies [07daba7]
  - zsa@0.2.0
