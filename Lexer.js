import { Expression } from "./Expression.js"
import { HexCode } from "./HexCode.js"
import { Labels } from "./Lexer/Labels.js"
import { Memory } from "./Processor/Memory.js"
import { ProgramCounter } from "./Processor/ProgramCounter.js"
import { Utils } from "./utils.js"
const noneArgument = ["RLC", "RAL", "RRC", "RAR", "DAA", "STC", "HLT", "CMA", "CMC", "RET", "RNZ", "RNC", "RPO","RP", "RZ", "RC", "RPE", "RM", "XTHL", "XCHG", "DI", "EI"]

const calls = ["CNZ", "CNC", "CPO","CP", "CZ", "CC", "CPE", "CM", "CALL"]
const jumps = ["JNZ", "JNC", "JPO","JP", "JZ", "JC", "JPE", "JM", "JMP"]

const ArgumentType = {
    NUMBER : 1,
    STRING : 2,
    EXPRESSION : 3
}


export class Lexer{
    ProgramCounter = new ProgramCounter(-1)
    labelsAddress = new Labels()
    labelsEQU = new Labels()

    Labels = {}
    LabelsToFill = new Array()
    current = ""
    linePcAssociation = {}
    
    constructor(memory){
        this.Memory = memory
    }

    parse(program){
        //program = fs.readFileSync(path.join(__dirname, "program.asm"), {encoding: 'utf-8'})
        let programFormatted = program.split("\n")
        if(program.length == 0){
            return false
        }
        programFormatted.forEach((string, index) => programFormatted[index] = string.trim())
        //programFormatted = programFormatted.filter(n => n));
        
        return this.#addToMemory(programFormatted)
    }

    getAssociation(){
        return this.linePcAssociation
    }

    #addToMemory(programFormatted){
        let line = 1
        for (let index = 0; index < programFormatted.length; index++) {
            let word = programFormatted[index]
            
            if(word == ""){
                line++
                continue
            }
            
            
            this.current = ""
            for (let j = 0; j < word.length; j++) {
                let letter = word[j]
                

                if((this.current.toUpperCase() in Lexer.prototype || (calls.includes(this.current.toUpperCase()) || jumps.includes(this.current.toUpperCase()))) && letter == ' '){
                    this.linePcAssociation[this.ProgramCounter.get()+1] = line
                    
                    if((calls.includes(this.current.toUpperCase()) || jumps.includes(this.current.toUpperCase()))){
                        if(!this.CALL(word.slice(this.current.length).trim())){
                            return {
                                status: false,
                                error: {
                                    line : index + 1,
                                    instruction: this.current
                                }
                            }
                        }
                    }else{
                        if(!this[this.current.toUpperCase()]?.(word.slice(this.current.length).trim())){
                            return {
                                status: false,
                                error: {
                                    line : index + 1,
                                    instruction: this.current
                                }
                            }
                        }
                    }
                    
                    this.current = ""
                    line++
                    break
                }
                
                
                if(`${this.current}${letter}`.toUpperCase() in Lexer.prototype && (word.trim().length ==`${this.current}${letter}`.length )){
                    this.current = `${this.current}${letter}`.toUpperCase()
                        
                    this.linePcAssociation[this.ProgramCounter.get()+1] = line
                    if(!this[this.current]()){
                        return {
                            status: false,
                            error: {
                                line : index + 1,
                                instruction: this.current
                            }
                        }
                    }
                    
                    this.current = ""
                    line++
                    break
                }

                if(noneArgument.includes(`${this.current}${letter}`.toUpperCase()) && (word.trim().length ==`${this.current}${letter}`.length )){
                    this.current = `${this.current}${letter}`.toUpperCase()
                    this.linePcAssociation[this.ProgramCounter.get()+1] = line
                    
                    if(!this.noneArgumentTemplate()){
                        return {
                            status: false,
                            error: {
                                line : index + 1,
                                instruction: this.current
                            }
                        }
                    }
                    this.current = ""
                    line++
                    break
                }

                
                //console.log(word.length, this.current.length);
                //console.log( this.current);
                this.current += letter
                
                
                if((letter == ":" || (letter == " ") || word.length == this.current.length) && (/^\w+\s{0,1}:{0,1}$/i).test(this.current)&& !(this.current.toUpperCase() in Lexer.prototype || this.current.toLowerCase() in Lexer.prototype)){
                    let rest = word.slice(this.current.length + 1).trim()

                    if((/\s+equ\s+/i).test(word)){
                        this.labelsEQU.add(this.current, this.ProgramCounter.offset(1).toHexOffset())
                        this.equ(word)
                        this.current = ""  

                        line++
                        
                        word = rest
                        continue
                    }else{
                        //this.Labels[this.current] = this.ProgramCounter.offset(1).toHexOffset()
                        let label = this.current.trim().at(-1) == ":" ? this.current.slice(0, -1) : this.current
                        
                        this.labelsAddress.add(label, this.ProgramCounter.offset(1).toHexOffset())
                    }
                    
                    this.current = ""  
                    if(rest.length == 0){
                        line++
                        break
                    }

                    word = rest
                    j = -1
                    
                    continue
                }

                            
                
                if(Object.keys(this.Memory.return()).length == 0 && this.current.toUpperCase() === "ORG"){
                    if(!this.ORG(word.slice(this.current.length).trim())){
                        return {
                            status: false,
                            error: {
                                line : index + 1,
                                instruction: this.current
                            }
                        }
                    }
                    line++
                    break
                }

                if(this.current.length == word.length && word != ""){
                    console.log( this.current);

                    return {
                        status: false,
                        error: {
                            line : index + 1,
                            instruction: null
                        }
                    }
                }

            }
        }


        
        this.fillLabelsAdresess()
        new HexCode(this.Memory, this.linePcAssociation).insertHexCode()

        console.log(this.Memory.return());
        
        return {
            status: true,
            Memory: this.Memory,
            Labels: this.Labels
        }
    }


    fillLabelsAdresess(){
        for(const element of this.LabelsToFill){
            if(this.labelsAddress.get(element[1])){
                this.Memory.writeByte(element[0], this.labelsAddress.get(element[1]).slice(2))
                this.Memory.writeByte(element[0] + 1, this.labelsAddress.get(element[1]).slice(0, 2))
                continue
            }
            
            if(this.labelsEQU.get(element[1])){
                this.Memory.writeByte(element[0], (this.labelsEQU.get(element[1])))
                continue
            }

            throw new Error()
        }
    }

    fillLabelsAdresess2(){
        for(const label of this.LabelsToFill){
            
            if(!(label[1] in this.Labels)){
                throw new Error("Label does not exists");
            }
            
            let pc = label[0]
            let bytes = Utils.DecimalToHex16Bit(this.Labels[label[1]])
            

            this.Memory.writeByte(pc, bytes.slice(2))
            this.Memory.writeByte(pc + 1, bytes.slice(0, 2))
        }
    }

    getOrigin(){
        return this.ProgramCounter.getOrigin()
    }

    noneArgumentTemplate(){
        this.ProgramCounter.add(1)
        this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)
        return true
    }

    #argumentRegister(register, regex){
        if(regex.test(register)){
            return true
        }
        return false
    }

    #argument8bit(argument){
        let comment = /;(?=(?:[^']*'[^']*')*[^']*$).*/g
        const match = argument.match(comment)

        if(match){
            argument = argument.replace(match, "").trim()
        }

        // let pattern = /^\-{0,1}((0{0,2}[0-9A-F]{1,2}H)|(((0?[0-2]?[0-5]{1,2}D?)|(0?[0-9]{1,2})))|([01]{1,8}B)|(([0-3]?[0-7]{1,2})(Q|O)))$/i
        let pattern = /^((0{0,2}[0-9A-F]{1,2}H)|(((0?[0-2]?[0-5]{1,2}D?)|(0?[0-9]{1,2})))|([01]{1,8}B)|(([0-3]?[0-7]{1,2})(Q|O)))$/i
        //Number
        if(pattern.test(argument)){
            return Utils.formatNumberToHex8Bit(argument)
        }

        //String
        pattern = /^'.'$/
        if(pattern.test(argument)){
            return Utils.formatNumberToHex8Bit(Number(argument.charCodeAt(1)))
        }

        //Expression
        pattern = /(\+|\-|\*|\/|(NOT)|(AND)|(OR)|(XOR)|\(|\))/i
        if(pattern.test(argument)){
            const value = new Expression(argument, this.ProgramCounter.offset(1).getOffset()).evaluate(255)
            if(value !== null){
                return Utils.formatNumberToHex8Bit(value)
            }
            return null
        }

        return null
    }

    #argument16bit(argument){
        
    }

    #labelAssign(label){
        if(this.labelsAddress.get(label)){
            return this.labelsAddress.get(label)
        }

        if(this.labelsEQU.get(label)){
            return this.labelsEQU.get(label)
        }
        
        this.LabelsToFill.push([this.ProgramCounter.offset(2).getOffset(), label])
        return false
    }


    ORG(arg){
        let pattern = /(([0-9A-F]{1,4}H)|((((([0-5]?\d{1,4})|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])D?)|(0?[0-9]{1,2})))|([01]{1,16}B)|(([0-3]?[0-7]{1,2})(Q|O)))/i
        arg = arg.trim() 

        console.log(pattern.test(arg));
        
        if(pattern.test(arg)){
            this.ProgramCounter.setOrigin(Utils.HexToDecimal(Utils.formatNumberToHex16Bit(arg).join("")) - 1) 

            this.getOrigin = () => this.ProgramCounter.getOrigin() + 1
            return true
        }

        return false
    }

    equ(arg){
        console.log(arg);
        
        let label = arg.split(/\s+equ\s+/i)[0]
        label = label[label.length - 1] == ":" ? label.slice(0,-1) : label
        const argument = this.#argument8bit(arg.split(/\s+equ\s+/i)[1].trim())

        if(argument){
            this.labelsEQU.add(label, argument)
            console.log(label);
            
            return true
        }

        return false
    }
    
    MOV(args){
        const pattern = /^([A-E]|[HL]|[M])(\s|\t)*,(\s|\t)*([A-E]|[HL]|[M])$/i
        if(pattern.test(args)){
            args = args.split(",")
            args.forEach((value, index) => args[index] = value.trim())
            if(args[0] == "M" && args[1] == "M"){
                //process.exit()
            }

            this.current += ` ${args.join(",")}`
            this.ProgramCounter.add(1)
            this.current = this.current.toUpperCase()
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)
            return true
        }
        return false
    }

    MVI(args){
        const instructionArguments = args.split(",")
        const register = instructionArguments[0].trim()
        
        if(this.#argumentRegister(register, /^([A-E]|[HL]|M)$/i)){
            const argument = this.#argument8bit(instructionArguments[1].trim())

            if(argument !== null){
                this.current += ` ${args[0]}`
                this.Memory.writeInstruction(this.ProgramCounter.add(1).get(), this.current)
                this.Memory.writeByte(this.ProgramCounter.add(1).get(), argument)
                return true
            }

            
            const labelArgument = this.#labelAssign(instructionArguments[1].trim())
            if(labelArgument == null) return false

            if(labelArgument !== false){
                this.current += ` ${args[0]}`
                this.Memory.writeInstruction(this.ProgramCounter.add(1).get(), this.current)
                this.Memory.writeByte(this.ProgramCounter.add(1).get(), labelArgument)
                return true
            }else{
                this.current += ` ${args[0]}`
                this.Memory.writeInstruction(this.ProgramCounter.add(1).get(), this.current)
                return true
            }
        }
        return false
    }


    RST(arg){
        let pattern = /^[0-7]{1}$/
        
        if(pattern.test(arg)){
            this.ProgramCounter.add(1)
            this.current += ` ${arg}`
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)
            
            return true
        }
        return false
    }


    LXI(args){
        //let pattern = /^([BDH]|SP)(\s|\t)*,(\s|\t)*((0{,2}[0-9A-F]{1,2}H)|(((0?[0-2]?[0-5]{1,2}D?)|(0?[0-9]{1,2})))|([01]{1,8}B)|(([0-3]?[0-7]{1,2})(Q|O)))$/i
        let pattern = /^([BDH])(\s|\t)*,(\s|\t)*(([0-9A-F]{1,4}H)|((((([0-5]?\d{1,4})|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])D?)|(0?[0-9]{1,2})))|([01]{1,16}B)|(([0-3]?[0-7]{1,2})(Q|O)))$/i
        if(pattern.test(args)){
            args = args.split(",")
            args.forEach((value, index) => args[index] = value.trim().toUpperCase())
            const bytes = Utils.formatNumberToHex16Bit(args[1])
            
            this.ProgramCounter.add(1)
            this.current += ` ${args[0]}`
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)
            
            this.ProgramCounter.add(1)
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatBytesToMemory(bytes[1])
            this.Memory.writeByte(this.ProgramCounter.get(), bytes[1])

            this.ProgramCounter.add(1)
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatBytesToMemory(bytes[0])
            this.Memory.writeByte(this.ProgramCounter.get(), bytes[0])

            return true
        }   

        pattern = /^([BDH])(\s|\t)*,(\s|\t)*.*$/i
        if(pattern.test(args)){
            args = args.split(",")
            args.forEach((value, index) => args[index] = value.trim())
            args[0] = args[0].toUpperCase()

            this.ProgramCounter.add(1)
            this.current += ` ${args[0]}`
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)

            if(!(args[1] in this.Labels)){
                this.LabelsToFill.push([this.ProgramCounter.get()+1, args[1]])
                this.ProgramCounter.add(2)
                return true
            }else{
                const bytes = this.Labels[args[1]]
                
                this.ProgramCounter.add(1)
                //this.Memory[this.ProgramCounter.toHex()] = Utils.formatBytesToMemory(bytes.slice(2, 4))
                this.Memory.writeByte(this.ProgramCounter.get(), bytes.slice(2, 4))

                this.ProgramCounter.add(1)
                //this.Memory[this.ProgramCounter.toHex()] = Utils.formatBytesToMemory(bytes.slice(0,2))
                this.Memory.writeByte(this.ProgramCounter.get(), bytes.slice(0,2))

                return true
            }
        }
        return false
    }

    STAX(arg){
        const pattern = /^([BD])$/
        arg = arg.trim().toUpperCase()
    
        if(pattern.test(arg)){
            this.ProgramCounter.add(1)
            this.current += ` ${arg}`
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)

            return true
        }
        return false
    }

    SHLD(arg){
        let pattern = /^(([0-9A-F]{1,4}H)|((((([0-5]?\d{1,4})|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])D?)|(0?[0-9]{1,2})))|([01]{1,16}B)|(([0-3]?[0-7]{1,2})(Q|O)))$/i
        arg = arg.trim()
    
        if(pattern.test(arg)){
            const bytes = Utils.formatNumberToHex16Bit(arg)
    
            this.ProgramCounter.add(1)
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)

            this.ProgramCounter.add(1)
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatBytesToMemory(bytes[1])
            this.Memory.writeByte(this.ProgramCounter.get(), bytes[1])

            this.ProgramCounter.add(1)
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatBytesToMemory(bytes[0])
            this.Memory.writeByte(this.ProgramCounter.get(), bytes[0])

            return true
        }
        return false
    }

    STA(arg){
        let pattern = /^(([0-9A-F]{1,4}H)|((((([0-5]?\d{1,4})|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])D?)|(0?[0-9]{1,2})))|([01]{1,16}B)|(([0-3]?[0-7]{1,2})(Q|O)))$/i
        arg = arg.trim()
    
        if(pattern.test(arg)){
            const bytes = Utils.formatNumberToHex16Bit(arg)
    
            this.ProgramCounter.add(1)
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)

            this.ProgramCounter.add(1)
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatBytesToMemory(bytes[1])
            this.Memory.writeByte(this.ProgramCounter.get(), bytes[1])

            this.ProgramCounter.add(1)
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatBytesToMemory(bytes[0])
            this.Memory.writeByte(this.ProgramCounter.get(), bytes[0])

            return true
        }
        return false
    }


    INX(arg){
        let pattern = /^([BDH]|SP)$/i
        arg = arg.trim()
    
        if(pattern.test(arg)){
            this.ProgramCounter.add(1)
            this.current += ` ${arg}`
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)

            return true
        }
        return false
    }


    INR(arg){
        let pattern = /^([A-E]|[HL]|M)$/i
        arg = arg.trim()
    
        if(pattern.test(arg)){
            this.ProgramCounter.add(1)
            this.current += ` ${arg}`
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)

            return true
        }
        return false
    }


    DCX(arg){
        let pattern = /^([BDH]|SP)$/i
        arg = arg.trim()
    
        if(pattern.test(arg)){
            this.ProgramCounter.add(1)
            this.current += ` ${arg}`
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)

            return true
        }
        return false
    }


    DCR(arg){
        
        let pattern = /^[A-E]|[HL]|M$/i
        arg = arg.trim()

        if(pattern.test(arg)){
            this.ProgramCounter.add(1)
            this.current += ` ${arg}`
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)
            
            return true
        }
        return false
    }


    // RLC(){
    //     this.ProgramCounter.add(1)
    //     this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)  
    // }


    // RAL(){
    //     this.ProgramCounter.add(1)
    //     this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)  
    // }

    // RRC(){
    //     this.ProgramCounter.add(1)
    //     this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)  
    // }


    // RAR(){
    //     this.ProgramCounter.add(1)
    //     this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)  
    // }

    // DAA(){
    //     this.ProgramCounter.add(1)
    //     this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current) 
    // }

    // STC(){
    //     this.ProgramCounter.add(1)
    //     this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)
    // }

    // HLT(){
    //     this.ProgramCounter.add(1)
    //     this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)
    // }

    DAD(arg){
        const pattern = /^(B|D|H|SP)$/i
        arg = arg.trim()
    
        if(pattern.test(arg)){
            this.ProgramCounter.add(1)
            this.current += ` ${arg}`
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current) 
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)

            return true
        }
        return false
    }
    

    LDAX(arg){
        arg = arg.trim()
        const pattern = /^([BD])$/i
    
        if(pattern.test(arg)){
            this.ProgramCounter.add(1)
            this.current += ` ${arg}`
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current) 
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)

            return true
        }
        return false
    }


    LHLD(arg){
        let pattern = /^(([0-9A-F]{1,4}H)|((((([0-5]?\d{1,4})|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])D?)|(0?[0-9]{1,2})))|([01]{1,16}B)|(([0-3]?[0-7]{1,2})(Q|O)))$/i
        arg = arg.trim()
    
        if(pattern.test(arg)){
            const bytes = Utils.formatNumberToHex16Bit(arg)
    
            this.ProgramCounter.add(1)
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)

            this.ProgramCounter.add(1)
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatBytesToMemory(bytes[1])
            this.Memory.writeByte(this.ProgramCounter.get(), bytes[1])

            this.ProgramCounter.add(1)
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatBytesToMemory(bytes[0])
            this.Memory.writeByte(this.ProgramCounter.get(), bytes[0])

            return true
        }
        return false
    }


    LDA(arg){
        const pattern = /^(([0-9A-F]{1,4}H)|((((([0-5]?\d{1,4})|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])D?)|(0?[0-9]{1,2})))|([01]{1,16}B)|(([0-3]?[0-7]{1,2})(Q|O)))$/i
        arg = arg.trim()
    
        if(pattern.test(arg)){
            const bytes = Utils.formatNumberToHex16Bit(arg)
            Registries.A = bytes.join("") in Memory ? Memory[bytes.join("")][1] : "00"
    
            this.ProgramCounter.add(1)
            //this.Memory[Utils.DecimalToHex16Bit(pc)] = Utils.formatInstructionToMemory(this.current)
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)

            this.ProgramCounter.add(1)
            //this.Memory[Utils.DecimalToHex16Bit(pc)] = Utils.formatBytesToMemory(bytes[1])
            this.Memory.writeByte(this.ProgramCounter.get(), bytes[1])

            this.ProgramCounter.add(1)
            //this.Memory[Utils.DecimalToHex16Bit(pc)] = Utils.formatBytesToMemory(bytes[0])
            this.Memory.writeByte(this.ProgramCounter.get(), bytes[0])

            return true
        }
        return false
    }



    ADD(arg){
        arg = arg.trim()
        const pattern = /^([A-E]|H|L|M)$/i
    
        if(pattern.test(arg)){
            this.ProgramCounter.add(1)
            this.current += ` ${arg}`
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)

            return true
        }
        return false
    }


    ADC(arg){
        arg = arg.trim()
        const pattern = /^([A-E]|H|L|M)$/i
    
        if(pattern.test(arg)){
            this.ProgramCounter.add(1)
            this.current += ` ${arg}`
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)

            return true
        }
        return false
    }


    SUB(arg){
        arg = arg.trim()
        const pattern = /^([A-E]|H|L|M)$/i
    
        if(pattern.test(arg)){
            this.ProgramCounter.add(1)
            this.current += ` ${arg}`
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)

            return true
        }
        return false
    }


    SBB(arg){
        arg = arg.trim()
        const pattern = /^([A-E]|H|L|M)$/i
    
        if(pattern.test(arg)){
            this.ProgramCounter.add(1)
            this.current += ` ${arg}`
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)

            return true
        }
        return false
    }

    ANA(arg){
        arg = arg.trim()
        const pattern = /^([A-E]|H|L|M)$/i

        if(pattern.test(arg)){
            this.ProgramCounter.add(1)
            this.current += ` ${arg}`
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)

            return true
        }
        return false
    }

    XRA(arg){
        arg = arg.trim()
        const pattern = /^([A-E]|H|L|M)$/i

        if(pattern.test(arg)){
            this.ProgramCounter.add(1)
            this.current += ` ${arg}`
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)

            return true
        }
        return false
    }

    ORA(arg){
        arg = arg.trim()
        const pattern = /^([A-E]|H|L|M)$/i

        if(pattern.test(arg)){
            this.ProgramCounter.add(1)
            this.current += ` ${arg}`
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)

            return true
        }
        return false
    }

    CMP(arg){
        arg = arg.trim()
        const pattern = /^([A-E]|H|L|M)$/i

        if(pattern.test(arg)){
            this.ProgramCounter.add(1)
            this.current += ` ${arg}`
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)

            return true
        }
        return false
    }

    // CMA(){
    //     this.ProgramCounter.add(1)
    //     this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)  
    // }

    // CMC(){
    //     this.ProgramCounter.add(1)
    //     this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)  
    // }

    CALL(arg){
        arg = arg.trim()
        let pattern = /^.*$/

        if(pattern.test(arg)){
            this.ProgramCounter.add(1)
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)

            
            if(!(arg in this.Labels)){
                this.LabelsToFill.push([this.ProgramCounter.get()+1, arg])
                this.ProgramCounter.add(2)
                return true
            }else{
                const bytes = this.Labels[arg]
                
                this.ProgramCounter.add(1)
                //this.Memory[this.ProgramCounter.toHex()] = Utils.formatBytesToMemory(bytes.slice(2, 4))
                this.Memory.writeByte(this.ProgramCounter.get(), bytes.slice(2, 4))

                this.ProgramCounter.add(1)
                //this.Memory[this.ProgramCounter.toHex()] = Utils.formatBytesToMemory(bytes.slice(0,2))
                this.Memory.writeByte(this.ProgramCounter.get(), bytes.slice(0,2))

            }
            
            

            return true
        }

        pattern = /^(([0-9A-F]{1,4}H)|((((([0-5]?\d{1,4})|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])D?)|(0?[0-9]{1,2})))|([01]{1,16}B)|(([0-3]?[0-7]{1,2})(Q|O)))$/i
        if(pattern.test(arg)){
            const bytes = Utils.formatNumberToHex16Bit(arg)

            this.ProgramCounter.add(1)
            //this.Memory[Utils.DecimalToHex16Bit(pc)] = Utils.formatInstructionToMemory(this.current)
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)

            this.ProgramCounter.add(1)
            //this.Memory[Utils.DecimalToHex16Bit(pc)] = Utils.formatBytesToMemory(bytes[1])
            this.Memory.writeByte(this.ProgramCounter.get(), bytes[1])

            this.ProgramCounter.add(1)
            //this.Memory[Utils.DecimalToHex16Bit(pc)] = Utils.formatBytesToMemory(bytes[0])
            this.Memory.writeByte(this.ProgramCounter.get(), bytes[0])

            return true
        }
        return false
    }
    
    // RET(){
    //     this.ProgramCounter.add(1)
    //     this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)  
    // }

    // RNZ(){
    //     this.ProgramCounter.add(1)
    //     this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)  
    // }


    POP(arg){
        arg = arg.trim()
        const pattern = /^([BDH]|PSW)$/i

        if(pattern.test(arg)){
            this.ProgramCounter.add(1)
            this.current += ` ${arg}`
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)  
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)

        }
    }

    PUSH(arg){
        arg = arg.trim()
        const pattern = /^([BDH]|PSW)$/i

        if(pattern.test(arg)){
            this.ProgramCounter.add(1)
            this.current += ` ${arg}`
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)  
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)

        }
    }


    addTwoBytesToMemory(arg){
        let pattern = /^((0{0,2}[0-9A-F]{1,2}H)|(((0?[0-2]?[0-5]{1,2}D?)|(0?[0-9]{1,2})))|([01]{1,8}B)|(([0-3]?[0-7]{1,2})(Q|O)))$/i
        
        if(pattern.test(arg)){
            this.ProgramCounter.add(1)
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)

            this.ProgramCounter.add(1)
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatBytesToMemory(Utils.formatNumberToHex8Bit(arg))
            this.Memory.writeByte(this.ProgramCounter.get(), Utils.formatNumberToHex8Bit(arg))
            return true
            
        }
        return false
    }


    ADI(arg){
        return this.addTwoBytesToMemory(arg)
    }

    ACI(arg){
        return this.addTwoBytesToMemory(arg)
    }

    SUI(arg){
        return this.addTwoBytesToMemory(arg)
    }

    SBI(arg){
        return this.addTwoBytesToMemory(arg)
    }

    ANI(arg){
        return this.addTwoBytesToMemory(arg)
    }

    XRI(arg){
        return this.addTwoBytesToMemory(arg)
    }

    ORI(arg){
        return this.addTwoBytesToMemory(arg)
    }

    CPI(arg){
        return this.addTwoBytesToMemory(arg)
    }

    OUT(arg){
        let pattern = /^((0{0,2}[0-9A-F]{1,2}H)|(((0?[0-2]?[0-5]{1,2}D?)|(0?[0-9]{1,2})))|([01]{1,8}B)|(([0-3]?[0-7]{1,2})(Q|O)))$/i
        if(pattern){
            this.ProgramCounter.add(1)
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatInstructionToMemory(this.current)
            this.Memory.writeInstruction(this.ProgramCounter.get(), this.current)

            this.ProgramCounter.add(1)
            //this.Memory[this.ProgramCounter.toHex()] = Utils.formatBytesToMemory(Utils.formatNumberToHex8Bit(arg))
            this.Memory.writeByte(this.ProgramCounter.get(), arg)

            return true
        }
        return false
    }

    DB(arg){
        arg = arg.trim().split(/,(?=(?:[^']*'[^']*')*[^']*$)/)
        let patternNum = /^((0{0,2}[0-9A-F]{1,2}H)|(((0?[0-2]?[0-5]{1,2}D?)|(0?[0-9]{1,2})))|([01]{1,8}B)|(([0-3]?[0-7]{1,2})(Q|O)))$/i
        let patterString = /^'.*'$/
        let patternAtSign = /^@*$/

        for(let i = 0; i < arg.length; i++) {
            const value = arg[i].trim()
            
            
            if(patternNum.test(value)){
                this.ProgramCounter.add(1)
                //this.Memory[this.ProgramCounter.toHex()] = Utils.formatBytesToMemory(Utils.formatNumberToHex8Bit(value))
                this.Memory.writeByte(this.ProgramCounter.get(), Utils.formatNumberToHex8Bit(value))
                
                continue
            }

            if(patterString.test(value)){
                for (let j = 1; j < value.length-1; j++) {
                    const letter = value[j];
                      
                    this.ProgramCounter.add(1)
                    //this.Memory[this.ProgramCounter.toHex()] = Utils.formatBytesToMemory(Utils.DecimalToHex8Bit(Number(letter.charCodeAt(0))))
                    this.Memory.writeByte(this.ProgramCounter.get(), Utils.formatNumberToHex8Bit(Number(letter.charCodeAt(0))))

                }
                continue
            }

            if(patternAtSign.test(value)){
                for (let j = 0; j <= value.length-1; j++) {
                    const letter = value[j];
                      
                    this.ProgramCounter.add(1)
                    //this.Memory[this.ProgramCounter.toHex()] = Utils.formatBytesToMemory(Utils.DecimalToHex8Bit(Number(letter.charCodeAt(0))))
                    this.Memory.writeByte(this.ProgramCounter.get(), Utils.formatNumberToHex8Bit(Number(letter.charCodeAt(0))))

                }
            }
            return false
        }
        return true
    }


    DW(arg){
        arg = arg.trim().split(",")
        let patternNum = /^(([0-9A-F]{1,4}H)|((((([0-5]?\d{1,4})|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])D?)|(0?[0-9]{1,2})))|([01]{1,16}B)|(([0-3]?[0-7]{1,2})(Q|O)))$/i
        let patterString = /^'.*'$/

        for(let i = 0; i < arg.length; i++) {
            const value = arg[i].trim()
            
            if(patternNum.test(value)){
                const bytes = Utils.formatNumberToHex16Bit(value)
                this.ProgramCounter.add(1)
                //this.Memory[this.ProgramCounter.toHex()] = Utils.formatBytesToMemory(bytes[1])
                this.Memory.writeByte(this.ProgramCounter.get(), bytes[1])

                this.ProgramCounter.add(1)
                //this.Memory[this.ProgramCounter.toHex()] = Utils.formatBytesToMemory(bytes[0])
                this.Memory.writeByte(this.ProgramCounter.get(), bytes[0])

                
                continue
            }

            if(patterString.test(value)){            
                for (let j = 1; j < value.length-1; j++) {
                    const letter = value[j];
                      
                    this.ProgramCounter.add(1)
                    //this.Memory[this.ProgramCounter.toHex()] = Utils.formatBytesToMemory(Utils.DecimalToHex8Bit(Number(letter.charCodeAt(0))))
                    this.Memory.writeByte(this.ProgramCounter.get(),Utils.formatNumberToHex8Bit(Number(letter.charCodeAt(0))))

                }
                continue
            }
            return false
        }
        return true
    }
}
