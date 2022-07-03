export const online: {
    <Return extends void, Args extends any[]>(fn: (...args: Args) => Promise<Return> | Return): (...args: Args) => Promise<Return> | Return
    <Return, Args extends any[]>(fn: (...args: Args) => Promise<Return> | Return, fallback: Return): (...args: Args) => Promise<Return> | Return,
} = <Return, Args extends any[]>(fn: (...args: Args) => Promise<Return> | Return, fallback?: Return): (...args: Args) => Promise<Return> | Return => {
    return navigator.onLine ? fn : (() => fallback!);
}
