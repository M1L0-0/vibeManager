import { DishRecord, libraryDB } from '@/store/library-db';
import { useGridStore } from '@/store/grid-store';
import { X, Trash2, Upload, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSimulationStore } from '@/store/simulation-store';

interface DishLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DishLibraryModal({ isOpen, onClose }: DishLibraryModalProps) {
    const [dishes, setDishes] = useState<DishRecord[]>([]);
    const { importGrid } = useGridStore();
    const { setIsPlaying } = useSimulationStore();

    useEffect(() => {
        if (isOpen) {
            loadDishes();
        }
    }, [isOpen]);

    const loadDishes = async () => {
        const allDishes = await libraryDB.getAllDishes();
        // Sort by timestamp desc
        setDishes(allDishes.sort((a, b) => b.timestamp - a.timestamp));
    };

    const handleLoadDish = (dish: DishRecord) => {
        importGrid(dish.data);
        // setIsPlaying(false); // Can confuse user if they expect immediate interaction
        onClose();
    };

    const handleDeleteDish = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this dish?')) {
            await libraryDB.deleteDish(id);
            loadDishes();
        }
    };

    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
                importGrid(content);
                // setIsPlaying(false);
                onClose();
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end bg-black/10 backdrop-blur-[2px]"
            onClick={onClose}
        >
            <div
                className="bg-neutral-950/90 border-l border-white/10 w-full max-w-[450px] h-full flex flex-col shadow-2xl backdrop-blur-md transition-transform duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">
                        The Incubator
                    </h2>
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer text-sm text-white/80">
                            <Upload size={16} />
                            <span>Import File</span>
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImportFile}
                                className="hidden"
                            />
                        </label>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                    {dishes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-white/30 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                <Download size={32} />
                            </div>
                            <p>No dishes in the incubator yet.</p>
                            <p className="text-sm">Save a setup to see it here.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {dishes.map((dish) => (
                                <div
                                    key={dish.id}
                                    onClick={() => handleLoadDish(dish)}
                                    className="group relative bg-black/40 border border-white/10 rounded-xl overflow-hidden cursor-pointer hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all duration-300"
                                >
                                    {/* Thumbnail */}
                                    <div className="aspect-[4/3] bg-black/50 relative overflow-hidden">
                                        {dish.thumbnail ? (
                                            <img
                                                src={dish.thumbnail}
                                                alt={dish.name}
                                                className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white/10">
                                                No Preview
                                            </div>
                                        )}
                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                    </div>

                                    {/* Footer */}
                                    <div className="p-3 bg-white/5 border-t border-white/5">
                                        <h3 className="font-medium text-white/90 truncate pr-6" title={dish.name}>
                                            {dish.name}
                                        </h3>
                                        <p className="text-xs text-white/40 mt-1">
                                            {new Date(dish.timestamp).toLocaleDateString()}
                                        </p>
                                    </div>

                                    {/* Delete Button (visible on hover) */}
                                    <button
                                        onClick={(e) => handleDeleteDish(e, dish.id)}
                                        className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-lg backdrop-blur-sm"
                                        title="Delete Dish"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
