# Contributing to Luma

Thank you for your interest in contributing to Luma!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/Luma.git`
3. Install dependencies: `pnpm install`
4. Create a branch: `git checkout -b feat/your-feature`

## Development Setup

```bash
pnpm install
pnpm build:packages
pnpm dev
```

## Code Style

- TypeScript strict mode — no `any` without justification
- ESLint + Prettier for formatting
- Meaningful commit messages following conventional commits

## Commit Convention

```
feat: new feature
fix: bug fix
refactor: code refactoring
test: adding tests
docs: documentation
chore: maintenance
security: security improvements
```

## Pull Requests

1. Ensure all tests pass: `pnpm test`
2. Ensure type checking passes: `pnpm typecheck`
3. Update documentation if needed
4. Submit a PR with clear description

## License

By contributing, you agree that your contributions will be licensed under GPL-3.0.
