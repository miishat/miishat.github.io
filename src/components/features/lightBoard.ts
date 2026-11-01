/**
 * @file lightBoard.ts
 * @description What the Light theme's boot and hero share about the hero's breadboard bench: a
 * small bridge the hero fills in so the boot can draw the bench in 2D and land it exactly on the
 * 3D scene. Kept free of three.js so the boot, which loads eagerly, doesn't pull in the hero's
 * lazy-loaded 3D bundle.
 * @module Components/Features
 * @author Mishat
 */

export type V3 = [number, number, number];
export type Pt = [number, number];

/** The bench's parts in the bench's own coordinates (y up, the board's top at y = 0). */
export interface BenchScene {
    /** Board top corners: TL, TR, BR, BL (far edge first). */
    board: V3[];
    /** The four +/- rail stripes. */
    rails: { color: string; a: V3; b: V3 }[];
    /** Chip lids: TL, TR, BR, BL. */
    chips: { sig: string; sub: string; quad: V3[] }[];
    /** Jumper wires, sampled along their arcs, with their tube radius. */
    wires: { color: string; r: number; pts: V3[] }[];
    leds: { color: string; pos: V3 }[];
}

export const lightBoard = {
    /** Set by the boot while it runs, so the hero holds still and the drawing lands on a still target. */
    booting: false,
    /** Set by the hero at load. */
    scene: null as BenchScene | null,
    /** Bench coordinates to page px; set by the hero once its camera is ready, null while it loads. */
    project: null as ((p: V3) => Pt) | null,
    /** The hero canvas's page box; its bottom 18% fades out, and the boot fades the drawing to match. */
    frame: null as (() => DOMRect) | null,
};
