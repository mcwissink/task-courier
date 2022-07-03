import React, { useEffect } from 'react';
import { useRecords } from './records-store';
import { Route, Routes } from 'react-router';
import { App } from './App';
import { Manage } from './Manage';
import { Layout } from './Layout';
import { Settings } from './Settings';
import { RecordEntry } from './RecordEntry';
import { RecordView } from './RecordView';
import { Progress } from './ui/Progress';

export const Router: React.FC = () => {
    const {
        isConnected,
        initialize,
    } = useRecords();

    useEffect(() => {
        initialize();
    }, [initialize]);

    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<App />} />
                {isConnected ? (
                    <>
                        <Route path="records">
                            <Route index element={<div>Records</div>} />
                            <Route path="add" element={<RecordEntry />} />
                            <Route path=":recordId" element={<RecordView />} />
                        </Route>
                        <Route path="manage" element={<Manage />} />
                        <Route path="settings" element={<Settings />} />
                    </>
                ) : <Route path="*" element={<Progress />} />}
                <Route path="*" element={<div>Not Found</div>} />
            </Route>
        </Routes>
    );
}
