const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const nameArg = args.find(a => a.startsWith('--name='))?.split('=')[1] || args[0];

if (!nameArg) {
    console.error('Stack Overflow Error: Missing required argument --name');
    console.error('Usage: npm run gen:pam [name]');
    process.exit(1);
}

// Helpers
const toPascalCase = (str) => str.replace(/(^\w|-\w)/g, (m) => m.replace('-', '').toUpperCase());
const toKebabCase = (str) => str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

const name = toKebabCase(nameArg);
const PascalName = toPascalCase(name);
const CellName = `${PascalName}Cell`;

const pamsDir = path.join(__dirname, '../src/pams');
const targetDir = path.join(pamsDir, name);

// 1. Create Directory
if (fs.existsSync(targetDir)) {
    console.error(`Error: PAM module "${name}" already exists.`);
    process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });

// 2. Generate index.ts
const indexContent = `/**
 * ${PascalName} Cell
 * Auto-generated PAM module.
 */

import { PamModule, Cell, Signal } from '@/lib/vibe-core';
import { useGridStore } from '@/store/grid-store';

export const ${CellName}: PamModule = {
    dna: {
        id: '${name}',
        name: '${PascalName}',
        color: '#a855f7', // Purple/Vibe default
        description: 'Auto-generated cell type.',
        complexity: 1,
        transmission: 'omni'
    },

    onSpawn: (cell: Cell) => {
        // Initialize state
        cell.state.data = {
            ...cell.state.data
        };
    },

    onSignal: (cell: Cell, signal: Signal) => {
        // Handle incoming signal
        // e.g. propagateSignal(cell, ...);
    },

    onTick: (cell: Cell, deltaTime: number) => {
        // Update physics or logic
    },

    getLabel: (cell: Cell) => {
        return '${PascalName.substring(0, 1)}';
    }
};
`;

fs.writeFileSync(path.join(targetDir, 'index.ts'), indexContent);

// 3. Generate test file
const testContent = `import { ${CellName} } from './index';
import { scaffoldGrid, getGridSnapshot } from '@/test/utils';
import { useGridStore } from '@/store/grid-store';

describe('${PascalName} Cell', () => {
    it('should initialize correctly', () => {
        const store = scaffoldGrid([{
            id: 'test-${name}',
            coord: { q: 0, r: 0 },
            dna: ${CellName}.dna,
            state: { energy: 100, activity: 0 },
            signals: [],
            createdAt: Date.now()
        }]);

        expect(getGridSnapshot(store)).toMatchSnapshot('Initial State');
    });
});
`;

fs.writeFileSync(path.join(targetDir, `${name}.test.ts`), testContent);

// 4. Update Registry
const registryPath = path.join(pamsDir, 'registry.ts');
let registryContent = fs.readFileSync(registryPath, 'utf8');

// Inject Import
// Find the last import line
const lastImportIdx = registryContent.lastIndexOf('import ');
const endOfLastImport = registryContent.indexOf('\n', lastImportIdx);
const importStatement = `import { ${CellName} } from '@/pams/${name}';\n`;

registryContent =
    registryContent.slice(0, endOfLastImport + 1) +
    importStatement +
    registryContent.slice(endOfLastImport + 1);

// Inject Registry Entry
// Find "export const REGISTRY: Record<string, PamModule> = {"
const registryStart = registryContent.indexOf('export const REGISTRY');
const registryOpenBrace = registryContent.indexOf('{', registryStart);
const registryEntry = `    [${CellName}.dna.id]: ${CellName},\n`;

registryContent =
    registryContent.slice(0, registryOpenBrace + 1) +
    '\n' + registryEntry +
    registryContent.slice(registryOpenBrace + 1);

fs.writeFileSync(registryPath, registryContent);

console.log(`✅ Successfully scaffolded PAM: ${PascalName}`);
console.log(`📁 Location: src/pams/${name}`);
console.log(`📝 Registry updated.`);
