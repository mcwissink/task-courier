import { Paginated, GetOptions, Schema } from "./records";
import { log } from './app-store';

export enum JournalAction {
    Insert = 'insert',
    Delete = 'delete',
}

interface JournalPayload<Action extends JournalAction, Payload> {
    action: Action;
    payload: Payload;
    id: string;
    table: string;
}

type JournalEntry =
    | JournalPayload<JournalAction.Insert, string[]>
    | JournalPayload<JournalAction.Delete, string>

type DatabaseSchema = Schema<IDBObjectStoreParameters | undefined>
class Database {
    private _db?: IDBDatabase;
    constructor(
        private name: string,
        private version?: number,
    ) {
    }

    private ensure<T>(value?: T) {
        if (!value) {
            throw new Error('database has not been initialized');
        }
        return value;
    }

    get db() {
        return this.ensure(this._db);
    }

    set db(db) {
        this._db = db;
    }

    resolve = <Result>(request: IDBRequest<Result>): Promise<Result> => new Promise((resolve, reject) => {
        request.addEventListener('success', () => resolve(request.result));
        request.addEventListener('error', reject);
    });

    connect = async (onUpgradeNeeded: (db: IDBDatabase) => void) => {
        const request = window.indexedDB.open(this.name, this.version);
        this.db = await new Promise((resolve, reject) => {
            request.addEventListener('success', () => resolve(request.result));
            request.addEventListener('error', reject);
            request.addEventListener('upgradeneeded', () => onUpgradeNeeded(request.result));
        });
    }

    insert = log('db:insert', async (table: string, row: Record<string, any>) => this.resolve(
        this.db
            .transaction(table, 'readwrite')
            .objectStore(table)
            .add(row)
    ));

    get = log('db:get', async (table: string): Promise<any[]> => this.resolve(
        this.db
            .transaction(table, 'readonly')
            .objectStore(table)
            .getAll()
    ));

    find = log('db:find', async (table: string, id: string,): Promise<Record<string, any>> => this.resolve(
        this.db
            .transaction(table, 'readonly')
            .objectStore(table)
            .get(id)
    ));

    delete = log('db:delete', async (table: string, id: string | number) => this.resolve(
        this.db
            .transaction(table, 'readwrite')
            .objectStore(table)
            .delete(id)
    ));

    reset = log('db:reset', async (table: string, rows: Record<string, any>[]) => this.transaction(table, (store) => {
        store.clear();
        rows.forEach(row => store.add(row))
    }));

    transaction = async (table: string, cb: (store: IDBObjectStore) => void) => {
        const transaction = this.db.transaction(table, 'readwrite')
        cb(transaction.objectStore(table));
        return await new Promise((resolve, reject) => {
            transaction.addEventListener('complete', resolve);
            transaction.addEventListener('error', reject);
        });
    }

    disconnect = log('db:disconnect', async () => {
        this.db.close();
        return this.resolve(window.indexedDB.deleteDatabase(this.name));
    });
}

class Journal {
    private static ENTRY = 'entry';
    constructor(
        private db = new Database('record-sage-journal'),
    ) { }

    get = (): Promise<JournalEntry[]> => this.db.get(Journal.ENTRY);

    insert = (entry: Omit<JournalEntry, 'id'>) => this.db.insert(Journal.ENTRY, entry);

    delete = (id: string | number) => this.db.delete(Journal.ENTRY, id);

    connect = log('journal:connect', async () => {
        await this.db.connect((db) => {
            db.createObjectStore(Journal.ENTRY, {
                keyPath: 'id',
                autoIncrement: true,
            })
        });
    });

    disconnect = async () => this.db.disconnect();
}

export class Cache {
    private syncing = false;
    private _schema?: DatabaseSchema;
    constructor(
        private db = new Database('record-sage'),
        public journal = new Journal(),
    ) { }

    private ensure<T>(value?: T) {
        if (!value) {
            throw new Error('cache has not been initialized');
        }
        return value;
    }

    get schema() {
        return this.ensure(this._schema);
    }

    set schema(schema) {
        this._schema = schema;
    }

    connect = log('cache:connect', async (schema: Schema) => {
        this.schema = schema;
        await this.db.connect(async (db) => {
            Object.keys(schema).forEach((table) => {
                db.createObjectStore(table, { keyPath: 'id' });
            });
        });
        await this.journal.connect();
    });

    insert = async (table: string, row: string[]) => {
        await this.db.insert(table, this.convertRowArray(table, row))
        await this.journal.insert({
            payload: row,
            table,
            action: JournalAction.Insert,
        });
    }

    get = async (table: string, options?: GetOptions): Promise<Paginated<string[][]>> => {
        const records = await this.db.get(table);
        const limit = options ? options.limit : records.length
        const offset = options ? options.offset : 0;
        return {
            rows: records
                .slice(offset, offset + limit)
                .map(this.convertRowObject),
            total: records.length,
            limit,
            offset,
        }
    }

    find = async (table: string, id: string): Promise<string[]> => this.convertRowObject(
        await this.db.find(table, id),
    );

    delete = async (table: string, id: string) => {
        await this.db.delete(table, id);
        await this.journal.insert({
            payload: id,
            table,
            action: JournalAction.Delete,
        })
    }

    sync = async (cb: (entry: JournalEntry) => Promise<boolean>): Promise<string[]> => {
        if (!this.syncing) {
            const updates = new Set<string>();
            this.syncing = true;
            const entries = await this.journal.get();
            for (const entry of entries) {
                if (await cb(entry)) {
                    updates.add(entry.table);
                    await this.journal.delete(entry.id);
                }
            }
            this.syncing = false;
            return Array.from(updates);
        }
        return [];
    }

    disconnect = async () => {
        await this.db.disconnect();
        await this.journal.disconnect();
    }

    reset = async (table: string, rows: string[][]) => this.db.reset(table, rows.map((row) => this.convertRowArray(table, row)));

    private convertRowArray = (table: string, row: string[]): Record<string, any> => {
        const { columns } = this.schema[table];
        return columns.reduce<Record<string, string>>((rowObject, column, index) => {
            rowObject[column] = row[index];
            return rowObject;
        }, {});
    }

    private convertRowObject = (row: Record<string, string>) => Object.values(row);
}
