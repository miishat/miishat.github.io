import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        server: {
            port: 3000,
            host: '0.0.0.0',
        },
        plugins: [react()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        },
        build: {
            rollupOptions: {
                output: {
                    manualChunks: {
                        three: ['three', '@react-three/fiber', '@react-three/drei'],
                        framer: ['framer-motion', 'framer-motion-3d']
                    }
                }
            }
        }
    };
});