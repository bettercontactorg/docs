# BetterContact API documentation

Public documentation for the BetterContact API, published with
[Mintlify](https://mintlify.com) at **[doc.bettercontact.rocks](https://doc.bettercontact.rocks)**.

## Layout

| Path | Content |
| --- | --- |
| `mint.json` | Site config: navigation, colours, logo, top bar |
| `quickstart.mdx` | Landing page, product overview |
| `api-reference/openapi.json` | **Single source of truth for endpoints, params and responses** |
| `api-reference/endpoint/*.mdx` | One page per endpoint, each pointing at an `openapi` operation |
| `api-reference/*.mdx` | Guides: authentication, statuses, webhooks, errors, credits, rate limits, taxonomies |

Endpoint pages hold no parameter tables of their own: everything is rendered from
`openapi.json`. To change a parameter or a response, edit the spec, not the page.

## Local preview

```bash
npm i -g mintlify
mintlify dev
```

Run it from the repo root, where `mint.json` lives. If a page 404s, you are in the wrong directory.
If the dev server misbehaves, `mintlify install` reinstalls its dependencies.

## Checks

```bash
npx @redocly/cli@latest lint api-reference/openapi.json   # spec is valid
node scripts/check-docs.mjs                               # nav and links are consistent
```

Both run on every pull request via GitHub Actions. Run them before pushing.

## Publishing

The Mintlify GitHub App deploys `main` automatically. Merging to `main` publishes to production.

## Keeping the docs honest

The spec describes the live v2 API served by the Rails app. When an endpoint changes, the spec has
to change with it. The things that drift most often, and are worth re-checking on every API change:

- **HTTP status codes.** The `GET` endpoints answer `202` while a request is running, `200` once it
  is `terminated`. Clients must branch on `status`, not on the HTTP code.
- **Response fields.** The enrichment payload and the Lead Finder payload both carry a set of legacy
  keys that are always `null`. Only document fields that actually carry data.
- **Lead Finder filters.** They are declared in `FILTER_PERMIT_SCHEMA` in
  `app/controllers/api/v2/lead_finder_controller.rb`. Adding one there without adding it here makes
  it invisible to customers.
- **Taxonomies.** `api-reference/taxonomies.mdx` mirrors the provider taxonomies. Re-sync it when
  the provider adds or renames values.
