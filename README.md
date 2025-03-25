# TypeScript library repo template

**Template repo for building a modern TypeScript library optimized for minimal setup and maintenance effort**

An opinionated template repo configured with the following:

- Typescript
- ESM only
- Node >= 20
- Test using Vitest
- Prettier (see `package.json` for config)
- Typescript ESLint (strict & typed mode)
- Github Actions deployment to npm on push to `main` branch
- Github dependabot configured for weekly updates
- Auto-approve dependabot changes after lint, built, and tests pass
- Auto package version bump on push to `main` branch (based on [Conventional Commits](https://www.conventionalcommits.org/) conventions)
- Github Release generation on deployment (based on [Conventional Commits](https://www.conventionalcommits.org/) conventions)
- Yarn with `nodeLinker: node-modules`
- Block commits on lint/format issues (using `lint-staged`)
- VS Code config with suggested eslint and prettier extensions
- VS Code configured for auto-save

## Configuration before you start:

### Update the `LICENSE` file

- Replace `I Forgot To Add My Name Here` on the copyright line with your name

### Update the `package.json` file

- `name`: Your package name
- `repository`: Your repo info
- `keywords`: Keywords to help people find your package

### Add NPM_TOKEN to the repo secrets

    NOTE: The package must have been published at least once with `npm publish` in order to be able to generate a granular token scoped to the specific package.

1. [Get a token](https://docs.npmjs.com/creating-and-viewing-access-tokens#creating-granular-access-tokens-on-the-website) from npmjs.com
2. [Add a secret with the npm token to be used by Github Actions](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions). The secret must be named `NPM_TOKEN`.

### Enable auto-merge for dependabot pull-requests

There are actually two options:

1. [Enable auto-merge for the repo](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-auto-merge-for-pull-requests-in-your-repository) (only avaylable for public repos or paid accounts as of this writing)
1. Disable the auto-merge option by removing it from `.github/workflows/dependabot.yml`

## Things to know

- Run `yarn` at the root to install all the dependencies and register the new package name before pushing the initial commit
- Ensure that any commits follow [Conventional Commits](https://www.conventionalcommits.org/) conventions in order for the version bump and release notes to work appropriately.

## Yarn Scripts

- `yarn build`
- `yarn lint`
- `yarn test`
- `yarn smoke` - runs build, lint, and test
