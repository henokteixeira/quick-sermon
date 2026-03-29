# Temporal Durable Execution

Comprehensive assistance for the Temporal durable execution platform: CLI operations, SDK development across Go/TypeScript/Python/Java, workflow design, and architectural decisions.

## Triggers

Use this skill when the user mentions: "temporal", "durable execution", "workflow orchestration", "temporal cli", "temporal sdk", "temporal worker", "temporal activity", "temporal workflow", "temporal schedule", "temporal signal", "temporal query".

## Quick Start

### Local Development Server

```bash
# Install CLI
brew install temporal    # macOS
curl -sSf https://temporal.download/cli | sh  # Linux

# Start local dev server (with Web UI at localhost:8233)
temporal server start-dev

# Start with persistent storage
temporal server start-dev --db-filename temporal.db
```

### First Workflow (TypeScript example)

```bash
npm init -y
npm install @temporalio/client @temporalio/worker @temporalio/workflow @temporalio/activity
```

## Common Tasks by Intent

| Developer wants to... | Action |
|-----------------------|--------|
| Start a workflow | `temporal workflow start --type MyWorkflow --task-queue my-queue --input '{"key":"val"}'` |
| Check workflow status | `temporal workflow describe -w <workflow-id>` |
| View event history | `temporal workflow show -w <workflow-id>` |
| Cancel a workflow | `temporal workflow cancel -w <workflow-id>` |
| Send a signal | `temporal workflow signal -w <workflow-id> --name signal-name --input '{"data":true}'` |
| Query workflow state | `temporal workflow query -w <workflow-id> --name query-name` |
| List running workflows | `temporal workflow list` |
| Debug stuck workflow | Check history with `temporal workflow show`, look for pending activities |
| Set up scheduled runs | `temporal schedule create --schedule-id my-sched --cron '0 * * * *' ...` |
| Test workflows | Use SDK test utilities with time-skipping and activity mocking |

## When to Use Temporal

**Good fit:**
- **Multi-step processes** that must complete reliably (order processing, onboarding, payment flows)
- **Saga patterns** across microservices (distributed transactions with compensating actions)
- **Long-running workflows** (minutes, hours, days, weeks, months, or years)
- **Scheduled/cron jobs** with complex logic — durable, inspectable replacement for cron
- **Human-in-the-loop** approval workflows (pause, wait for signal, resume)
- **AI agents & orchestration** — durable execution for LLM-powered tool coordination, multi-step agent pipelines, and long-lived AI agents that maintain state
- **Entity lifecycle management** — complex processes that accumulate state over time (e.g., mortgage underwriting, subscription management)
- **Background jobs that take seconds+** — especially in Python where CPU-bound or blocking operations (AI inference, PDF generation, heavy computation) would block the async event loop. Temporal activities run in separate threads/processes with automatic retries, heartbeating, and timeout management
- **Data pipelines & sync** — reliable ETL/ELT with retry, checkpointing, and bidirectional data sync
- **Infrastructure automation** — provisioning, disaster recovery, CI/CD orchestration
- **Polyglot systems** — workflows spanning multiple languages communicating seamlessly

**Python-specific guidance:**
- Use **sync activities** with `ThreadPoolExecutor` or `ProcessPoolExecutor` for CPU-bound or blocking operations (AI model inference, image processing, PDF rendering). Async activities block the event loop if they call blocking code
- Use **async activities** for non-blocking I/O (HTTP calls to async-safe libraries, DB queries via async drivers)
- Temporal is especially valuable in Python/Django where you need reliable execution of operations that take seconds to minutes (e.g., calling OpenAI APIs, generating content, processing files) without managing your own retry/state logic

**Not a good fit:**
- Simple request/response APIs with no failure recovery needs (use plain HTTP)
- Sub-millisecond latency requirements (Temporal adds ~10-50ms overhead)
- Pure data streaming (use Kafka/Flink/Pulsar)
- Simple event pub/sub (use Kafka, NATS, RabbitMQ)
- Static content serving (no workflow needed)

## Reference Documents

For deep dives, consult these references:

| Reference | Content |
|-----------|---------|
| [CLI.md](references/CLI.md) | Complete CLI command reference: installation, server, workflows, schedules, operators |
| [SDK-PATTERNS.md](references/SDK-PATTERNS.md) | Cross-language SDK patterns: Go, TypeScript, Python, Java side-by-side |
| [CONCEPTS.md](references/CONCEPTS.md) | Architecture, core concepts, design patterns, deployment, comparisons |

## Troubleshooting

### Determinism Violations

Workflows must be deterministic. Common violations:
- Using `Date.now()`, `Math.random()`, or system time directly — use `workflow.now()` or side effects
- Making network calls from workflow code — move to activities
- Using non-deterministic data structures (e.g., iterating over unordered maps)
- Changing workflow logic without proper versioning

### Stuck Workflows

1. Check event history: `temporal workflow show -w <id>`
2. Look for `ActivityTaskScheduled` without corresponding `ActivityTaskCompleted`
3. Verify workers are running and polling the correct task queue
4. Check activity timeouts — may need `HeartbeatTimeout` for long activities
5. Check for deadlocked signals/queries

### Timeout Issues

Temporal has four timeout types:
- **WorkflowExecutionTimeout**: Max time for entire workflow (including retries)
- **WorkflowRunTimeout**: Max time for a single workflow run
- **ScheduleToCloseTimeout**: Max time from activity scheduled to completed
- **StartToCloseTimeout**: Max time from activity started to completed

If activities time out unexpectedly, ensure `StartToCloseTimeout` is generous enough and add heartbeating for long-running activities.

### Worker Not Picking Up Tasks

- Verify task queue name matches between workflow starter and worker
- Check that the worker is registered with the correct workflow/activity types
- Ensure the Temporal server address is correct (`TEMPORAL_ADDRESS`)
- Look at worker logs for connection errors

## Workflow

When helping with Temporal:

1. **Identify the task**: CLI operation, SDK code, architecture decision, or debugging
2. **Check the language**: For SDK questions, determine Go/TypeScript/Python/Java
3. **Consult references**: Use the reference docs for detailed patterns and commands
4. **Verify determinism**: For workflow code, ensure deterministic execution rules are followed
5. **Test guidance**: Recommend SDK test utilities, replay testing, and local dev server
