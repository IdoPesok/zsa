---
"zsa-react-query": minor
"zsa-openapi": minor
"zsa-react": minor
"zsa": minor
---

- Restructured dependencies to improve compatibility and version management
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
