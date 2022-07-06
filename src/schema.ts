import { Schema } from "./records";

export const schema: Schema = {
    'todo': {
        columns: ['id', 'date', 'title', 'details', 'complete'],
        cache: true,
    },
};
