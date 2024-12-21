import { Utils } from "../utils.js"

export class ProgramCounter{
    //counter = 2048
    #offset = 0
    #origin = 0

    constructor(counter = 0){
        this.counter = counter
    }

    setOrigin(value){
        this.#origin = value 
        this.counter = value
    }
    
    getOrigin(){
        return this.#origin
    }
    
    get(){
        return this.counter
    }

    add(value){
        this.counter += value
        return this
    }

    set(counter){
        this.counter = Utils.HexToDecimal(counter)
        return this
    }

    toHex(){
        return Utils.DecimalToHex16Bit(this.counter)
    }

    toHexOffset(){
        return Utils.DecimalToHex16Bit(this.#offset)
    }

    offset(value){
        this.#offset = this.counter + value
        return this
    }

    getOffset(){
        return this.#offset
    }

}