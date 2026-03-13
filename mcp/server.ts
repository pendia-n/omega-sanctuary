#!/usr/bin/env node
/**
 * orega RaaS — MCP Server
 *
 * Exposes 4 tools for any MCP-compatible AI host (Claude Desktop, Cursor, etc.)
 * This is a thin stdio wrapper over the orega Kernel at http://localhost:4400
 *
 * To add to Claude Desktop, add to ~/Library/Application Support/Claude/claude_desktop_config.json:
 * {
 *   "mcpServers": {
 *     "orega": {
 *       "command": "npx",
 *       "args": ["tsx", "/Users/nosensetxt/orega/mcp/server.ts"]
 *     }
 *   }
 * }
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const KERNEL_URL = process.env.orega_KERNEL_URL ?? 'http://localhost:4400';

const server = new McpServer({
    name: 'orega-sanctuary',
    version: '1.0.0',
});

// ─── Helper ──────────────────────────────────────────────────────────────────
async function oregaFetch(path: string, options: RequestInit = {}) {
    const res = await fetch(`${KERNEL_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers ?? {}),
        },
    });
    const data = await res.json();
    return { status: res.status, data };
}

// ─── Tool 1: ignite ──────────────────────────────────────────────────────────
server.tool(
    'orega_ignite',
    'Ignite a new Orega Sanctuary API identity. Returns a fresh API key with 160.0 starting credits. The key must be claimed within 9 seconds.',
    {},
    async () => {
        const { status, data } = await oregaFetch('/api/auth/ignite', { method: 'POST' });
        if (status !== 200) {
            return { content: [{ type: 'text', text: `Error: ${JSON.stringify(data)}` }], isError: true };
        }
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    apiKey: data.apiKey,
                    credits: data.credits,
                    status: data.status,
                    instruction: 'Call orega_claim immediately with this apiKey to activate the identity before 9 seconds elapse.',
                }, null, 2),
            }],
        };
    }
);

// ─── Tool 2: claim ───────────────────────────────────────────────────────────
server.tool(
    'orega_claim',
    'Claim and activate an EPHEMERAL Sanctuary identity. Call this immediately after orega_ignite with the returned apiKey.',
    { apiKey: z.string().describe('The API key returned from orega_ignite') },
    async ({ apiKey }) => {
        const { status, data } = await oregaFetch('/api/auth/claim', {
            method: 'POST',
            headers: { 'X-KSpec-API-Key': apiKey },
        });
        if (status !== 200) {
            return { content: [{ type: 'text', text: `Error: ${JSON.stringify(data)}` }], isError: true };
        }
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({ status: data.status, credits: data.credits }, null, 2),
            }],
        };
    }
);

// ─── Tool 3: execute ─────────────────────────────────────────────────────────
server.tool(
    'orega_execute',
    'Execute a K-Spec command sequence on a Sanctuary agent. Consumes credits. Agents: Atlas (500kg/0.1mm), Hermes (50kg/0.01mm), Apollo (10kg/0.001mm). Primitives: K-MOVE, K-LIFT, K-GRIP, K-SENSE, K-SCAN, K-STREAM, K-TORQUE, K-FUSE, K-VERIFY, K-SONAR.',
    {
        apiKey: z.string().describe('Your active X-KSpec-API-Key'),
        agentId: z.enum(['Atlas', 'Hermes', 'Apollo']).describe('The target agent profile'),
        commands: z.array(
            z.object({
                type: z.enum(['K-MOVE', 'K-LIFT', 'K-GRIP', 'K-SENSE', 'K-SCAN', 'K-STREAM', 'K-TORQUE', 'K-FUSE', 'K-VERIFY', 'K-SONAR']),
                params: z.record(z.unknown()).optional(),
            })
        ).min(1).describe('Array of K-Spec command objects'),
    },
    async ({ apiKey, agentId, commands }) => {
        const { status, data } = await oregaFetch('/api/execute', {
            method: 'POST',
            headers: { 'X-KSpec-API-Key': apiKey },
            body: JSON.stringify({ agentId, commands }),
        });
        if (status !== 200) {
            return {
                content: [{
                    type: 'text',
                    text: `Execution failed (HTTP ${status}): ${JSON.stringify(data)}`,
                }],
                isError: true,
            };
        }
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    executionProof: data.executionProof,
                    remainingCredits: data.remainingCredits,
                    results: data.results,
                    timestamp: data.timestamp,
                }, null, 2),
            }],
        };
    }
);

// ─── Tool 4: get_credits ─────────────────────────────────────────────────────
server.tool(
    'orega_credits',
    'Check the current credit balance and status of an Orega Sanctuary API key.',
    { apiKey: z.string().describe('The X-KSpec-API-Key to check') },
    async ({ apiKey }) => {
        const { status, data } = await oregaFetch('/api/user/credits', {
            headers: { 'X-KSpec-API-Key': apiKey },
        });
        if (status !== 200) {
            return { content: [{ type: 'text', text: `Error: ${JSON.stringify(data)}` }], isError: true };
        }
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({ credits: data.credits, status: data.status }, null, 2),
            }],
        };
    }
);

// ─── Start ────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Orega Sanctuary MCP Server running (stdio). Kernel:', KERNEL_URL);
