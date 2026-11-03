# Pi notes (learning log)

How to build/run [Pi](https://pi.dev) extensions. Copied from the agents repo's `docs/pi-notes.md` (2026-11-03), where
the `hfq/...` paths below live; the demo here (`demo_pi/`) follows the same patterns.

## Confirmed (2026-07-11, pi 0.80.6)

- **Package**: `@earendil-works/pi-coding-agent` (npm; binary `pi`). **Needs Node >= 22.19**
  — on Node 20, npm silently installs the old 0.74.x. We run a user-local Node 22 at
  `~/.local/node` (`export PATH="$HOME/.local/node/bin:$PATH"`).
- **Extension loading**: auto-discovery from `~/.pi/agent/extensions/` (global) and
  `.pi/extensions/` (project-local, requires trust — prompt on first run, or `--approve`
  per run). This repo no longer ships an auto-loaded extension (the discovery extension was
  retired 2026-10-06); hfq loads `hfq/agent/extension.ts` explicitly. Explicit
  `pi -e <path>` works but auto-discovered extensions get `/reload` hot-reload;
  `-e` ones don't. `--no-extensions` disables discovery; `pi list` / `pi config` manage
  installed extensions. TypeScript is loaded directly (jiti) — no build step.
- **Extension shape**: default-export a (sync or async) factory receiving `ExtensionAPI`
  (type exported from the package root). Key methods: `registerProvider(name, config)`,
  `registerTool({name, description, parameters, execute})`, `on(event, handler)`,
  `registerCommand/Shortcut/Flag`.
- **registerProvider config**: `{baseUrl, apiKey, api: "openai-completions", models: [...]}`
  where each model is an object `{id, name, reasoning, input, cost{input,output,cacheRead,
  cacheWrite}, contextWindow, maxTokens}` — NOT plain strings (PLAN.md §5.5's sketch was
  looser than reality). `apiKey: "$VAR"` resolves from the environment; `"!cmd"` runs a
  command.
- **Providers are hidden until their env var is set** — even dummy values (ollama/vllm
  ignore the key). Source `.env` / export before running; pi does not read our `.env`.
- **Headless**: `pi --print` (`-p`); `--mode json` for machine-readable output.

- **Headless driving, verified (hfq native_llm_agent):** `pi --mode json --no-session --no-extensions -e <ext.ts>
  --no-skills --no-prompt-templates --no-themes --no-context-files --no-approve --tools <list>
  --provider <name> --model <id> --thinking off --system-prompt "<text>" "<prompt>"` runs one
  session to completion and prints one JSON event per line (`message_end` carries `usage`
  {input, output, cacheRead, cacheWrite} and `stopReason`; `tool_execution_start/end` carry
  `toolName`, `args`, `isError`). `--system-prompt` fully replaces pi's coding prompt (only the
  date and cwd lines are added). Print/json mode merges piped stdin into the prompt, so spawn
  with stdin closed. A custom tool signals failure by throwing; the message becomes the tool
  result and the event is `isError: true`. `hfq/agent/pi.py` is the reference driver;
  `hfq/agent/extension.ts` registers the provider and a tool entirely from env vars (no yaml
  dependency), so `-e` works from any cwd. The vendored copy at
  `hfq/agent/node_modules/@earendil-works/pi-coding-agent/dist/cli.js` (`just setup`, pinned in
  `hfq/agent/package.json`) runs with plain `node` when `pi` is not on PATH.

## TODO
- [x] Model defaults: `endpoints.yaml` now takes optional `context_window` / `max_tokens`
      per provider (read by `hfq/llm/providers.py` and hfq/agent).
- [ ] `pi install <source>` vs `-e` for distributing the extension to sites.

## Log

- **2026-07-11** — installed pi 0.80.6 under user-local Node 22 (`~/.local/node`); wired
  provider-sync in the extension against the real `ExtensionAPI` types; typecheck + model
  listing verified.
- **2026-07-14** — `openai` provider's `models` list in `endpoints.yaml` was a hardcoded
  `["gpt-5", "gpt-4o"]` (a placeholder copied from PLAN.md §5.3's sketch, not a deliberate
  restriction — `hfq/llm/providers.py` never even reads `.models`). Changed to `models: []` +
  extension now fetches `GET /v1/models` at startup and filters out non-chat families
  (embeddings/audio/image/moderation/sora/etc.) when the list is empty for a `kind: openai`
  provider. `ollama-local`/`vllm-local` keep explicit lists since local servers only serve
  whatever's pulled/loaded. Verified: `--list-models` now shows the full gpt-4/gpt-5/o-series
  set for the account's `OPENAI_API_KEY`.
- **2026-09-18** — hfq strategy native_llm_agent (`hfq/agent`): one headless pi session per patient over a
  per-patient DuckDB in the source's own format, `sql` tool + scratch shell, tasks returned as
  JSON; every model/tool call accounted from the `--mode json` stream. Integration test
  (`tests/test_hfq_agent.py`) drives the real CLI against a scripted OpenAI-compatible server.
