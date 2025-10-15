const priorities = {
    "(" : 1,
    "*" : 2,
    "/" : 2,
    "+" : 3,
    "-" : 3,
    "NOT" : 4,
    "AND" : 5,
    "OR" : 6,
    "XOR" : 7
}

export class Expression{
    #expression
    #operandStack
    #resultStack

    constructor(expression, programCounter){
        this.#expression = expression
        this.#operandStack = new Array()
        this.#resultStack = new Array()
        this.prepare(programCounter)  
    }



    prepare(programCounter){
        // try {
        //     return eval(this.#expression)
        // } catch (error) {
            this.#expression = this.#expression.replace(/\$/g, programCounter);
            this.#replaceAllSystems()

            let number = ""
            let oper = ""

            for (const element of this.#expression) {
                if(!element.trim().length) continue
                
                if(this.#isNumber(element)){
                    number += parseInt(element)
                    continue
                }

                if(["Q", "O", "H", "B", "D"].includes(element.toUpperCase() && oper.length == 0)){
                    
                    number = formatNumber(`${number}${element}`)                  
                    continue
                }

                oper += element

                if(this.#isOperand(element)){
                    if(number != ""){
                        this.#resultStack.push(number)
                        number = ""
                    }
                    this.#checkStack(element)
                    oper = ""
                    continue
                }

                if(oper.toUpperCase() in priorities){
                    if(number != ""){
                        this.#resultStack.push(number)
                        number = ""
                    }

                    this.#checkStack(oper.toUpperCase())
                    oper = ""
                }



            }

            if(number != ""){
                this.#resultStack.push(number)
            }
            
            this.#emptyStack()
            
    }

    
    #isOperand(element){
        const pattern = /(\+|\-|\*|\/|(NOT)|(AND)|(OR)|(XOR)|\(|\))/i
        return pattern.test(element)
    }

    #isNumber(element){    
        return !isNaN(parseInt(element))
    }

    #checkStack(operand){
        if(operand == ")"){
            let stackOperand = this.#operandStack.pop()

            while(stackOperand != "("){
                this.#resultStack.push(stackOperand)
                
                stackOperand = this.#operandStack.pop()
            }
            return
        }
        
        
        while(priorities[this.#operandStack.at(-1)] <= priorities[operand] && this.#operandStack.at(-1) != "("){
            this.#resultStack.push(this.#operandStack.pop())
        }
        
        this.#operandStack.push(operand)
    }

    #emptyStack(){
        while(this.#operandStack.length != 0){
            this.#resultStack.push(this.#operandStack.pop())
        }
    }

    evaluate(max = 65535){
        for (let i = 0; i < this.#resultStack.length; i++) {
            const element = this.#resultStack[i];
            console.log(this.#resultStack);
            
            if(this.#isOperand(element)){
                if(element.length == 1){
                    // console.log( `${this.#resultStack.splice(i - 2, 1)[0]} ${this.#resultStack.splice(i - 1, 1)[0]} ${this.#resultStack[i-2]}`);

                    this.#resultStack[i-2] = eval(`${this.#resultStack.splice(i - 2, 1)[0]} ${this.#resultStack.splice(i - 1, 1)[0]} ${this.#resultStack[i-2]}`);

                    
                    i -= 2
                }else{
                    if(element == "NOT"){
                        this.#resultStack[i-1] = eval(`${this.#convertLogicalOperand(this.#resultStack[i])}${this.#resultStack.splice(i - 1, 1)[0]}`)
                        i -= 1
                        
                    }else{
                        this.#resultStack[i-2] = eval(`${this.#resultStack.splice(i - 1, 1)[0]} ${this.#convertLogicalOperand(this.#resultStack.splice(i - 1, 1)[0])} ${this.#resultStack[i-2]}`)
                        i -= 2
                    }

                }
            }

            if(this.#resultStack[0] < 0){
                this.#resultStack[0] += max
            }
        }

        if(this.#resultStack.length != 1 || (this.#resultStack[0] > max)){
            // throw new EvalError("asdas")
            return null
        }
        return this.#resultStack[0]
    }

    #convertLogicalOperand(operand){
        switch (operand) {
            case "AND":
                return "&";
            case "OR":
                return "|";
            case "XOR":
                return "^";
            case "NOT":
                return "~";
            default:
                break;
        }
    }


    #replaceAllSystems(){
        for(const value of new Set(this.#expression.match(/\d+(h|q|o|d|b)/gi))){
            this.#expression = this.#expression.replaceAll(value, toDecimal(value))
        }
    }
}

function toDecimal(number){ 
    let system = number.toString().at(-1).toUpperCase()

    if(system == "H"){
        return parseInt(number.slice(0, -1), 16)
    }

    if(system == "B"){
        return parseInt(number.slice(0, -1), 2)
    }

    if(system == "Q" || system == "O"){
        return parseInt(number.slice(0, -1), 8)
    }

    if(system == "D"){
        return parseInt(number.slice(0, -1))
    }else{
        return parseInt(number)
    }
}