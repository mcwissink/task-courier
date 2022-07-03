import vanilla from 'zustand/vanilla';
import create from 'zustand';
import { Records, RecordsSetupOptions } from './records';
import * as Providers from './providers';

export const records = new Records(Providers.Sheets);

export const recordsStore = vanilla<{
    isInitialized: boolean;
    isAuthenticated: boolean;
    isConnected: boolean;
    isOnline: boolean;
    records: Records;
    setup: (options: RecordsSetupOptions) => Promise<void>;
    disconnect: () => void;
    initialize: () => Promise<void>;
    login: () => Promise<void>;
    logout: () => Promise<void>;
}>((set, get) => ({
    isOnline: navigator.onLine,
    isInitialized: false,
    isAuthenticated: false,
    isConnected: false,
    records,
    setup: async (options) => {
        await get().records.setup(options)
        set({
            isConnected: await get().records.isConnected(),
        })
    },
    disconnect: async () => {
        await get().records.disconnect()
        set({
            isConnected: await get().records.isConnected(),
        })
    },
    initialize: async () => set({
        isInitialized: true,
        isAuthenticated: await get().records.isAuthenticated(),
        isConnected: await get().records.isConnected(),
    }),
    login: async () => set({
        isAuthenticated: await get().records.login()
    }),
    logout: async () => {
        await get().records.disconnect();
        set({
            isAuthenticated: await get().records.logout(),
            isConnected: await get().records.isConnected(),
        })
    },
}));

const setOnline = () => recordsStore.setState({ isOnline: navigator.onLine });

export const useRecords = create(recordsStore);
export const Setup = records.Setup;
export const Login = records.Login;

window.addEventListener('online', setOnline);
window.addEventListener('offline', setOnline);
