import { Utils } from "../utils.js"

export class Memory{
    #memory = new Object()

    writeByte(programCounter, byte){
        this.#memory[Utils.DecimalToHex16Bit(programCounter)] = Utils.formatBytesToMemory(byte)
    }

    writeInstruction(programCounter, instruction){
        this.#memory[Utils.DecimalToHex16Bit(programCounter)] = Utils.formatInstructionToMemory(instruction)
    }

    writeLabel(programCounter, label){
        this.#memory[Utils.DecimalToHex16Bit(programCounter)] = [label]
    }

    read(address){
        return this.#existInMemory(address)
    }

    #existInMemory(address){
        return address in this.#memory ? this.#memory[address][1] : "00"
    }

    return(){
        return this.#memory
    }
}