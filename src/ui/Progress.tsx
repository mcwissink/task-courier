import React from 'react'
import cn from 'classnames';

interface Props {
    active?: boolean;
}

export const Progress: React.VFC<Props> = ({ active = true }) => {
    return (
        <progress className={cn('w-full transition-all', {
            'opacity-0': !active,
        })} />
    );
}
