import React from 'react'
import cn from 'classnames';

export const Card: React.FC<React.ComponentPropsWithoutRef<'div'>> = ({
    children,
    className,
    ...props
}) => {
    return (
        <div
            {...props}
            className={cn(
                'border border-gray-500 border-solid p-4 bg-gray-100 rounded',
                className
            )}
        >
            {children}
        </div>
    );
}
