/** Gigacart bank geometry and boot hardware, independent of ZIP and CPU I/O. */
export interface GigacartOptions {
    boot: 'rom' | 'grom' | 'cpld';
    dataBits: number;
    initialBank: number;
}

export function gigacartOptions(type: string, width: string | null, initial: string | null,
                               romSize: number, gromSize = 0): GigacartOptions {
    if (!['gigacart', 'gigacart-rom', 'gigacart-grom', 'gigacart-cpld'].includes(type)) {
        throw new Error('Unknown Gigacart PCB type: ' + type);
    }
    // The original js99er name remains compatible with existing packages.
    // Explicit hardware names use the declared width, as in the MAME proposal.
    const bits = width === null && type === 'gigacart'
        ? Math.max(1, Math.log2(romSize) - 25) : /^[1-8]$/.test(width || '') ? Number(width) : 0;
    if (!Number.isInteger(bits) || bits < 1 || bits > 8) {
        throw new Error('Gigacart requires bank_data_bits from 1 through 8.');
    }
    const banks = 2 ** (12 + bits);
    if (romSize < 8192 || !Number.isInteger(Math.log2(romSize)) || romSize > banks * 8192) {
        throw new Error('Gigacart ROM must be a power-of-two number of whole 8 KiB banks within the declared capacity.');
    }
    const value = initial ?? 'first';
    const bank = value === 'first' ? 0 : value === 'last' ? banks - 1 : /^\d+$/.test(value) ? Number(value) : NaN;
    if (!Number.isSafeInteger(bank) || bank < 0 || bank >= banks) {
        throw new Error('Gigacart initial_bank must be first, last, or a decimal bank within the declared capacity.');
    }
    const boot = type === 'gigacart' ? (gromSize ? 'grom' : 'cpld') : type.slice(9) as GigacartOptions['boot'];
    if (boot === 'grom' ? !gromSize || gromSize > 0xa000 || gromSize % 8192 !== 0 : gromSize !== 0) {
        throw new Error('Gigacart GROM socket does not match the selected boot hardware.');
    }
    return {boot, dataBits: bits, initialBank: bank};
}
