import { RecordsProvider, Schema, RecordsSetupOptions, GetOptions, Paginated } from '../../records';
import { log } from '../../app-store';
import gapi from './../../gapi';

export class SheetsProvider extends RecordsProvider {
    private static METADATA_OFFSET = 1;
    private initialized?: Promise<void>;
    private api: any = gapi;
    private _schema?: Schema;
    private _spreadsheetId?: string;

    private initialize = log('provider:initialize', async () => {
        if (!this.initialized) {
            this.initialized = new Promise((resolve, reject) => {
                this.api.load('client:auth2', async () => {
                    try {
                        await this.api.client.init({
                            apiKey: 'AIzaSyCNEjUa-oT-sppE2yix52q4KeudcJpdIXw',
                            clientId: '794158492809-ukkr1lfsml3ghmclr4po0rfongru44dq.apps.googleusercontent.com',
                            scope: 'https://www.googleapis.com/auth/spreadsheets',
                            discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
                        });
                        resolve();
                    } catch (error) {
                        console.error(error);
                        reject(error);
                    }
                });
            });
        }
        return this.initialized;
    });

    private ensure<T>(value?: T) {
        if (!value) {
            throw new Error('provider has not been initialized');
        }
        return value;
    }

    get schema() {
        return this.ensure(this._schema);
    }

    set schema(schema) {
        this._schema = schema;
    }

    // https://docs.microsoft.com/en-US/office/troubleshoot/excel/convert-excel-column-numbers
    // Convert zero-based row/column index to A1 notation 
    private static alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    private getA1Notation(row: number, column: number) {
        let a1Column = '';
        let columnReducer = column + 1;
        while (--columnReducer >= 0) {
            const quotient = Math.floor(columnReducer / 26);
            const remainder = columnReducer % 26;
            a1Column = SheetsProvider.alphabet[remainder] + a1Column;
            columnReducer = quotient;
        }
        return `${a1Column}${row + 1}`;
    }

    private static SPREADSHEET_ID_KEY = 'spreadsheedId';
    get spreadsheetId() {
        if (!this._spreadsheetId) {
            const spreadsheetId = localStorage.getItem(SheetsProvider.SPREADSHEET_ID_KEY);
            if (!spreadsheetId) {
                throw new Error('missing spreadsheet ID');
            }
            this._spreadsheetId = spreadsheetId;
        }
        return this._spreadsheetId;
    }
    set spreadsheetId(spreadsheetId: string) {
        localStorage.setItem(SheetsProvider.SPREADSHEET_ID_KEY, spreadsheetId);
    }

    isSetup = () => Boolean(localStorage.getItem(SheetsProvider.SPREADSHEET_ID_KEY));

    isAuthenticated = async () => {
        await this.initialize();
        return this.api.auth2.getAuthInstance().isSignedIn.get();
    }

    isConnected = async () => {
        await this.initialize();
        return Boolean(localStorage.getItem(SheetsProvider.SPREADSHEET_ID_KEY));
    }

    login = log('provider:login', async () => {
        await this.api.auth2.getAuthInstance().signIn()
        return this.isAuthenticated();
    });

    logout = log('provider:logout', async () => {
        await this.api.auth2.getAuthInstance().signOut();
        return this.isAuthenticated();
    });

    disconnect = log('provider:disconnect', async () => {
        localStorage.removeItem(SheetsProvider.SPREADSHEET_ID_KEY);
        this._schema = undefined;
        this._spreadsheetId = undefined;
    });

    connect = log('provider:connect', async (schema: Schema) => {
        await this.initialize();
        this.schema = schema;
    });

    setup = log('provider:setup', async (options: RecordsSetupOptions<{ spreadsheetId: string }>) => {
        await this.initialize();
        this.schema = options.schema;
        if (options.provider) {
            await this.api.client.sheets.spreadsheets.get({
                spreadsheetId: options.provider.spreadsheetId
            });
            this.spreadsheetId = options.provider.spreadsheetId;
        } else {
            const schema: Schema = {
                ...options.schema,
                query: {
                    columns: [''],
                }
            };
            const { body } = await log('gapi:create', this.api.client.sheets.spreadsheets.create)({
                properties: {
                    title: `record sage - ${new Date().toLocaleString()}`
                },
                sheets: Object.entries(schema).map(([table, { columns, rows }]) => ({
                    properties: {
                        title: table,
                        gridProperties: {
                            rowCount: (rows?.length ?? 0) + SheetsProvider.METADATA_OFFSET,
                            columnCount: columns.length,
                        },
                    },
                    data: [
                        {
                            startRow: 0,
                            startColumn: 0,
                            rowData: [
                                {
                                    values: columns.map(header => ({
                                        userEnteredValue: {
                                            stringValue: String(header)
                                        }
                                    }))
                                }
                            ].concat(rows?.map(row => ({
                                values: row.map(value => ({
                                    userEnteredValue: {
                                        stringValue: String(value)
                                    }
                                }))
                            })) ?? []),
                        },
                    ],
                })),
            });
            const { spreadsheetId } = JSON.parse(body);
            this.spreadsheetId = spreadsheetId;
        }
    });

    insert = log('provider:insert', async (table: string, row: Array<string>) => {
        const start = this.getA1Notation(1, 0);
        const end = this.getA1Notation(1, row.length - 1);
        await this.api.client.sheets.spreadsheets.values.append({
            spreadsheetId: this.spreadsheetId,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            range: SheetsProvider.range(table, start, end),
            values: [row],
        });
    });

    update = log('provider:update', async (table: string, row: Array<string>) => {
        const [id] = row;
        const rowIndex = await this.getIndexById(table, id);
        if (rowIndex === -1) {
            return;
        }
        const start = this.getA1Notation(rowIndex, 0);
        const end = this.getA1Notation(rowIndex + 1, row.length - 1);
        await this.api.client.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            valueInputOption: 'USER_ENTERED',
            range: SheetsProvider.range(table, start, end),
            values: [row],
        });
    });

    private getRowCount = async (table: string) => {
        const { body } = await this.api.client.sheets.spreadsheets.get({

            spreadsheetId: this.spreadsheetId,
        });
        const { sheets } = JSON.parse(body);
        const { properties } = sheets.find((sheet: any) => sheet.properties.title === table);
        return properties.gridProperties.rowCount - SheetsProvider.METADATA_OFFSET;
    }

    private getSheetId = async (table: string): Promise<string> => {
        const { body } = await this.api.client.sheets.spreadsheets.get({

            spreadsheetId: this.spreadsheetId,
        });
        const { sheets } = JSON.parse(body);
        const { properties } = sheets.find((sheet: any) => sheet.properties.title === table);
        return properties.sheetId;
    }

    private getIndexById = async (table: string, id: string): Promise<number> => {
        const rowCount = await this.getRowCount(table);
        const start = this.getA1Notation(0, 0);
        const end = this.getA1Notation(0, 0);
        const queryStart = this.getA1Notation(1, 0);
        const queryEnd = this.getA1Notation(1 + rowCount, 0);
        const { body } = await this.api.client.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            valueInputOption: 'USER_ENTERED',
            range: SheetsProvider.range('query', start, end),
            values: [[`=MATCH("${id}", '${table}'!${queryStart}:${queryEnd}, 0)`]],
            includeValuesInResponse: true,
        });
        const { updatedData } = JSON.parse(body);
        const index = Number(updatedData.values[0][0]);
        return isNaN(index) ? -1 : index;
    }

    get = log('provider:get', async (table: string, options: GetOptions): Promise<Paginated<string[][]>> => {
        const rowCount = await this.getRowCount(table);
        if (rowCount > 0) {
            const { columns } = this.schema[table];
            const offset = options ? options.offset : 0;
            const endRowIndex = rowCount + SheetsProvider.METADATA_OFFSET - offset;
            const limit = options ? options.limit : endRowIndex - 1;
            // A1 Grid notation limits are included
            // A1:Z1 will fetch 1 row
            // A1:Z2 will fetch 2 rows
            const end = this.getA1Notation(endRowIndex - 1, columns.length - 1);
            const start = this.getA1Notation(Math.max(endRowIndex - limit, SheetsProvider.METADATA_OFFSET), 0);

            const { body } = await this.api.client.sheets.spreadsheets.values.get({

                spreadsheetId: this.spreadsheetId,
                range: SheetsProvider.range(table, start, end),
            });
            const { values } = JSON.parse(body);
            return {
                rows: values.reverse(),
                total: rowCount,
                limit,
                offset,
            };
        } else {
            return {
                rows: [],
                total: 0,
                limit: 0,
                offset: 0,
            }
        }
    });

    find = log('provider:find', async (table: string, id: string) => {
        const rowIndex = await this.getIndexById(table, id);
        if (rowIndex === -1) {
            return [];
        }
        const { columns } = this.schema[table];
        const start = this.getA1Notation(rowIndex, 0);
        const end = this.getA1Notation(rowIndex, columns.length - 1);

        const { body } = await this.api.client.sheets.spreadsheets.values.get({

            spreadsheetId: this.spreadsheetId,
            range: SheetsProvider.range(table, start, end),
        });
        const { values } = JSON.parse(body);
        return values[0];
    });

    delete = log('provider:delete', async (table: string, id: string) => {
        const rowIndex = await this.getIndexById(table, id);
        if (rowIndex === -1) {
            return;
        }
        await this.api.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            requests: [
                {
                    deleteDimension: {
                        range: {
                            sheetId: await this.getSheetId(table),
                            dimension: 'ROWS',
                            startIndex: rowIndex,
                            endIndex: rowIndex + 1,
                        }
                    }
                }
            ]
        });
    });

    generateCloneUrl = () => `${window.origin}/task-courier?spreadsheetId=${this.spreadsheetId}`;

    private static range = (table: string, start: string, end: string) => `'${table}'!${start}:${end}`;
}
