#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosInstance } from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const FLUENT_SUPPORT_API_URL = process.env.FLUENT_SUPPORT_API_URL || 'https://your-domain.com/wp-json/fluent-support/v2';
const FLUENT_SUPPORT_API_USERNAME = process.env.FLUENT_SUPPORT_API_USERNAME || '';
const FLUENT_SUPPORT_API_PASSWORD = process.env.FLUENT_SUPPORT_API_PASSWORD || '';

/**
 * Fluent Support API Client
 * Based on: https://github.com/WPManageNinja/fluent-support-api-doc
 */
class FluentSupportClient {
  private apiClient: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string, username: string, password: string) {
    this.baseURL = baseURL;

    // Basic Auth for Fluent Support API
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');

    this.apiClient = axios.create({
      baseURL,
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
    });

    // Error interceptor
    this.apiClient.interceptors.response.use(
      response => response,
      error => {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Fluent Support API Error: ${message}`);
      }
    );
  }

  // ===== TICKETS =====

  async listTickets(params: any = {}) {
    const response = await this.apiClient.get('/tickets', { params });
    return response.data;
  }

  async getTicket(ticketId: number) {
    const response = await this.apiClient.get(`/tickets/${ticketId}`);
    return response.data;
  }

  async createTicket(data: {
    title: string;
    content: string;
    customer_id: number;
    priority?: string;
    product_id?: number;
    mailbox_id?: number;
  }) {
    const response = await this.apiClient.post('/tickets', data);
    return response.data;
  }

  async updateTicket(ticketId: number, data: any) {
    const response = await this.apiClient.put(`/tickets/${ticketId}`, data);
    return response.data;
  }

  async deleteTicket(ticketId: number) {
    const response = await this.apiClient.post(`/tickets/${ticketId}/delete`);
    return response.data;
  }

  async updateTicketProperty(ticketId: number, data: {
    priority?: string;
    client_priority?: string;
    agent_id?: number;
    product_id?: number;
  }) {
    const response = await this.apiClient.put(`/tickets/${ticketId}/property`, data);
    return response.data;
  }

  async closeTicket(ticketId: number) {
    const response = await this.apiClient.post(`/tickets/${ticketId}/close`);
    return response.data;
  }

  async reopenTicket(ticketId: number) {
    const response = await this.apiClient.post(`/tickets/${ticketId}/re-open`);
    return response.data;
  }

  async addReply(ticketId: number, data: {
    content: string;
    conversation_type?: string;
  }) {
    const response = await this.apiClient.post(`/tickets/${ticketId}/responses`, {
      content: data.content,
      conversation_type: data.conversation_type || 'response',
    });
    return response.data;
  }

  async addInternalNote(ticketId: number, content: string) {
    const response = await this.apiClient.post(`/tickets/${ticketId}/responses`, {
      content,
      conversation_type: 'note',
    });
    return response.data;
  }

  async listTicketResponses(ticketId: number, params: any = {}) {
    const response = await this.apiClient.get(`/tickets/${ticketId}/responses`, { params });
    return response.data;
  }

  async addTicketTag(ticketId: number, tagId: number) {
    const response = await this.apiClient.post(`/tickets/${ticketId}/tags`, {
      tag_id: tagId,
    });
    return response.data;
  }

  async removeTicketTag(ticketId: number, tagId: number) {
    const response = await this.apiClient.delete(`/tickets/${ticketId}/tags/${tagId}`);
    return response.data;
  }

  async listTicketTags(ticketId: number) {
    // Get ticket details which include tags
    const response = await this.apiClient.get(`/tickets/${ticketId}`);
    return response.data?.tags || response.data;
  }

  // ===== CUSTOMERS =====

  async listCustomers(params: any = {}) {
    const response = await this.apiClient.get('/customers', { params });
    return response.data;
  }

  async getCustomer(customerId: number) {
    const response = await this.apiClient.get(`/customers/${customerId}`);
    return response.data;
  }

  async updateCustomer(customerId: number, data: any) {
    const response = await this.apiClient.put(`/customers/${customerId}`, data);
    return response.data;
  }

  // ===== TAGS =====

  async listTags(params: any = {}) {
    const response = await this.apiClient.get('/tags', { params });
    return response.data;
  }

  async createTag(data: {
    title: string;
    slug?: string;
    description?: string;
  }) {
    const response = await this.apiClient.post('/tags', data);
    return response.data;
  }

  async deleteTag(tagId: number) {
    const response = await this.apiClient.delete(`/tags/${tagId}`);
    return response.data;
  }

  // ===== REPORTS =====

  async getReports(params: any = {}) {
    const response = await this.apiClient.get('/reports', { params });
    return response.data;
  }

  // ===== SAVED REPLIES =====

  async listSavedReplies(params: any = {}) {
    const response = await this.apiClient.get('/saved-replies', { params });
    return response.data;
  }

  async createSavedReply(data: {
    title: string;
    content: string;
  }) {
    const response = await this.apiClient.post('/saved-replies', data);
    return response.data;
  }

  // ===== AGENTS =====

  async listAgents(params: any = {}) {
    const response = await this.apiClient.get('/agents', { params });
    return response.data;
  }
}

// ===== MCP SERVER SETUP =====

const server = new Server(
  {
    name: 'fluent-support-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const client = new FluentSupportClient(
  FLUENT_SUPPORT_API_URL,
  FLUENT_SUPPORT_API_USERNAME,
  FLUENT_SUPPORT_API_PASSWORD
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ===== TICKETS =====
      {
        name: 'fluent_support_list_tickets',
        description: 'List tickets with pagination, search, and filters (status, priority, agent_id, customer_id)',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'number', description: 'Page number (default: 1)' },
            per_page: { type: 'number', description: 'Results per page (default: 10)' },
            search: { type: 'string', description: 'Search by title or content' },
            status: { type: 'string', description: 'Filter by status (new, active, closed)' },
            priority: { type: 'string', description: 'Filter by priority (normal, medium, critical)' },
            agent_id: { type: 'number', description: 'Filter by assigned agent ID' },
            customer_id: { type: 'number', description: 'Filter by customer ID' },
            product_id: { type: 'number', description: 'Filter by product ID' },
            sort_by: { type: 'string', description: 'Sort field (default: id)' },
            sort_type: { type: 'string', description: 'Sort direction: ASC or DESC (default: DESC)' },
          },
        },
      },
      {
        name: 'fluent_support_get_ticket',
        description: 'Get full ticket details by ID, including responses and tags',
        inputSchema: {
          type: 'object',
          properties: {
            ticket_id: { type: 'number', description: 'Ticket ID' },
          },
          required: ['ticket_id'],
        },
      },
      {
        name: 'fluent_support_create_ticket',
        description: 'Create a new support ticket',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Ticket subject/title' },
            content: { type: 'string', description: 'Ticket body/description (HTML supported)' },
            customer_id: { type: 'number', description: 'Customer ID who created the ticket' },
            priority: { type: 'string', description: 'Priority: normal, medium, or critical' },
            product_id: { type: 'number', description: 'Product ID (optional)' },
            mailbox_id: { type: 'number', description: 'Mailbox ID (optional)' },
          },
          required: ['title', 'content', 'customer_id'],
        },
      },
      {
        name: 'fluent_support_update_ticket',
        description: 'Update ticket properties like priority, status, or assigned agent',
        inputSchema: {
          type: 'object',
          properties: {
            ticket_id: { type: 'number', description: 'Ticket ID' },
            priority: { type: 'string', description: 'New priority: normal, medium, or critical' },
            client_priority: { type: 'string', description: 'Client-facing priority' },
            agent_id: { type: 'number', description: 'Assign to agent by ID' },
            product_id: { type: 'number', description: 'Product ID' },
            status: { type: 'string', description: 'New status: new, active, closed' },
          },
          required: ['ticket_id'],
        },
      },
      {
        name: 'fluent_support_delete_ticket',
        description: 'Permanently delete a ticket',
        inputSchema: {
          type: 'object',
          properties: {
            ticket_id: { type: 'number', description: 'Ticket ID to delete' },
          },
          required: ['ticket_id'],
        },
      },
      {
        name: 'fluent_support_close_ticket',
        description: 'Close a ticket (shortcut to set status=closed)',
        inputSchema: {
          type: 'object',
          properties: {
            ticket_id: { type: 'number', description: 'Ticket ID to close' },
          },
          required: ['ticket_id'],
        },
      },
      {
        name: 'fluent_support_add_reply',
        description: 'Add a public reply to a ticket (visible to customer)',
        inputSchema: {
          type: 'object',
          properties: {
            ticket_id: { type: 'number', description: 'Ticket ID' },
            content: { type: 'string', description: 'Reply content (HTML supported)' },
          },
          required: ['ticket_id', 'content'],
        },
      },
      {
        name: 'fluent_support_add_internal_note',
        description: 'Add an internal note to a ticket (only visible to agents)',
        inputSchema: {
          type: 'object',
          properties: {
            ticket_id: { type: 'number', description: 'Ticket ID' },
            content: { type: 'string', description: 'Note content (HTML supported)' },
          },
          required: ['ticket_id', 'content'],
        },
      },
      {
        name: 'fluent_support_list_ticket_tags',
        description: 'List all tags assigned to a specific ticket',
        inputSchema: {
          type: 'object',
          properties: {
            ticket_id: { type: 'number', description: 'Ticket ID' },
          },
          required: ['ticket_id'],
        },
      },
      {
        name: 'fluent_support_add_ticket_tag',
        description: 'Add a tag to a ticket',
        inputSchema: {
          type: 'object',
          properties: {
            ticket_id: { type: 'number', description: 'Ticket ID' },
            tag_id: { type: 'number', description: 'Tag ID to add' },
          },
          required: ['ticket_id', 'tag_id'],
        },
      },
      {
        name: 'fluent_support_remove_ticket_tag',
        description: 'Remove a tag from a ticket',
        inputSchema: {
          type: 'object',
          properties: {
            ticket_id: { type: 'number', description: 'Ticket ID' },
            tag_id: { type: 'number', description: 'Tag ID to remove' },
          },
          required: ['ticket_id', 'tag_id'],
        },
      },

      // ===== CUSTOMERS =====
      {
        name: 'fluent_support_list_customers',
        description: 'List customers with pagination and search',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'number', description: 'Page number (default: 1)' },
            per_page: { type: 'number', description: 'Results per page (default: 10)' },
            search: { type: 'string', description: 'Search by name or email' },
          },
        },
      },
      {
        name: 'fluent_support_get_customer',
        description: 'Get customer details by ID',
        inputSchema: {
          type: 'object',
          properties: {
            customer_id: { type: 'number', description: 'Customer ID' },
          },
          required: ['customer_id'],
        },
      },
      {
        name: 'fluent_support_update_customer',
        description: 'Update customer information',
        inputSchema: {
          type: 'object',
          properties: {
            customer_id: { type: 'number', description: 'Customer ID' },
            first_name: { type: 'string', description: 'First name' },
            last_name: { type: 'string', description: 'Last name' },
            email: { type: 'string', description: 'Email address' },
            note: { type: 'string', description: 'Customer note' },
          },
          required: ['customer_id'],
        },
      },

      // ===== TAGS =====
      {
        name: 'fluent_support_list_tags',
        description: 'List all available tags',
        inputSchema: {
          type: 'object',
          properties: {
            search: { type: 'string', description: 'Search tags by name' },
          },
        },
      },
      {
        name: 'fluent_support_create_tag',
        description: 'Create a new tag',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Tag name' },
            slug: { type: 'string', description: 'Tag slug (auto-generated if empty)' },
            description: { type: 'string', description: 'Tag description' },
          },
          required: ['title'],
        },
      },
      {
        name: 'fluent_support_delete_tag',
        description: 'Delete a tag',
        inputSchema: {
          type: 'object',
          properties: {
            tag_id: { type: 'number', description: 'Tag ID to delete' },
          },
          required: ['tag_id'],
        },
      },

      // ===== REPORTS =====
      {
        name: 'fluent_support_reports',
        description: 'Get overall support reports and statistics',
        inputSchema: {
          type: 'object',
          properties: {
            date_range: { type: 'string', description: 'Date range filter (e.g. "last_7_days", "last_30_days")' },
          },
        },
      },

      // ===== SAVED REPLIES =====
      {
        name: 'fluent_support_list_saved_replies',
        description: 'List saved reply templates for quick responses',
        inputSchema: {
          type: 'object',
          properties: {
            search: { type: 'string', description: 'Search saved replies by title' },
          },
        },
      },
      {
        name: 'fluent_support_create_saved_reply',
        description: 'Create a new saved reply template',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Template title/name' },
            content: { type: 'string', description: 'Template content (HTML supported)' },
          },
          required: ['title', 'content'],
        },
      },

      // ===== AGENTS =====
      {
        name: 'fluent_support_list_agents',
        description: 'List all support agents',
        inputSchema: {
          type: 'object',
          properties: {
            search: { type: 'string', description: 'Search agents by name' },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // ===== TICKETS =====
      case 'fluent_support_list_tickets':
        return { content: [{ type: 'text', text: JSON.stringify(await client.listTickets(args || {}), null, 2) }] };
      case 'fluent_support_get_ticket':
        return { content: [{ type: 'text', text: JSON.stringify(await client.getTicket((args as any)?.ticket_id), null, 2) }] };
      case 'fluent_support_create_ticket':
        return { content: [{ type: 'text', text: JSON.stringify(await client.createTicket(args as any), null, 2) }] };
      case 'fluent_support_update_ticket': {
        const { ticket_id, status, ...propertyData } = args as any;
        const results: any[] = [];
        // Status changes require dedicated endpoints
        if (status === 'closed') {
          results.push(await client.closeTicket(ticket_id));
        } else if (status === 'active' || status === 'new') {
          results.push(await client.reopenTicket(ticket_id));
        }
        // Other properties use the property endpoint
        if (Object.keys(propertyData).length > 0) {
          results.push(await client.updateTicketProperty(ticket_id, propertyData));
        }
        return { content: [{ type: 'text', text: JSON.stringify(results.length === 1 ? results[0] : results, null, 2) }] };
      }
      case 'fluent_support_delete_ticket':
        return { content: [{ type: 'text', text: JSON.stringify(await client.deleteTicket((args as any)?.ticket_id), null, 2) }] };
      case 'fluent_support_close_ticket':
        return { content: [{ type: 'text', text: JSON.stringify(await client.closeTicket((args as any)?.ticket_id), null, 2) }] };
      case 'fluent_support_add_reply':
        return { content: [{ type: 'text', text: JSON.stringify(await client.addReply((args as any)?.ticket_id, { content: (args as any)?.content }), null, 2) }] };
      case 'fluent_support_add_internal_note':
        return { content: [{ type: 'text', text: JSON.stringify(await client.addInternalNote((args as any)?.ticket_id, (args as any)?.content), null, 2) }] };
      case 'fluent_support_list_ticket_tags':
        return { content: [{ type: 'text', text: JSON.stringify(await client.listTicketTags((args as any)?.ticket_id), null, 2) }] };
      case 'fluent_support_add_ticket_tag':
        return { content: [{ type: 'text', text: JSON.stringify(await client.addTicketTag((args as any)?.ticket_id, (args as any)?.tag_id), null, 2) }] };
      case 'fluent_support_remove_ticket_tag':
        return { content: [{ type: 'text', text: JSON.stringify(await client.removeTicketTag((args as any)?.ticket_id, (args as any)?.tag_id), null, 2) }] };

      // ===== CUSTOMERS =====
      case 'fluent_support_list_customers':
        return { content: [{ type: 'text', text: JSON.stringify(await client.listCustomers(args || {}), null, 2) }] };
      case 'fluent_support_get_customer':
        return { content: [{ type: 'text', text: JSON.stringify(await client.getCustomer((args as any)?.customer_id), null, 2) }] };
      case 'fluent_support_update_customer': {
        const { customer_id, ...custData } = args as any;
        return { content: [{ type: 'text', text: JSON.stringify(await client.updateCustomer(customer_id, custData), null, 2) }] };
      }

      // ===== TAGS =====
      case 'fluent_support_list_tags':
        return { content: [{ type: 'text', text: JSON.stringify(await client.listTags(args || {}), null, 2) }] };
      case 'fluent_support_create_tag':
        return { content: [{ type: 'text', text: JSON.stringify(await client.createTag(args as any), null, 2) }] };
      case 'fluent_support_delete_tag':
        return { content: [{ type: 'text', text: JSON.stringify(await client.deleteTag((args as any)?.tag_id), null, 2) }] };

      // ===== REPORTS =====
      case 'fluent_support_reports':
        return { content: [{ type: 'text', text: JSON.stringify(await client.getReports(args || {}), null, 2) }] };

      // ===== SAVED REPLIES =====
      case 'fluent_support_list_saved_replies':
        return { content: [{ type: 'text', text: JSON.stringify(await client.listSavedReplies(args || {}), null, 2) }] };
      case 'fluent_support_create_saved_reply':
        return { content: [{ type: 'text', text: JSON.stringify(await client.createSavedReply(args as any), null, 2) }] };

      // ===== AGENTS =====
      case 'fluent_support_list_agents':
        return { content: [{ type: 'text', text: JSON.stringify(await client.listAgents(args || {}), null, 2) }] };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Fluent Support MCP Server running on stdio');
  console.error(`API URL: ${FLUENT_SUPPORT_API_URL}`);
  console.error(`Username: ${FLUENT_SUPPORT_API_USERNAME}`);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
