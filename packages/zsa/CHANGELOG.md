# server-actions-wrapper

## 0.5.1

### Patch Changes

- 754e219: Coerce booleans in form data

## 0.5.0

### Minor Changes

- 0ed5c1b: - Restructured dependencies to improve compatibility and version management

  - Moved several dependencies to peerDependencies:
    - `zod`
    - `react` (for React-based packages)
    - `@tanstack/react-query` (for zsa-react-query)
    - `openapi-types` (for zsa-openapi)
  - Moved `typescript` from dependencies to devDependencies
  - Retained `zsa` as a direct dependency where applicable
  - Added former dependencies to devDependencies for development and testing purposes
  - Projects using this package now need to explicitly install peer dependencies
  - Minimum required versions for peer dependencies:

    - zod: ^3.23.5
    - react: ^18.0.0 || ^19.0.0 (for React-based packages)
    - @tanstack/react-query: ^5.0.0 (for zsa-react-query)
    - openapi-types: ^12.1.3 (for zsa-openapi)

  - This change allows for more flexibility in version management and reduces potential conflicts with other packages in your project
  - Please ensure you have the required peer dependencies installed in your project after updating
  - If you encounter any issues after updating, please check that all peer dependencies are correctly installed and version-compatible with your project

## 0.4.0

### Minor Changes

- 884cf8f: Change input schemas from zod intersections to zod merges

## 0.3.5

### Patch Changes

- d2d27fd: 402 error code support

## 0.3.4

### Patch Changes

- b9f6162: Allow z.undefined as an output and correctly parse it
- 83f94d1: Experimental shape error feature

## 0.3.3

### Patch Changes

- 0816106: remove stack from error

## 0.3.2

### Patch Changes

- 4f5a8da: Callbacks from chained procedures will run sequentially, like handlers, rather than overwrite each other

## 0.3.1

### Patch Changes

- b8800d6: Support input formData entries with consistent field name

## 0.3.0

### Minor Changes

- 474e0bf: Added new "state" type to inputs to enable use with useActionState

## 0.2.3

### Patch Changes

- 69f8059: Add name to TZSAError

## 0.2.2

### Patch Changes

- cb93c39: Added responseMeta field

## 0.2.1

### Patch Changes

- 735530f: throwing the error when it is a next redirect error to allow the next framework to properly handle and redirect

## 0.2.0

### Minor Changes

- 07daba7: Typed errors that respect the zod input schema, and added a request value if the action was called from an API handler

## 0.1.1

### Patch Changes

- 45955d9: Fix string errors to not be stringified

## 0.1.0

### Minor Changes

- b592762: Added form data type to input

### Patch Changes

- b142dd6: Added README

## 0.0.1

### Patch Changes

- 0102ffe: Initial push

## 0.0.2

### Patch Changes

- 3ba6b05: Initial commit

## 0.1.4

### Patch Changes

- 4a7dbfd: Changing exports

## 0.1.3

### Patch Changes

- 3ba216e: Compiler options

## 0.1.2

### Patch Changes

- c955c60: Fix type versions

## 0.1.1

### Patch Changes

- f84afc3: Added type versions to package json

## 0.1.0

### Minor Changes

- eb1296d: Fixed incorrect isLoading states caused by transitions

## 0.0.2

### Patch Changes

- 91160f4: prototype
