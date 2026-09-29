import { useSyncExternalStore } from 'react';
import { getVersion, subscribe } from './data/db.js';

// Call at the top of a component: it re-renders whenever any repository changes.
export const useDb = () => useSyncExternalStore(subscribe, getVersion);
