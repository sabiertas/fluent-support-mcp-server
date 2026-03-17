# Fluent Support MCP Server

A Model Context Protocol (MCP) server that provides AI assistants with full access to the [Fluent Support](https://fluentsupport.com) helpdesk API, enabling ticket management, customer support workflows, and reporting through natural language.

## Features

- Full ticket lifecycle management (create, update, close, delete)
- Public replies and internal agent notes
- Tag-based ticket organization
- Customer lookup and management
- Saved reply templates for consistent responses
- Support reports and analytics
- Agent listing and assignment

## Available Tools

| Tool | Description |
|------|-------------|
| `fluent_support_list_tickets` | List tickets with pagination, search, and filters (status, priority, agent, customer) |
| `fluent_support_get_ticket` | Get full ticket details by ID, including responses and tags |
| `fluent_support_create_ticket` | Create a new support ticket |
| `fluent_support_update_ticket` | Update ticket properties like priority, status, or assigned agent |
| `fluent_support_delete_ticket` | Permanently delete a ticket |
| `fluent_support_close_ticket` | Close a ticket (shortcut to set status=closed) |
| `fluent_support_add_reply` | Add a public reply to a ticket (visible to customer) |
| `fluent_support_add_internal_note` | Add an internal note to a ticket (only visible to agents) |
| `fluent_support_list_ticket_tags` | List all tags assigned to a specific ticket |
| `fluent_support_add_ticket_tag` | Add a tag to a ticket |
| `fluent_support_remove_ticket_tag` | Remove a tag from a ticket |
| `fluent_support_list_customers` | List customers with pagination and search |
| `fluent_support_get_customer` | Get customer details by ID |
| `fluent_support_update_customer` | Update customer information |
| `fluent_support_list_tags` | List all available tags |
| `fluent_support_create_tag` | Create a new tag |
| `fluent_support_delete_tag` | Delete a tag |
| `fluent_support_reports` | Get overall support reports and statistics |
| `fluent_support_list_saved_replies` | List saved reply templates for quick responses |
| `fluent_support_create_saved_reply` | Create a new saved reply template |
| `fluent_support_list_agents` | List all support agents |

## Requirements

- Node.js 18+
- WordPress site with [Fluent Support](https://fluentsupport.com) installed and activated
- WordPress Application Password

## Quick Setup

### 1. Clone and build

```bash
git clone https://github.com/sabiertas/fluent-support-mcp-server.git
cd fluent-support-mcp-server
npm install
npm run build
```

### 2. Configure in Claude Code

Add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "fluent-support": {
      "command": "node",
      "args": ["/path/to/fluent-support-mcp-server/dist/fluent-support-mcp-server.js"],
      "env": {
        "FLUENT_SUPPORT_API_URL": "https://your-domain.com/wp-json/fluent-support/v2",
        "FLUENT_SUPPORT_API_USERNAME": "your-wp-username",
        "FLUENT_SUPPORT_API_PASSWORD": "your-application-password"
      }
    }
  }
}
```

### 3. Configure in Cursor / other MCP clients

Same config pattern -- see your client's MCP documentation.

## Authentication

Uses WordPress Application Passwords (Basic Auth). Create one at:
`WordPress Admin > Users > Profile > Application Passwords`

## Contributing

PRs welcome. Please open an issue first to discuss changes.

## License

MIT
