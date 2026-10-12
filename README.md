# n8n-nodes-extralt

[n8n](https://n8n.io) nodes for [Extralt](https://extralt.com), which turns ecommerce stores into
structured product data.

The **Extralt Trigger** node starts a workflow when Extralt finishes work for your organization:
a Robot is built, a Run or an Enrichment completes, stops or fails, an Import finishes. Work started
from the dashboard, the Agent, the API or a Schedule all count.

## Installation

Follow n8n's [community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/)
and install `n8n-nodes-extralt`.

## Credentials

Create an API key in the Extralt dashboard under **Settings → Organization → API keys**, then add an
**Extralt API** credential in n8n with it. Leave **Base URL** as `https://api.extralt.com`.

## Extralt Trigger

Choose the events that start the workflow. When the workflow is published, the node registers a
webhook with Extralt for exactly those events; when it is unpublished, the webhook is deleted. The
webhook appears in the Extralt dashboard under **Settings → Connections**, described as `n8n:` and
the workflow's name, where you can see its deliveries and send a test event.

Each execution receives one event:

```json
{
	"id": "evt_…",
	"type": "run.completed",
	"created_at": "2026-10-12T10:40:50Z",
	"data": { "id": "…", "status": "completed" }
}
```

- `data` is the object the [Extralt API](https://extralt.com/docs) returns for that Robot, Run,
  Enrichment or Import, as it was when the event happened. Read it again from the API when you need
  its current state.
- Events are delivered at least once and in no guaranteed order. Use `id` to skip an event you
  have already handled.
- A test event sent from the dashboard has the type `webhook.test` and always starts the workflow,
  whatever events you chose.
- The node checks every request's [Standard Webhooks](https://www.standardwebhooks.com/) signature
  and rejects any that Extralt did not sign.

## Compatibility

Built and tested with n8n 2.42.

## Resources

- [Extralt API documentation](https://extralt.com/docs)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
