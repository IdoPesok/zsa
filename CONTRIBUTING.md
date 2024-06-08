# Contributing

Thank you for your interest in contributing to the `zsa` project. We appreciate your support and welcome any contributions that can help improve the project. Please take a moment to review this document before submitting your first pull request.

## About this repository

This repository is a monorepo that includes the following packages:

- `tests/jest`: A Next.js project with a `tests` folder that stores all the tests.
- `examples/showcase`: A package that deploys to zsa.vercel.app and stores documentation and examples.
- `packages/zsa`: The core `zsa` package.
- `packages/zsa-react`: The React `zsa` package.
- `packages/zsa-openapi`: The OpenAPI package.
- `packages/zsa-react-query`: The React Query package.

We use the following tools for development and package management:

- [Turborepo](https://turbo.build/repo) as our build system.
- [Changesets](https://github.com/changesets/changesets) for managing releases.
- [npm](https://www.npmjs.com/) for package management.

## Development

To get started with development, follow these steps:

1. Fork the repository by clicking the "Fork" button in the top right corner of the GitHub page.

2. Clone your forked repository to your local machine:

   ```bash
   git clone https://github.com/your-username/zsa.git
   ```

3. Navigate to the project directory:

   ```bash
   cd zsa
   ```

4. Create a new branch for your changes:

   ```bash
   git checkout -b my-new-branch
   ```

5. Install the dependencies:

   ```bash
   npm install
   ```

6. Start the development server:

   ```bash
   npm run dev
   ```

   This command puts everything in dev mode. You can go to `localhost:3000` to see the showcase. When you change a file in any package in dev mode, it will automatically rebuild for you, and you will have access to the new types.

7. Run the tests:

   ```bash
   npm run test
   ```

   NOTE: The Jest tests are in the `__tests__` folder.
   NOTE: The Playwright tests are in the `e2e` folder.

   This command will run the test package and all the tests inside.

## Getting Hands Dirty with the Project

If you want to make changes to any of the packages in the project, you can test your changes in two ways:

**Assuming `npm run dev` is running**

1. Write a new test case:

   - Navigate to the `tests/jest` package.
   - Create a new test file or modify an existing one to cover your changes.
   - Run `npm run test` to execute the tests and ensure your changes are working as expected.

2. Create UI components in the showcase:
   - Navigate to the `examples/showcase` package.
   - Add a new example component in the `ExampleComponent` file or create a new file for your example.
   - Inject your example into a content page or component where you want to test it.
   - Make sure the dev server is running, navigate to where you placed the component, and see the changes.

Feel free to explore the codebase and make changes to any of the packages. Remember to keep the tests updated and provide clear examples in the showcase to demonstrate your changes.

## Pull Request Process

1. Ensure that your changes adhere to the project's coding conventions and have been thoroughly tested.

2. Create a pull request from your branch to the `main` branch of the main repository.

3. Provide a clear and descriptive title for your pull request, summarizing the changes made.

4. In the pull request description, include a detailed explanation of the changes, along with any relevant information or examples.

5. If your pull request addresses an open issue, please reference it in the description using the `Fixes #issue-number` syntax.

6. Be responsive to feedback and be prepared to make changes to your pull request if requested by the maintainers.

## Reporting Issues

If you encounter any bugs, have feature requests, or want to discuss potential improvements, please open an issue on the GitHub repository. When creating an issue, provide a clear and concise description of the problem or suggestion, along with any relevant information or examples.

We appreciate your contributions and look forward to collaborating with you to make the `zsa` project even better!
