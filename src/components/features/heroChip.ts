/**
 * @file heroChip.ts
 * @description What the Default theme's boot and hero share about the hero chip: the die's
 * floorplan geometry, and a small bridge the hero fills in so the boot can draw the chip in 2D
 * and tilt it onto the 3D hologram. Kept free of three.js so the boot, which loads eagerly,
 * doesn't pull in the hero's lazy-loaded 3D bundle.
 * @module Components/Features
 * @author Mishat
 */

export type IPKey = 'ai' | 'cpu' | 'serdes';
export type Rect = [number, number, number, number];

/** Die edge in world units. The package is 5 x 5, centred on the origin. */
export const DIE = 3.2;
export const PACKAGE = 5;

/** Die floorplan in die-relative fractions: [x, y, w, h]. */
export const FLOORPLAN: Record<IPKey, Rect> = {
    ai: [0.06, 0.06, 0.42, 0.4],
    cpu: [0.52, 0.06, 0.42, 0.4],
    serdes: [0.06, 0.54, 0.88, 0.22],
};
export const MISC_BLOCKS: Rect[] = [[0.06, 0.8, 0.4, 0.14], [0.5, 0.8, 0.2, 0.14], [0.74, 0.8, 0.2, 0.14]];

/** Signal routes between the IP blocks, in floorplan fractions. */
export const ROUTES: [number, number][][] = [
    [[0.27, 0.26], [0.5, 0.26], [0.73, 0.26]],
    [[0.73, 0.26], [0.73, 0.5], [0.5, 0.5], [0.5, 0.65]],
    [[0.5, 0.65], [0.27, 0.65], [0.27, 0.5], [0.27, 0.26]],
    [[0.2, 0.87], [0.2, 0.5], [0.27, 0.26]],
    [[0.6, 0.87], [0.6, 0.5], [0.73, 0.26]],
];

/** Floorplan fraction to world units on the die plane. */
export const fpToWorld = (f: number) => (f - 0.5) * DIE;

/** Gold fan-out traces from the die edge to the package edge, 14 per side, as world (x, z) points. */
export const FAN_OUT: [number, number][][] = (() => {
    const out: [number, number][][] = [];
    for (let side = 0; side < 4; side++) for (let i = 0; i < 14; i++) {
        const o = (i / 13 - 0.5) * (DIE - 0.3), a = DIE / 2 + 0.05, b = DIE / 2 + 0.45, c = 2.35;
        out.push(([[o, a], [o, b], [o * 1.35, c]] as [number, number][]).map(([u, v]) =>
            side === 0 ? [u, v] : side === 1 ? [u, -v] : side === 2 ? [v, u] : [-v, u]));
    }
    return out;
})();

/** Inner detail of each IP block, in floorplan fractions: the AI array tiles, the four CPU cores, the 16 SerDes lanes. */
export const BLOCK_DETAIL: Rect[] = (() => {
    const out: Rect[] = [];
    const [ax, ay] = FLOORPLAN.ai, [cx, cy] = FLOORPLAN.cpu, [sx, sy] = FLOORPLAN.serdes;
    for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++) out.push([ax + 0.03 + i * 0.045, ay + 0.08 + j * 0.05, 0.035, 0.04]);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) out.push([cx + 0.03 + i * 0.19, cy + 0.07 + j * 0.12, 0.17, 0.1]);
    for (let i = 0; i < 16; i++) out.push([sx + 0.02 + i * 0.053, sy + 0.06, 0.04, 0.13]);
    return out;
})();

/** Screen corners of the package (TL, TR, BR, BL) in px. */
export type Quad = [number, number][];

/**
 * Projects the package's corners to the screen at height `y` above the hologram's plane.
 * `tilt` runs from 0 (facing the camera, `flatScale` of its size) to 1 (exactly on the hologram).
 */
export type ProjectChip = (tilt: number, y: number, flatScale: number) => Quad;

export const heroChip = {
    /** Set by the boot while it runs, so the hero holds its spin and the drawing lands on a still target. */
    booting: false,
    /** Set by the hero once its camera is ready; null while it loads. */
    project: null as ProjectChip | null,
};
