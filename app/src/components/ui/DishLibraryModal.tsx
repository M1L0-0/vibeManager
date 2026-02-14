import { DishRecord, libraryDB } from '@/store/library-db';
import { useGridStore } from '@/store/grid-store';
import { X, Trash2, Upload, Download, Folder, User, Beaker } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSimulationStore } from '@/store/simulation-store';
import { DishValidator } from '@/core/grid/validator';

interface DishLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Tab = 'Demos' | 'User';

export function DishLibraryModal({ isOpen, onClose }: DishLibraryModalProps) {
    const [dishes, setDishes] = useState<DishRecord[]>([]);
    const [activeTab, setActiveTab] = useState<Tab>('Demos');
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
        try {
            const data = JSON.parse(dish.data);
            const validation = DishValidator.validate(data);

            if (!validation.isValid) {
                alert(`Cannot load dish: \n${validation.errors.join('\n')}`);
                return;
            }
            if (validation.warnings.length > 0) {
                console.warn('Dish Validation Warnings:', validation.warnings);
            }

            importGrid(dish.data);
            // setIsPlaying(false); // Can confuse user if they expect immediate interaction
            onClose();
        } catch (e) {
            alert('Failed to parse dish data');
            console.error(e);
        }
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
                try {
                    const data = JSON.parse(content);
                    const validation = DishValidator.validate(data);

                    if (!validation.isValid) {
                        alert(`Cannot import dish: \n${validation.errors.join('\n')}`);
                        return;
                    }

                    importGrid(content);
                    onClose();
                } catch (e) {
                    alert('Invalid JSON file');
                }
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    if (!isOpen) return null;

    // Filter dishes based on Tab
    // Default legacy dishes (no folder) -> User
    const filteredDishes = dishes.filter(d => {
        if (activeTab === 'Demos') return d.folder === 'Demos';
        return d.folder !== 'Demos'; // User dishes have undefined or 'User'
    });

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end bg-black/10 backdrop-blur-[2px]"
            onClick={onClose}
        >
            <div
                className="bg-neutral-950/90 border-l border-white/10 w-full max-w-[600px] h-full flex flex-col shadow-2xl backdrop-blur-md transition-transform duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent flex items-center gap-2">
                        <Beaker className="text-purple-400" size={24} />
                        The Incubator
                    </h2>
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer text-sm text-white/80">
                            <Upload size={16} />
                            <span>Import</span>
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

                {/* Tabs / Sidebar Area */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-40 border-r border-white/5 bg-black/20 flex flex-col p-2 gap-1">
                        <button
                            onClick={() => setActiveTab('Demos')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${activeTab === 'Demos'
                                    ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30'
                                    : 'text-white/50 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <Folder size={16} />
                            Demos
                        </button>
                        <button
                            onClick={() => setActiveTab('User')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${activeTab === 'User'
                                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                                    : 'text-white/50 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <User size={16} />
                            My Dishes
                        </button>
                    </div>

                    {/* Grid */}
                    <div className="flex-1 overflow-y-auto p-4 bg-black/10">
                        {filteredDishes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-white/30 space-y-4">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                    <Download size={32} />
                                </div>
                                <p>No dishes found in {activeTab}.</p>
                                {activeTab === 'User' && <p className="text-sm">Save a setup to see it here.</p>}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {filteredDishes.map((dish) => (
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
                                                <div className="w-full h-full flex items-center justify-center text-white/10 flex-col gap-2">
                                                    <Beaker className="opacity-20" size={32} />
                                                    <span className="text-xs">No Preview</span>
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

                                        {/* Delete Button (visible on hover) - ONLY ALLOW FOR USER DISHES */}
                                        {activeTab === 'User' && (
                                            <button
                                                onClick={(e) => handleDeleteDish(e, dish.id)}
                                                className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-lg backdrop-blur-sm"
                                                title="Delete Dish"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
