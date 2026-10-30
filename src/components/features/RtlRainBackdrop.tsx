/**
 * @file RtlRainBackdrop.tsx
 * @description Page background for the Silicon theme: columns of Verilog and UVM fall
 * slowly down the page, each led by a bright lime line and trailing off into the dark,
 * like source scrolling past on a phosphor terminal. It is a fixed layer behind every
 * section at 65%, starting clear of the Vim line-number gutter; index.html fades it into
 * the Run Simulation footer and gives the translucent cards a solid fill over it.
 *
 * @author Mishat
 */
import React, { useEffect, useRef } from 'react';

const GREEN = '57, 255, 20'; // Silicon --color-electric
const LIME = '204, 255, 0';  // Silicon --color-pcbgold

const RTL = [
    'always_ff @(posedge clk or negedge rst_n)', 'if (!rst_n) state <= IDLE;', 'else state <= next_state;', 'assign ready = ~fifo_full & en;',
    'case (opcode)', "4'hA: alu_out = a & b;", 'endcase', 'logic [31:0] axi_awaddr;', 'assert property (@(posedge clk) req |-> ##[1:3] ack);',
    'covergroup cg_noc @(posedge clk);', 'cp_dst: coverpoint flit.dst;', 'endgroup', 'wire [7:0] crc = crc8(data);', 'uvm_info("SB", "match", UVM_LOW)',
    'fork', 'drv.run_phase(phase);', 'join_none', 'localparam int LANES = 16;', 'generate for (genvar i=0;i<LANES;i++)', 'serdes_lane u_lane (.*);',
];

const COLUMN_GAP = 260; // px between columns
const LINE_H = 20;      // px between lines in a column
const GUTTER = 48;      // the fixed Vim gutter (w-12), shown from lg up

/** Seeded PRNG so the opening layout is the same on every visit. */
const rng = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

type Column = { x: number; y: number; speed: number; seed: number; length: number };

export default function RtlRainBackdrop() {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current!, ctx = canvas.getContext('2d')!;
        const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let w = 0, h = 0, raf = 0, last = 0;
        let columns: Column[] = [];

        const layout = () => {
            const dpr = Math.min(window.devicePixelRatio, 2);
            w = window.innerWidth; h = window.innerHeight;
            canvas.width = w * dpr; canvas.height = h * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const left = (w >= 1024 ? GUTTER : 0) + 24, r = rng(9);
            columns = Array.from({ length: Math.ceil((w - left) / COLUMN_GAP) }, (_, i) => ({
                x: left + i * COLUMN_GAP + r() * 30,
                y: r() * h * 1.5,
                speed: 15 + r() * 27, // px/s
                seed: Math.floor(r() * RTL.length),
                length: 10 + Math.floor(r() * 10),
            }));
        };

        const draw = (dt: number) => {
            ctx.clearRect(0, 0, w, h);
            ctx.font = '12px JetBrains Mono, monospace';
            for (const col of columns) {
                col.y += col.speed * dt;
                for (let k = 0; k < col.length; k++) {
                    const y = col.y - k * LINE_H;
                    if (y < -LINE_H || y > h + LINE_H) continue;
                    // the leading line is bright lime; the trail dims line by line
                    ctx.fillStyle = k === 0 ? `rgba(${LIME}, 0.85)` : `rgba(${GREEN}, ${Math.max(0, 0.4 - k * 0.03)})`;
                    ctx.fillText(RTL[(col.seed + k) % RTL.length], col.x, y);
                }
                if (col.y - col.length * LINE_H > h) { col.y = -LINE_H; col.seed = Math.floor(Math.random() * RTL.length); }
            }
        };

        const loop = (t: number) => {
            const dt = last ? Math.min(0.1, (t - last) / 1000) : 0;
            last = t;
            draw(dt);
            raf = requestAnimationFrame(loop);
        };

        const onResize = () => { layout(); if (still) draw(0); };
        layout();
        if (still) draw(0); else raf = requestAnimationFrame(loop);
        window.addEventListener('resize', onResize);
        return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
    }, []);

    return (
        <div aria-hidden className="fixed inset-0 pointer-events-none overflow-hidden" style={{ opacity: 0.65 }}>
            <canvas ref={ref} className="absolute inset-0 w-full h-full" />
        </div>
    );
}
