/**
 * Client-side SSE Manager
 * Maintains a single connection to the server and dispatches events to subscribed cells.
 */

type CellCallback = (payload: any) => void;

class SSEClientManager {
    private eventSource: EventSource | null = null;
    private subscribers: Map<string, Set<CellCallback>> = new Map();
    private reconnectTimer: NodeJS.Timeout | null = null;
    private isConnecting: boolean = false;

    constructor() {
        if (typeof window !== 'undefined') {
            this.connect();
        }
    }

    private connect() {
        if (this.eventSource || this.isConnecting) return;
        this.isConnecting = true;

        console.log('🔌 Connecting to SSE stream...');
        this.eventSource = new EventSource('/api/events');

        this.eventSource.onopen = () => {
            console.log('✅ SSE Connected');
            this.isConnecting = false;
        };

        this.eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.dispatch(data);
            } catch (err) {
                console.error('Failed to parse SSE message', err);
            }
        };

        this.eventSource.onerror = (err) => {
            console.error('❌ SSE Error', err);
            this.disconnect();
            // Retry in 5s
            if (!this.reconnectTimer) {
                this.reconnectTimer = setTimeout(() => this.connect(), 5000);
            }
        };
    }

    private disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        this.isConnecting = false;
    }

    private dispatch(data: { cellId: string, payload: any }) {
        if (!data.cellId) return;

        const cellSubs = this.subscribers.get(data.cellId);
        if (cellSubs) {
            console.log(`📨 SSE Event for Cell ${data.cellId}`, data.payload);
            cellSubs.forEach(cb => cb(data.payload));
        }
    }

    public subscribe(cellId: string, callback: CellCallback) {
        if (!this.eventSource) this.connect();

        if (!this.subscribers.has(cellId)) {
            this.subscribers.set(cellId, new Set());
        }
        this.subscribers.get(cellId)!.add(callback);

        return () => this.unsubscribe(cellId, callback);
    }

    public unsubscribe(cellId: string, callback: CellCallback) {
        const subs = this.subscribers.get(cellId);
        if (subs) {
            subs.delete(callback);
            if (subs.size === 0) {
                this.subscribers.delete(cellId);
            }
        }
    }
}

// Singleton
export const sseManager = new SSEClientManager();
