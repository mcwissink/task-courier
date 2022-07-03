import React from 'react';
import { useLoading } from '../use-loading';
import cn from 'classnames';

export const Button: React.FC<React.ComponentPropsWithoutRef<'button'> & {
    onClick?: (e: React.SyntheticEvent) => Promise<void> | void;
    loading?: boolean;
}> = ({
    children,
    onClick,
    loading: isLoadingProp,
    className,
    ...props
}) => {
        const { isLoading: isLoadingClick, loading } = useLoading();
        const isLoading = isLoadingClick || isLoadingProp;
        return (
            <button
                onClick={onClick ? loading(async (e) => onClick(e)) : undefined}
                disabled={isLoading}
                {...props}
                className={cn('p-1', className)}
            >
                {children}
            </button>
        );
    }
