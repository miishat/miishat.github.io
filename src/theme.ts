/**
 * @file theme.ts
 * @description The active page theme, provided by AppContent so components deep in a
 * section can pick their per-theme design without prop drilling.
 * @author Mishat
 */
import { createContext, useContext } from 'react';

export type Theme = 'default' | 'silicon' | 'light';

export const ThemeContext = createContext<Theme>('default');

export const useTheme = () => useContext(ThemeContext);
