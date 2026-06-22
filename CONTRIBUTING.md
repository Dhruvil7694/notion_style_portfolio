# Contributing

Thank you for contributing to the AI Engineer Portfolio project.

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `develop` | Integration branch (optional) |
| `feature/*` | New features |
| `fix/*` | Bug fixes |
| `docs/*` | Documentation only |

Create feature branches from `main`:

```bash
git checkout -b feature/phase-3-auth
```

Open pull requests against `main`. Use descriptive branch names tied to roadmap phases when possible.

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

### Types

| Type | Use |
|------|-----|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `chore` | Tooling, deps, config |
| `refactor` | Code change without behavior change |
| `test` | Tests |
| `style` | Formatting only |

### Examples

```
feat(auth): add GitHub OAuth middleware
docs(readme): update environment variable table
chore(deps): upgrade next to 15.5.19
fix(contact): validate email format on submit
```

## Code Style

### TypeScript

- Strict mode enabled with additional checks (`noUncheckedIndexedAccess`, etc.)
- Prefer explicit return types on exported functions
- Use `@/` path alias for all internal imports

### Imports

Imports are auto-sorted by `eslint-plugin-simple-import-sort`:

1. External packages
2. Internal `@/` imports
3. Relative imports

Run `npm run lint:fix` to auto-sort.

### Formatting

Prettier handles formatting. Run `npm run format` before committing, or rely on lint-staged.

Prettier settings:

- No semicolons
- Double quotes
- 2-space indent
- 80 character print width

### React / Next.js

- Prefer Server Components by default
- Add `"use client"` only when needed
- Colocate feature code under `src/features/`
- Keep shadcn components in `src/components/ui/`

### Environment Variables

- Add new variables to `.env.example` with comments
- Validate in `src/lib/env/schema.ts`
- Never commit `.env.local` or secrets

## Pull Request Checklist

- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] New env vars documented in `.env.example`
- [ ] README updated if setup or workflow changed
- [ ] No secrets committed

## Development Phases

Follow the roadmap in `docs/roadmap.md`. Do not implement features from future phases in current phase PRs.

| Phase | Focus |
|-------|-------|
| 3 | Database schema, RLS, GitHub OAuth |
| 4 | Admin CMS with Tiptap |
| 5 | Public site MVP |

## Questions

Open a GitHub issue for architectural questions or refer to `docs/architecture.md`.
