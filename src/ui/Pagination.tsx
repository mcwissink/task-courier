import React from 'react';
import cn from 'classnames';
import { Link } from 'react-router-dom';

export const Pagination: React.VFC<React.ComponentPropsWithoutRef<'span'> & {
    offset: number;
    limit: number;
    total: number;
}> = ({ total, limit, offset, ...props }) => {
    if (!total) {
        return null;
    }
    const page = Math.ceil(offset / limit);
    const pages = new Array(Math.ceil(total / limit)).fill(0);
    return (
        <span {...props}>
            <div className="inline-flex gap-4">
                <Link
                    className={cn({ 'invisible': !page })}
                    to={`?limit=${limit}&offset=${offset - limit}`}
                >
                    prev
                </Link>
                {pages.map((_, index) => (
                    <span key={index}>
                        {page === index ? (
                            <span>{index + 1}</span>
                        ) : (
                            <Link
                                key={index}
                                to={`?limit=${limit}&offset=${limit * index}`}
                            >
                                {index + 1}
                            </Link>
                        )
                        }
                    </span>
                ))}
                <Link
                    className={cn({ 'invisible': page === pages.length - 1 })}
                    to={`?limit=${limit}&offset=${offset + limit}`}
                >
                    next
                </Link>
            </div>
        </span>
    );
}
