---
name: vpk-deploy
description: This skill should be used when the user asks to "deploy", "deploy to
  Micros", "push to production", "ship to production", "deploy my prototype", "push
  my changes", "check deployment status", "redeploy changes", "set up deployment",
  "go live", "publish", "make it live", "host this", "put this online", "release",
  "launch", "how do I deploy", "how do I ship this", or wants to deploy their VPK
  prototype to Atlassian Micros infrastructure. Also triggered by errors like "deployment
  failed", "deploy error", "build failed on Micros". Auto-detects initial vs redeploy
  workflows.
---
# VPK Deploy - Deploy to Micros

**Goal:** Deploy the prototype to Atlassian Micros infrastructure.

## Quick Start

```bash
/vpk-deploy              # Interactive mode - auto-detects or asks
/vpk-deploy --status     # Show deployment status (service info, env vars)
/vpk-deploy --initial    # Force initial deployment workflow
/vpk-deploy --redeploy   # Force redeploy workflow
```

---

## Interactive Workflow (Default)

When invoked without flags, first auto-detect the deployment type. If detection is ambiguous or the user just wants to check status, ask a concise user-facing question:

```yaml
header: "Deployment action"
question: "What would you like to do?"
options:
  - label: "Check status"
    description: "View current deployment status and configuration"
  - label: "Deploy changes"
    description: "Build and deploy current code to Micros"
  - label: "Initial setup"
    description: "First-time deployment configuration"
  - label: "View env vars"
    description: "Check environment variables on Micros"
```

---

## Status Workflow (`--status`)

Shows current deployment configuration and status.

### Agent Instructions for Status

1. **Check local configuration**

   ```bash
   # Check if deploy config exists
   if [ -f ".deploy.local" ]; then
     source .deploy.local
     echo "Service: $SERVICE_NAME"
     echo "Environment: $ENV"
   else
     echo "No .deploy.local found"
   fi

   # Check service-descriptor.yml
   grep "image: docker.atl-paas.net/" service-descriptor.yml
   ```

2. **Check Micros service status** (if service name known)

   ```bash
   atlas micros service show -s $SERVICE_NAME -e $ENV
   ```

3. **List environment variables** (if service exists)

   ```bash
   atlas micros stash list -s $SERVICE_NAME -e $ENV
   ```

4. **Report status**
   - Service name and URL
   - Current deployment version
   - Environment variables status (count of vars set)
   - Any missing configuration

---

## Step 0: Auto-Detect Deployment Type

**First, check if `.deploy.local` exists (indicates previous successful setup):**

```bash
if [ -f ".deploy.local" ]; then
  # Config exists → Fast redeploy path
  DEPLOYMENT_TYPE="fast-redeploy"
  echo "🚀 Deploy config found (.deploy.local) - using fast redeploy"
else
  # No config → Check service-descriptor.yml
  SERVICE_FROM_FILE=$(grep "image: docker.atl-paas.net/" service-descriptor.yml | awk -F'/' '{print $2}')

  if [ "$SERVICE_FROM_FILE" = "YOUR-SERVICE-NAME" ]; then
    DEPLOYMENT_TYPE="initial"
    echo "📋 First deployment detected (service-descriptor.yml has default value)"
  else
    DEPLOYMENT_TYPE="redeploy-no-config"
    SERVICE_NAME="$SERVICE_FROM_FILE"
    echo "🔄 Redeploy detected but missing .deploy.local - will need to collect credentials"
  fi
fi
```

**Rule:**

- If `.deploy.local` exists → **Fast redeploy** (run `pnpm run deploy:micros` directly)
- If service-descriptor.yml says `YOUR-SERVICE-NAME` → **Initial deploy** (ask for service name + credentials)
- If service-descriptor.yml has custom name but no `.deploy.local` → **Redeploy without config** (ask for credentials to generate config)

### Fast Redeploy Path (when `.deploy.local` exists)

When `.deploy.local` is detected, inform the user to run the deploy command:

```bash
pnpm run deploy:micros
```

> **Note:** Use `pnpm run deploy:micros` (not `pnpm deploy`). The command `pnpm deploy` is a reserved pnpm built-in command for monorepo workspace deployment and will fail with `ERR_PNPM_NOTHING_TO_DEPLOY`.

**If the deployment succeeds:** Done! No further action needed.

**If the deployment fails:** Check the terminal output for the specific error. Common issues:

- Docker not running → Start Docker Desktop
- Health check failed → Environment variables not set on Micros (see Step 3.5)

## Step 1: Gather Required Information

### For Initial Deploy (Service Doesn't Exist)

**Required from user:**

1. **Service name** (≤26 chars, lowercase-with-hyphens)
   - Examples: `my-prototype`, `john-chat-demo`, `rovo-assistant`
   - Your URL will be: `https://<service-name>.us-west-2.platdev.atl-paas.net`

2. **Docker credentials** (for pushing images to registry)
   - **Username**: Your Atlassian Staff ID (e.g., `esoh`)
   - **API Token**: Generate at https://packages.atlassian.com/ → User Settings → Access Tokens

**Verify prerequisites:**

- [ ] `/vpk-setup` completed (`.asap-config` and `.env.local` exist)
- [ ] Local prototype tested and working
- [ ] Docker Desktop running (`docker ps` works)

### For Redeploy (with `.deploy.local`)

**No user interaction needed!** Run `pnpm run deploy:micros` directly (see Step 0 fast redeploy path).

### For Redeploy (without `.deploy.local`)

If the service exists but `.deploy.local` is missing (e.g., cloned repo, deleted config), collect Docker credentials from the user to regenerate the config file, then proceed with deployment.

## Step 2: Generate Deploy Config

After gathering required information, generate the `.deploy.local` config file for fast future deployments.

**Generate `.deploy.local`:**

```bash
cat > .deploy.local << 'EOF'
# Deploy configuration for VPK prototype
# Generated by /vpk-deploy skill
# This file is gitignored - do not commit

SERVICE_NAME="<service-name>"
DOCKER_USERNAME="<username>"
DOCKER_PASSWORD="<api-token>"
ENV="pdev-west2"
EOF
```

Replace `<service-name>`, `<username>`, and `<api-token>` with the values collected from the user.

**Inform the user:**

> Your deploy config has been saved to `.deploy.local`. For future deployments, you can simply run:
>
> ```bash
> pnpm run deploy:micros
> ```
>
> This will automatically build, push, and deploy your changes without needing to run `/vpk-deploy` again.
>
> **Note:** Use `pnpm run deploy:micros` (not `pnpm deploy`). The latter is a reserved pnpm command.

## Step 3: Pre-Deployment Fixes

Before running deployment, ensure these common issues are addressed:

### 1. Backend has package-lock.json

The Dockerfile uses `npm ci` which requires a lock file:

```bash
if [ ! -f backend/package-lock.json ]; then
  echo "Generating backend/package-lock.json..."
  cd backend && npm install && cd ..
fi
```

### 2. Dockerfile uses Node 20 (for Next.js 16+)

Check that `backend/Dockerfile` uses `FROM node:20-alpine` not `node:18-alpine`.

### 3. next.config.ts has export support

Ensure the config has conditional `output: "export"` when `NEXT_OUTPUT=export` env var is set:

```typescript
// Static export for production deployment
...(process.env.NEXT_OUTPUT === "export" && {
  output: "export",
}),
```

### 4. Docker registry re-authentication

Before pushing, always re-login:

```bash
docker login docker.atl-paas.net
```

If push fails with "unauthorized", wait 1-2 minutes after `atlas packages permission grant` and retry.

### 5. File casing matches imports

macOS is case-insensitive, so `Providers.tsx` and `providers.tsx` appear identical locally but fail in Docker (Linux). Check that file names match their imports exactly.

### 6. Environment Variables on Micros (CRITICAL for Initial Deploy)

**For initial deployments, you MUST set environment variables on Micros BEFORE deploying.** The deployment will fail health checks if variables are missing.

**Set all 7 variables using `atlas micros stash set`:**

```bash
SERVICE_NAME="<your-service-name>"
ENV="pdev-west2"

# Source local env file to get values
source .env.local

# Set simple variables (single-line values)
atlas micros stash set -s $SERVICE_NAME -e $ENV -k AI_GATEWAY_URL -v "$AI_GATEWAY_URL"
atlas micros stash set -s $SERVICE_NAME -e $ENV -k AI_GATEWAY_USE_CASE_ID -v "$AI_GATEWAY_USE_CASE_ID"
atlas micros stash set -s $SERVICE_NAME -e $ENV -k AI_GATEWAY_CLOUD_ID -v "$AI_GATEWAY_CLOUD_ID"
atlas micros stash set -s $SERVICE_NAME -e $ENV -k AI_GATEWAY_USER_ID -v "$AI_GATEWAY_USER_ID"
atlas micros stash set -s $SERVICE_NAME -e $ENV -k ASAP_KID -v "$ASAP_KID"
atlas micros stash set -s $SERVICE_NAME -e $ENV -k ASAP_ISSUER -v "$ASAP_ISSUER"
```

**For ASAP_PRIVATE_KEY (multiline key - requires special handling):**

The private key contains actual newlines. Use `jq` to properly format the JSON with escaped newlines:

```bash
# Method 1: From .asap-config file (recommended)
# jq without -r flag preserves JSON escaping (quotes and \n)
cat > /tmp/asap_stash.json << EOF
{
  "ASAP_PRIVATE_KEY": $(cat .asap-config | jq '.privateKey')
}
EOF

# Set the key on Micros
atlas micros stash set -s $SERVICE_NAME -e $ENV -f /tmp/asap_stash.json
rm /tmp/asap_stash.json
```

```bash
# Method 2: From .env.local (if .asap-config not available)
source .env.local
ESCAPED_KEY=$(echo "$ASAP_PRIVATE_KEY" | awk '{printf "%s\\n", $0}' | sed 's/\\n$//')
printf '{"ASAP_PRIVATE_KEY": "%s"}' "$ESCAPED_KEY" > /tmp/asap_stash.json

atlas micros stash set -s $SERVICE_NAME -e $ENV -f /tmp/asap_stash.json
rm /tmp/asap_stash.json
```

> **Why `jq` works:** Using `jq '.privateKey'` (without `-r` flag) outputs the key with proper JSON escaping - including surrounding quotes and `\n` for newlines. The server code converts these back at runtime.

**Verify variables are set:**

```bash
atlas micros stash list -s $SERVICE_NAME -e $ENV
```

> **Note:** Use `stash list` to verify (not `stash get` - that command doesn't exist).

## Step 4: Pre-Deployment Checks

Run the pre-deployment check script from this skill's scripts directory:

```bash
# Script location: .agents/skills/vpk-deploy/scripts/deploy-check.sh
./.agents/skills/vpk-deploy/scripts/deploy-check.sh
```

The script validates:

- ASAP credentials (ASAP_PRIVATE_KEY, ASAP_KID, ASAP_ISSUER)
- AI Gateway configuration (AI_GATEWAY_URL, AI_GATEWAY_USE_CASE_ID)
- Backend package-lock.json exists
- Dockerfile uses Node 20+
- next.config.ts has NEXT_OUTPUT export support

## Step 5: Deploy

Use the deploy script from this skill's scripts directory:

```bash
# Script location: .agents/skills/vpk-deploy/scripts/deploy.sh
./.agents/skills/vpk-deploy/scripts/deploy.sh <service-name> <version> [env]

# Example
./.agents/skills/vpk-deploy/scripts/deploy.sh my-prototype 1.0.1

# Default environment: pdev-west2 (override via 3rd arg or `ENV=` in .deploy.local)
```

The script will:

1. Validate service name length (≤26 chars) and that `$ENV` is a known pdev env
2. Check if service-descriptor.yml has been updated from placeholder
3. Detect if service exists *in the chosen env* (update) or needs creation (new)
4. Verify all 7 required env vars are stashed *in that env* (uses `stash list`, since `stash get` doesn't exist)
5. Build Docker image with `--platform linux/amd64`
6. Push to `docker.atl-paas.net` (re-auth via `atlas packages secrets -t docker -i <token>` if needed)
7. Deploy using `atlas micros service deploy`

For manual deployment commands, see [references/guide-manual-deployment.md](references/guide-manual-deployment.md).

### Choosing an Environment (pdev-west2 vs pdev-apse2)

There are exactly **two** pdev environments:

| Env          | AWS Region        | When to use                                                          |
| ------------ | ----------------- | -------------------------------------------------------------------- |
| `pdev-west2` | `us-west-2`       | Default. Lowest latency for SF/Sydney mixed teams; most popular.     |
| `pdev-apse2` | `ap-southeast-2`  | Fallback when west2 has subnet/IP exhaustion. Very low pdev usage.   |

**`pdev-west2` is currently subject to ALB subnet IP exhaustion.** ALBs need ≥8 free IPs per AZ subnet, and the public subnets in west2 routinely sit at 0–10 free. If you see this CFN error:

```
ALB CREATE_FAILED: Not enough IP space available in subnet-xxxxxxxxx.
ELB requires at least 8 free IP addresses in each subnet.
```

**Don't retry blindly.** First check actual capacity (see `references/troubleshooting.md` → "Subnet IP exhaustion"). If west2 is exhausted, switch to `pdev-apse2`:

```bash
# 1. Update .deploy.local (the script reads ENV from here when no 3rd arg given)
sed -i '' 's/^ENV=.*/ENV="pdev-apse2"/' .deploy.local

# 2. Re-stash all 7 env vars in the new env (stashes are per-env, not copied)
#    See Step 3.6 above; substitute -e pdev-apse2 in every command.

# 3. Re-run deploy with explicit env arg (or just `./scripts/deploy.sh <svc> <ver>`)
./scripts/deploy.sh my-prototype 1.0.2 pdev-apse2
```

> **Heads-up:** Both `pdev-west2` and `pdev-apse2` resolve to the *same* AWS account, so once you've assumed creds via `atlas micros role assume user -e pdev-west2`, the same `aws` CLI session works for `--region ap-southeast-2` queries. Useful for cross-region capacity checks.

## Deployment Checklist

### Initial Deploy

- [ ] Service name chosen (≤26 chars)
- [ ] Docker credentials collected (username + API token)
- [ ] `.deploy.local` config file generated
- [ ] `service-descriptor.yml` updated (replace `YOUR-SERVICE-NAME`)
- [ ] Micros service created
- [ ] **ALL 7 env vars set and verified**
- [ ] Docker authenticated
- [ ] Image built & pushed (v1.0.1)
- [ ] Deployed (10-15 min first time)
- [ ] Health check shows all "SET" (no "MISSING")
- [ ] User informed about `pnpm run deploy:micros` for future deployments

### Redeploy (via `pnpm run deploy:micros`)

- [ ] `.deploy.local` exists (from initial deploy)
- [ ] Local changes tested
- [ ] Docker running
- [ ] Run `pnpm run deploy:micros` (auto-increments version)
- [ ] Deployed (~30 sec)
- [ ] Changes visible after hard refresh

## Quick Troubleshooting

For common deployment issues (health check failures, Docker auth, ASAP key formatting, pnpm command errors, build issues), see `references/troubleshooting.md`.

## Success Criteria

### Initial Deploy

✅ Health check returns all 7 "SET" values (not "MISSING")
✅ Chat API streams responses
✅ AI responses appear in chat

### Redeploy

✅ New version shown in `atlas micros service show`
✅ Changes visible after hard refresh
✅ All functionality working

## URLs After Deployment

The DNS pattern is `https://<service-name>.<aws-region>.platdev.atl-paas.net` and the URL is **internal** — you need Atlassian VPN to reach it.

| Env          | Frontend URL                                                |
| ------------ | ----------------------------------------------------------- |
| `pdev-west2` | `https://<service-name>.us-west-2.platdev.atl-paas.net`     |
| `pdev-apse2` | `https://<service-name>.ap-southeast-2.platdev.atl-paas.net`|

- **Health:** append `/api/health` (or `/healthcheck` per your `service-descriptor.yml`)
- **Microscope:** `https://microscope.prod.atl-paas.net/services/<service-name>`
- **Splunk logs:** `https://go.atlassian.com/logs/<env>/<service-name>`

> **Verification lag:** `atlas micros service show` may report `CREATE_IN_PROGRESS` for 1–3 minutes after AWS CloudFormation has reached `CREATE_COMPLETE`. For ground truth use `aws cloudformation describe-stacks --region <region> --stack-name <stack> --query 'Stacks[].StackStatus'` (after `atlas micros role assume user -s <svc> -e <env> -o env -f /tmp/creds.env && source /tmp/creds.env`).

## References

For detailed documentation, see:

- [`references/guide-deployment.md`](references/guide-deployment.md) — Full deployment guide
- [`references/guide-manual-deployment.md`](references/guide-manual-deployment.md) — Manual deployment commands
- [`references/troubleshooting.md`](references/troubleshooting.md) — Common issues and solutions
