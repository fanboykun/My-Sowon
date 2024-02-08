export const QueryHelper = {
    toString(value:unknown) {
        return value ? `'${value}'` : '';
    }
}