import React, { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom";
import { Paginated } from "./records"
import { useRecords } from "./records-store";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Progress } from "./ui/Progress";
import { useLoading } from "./use-loading";
import { useNavigate } from "react-router-dom";
import { Label } from "./RecordView";

export const RecordList: React.VFC = () => {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const { isLoading, loading } = useLoading();
    const [data, setData] = useState<Paginated<string[][]>>({
        rows: [],
        total: 0,
        limit: 0,
        offset: 0,
    });
    const { records } = useRecords();
    const parameters = {
        limit: Number(params.get('limit') ?? 20),
        offset: Number(params.get('offset') ?? 0),
    }

    useEffect(() => {
        loading(records.get)('chemical-application', parameters).then(setData);
    }, [records, params]);

    const onDuplicateRows = (rows: string[][]) => () => {
        navigate('records/add', { state: { rows } });
    };

    const rowsByDate = data.rows.reduce<Record<string, string[][]>>((acc, row) => {
        const [_id, date] = row;
        if (acc[date]) {
            acc[date].push(row);
        } else {
            acc[date] = [row];
        }
        return acc;
    }, {});

    return (
        <div>
            <Link to="/records/add">
                <Button className="mb-4 mt-2 w-full md:w-36">Add</Button>
            </Link>
            <Progress active={isLoading} />
            <div className="flex flex-col gap-4">
                {Object.entries(rowsByDate).map(([date, rows]) => (
                    <React.Fragment key={date}>
                        <div className="flex items-end">
                            <b className="grow">{date}</b>
                            <Button onClick={onDuplicateRows(rows)}>duplicate</Button>
                        </div>
                        {rows.map(([id, _date, field, crop, acres, chemical, registration, amount]) => (
                            <Link key={id} to={`/records/${id}`} className="no-underline">
                                <Card className="flex items-center">
                                    <div className="grid gap-1 grid-cols-1 md:grid-cols-2 w-full">
                                        <Label label="field">{field}</Label>
                                        <Label label="crop">{crop}</Label>
                                        <Label label="acres">{acres}</Label>
                                        <Label label="chemical">{chemical} [{registration}]</Label>
                                        <Label label="amount">{amount}</Label>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </React.Fragment>
                ))}
            </div>
        </div>
    )
}
