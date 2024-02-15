import { Operator } from "./types";

/** All of the available clause operators. */
export const operator: string[] = [
    '=', '<', '>', '<=', '>=', '<>', '!=', '<=>',
    'like', 'like binary', 'not like', 'ilike',
    '&', '|', '^', '<<', '>>', '&~', 'is', 'is not',
    'rlike', 'not rlike', 'regexp', 'not regexp',
    '~', '~*', '!~', '!~*', 'similar to', 'in',
    'not in', 'not similar to', 'not ilike', '~~*',
    '!~~*'
] as const

/** All of the available bitwise operator */
export const bitwiseOperator : string[] = [ 
    '&', '|', '^', '<<', '>>', '&~'
 ] as const

export class ValidateQuery
{
    validateTableSelected(table:string){
        if(!table) throw("No Table Selected")
        return true;
    }

    validateWhereColumnIsInSelect(column:string, select:Array<string>|string):true
    {
        // check if the column is in the select
        if( typeof select == 'object' && ( !select.join(', ').includes(column) && !select.join(', ').includes('*') ) ) {
            throw("column is not in the select statement")
        }else if( typeof select == 'string' && !select.includes(column)) {
            throw("column is not in the select statement")
        }
        return true
    }

    validateOperatorExists(operator:Operator){
        const allOperators: Operator[] = [...operator, ...bitwiseOperator]
        if(allOperators.includes(operator) || allOperators.includes(operator.toLowerCase())) return true
        throw("Operator does not exist")
    }
}