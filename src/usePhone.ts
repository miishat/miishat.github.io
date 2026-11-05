/**
 * @file usePhone.ts
 * @description True below Tailwind's `md` breakpoint (768px). Phone-only layout and copy
 * hang off this, so tablet and desktop never change.
 */
import { useSyncExternalStore } from 'react';

export const PHONE_QUERY = '(max-width: 767px)';

const subscribe = (onChange: () => void) => {
    const mq = window.matchMedia(PHONE_QUERY);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
};

export const isPhone = () => window.matchMedia(PHONE_QUERY).matches;

export const usePhone = () => useSyncExternalStore(subscribe, isPhone);
