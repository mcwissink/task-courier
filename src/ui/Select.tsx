import React from 'react';
import cn from 'classnames';

type Props = React.ComponentPropsWithoutRef<'select'>;

export const Select = React.forwardRef<HTMLSelectElement, Props>(({
    className,
    ...props
}, ref) => (
    <select
        ref={ref}
        className={cn('p-1', className)}
        {...props}
    />
));
