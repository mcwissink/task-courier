import { useCallback, useState } from 'react';

export const useLoading = () => {
    const [isLoading, setLoading] = useState(false);
    return {
        isLoading,
        loading: useCallback(<Result, Args extends any[]>(fn: (...args: Args) => Promise<Result>) => async (...args: Args) => {
            setLoading(true);
            const result = await fn(...args);
            setLoading(false);
            return result;
        }, [])
    }
}
