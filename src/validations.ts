export class ValidateQuery
{
    validateTableSelected(table:string){
        if(!table) throw("No Table Selected")
        return true;
    }
    validateWhereColumnIsInSelect(column:string, select:Array<string>|string):true
    {
        if(select == '') return true
        // check if the column is in the select
        if( typeof select == 'object' && !select.join(', ').includes(column) ) {
            throw("column is not in the select statement")
        }else if( typeof select == 'string' && !select.includes(column)) {
            throw("column is not in the select statement")
        }
        return true
    }
}