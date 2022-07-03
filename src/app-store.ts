import vanilla from 'zustand/vanilla';
import create from 'zustand';

export const appStore = vanilla<{
    logMessage: string;
}>(() => ({
    logMessage: '',
}));


export const log = <Result = any, Args extends any[] = any[]>(message: string, fn: (...args: Args) => Promise<Result>) => async (...args: Args): Promise<Result> => {
    appStore.setState({ logMessage: `${message}:starting` })
    const result = await fn(...args);
    appStore.setState({ logMessage: `${message}:done` })
    return result;
}

export const useAppStore = create(appStore);
