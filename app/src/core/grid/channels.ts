export type ChannelId = 'universal' | 'ignitium' | 'cryogen' | 'vitalis' | 'voltix' | 'psyon';

export interface Channel {
    id: ChannelId;
    name: string;
    color: string;
    description: string;
}

export const CHANNELS: Record<ChannelId, Channel> = {
    'universal': {
        id: 'universal',
        name: 'Universal',
        color: '#ffffff', // White
        description: 'Standard signal, affects all cells.'
    },
    'ignitium': {
        id: 'ignitium',
        name: 'Ignitium',
        color: '#ef4444', // Red-500
        description: 'Highly reactive thermal agent.'
    },
    'cryogen': {
        id: 'cryogen',
        name: 'Cryogen',
        color: '#3b82f6', // Blue-500
        description: 'Cooling solution for stabilization.'
    },
    'vitalis': {
        id: 'vitalis',
        name: 'Vitalis',
        color: '#22c55e', // Green-500
        description: 'Bio-stimulant for growth.'
    },
    'voltix': {
        id: 'voltix',
        name: 'Voltix',
        color: '#eab308', // Yellow-500
        description: 'High-voltage charge carrier.'
    },
    'psyon': {
        id: 'psyon',
        name: 'Psyon',
        color: '#a855f7', // Purple-500
        description: 'Psycho-reactive neural link.'
    }
};

export const CHANNEL_LIST = Object.values(CHANNELS);
