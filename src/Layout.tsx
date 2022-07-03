import React from 'react';
import { Link, Outlet } from "react-router-dom";
import { useAppStore } from './app-store';
import { useRecords } from './records-store';

const links = [
    ['/', 'home'],
];

const connectedLinks = [
    ['/manage', 'manage'],
    ['/settings', 'settings'],
];

export const Layout: React.VFC = () => {
    const {
        isConnected,
    } = useRecords();
    const {
        logMessage,
    } = useAppStore();


    return (
        <div className="flex flex-col min-h-screen">
            <nav className="overflow-hidden p-4 flex items-center gap-2 border-solid border-0 border-b">
                <ul className="contents list-none">
                    {links.concat(isConnected ? connectedLinks : []).map(([to, title], index) => (
                        <React.Fragment key={to}>
                            {index ? <li>|</li> : null}
                            <li><Link to={to}>{title}</Link></li>
                        </React.Fragment>
                    ))}
                </ul>
            </nav>
            <div className="p-4 grow">
                <Outlet />
            </div>
            <footer className="flex justify-between p-4 border-solid border-0 border-t">
                <div>{process.env.REACT_APP_GIT_SHA}</div>
                <div>{logMessage}</div>
            </footer>
        </div>
    );
}
