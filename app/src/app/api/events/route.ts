
import { addClient, removeClient } from '@/lib/sse-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const stream = new ReadableStream({
        start(controller) {
            const client = addClient(controller);

            // Send initial ping to confirm connection
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode('event: connected\ndata: "ok"\n\n'));

            // Clean up on disconnect
            request.signal.addEventListener('abort', () => {
                removeClient(client);
            });
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
