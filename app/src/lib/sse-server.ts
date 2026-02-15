/**
 * Simple in-memory SSE Manager for local development.
 * Note: This won't work in serverless/lambda environments without external pub/sub (Redis).
 */

type SSEClient = {
    id: string;
    controller: ReadableStreamDefaultController;
};

// Global augmentation to prevent HMR from wiping the set in dev mode
const globalForSSE = global as unknown as { sseClients: Set<SSEClient> };

export const sseClients = globalForSSE.sseClients || new Set<SSEClient>();

if (process.env.NODE_ENV !== 'production') globalForSSE.sseClients = sseClients;

export function addClient(controller: ReadableStreamDefaultController) {
    const client: SSEClient = {
        id: crypto.randomUUID(),
        controller,
    };
    sseClients.add(client);
    console.log(`🔌 Client connected. Total: ${sseClients.size}`);
    return client;
}

export function removeClient(client: SSEClient) {
    sseClients.delete(client);
    console.log(`🔌 Client disconnected. Total: ${sseClients.size}`);
}

export function broadcastToCell(cellId: string, payload: any) {
    const data = JSON.stringify({
        cellId,
        timestamp: Date.now(),
        payload
    });

    const message = `data: ${data}\n\n`;
    const encoder = new TextEncoder();

    sseClients.forEach(client => {
        try {
            client.controller.enqueue(encoder.encode(message));
        } catch (err) {
            console.error('Failed to send to client', client.id, err);
            removeClient(client);
        }
    });
}
