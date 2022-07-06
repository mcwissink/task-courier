import React, { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom";
import { Paginated } from "./records"
import { useRecords } from "./records-store";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Input } from "./ui/Input";
import { Progress } from "./ui/Progress";
import { useLoading } from "./use-loading";
import { useNavigate } from "react-router-dom";

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
        loading(records.get)('todo', parameters).then(setData);
    }, [records, loading]);

    const onCheck = ([id, date, title, details, complete]: string[]) => async () => {
        await records.update('todo', [id, date, title, details, complete === 'T' ? 'F' : 'T']);
        loading(records.get)('todo', parameters).then(setData);
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
                        </div>
                        {rows.map((row) => {
                            const [id, _date, title, _details, complete] = row;
                            return (
                                <Card key={id} className="flex items-center">
                                    <Input type="checkbox" checked={complete === 'T'} onChange={onCheck(row)} />
                                    <div className="grow">{title}</div>

                                    <Link key={id} to={`/records/${id}`}>
                                        edit
                                    </Link>
                                </Card>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    )
}
