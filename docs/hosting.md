# Hosting the demo for the room

How to serve `demo_pi` to about 100 people at once: each opens the page on their own device, and the agent runs on
our server. Written 2026-11-04.

## What the server has to do

The page is small and static. Each **Run** is a separate pi process on the server (`agent/session.mjs`), and every
session, from every person, goes through one queue of `DEMO_CONCURRENCY` slots (`server.mjs`, `slot`):

- **Rosa** (Prompt view): 1 session, about 2,500 tokens, about 3 s on `gpt-6-luna`.
- **Test** (100 patients): 100 sessions. From the README's table, 1,352 to 5,585 tokens per patient, so 135k to 559k
  tokens per click. A build someone already ran comes from the cache (`.cache/`) at once and costs nothing.

Measured in OrbStack (Linux containers on an M-series Mac) against the stand-in model, which answers at once. These
numbers are the server's own cost; a real model adds 2 to 3 s of waiting per session, which overlaps with other work.

| Container | Load | Result |
|---|---|---|
| 4 vCPU, 8 GB, 24 slots | 100 Rosa runs at once | the last one finished at 28 s |
| | one 100-patient test | 30 s |
| 8 vCPU, 8 GB, 32 slots | 100 Rosa runs at once | the last one finished at 22 s; peak memory 3.0 GB |
| | 5 different 100-patient tests at once | 86 s; peak memory 3.4 GB |
| | 1 Rosa run started behind 3 tests | waited 62 s; 10 s once Rosa goes first and tests run one at a time |

So each session costs about 1 to 1.7 CPU-seconds and about 100 MB. **One 8-vCPU server handles the whole room on Rosa
runs.** The 100-patient test is where it gets heavy, in two ways:

- **Queue.** The line is of sessions, not tests. A test keeps 8 of its patients in the shared line at a time
  (`DEMO_PER_TEST`), and each one that finishes makes room for its next patient, at the back. So every test in the room
  moves at once, a few patients at a time, and none waits for another to finish: with 4 tests or more the 32 agents are
  shared out between them. Each square on Test shows its own patient: in line (amber), running, or done. Rosa runs and
  Ask the EHR questions go ahead of tests' patients; when every agent is busy they are told their place ("In line for
  an agent: 3 runs ahead of yours", in amber under Run and in the terminal) until their turn. Sharing doesn't add
  capacity: 32 agents finish about 200 sessions a minute, so 50 tests at once take about 25 minutes each, but everyone
  sees results from the start. (Until 2026-11-06 tests ran one at a time, and the 50th waited 25 minutes to start.)
- **Robustness.** A session is killed after 60 s (`DEMO_SESSION_TIMEOUT_MS`; a normal one takes 5 to 15 s), so it
  always gives its agent back. Stop or a closed tab takes the test's waiting patients out of the line at once and
  kills its running ones. At most 400 runs, tests and questions are open at once (`DEMO_MAX_OPEN`); past that a page
  is told "The room is full right now. Try again in a minute." `GET /api/status` shows the line: agents running,
  sessions waiting, streams open.
- **Tokens.** If all 100 people each run one test with a different build, that is 10,000 sessions, about 14M to 56M
  tokens, in a few minutes. The workshop project's limit for `gpt-6-luna` is 2,000,000 tokens and 5,000 requests per
  minute (read from the API's `x-ratelimit-*` headers, 2026-11-04), so the room can run about 2 to 5 different tests a
  minute (my estimate, counting each request as OpenAI does). OpenAI counts each request as at least its output cap
  (`DEMO_MAX_TOKENS`, 2048 unless set), while the largest output of any call in the recordings is 153 tokens: set
  `DEMO_MAX_TOKENS=400` and each call counts about what it uses. Over the limit, pi retries once and then the patient
  shows as an error.
- **Where a patient's tokens go** (the recordings): 2 to 3.8 model calls, 1,100 to 5,300 input tokens. The first call
  is already 460 to 990 tokens (the harness prompt, the tool definitions, the question) and is sent again with every
  call; the chart the agent reads adds about 200 to 750. Shorter charts would save little; fewer calls and a lower
  output cap save more.

Cloud vCPUs are usually slower than a Mac's cores, so leave headroom: 8 vCPU or more for the room.

## Recommendation

**Railway for the room, Colab as the take-home, the recorded runs as the fallback.**

| | Railway | Yale Spinup | Personal AWS (EC2) | Colab |
|---|---|---|---|---|
| Reachable from the AHA room | yes, HTTPS URL at once | only after a Security Planning Assessment and a load balancer request; until then Yale network or VPN only | yes, once someone sets it up | yes, but each person runs their own copy |
| Setup, by us | about 30 min, no one else needed | a container in an hour; public access is a ticket process with no stated timeline | about 1 h, through whoever holds the account | a notebook, tested once |
| Setup, per attendee | scan a QR code | scan a QR code | scan a QR code | Google account, open the notebook, run it, 1 to 3 min (estimate), a laptop |
| Holds 100 people | yes, one server, up to 8 vCPU / 8 GB on Hobby (24 / 24 on Pro) | yes, if the container size is large enough | yes, pick the instance size | each has their own 2-vCPU machine; no shared queue, no shared cache |
| Cost | Hobby $5 or Pro $20 a month, plus a few dollars of use | Yale billing | about $0.36/h for 8 vCPU / 16 GB (c7i.2xlarge, on demand; check the console) | free |
| Model tokens | shared cache: a build costs once | shared cache | shared cache | no sharing: every person pays for every build |

Why Railway: we can do it ourselves today, it gives an HTTPS address with no firewall or domain work, Railway allows
HTTP responses to stream for up to 15 minutes as long as data keeps flowing (a test streams for about a minute), and it
bills by use. Spinup is the right home only if the public-access review can finish in time. EC2 is as robust as
Railway, but needs someone else's hands. Colab gives everyone their own copy, which helps no one in the room: it
multiplies the token cost by 100, takes minutes per person, and doesn't work well on a phone.

## Before the day, whichever host

1. **Push the demo.** A host builds what is in GitHub, not what is on your machine: push before you deploy, and
   check that the recordings in `demo_pi/recorded/` match the code (`just test`).
2. **The OpenAI key.** A separate OpenAI project for the workshop, with a budget cap, and its key only in the host's
   environment variables. Check the project's tokens-per-minute limit for `gpt-6-luna` against the numbers above.
   Revoke the key afterwards.
3. **Settings for a shared room:** `DEMO_CONCURRENCY` sized to the server (32 for 8 vCPU), `DEMO_MAX_TOKENS=400`,
   and the defaults for `DEMO_PER_TEST` (8), `DEMO_SESSION_TIMEOUT_MS` (60000) and `DEMO_MAX_OPEN` (400). The line is
   in `server.mjs` (`slot`).
4. **The deploy image** is `Dockerfile` and `.dockerignore` at the repo root: Node 22, pi, `demo_pi/` and `shared/`,
   and nothing else (the dev container's image has sshd and tools a deploy doesn't need). The measurements above ran on
   the same build steps. `just docker-demo` builds and runs it on your machine, with the model settings from `.env`.
5. **Load-test the deployed server** with the stand-in model (start command
   `node demo_pi/test/with-stand-in.mjs --port $PORT`), then with the real model and 10 people clicking at once.
6. **Warm the cache** on the deployed server: run each planned build once (the builds in `record.mjs`), so the room's
   likely builds come back at once.
7. **A QR code** for the URL, on a slide.

On the day, the fallback is the recorded runs: set `DEMO_REPLAY=1` and restart, and the page replays the planned
builds (other builds are refused with a message). The presenter's laptop can also run `just demo-pi 8771 --replay`.

## Railway

Railway builds the `Dockerfile` at the repo root (it always does when there is one), runs it, and routes an HTTPS
address to the port the server listens on. Everything else is set once in the dashboard. Railway's `railway.json` can't
be used: it is deprecated, new services can't opt into it, and it stops being read on 2026-12-01. Its replacement,
Infrastructure as Code (`.railway/railway.ts`, applied with the Railway CLI), is more than one service needs.

1. **Push** `main` to GitHub.
2. Sign in at [railway.com](https://railway.com) with GitHub, on Hobby ($5 a month, $5 of use included; 8 vCPU and
   8 GB per replica, 48 / 48 across its 6 replicas; we run one). Let Railway's GitHub app see `brunombatinica/qcor-2026` (all repositories, or only this one).
3. **New Project → Deploy from GitHub repo →** `brunombatinica/qcor-2026`. It builds and starts at once. With no
   variables yet, the server can't reach a model, so it replays the recordings: a working page before any key is set.
4. **Variables** (the service's Variables tab, Raw Editor):

   ```
   DEMO_BASE_URL=https://api.openai.com/v1
   DEMO_API_KEY=sk-...            # the capped workshop project's key
   DEMO_MODEL=gpt-6-luna
   DEMO_CONCURRENCY=32
   DEMO_MAX_TOKENS=400
   ```

   Then **Deploy** the staged changes. Don't set `PORT`: Railway sets it, and the server listens on it.
5. **Settings**, on the service:
   - **Networking → Public Networking → Generate Domain.** Railway finds the port the server listens on; the address is
     `https://<name>.up.railway.app`.
   - **Deploy → Healthcheck Path:** `/api/config`. A new deploy gets traffic only once this answers, so a build that
     doesn't start leaves the old one up.
   - **Deploy → Region:** US East. **Replicas:** 1 (each replica has its own queue and cache). **Serverless:** off,
     so the first person in the room doesn't wait for it to wake.
   - **Deploy → Replica Limits:** nothing to set. A replica gets up to the plan's 8 vCPU and 8 GB by itself, and is
     billed for what it uses; the room needs no more (the measurements). Set lower only to cap the bill.
   - `DEMO_CONCURRENCY` is for the whole server, not per person: at most that many sessions at once, from everyone, the
     rest waiting (the page says so, with its place in line). 32 is what 8 vCPU was measured with; 2 would make a room
     of 50 wait minutes for Rosa. On the day, `https://<your domain>/api/status` shows how full the line is.
   - **Build → Watch Paths:** `/demo_pi/**`, `/shared/**`, `/Dockerfile`, `/.dockerignore`. Railway redeploys on every
     push to `main`; with these, a push that only changes the slides or notes doesn't.
6. **A volume for the cache.** Right-click the canvas (or ⌘K) → **Volume** → attach it to the service, mount path
   `/app/demo_pi/.cache`. A deploy otherwise starts with an empty cache, so the builds warmed before the talk would run
   again. With a volume the service can't have replicas, and each redeploy has a few seconds of downtime: don't push to
   `main` or change a variable during the session.
7. Open the URL. The header should name `gpt-6-luna`, not **▶ replay**. Run Rosa, then one 100-patient test.
8. Load test: add a second service from the same repo, custom start command `node demo_pi/test/with-stand-in.mjs`
   (it listens on Railway's `PORT`), with its own domain; test it, then delete it.
9. After the workshop, delete `DEMO_API_KEY` (the server redeploys and replays) or the whole project, and revoke the key.

Cost: about $0.22 for 8 vCPU busy for an hour and $0.06 for 4 GB for an hour, at Railway's $20 per vCPU-month and
$10 per GB-month, so the plan's included use covers the workshop.

## Yale Spinup

Spinup servers and containers sit behind Yale's firewall: by default only the Yale network and VPN reach them. People
at AHA aren't on either, so Spinup works for the room only with public access, which needs:

1. **Ask first, today:** spinup@yale.edu or #spinup on Yale Slack. Ask how long a Security Planning Assessment and a
   load balancer take, and say the data is synthetic and the app has no login. If the answer is longer than the time
   left, use Railway for the room.
2. A Spinup space with a billing account.
3. Build the image above for `linux/amd64` and push it to a registry, e.g.
   `docker build --platform linux/amd64 -t ghcr.io/brunombatinica/qcor-demo:latest . && docker push ghcr.io/brunombatinica/qcor-demo:latest`.
4. **Create → Container Service:** the largest size available (8 vCPU if offered; at least 4 vCPU and 8 GB), image
   from step 3, port 8771, and `DEMO_API_KEY`, `DEMO_BASE_URL`, `DEMO_MODEL`, `DEMO_CONCURRENCY` as secret environment
   variables.
5. **Firewall:** a rule for port 8771, "Anywhere on Campus". It is now reachable from the Yale network and VPN, at
   `http://<service>.svc.spinup.yale.edu:8771`. Test it there.
6. **Security Planning Assessment** for the public-facing app.
7. **ServiceNow load balancer request** once the assessment is done: issue type "Infrastructure Platforms", reference
   "Load Balancing", with the app's name, purpose, the owner's NetID, the container's name and the assessment's ticket
   number. The load balancer handles HTTPS; Spinup's page says to listen on 443, so ask which port it forwards to (the
   server listens on whatever `PORT` says). The assessment also approves a `yale.edu` name.

Public Spinup sites must hold no PHI (ours is synthetic) and must meet Yale's accessibility policy. Don't open a
tunnel (cloudflared, ngrok) from a Spinup machine to get around the firewall: that bypasses Yale's controls.

## Personal AWS (EC2)

What to send the person with the account. A plain VM from DigitalOcean or Hetzner, on a card, is the same steps
without the go-between.

1. **Launch an instance:** Ubuntu 24.04, `c7i.2xlarge` (8 vCPU, 16 GB), 20 GB disk, region `us-east-1`.
2. **Security group:** inbound 22 from your own IP only; 80 and 443 from anywhere.
3. **An Elastic IP** on the instance, and a DNS A record (e.g. `qcor.<a domain you have>`) pointing at it. HTTPS needs
   a name; a bare IP works only over plain HTTP.
4. On the machine:

   ```bash
   curl -fsSL https://get.docker.com | sudo sh
   git clone https://github.com/brunombatinica/qcor-2026.git && cd qcor-2026
   sudo docker build -t qcor-demo .
   printf 'DEMO_BASE_URL=https://api.openai.com/v1\nDEMO_API_KEY=sk-...\nDEMO_MODEL=gpt-6-luna\nDEMO_CONCURRENCY=32\nDEMO_MAX_TOKENS=400\n' > .env
   sudo docker run -d --restart unless-stopped --name demo --env-file .env -p 127.0.0.1:8771:8771 qcor-demo
   ```

5. **HTTPS with Caddy**, which gets the certificate by itself: `sudo apt install -y caddy`, then
   `/etc/caddy/Caddyfile`:

   ```
   qcor.example.org {
       reverse_proxy 127.0.0.1:8771 {
           flush_interval -1
       }
   }
   ```

   and `sudo systemctl reload caddy`. `flush_interval -1` sends the streamed runs on at once.
6. Open `https://qcor.example.org`, run Rosa, load-test, warm the cache.
7. After the workshop, terminate the instance and release the Elastic IP (it is billed while unattached).

## Colab (the take-home)

Each person runs the server in their own Colab machine and sees the page in their own browser. Colab's address for a
port only works for the person running the notebook, so this can't serve the room from one place. It suits the
take-home: the encrypted workshop key (`just key-encrypt`, [demo_pi/README.md](../demo_pi/README.md#the-workshop-key-one-code-for-the-room))
was made for it.

A notebook with these cells:

```python
# 1. Node 22 (pi needs 22.19 or later) and the demo
!curl -fsSL https://deb.nodesource.com/setup_22.x | bash - > /dev/null && apt-get install -y nodejs > /dev/null
!git clone --depth 1 https://github.com/brunombatinica/qcor-2026.git
!cd qcor-2026/demo_pi && npm ci --no-audit --no-fund --silent
```

```python
# 2. start the server
import subprocess
server = subprocess.Popen(["node", "qcor-2026/demo_pi/server.mjs", "--port", "8771"])
```

```python
# 3. open the page; type the workshop code in its header
from google.colab import output
output.serve_kernel_port_as_window(8771)
```

Test it a week ahead: Colab's port proxy has broken before (colabtools issue 4738, 403 errors in July 2024). Each
person needs a Google account and a laptop; a 100-patient test takes a minute or more on Colab's 2 vCPUs. Anyone with
the code can recover the key, so it must be the capped workshop project's key, revoked after.

## Sources

- Spinup, public access: <https://yaleits.atlassian.net/wiki/spaces/spinup/pages/643170314/Spinup+External+Access>
- Spinup, container services: <https://yaleits.atlassian.net/wiki/spaces/spinup/pages/3057156115/How+to+deploy+a+web+application+to+Spinup+Container+Service>
- Spinup, servers behind the firewall: <https://spinup.yalepages.org/services/servers.html>
- Railway plans and prices: <https://docs.railway.com/pricing/plans>
- Railway request limits: <https://docs.railway.com/networking/public-networking/specs-and-limits>
- Colab port proxy: <https://github.com/googlecolab/colabtools/issues/4738>
