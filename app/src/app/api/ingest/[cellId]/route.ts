
import { broadcastToCell } from '@/lib/sse-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ cellId: string }> }
) {
    const cellId = (await params).cellId;

    try {
        const body = await request.json();

        // Broadcast
        broadcastToCell(cellId, body);

        return NextResponse.json({ success: true, cellId, message: 'Signal Broadcasted' });
    } catch (err) {
        return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }
}
