# Dev container

One container, `qcor-2026-dev` (hostname `qcor-2026`), built from this repo alone. The main [README](../README.md#in-the-dev-container)
says how to open it and what it serves; this is what each file does and how to SSH in.

| File | Runs | What |
|---|---|---|
| `Dockerfile` | at build | Node 22, Python 3, just, uv, tmux, sshd (key login only); `LIBREOFFICE=true` adds LibreOffice |
| `devcontainer.json` | | name, volumes (node_modules, Claude's login, sshd's host key), ports, the commands below |
| `check-loopback-ports.py` | on the host, before every create and start | refuses to start if any port would be published beyond `127.0.0.1` |
| `post-create.sh` | once, after create | `npm ci` (demo, pptx), Claude Code |
| `start-demo.sh` | every start | the demo on 8771, in tmux session `demo` |
| `start-ssh.sh` | every start | sshd, if `ssh_authorized_keys` exists |

## SSH, from this computer only

For testing on the computer the container runs on, e.g. to open it in the Claude desktop app. Three locks:

1. **Port:** published on the host's `127.0.0.1:2226` only, so nothing else on the network can reach it.
   `check-loopback-ports.py` refuses `-p` without `127.0.0.1:`, `-P`, `appPort` and host networking.
2. **Key:** login as `node` with a key in `ssh_authorized_keys`; no passwords, no root.
3. **Source:** sshd only lets `node` in from the container's own Docker network, the way published-port connections
   arrive (`start-ssh.sh` writes `AllowUsers node@<network>`); until it runs, nobody.

To set it up on a computer:

```bash
cp ~/.ssh/<your key>.pub .devcontainer/ssh_authorized_keys     # gitignored: stays on this computer
```

then rebuild the container (or `bash .devcontainer/start-ssh.sh` inside it), and add to `~/.ssh/config`:

```
Host qcor-dev
  HostName 127.0.0.1
  Port 2226
  User node
  IdentityFile ~/.ssh/<your key>
  IdentitiesOnly yes
  HostKeyAlias qcor-dev
  StrictHostKeyChecking accept-new
```

`ssh qcor-dev` lands in the container; the repo is at `/workspaces/qcor-2026`. In the Claude desktop app, add an SSH
connection to `qcor-dev` and open that folder. With no `ssh_authorized_keys`, sshd doesn't start and the port answers
nothing. The host key lives in a volume, so rebuilds don't change it.
