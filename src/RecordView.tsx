import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom";
import { useRecords } from "./records-store";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/Button";
import { useLoading } from "./use-loading";
import { Progress } from "./ui/Progress";

const TABLE = 'todo';

export const RecordView: React.VFC = () => {
    const navigate = useNavigate();
    const { isLoading, loading } = useLoading();
    const { recordId } = useParams();
    const [row, setRow] = useState<string[]>([]);
    const { records } = useRecords();
    useEffect(() => {
        if (recordId) {
            loading(records.find)(TABLE, recordId).then(setRow);
        }
    }, [records, recordId, loading]);

    if (!recordId) {
        return <div>Missing ID</div>
    }

    if (isLoading) {
        return <Progress />
    }

    if (!row.length) {
        return <div>404</div>
    }

    const onDelete = (row: string[]) => async () => {
        if (window.confirm(`Delete: ${JSON.stringify(row.slice(1))}`)) {
            await records.delete(TABLE, row[0]);
            navigate(-1);
        }
    };

    const [_id, date, title, details, complete] = row;

    return (
        <div className="grid gap-2">
            <div className="flex items-end">
                <b className="grow">{date}</b>
                <Button type="button" onClick={onDelete(row)}>delete</Button>
            </div>
            <div className="flex flex-col gap-1">
                <Label label="title">{title}</Label>
                <Label label="details">{details}</Label>
                <Label label="complete">{complete}</Label>
            </div>
        </div>
    )
}

export const Label: React.FC<{ label: string }> = ({ label, children, ...props }) => (
    <div {...props}>
        <b>{label}: </b>
        {children}
    </div>
);
