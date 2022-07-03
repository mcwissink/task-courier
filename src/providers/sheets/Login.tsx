import React from 'react'
import { useRecords } from '../../records-store';

export const Login: React.VFC = () => {
    const { login } = useRecords();

    return (
        <button onClick={login}>
            Login
        </button>
    );
}
