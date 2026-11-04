# The demo (demo_pi/) as a small image: what Railway builds from this repo, and what any host that runs containers
# can run (docs/hosting.md). It holds no keys: the model endpoint and key come from the host's environment variables.
#
#   just docker-demo            build it and run it here, with .env, on http://localhost:8771
#
# Built from the repo root because the server also serves shared/ (Rosa's portrait, the logos).
# Node 22: pi needs 22.19 or later.
FROM node:22-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

# the dependencies first, in their own layer: a change to the demo's code reuses it instead of reinstalling pi
COPY demo_pi/package.json demo_pi/package-lock.json demo_pi/
RUN cd demo_pi && npm ci --omit=dev --no-audit --no-fund

COPY shared shared
COPY demo_pi demo_pi

# The server listens on $PORT (Railway sets it), else 8771, on 0.0.0.0. Results are cached in /app/demo_pi/.cache:
# mount a volume there to keep them across deploys.
EXPOSE 8771
CMD ["node", "demo_pi/server.mjs"]
