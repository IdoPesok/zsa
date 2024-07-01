# server-actions-wrapper

## 0.2.0

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

### Patch Changes

- Updated dependencies [0ed5c1b]
  - zsa@0.5.0

## 0.1.1

### Patch Changes

- 986cf04: Fixes redirect and not found usage

## 0.1.0

### Minor Changes

- 07daba7: Added typed errors that respect the input schema

### Patch Changes

- Updated dependencies [07daba7]
  - zsa@0.2.0

## 0.0.2

### Patch Changes

- b142dd6: Added README
- Updated dependencies [b592762]
- Updated dependencies [b142dd6]
  - zsa@0.1.0

## 0.0.1

### Patch Changes

- 0102ffe: Initial push
- Updated dependencies [0102ffe]
  - zsa@0.0.1

## 0.0.2

### Patch Changes

- 3ba6b05: Initial commit
- Updated dependencies [3ba6b05]
  - zsa@0.0.2

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
