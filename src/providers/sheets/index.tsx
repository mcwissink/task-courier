import { SheetsProvider } from './provider';
import { Provider } from '../../records';
import { Login } from './Login';
import { Setup } from './Setup';

export const Sheets: Provider = {
    RecordsProvider: new SheetsProvider(),
    Login,
    Setup,
}
