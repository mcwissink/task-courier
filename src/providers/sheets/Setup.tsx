import React, { useEffect } from 'react'
import { useRecords } from '../../records-store';
import { schema } from '../../schema';
import { useForm } from 'react-hook-form';
import { Button } from '../../ui/Button';
import { Progress } from '../../ui/Progress';
import { useLoading } from '../../use-loading';
import { useSearchParams } from 'react-router-dom';
import { Input } from '../../ui/Input';

interface Form {
    spreadsheetId: string;
}

export const Setup: React.VFC = () => {
    const [params] = useSearchParams();
    const spreadsheetId = params.get('spreadsheetId');

    const { setup } = useRecords();
    const { isLoading, loading } = useLoading();
    const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Form>();

    useEffect(() => {
        if (spreadsheetId) {
            reset({ spreadsheetId });
        }
    }, [reset, spreadsheetId]);

    return (
        <>
            <Progress active={isLoading} />
            <ul>
                <li className="p-2">
                    <div>Link to an existing spreadsheet</div>
                    <form onSubmit={handleSubmit(({ spreadsheetId }) =>
                        loading(setup)({ schema, provider: { spreadsheetId } })
                    )}>
                        <Input {...register('spreadsheetId')} />
                        <Button loading={isSubmitting}>Connect</Button>
                    </form>
                </li>
                <li className="p-2">
                    <div>Create new spreadsheet</div>
                    <Button onClick={() => loading(setup)({ schema })}>Create</Button>
                </li>
            </ul>
        </>
    );
}
