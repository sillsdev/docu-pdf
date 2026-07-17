# Agent notes for docu-pdf

## Pull requests — always target our fork, never upstream

`sillsdev/docu-pdf` is a **fork** of `kohheepeace/mr-pdf`. GitHub tooling defaults PRs to the
fork's *parent*, so an unqualified `gh pr create` opens the PR against `kohheepeace/mr-pdf`
(the upstream original project) — which we do **not** want.

Always open pull requests against **`sillsdev/docu-pdf`**. With the `gh` CLI, be explicit:

```bash
gh pr create --repo sillsdev/docu-pdf --base master --head <branch> --draft ...
```

If a PR is ever accidentally created on `kohheepeace/mr-pdf`, close it and recreate it here.
