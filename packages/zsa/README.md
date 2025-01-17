# zsa

`zsa` is a library for building typesafe server actions in Next.js. It provides a simple, scalable developer experience with features like validated inputs/outputs, procedures (middleware) for passing context to server actions, and React Query integration for querying server actions in client components.

## Installation

Install `zsa` using your preferred package manager:

```bash
npm i zsa zsa-react zsa-react-query zsa-openapi zod
```

## Features

- Validated inputs and outputs using Zod schemas
- Procedures for adding context and authorization to server actions
- Callbacks for running additional logic based on server action lifecycle
- Built-in loading states and error handling
- React Query integration for querying server actions on the client side
- Support for FormData as input type
- Retry functionality and timeouts for server actions
- TypeScript support for a fully typesafe experience

## Documentation

View the full documentation and examples on [zsa.vercel.app](https://zsa.vercel.app/docs/introduction). The documentation includes:

- Getting started guide
- In-depth explanations of core concepts
- Examples for building fully typesafe server actions

If you're looking to learn how to get the most out of `zsa`, [the documentation](https://zsa.vercel.app/docs/introduction) is the best place to start.

## Contributing

We welcome contributions from the community! If you have an idea for a new feature, a bug fix, or any other improvement, please open an issue or submit a pull request, but be sure to read the [contributing guidelines](https://github.com/IdoPesok/zsa/blob/main/CONTRIBUTING.md) first.

## Support

If you encounter any issues or have questions, feel free to reach out via:

- **Discussions**: Visit the [Github discussions](https://github.com/IdoPesok/zsa/discussions) page to ask questions, share ideas, or discuss anything related to `zsa`.
- **Direct support**: For direct inquiries, you can DM ([@ido_pesok](https://twitter.com/ido_pesok)).

## ⚠️ Disclaimer

This is a personal project and is not associated with any company or organization. While I strive to make this project as reliable and useful as possible, it is provided "as is" without any guarantees or warranties.

**Use at your own risk.** You are responsible for reviewing, testing, and validating the code to ensure it meets your requirements and for any consequences that may arise from its use.

I will do my best to maintain and improve this project, but please understand that as a personal project, support and updates may be limited.

### Future Updates

#### Next.js 15 Compatibility
At this time, this project does not support **Next.js 15**, and I likely won’t have the bandwidth to make the necessary updates myself. If this is a feature you’d like to see, contributions are highly encouraged! 

If you’re interested in helping:
- Please feel free to open a Pull Request (PR) with the required updates.
- I’ll do my best to review and merge PRs as time allows.

#### Open Source – Fork or Maintain
This project is open source, so feel free to fork it, modify it, or use it however you like! If you’re interested in taking on a more active role as a maintainer, please don’t hesitate to ping me.

#### Recommended Alternatives
For those seeking a library that already supports **Next.js 15**, I recommend checking out [**next-safe-action**](https://next-safe-action.dev/). It offers excellent compatibility and features for safe server actions in Next.js.

#### Long-Term Outlook
While I can’t promise regular updates to this project moving forward, I hope it can still serve as a useful resource for those interested. Thanks for your understanding and support! 🙏

## Contributors

Here's a shoutout to all the amazing contributors who are helping to make `zsa` better. Thank you for your hard work and dedication!

<a href="https://github.com/IdoPesok/zsa/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=IdoPesok/zsa" />
</a>

Made with [contrib.rocks](https://contrib.rocks).
