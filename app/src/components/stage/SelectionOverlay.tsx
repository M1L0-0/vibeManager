import { useToolStore } from '@/store/tool-store';
import { hexToPixel } from '@/core/grid/hex';

export function SelectionOverlay() {
    const selectionRect = useToolStore(state => state.view.selectionRect);

    // console.log('SelectionOverlay render:', selectionRect);

    if (!selectionRect) return null;

    const { start, end } = selectionRect;

    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);

    return (
        <div
            style={{
                position: 'absolute',
                left: x,
                top: y,
                width,
                height,
                border: '2px solid rgba(0, 255, 255, 0.8)',
                backgroundColor: 'rgba(0, 255, 255, 0.2)',
                pointerEvents: 'none',
                zIndex: 10
            }}
        />
    );
}
