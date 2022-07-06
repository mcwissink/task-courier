import React from 'react'
import cn from 'classnames';
import { format } from 'date-fns';
import { useRecords } from './records-store';
import { useForm } from 'react-hook-form';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useNavigate } from 'react-router-dom';

interface Form {
    date: string;
    title: string;
    details: string;
}

const DEFAULT_FIELDS = {
    date: format(new Date(), 'yyyy-MM-dd'),
}
export const RecordEntry: React.VFC = () => {
    const navigate = useNavigate();
    const {
        records,
    } = useRecords();

    const {
        register,
        handleSubmit,
        formState: { isSubmitting }
    } = useForm<Form>({
        defaultValues: {
            ...DEFAULT_FIELDS,
        }
    });

    const onSubmit = handleSubmit(async ({ date, title, details }: Form) => {
        await records.insert('todo', [
            date,
            title,
            details,
            'F',
        ]);
        navigate('/');
    });

    return (
        <form onSubmit={onSubmit} className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <div className={'contents'}>
                <b className="col-span-full">TODO</b>
                <FormEntry className="col-span-2" label="date">
                    <Input type="date" className="w-full" {...register('date')} />
                </FormEntry>
                <FormEntry className="col-span-2" label="title">
                    <Input className="w-full" {...register('title')} />
                </FormEntry>
                <FormEntry className="col-span-2" label="details">
                    <textarea className="w-full" {...register('details')} />
                </FormEntry>
                <hr className="w-full col-span-full" />
            </div>
            <Button
                type="submit"
                loading={isSubmitting}
                className="col-span-2 md:w-36"
            >
                complete
            </Button>
        </form>
    )
}

export const FormEntry: React.FC<React.ComponentPropsWithoutRef<'div'> & {
    label: string;
    action?: React.ReactNode;
}> = ({
    children,
    action,
    label,
    ...props
}) => {
        return (
            <div {...props}>
                <div className="flex justify-between items-end pb-1">
                    {label}:
                    {action ? action : null}
                </div>
                {children}
            </div>
        );
    };

export const Title: React.FC = (props) => (
    <b className="col-span-full" {...props} />
)
