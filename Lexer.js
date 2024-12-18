import { Utils } from "./utils.js"
const noneArgument = ["RLC", "RAL", "RRC", "RAR", "DAA", "STC", "HLT", "CMA", "CMC", "RET", "RNZ", "RNC", "RPO","RP", "RZ", "RC", "RPE", "RM", "XTHL", "XCHG", "DI", "EI"]

const calls = ["CNZ", "CNC", "CPO","CP", "CZ", "CC", "CPE", "CM", "CALL"]
const jumps = ["JNZ", "JNC", "JPO","JP", "JZ", "JC", "JPE", "JM", "JMP"]

export class Lexer{
    PC = 2047
    Memory = {}
    Labels = {}
    LabelsToFill = new Array()
    current = ""
    formatted = []
    linePcAssociation = {}
    
    init(program){
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
                    this.linePcAssociation[this.PC+1] = line
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
                    this.linePcAssociation[this.PC+1] = line
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
                    this.linePcAssociation[this.PC+1] = line
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

                
                
                
                if(letter == ":"){
                    this.PC++
                
                    this.Memory[Utils.DecimalToHex16Bit(this.PC)] = [this.current]
                    this.Labels[this.current] = Utils.DecimalToHex16Bit(this.PC)
                    
                    
                    let rest = word.slice(this.current.length + 1).trim()
                    
                    this.current = ""  
                    if(rest.length == 0){
                        line++
                        break
                    }

                    
                    
                    word = rest
                    j = -1
                    
                    continue
                }

                this.current += letter
                                
                if(this.current.length == word.length && word.length != ""){
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
        return {
            status: true,
            Memory: this.Memory,
            Labels: this.Labels
        }
    }


    fillLabelsAdresess(){
        for(const label of this.LabelsToFill){
            
            if(!(label[1] in this.Labels)){
                throw new Error("Label does not exists");
            }
            
            let pc = label[0]
            let bytes = Utils.DecimalToHex16Bit(this.Labels[label[1]])
            
            this.Memory[Utils.DecimalToHex16Bit(pc)] = Utils.formatBytesToMemory(bytes.slice(2))
            this.Memory[Utils.DecimalToHex16Bit(pc + 1)] = Utils.formatBytesToMemory(bytes.slice(0,2))
        }
    }

    noneArgumentTemplate(){
        this.PC++
        this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)  
        return true
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
            this.PC++
            this.current = this.current.toUpperCase()
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)
            return true
        }
        return false
    }

    MVI(args){
        let pattern = /^([A-E]|[HL]|M)(\s|\t)*,(\s|\t)*((0{0,2}[0-9A-F]{1,2}H)|(((0?[0-2]?[0-5]{1,2}D?)|(0?[0-9]{1,2})))|([01]{1,8}B)|(([0-3]?[0-7]{1,2})(Q|O)))$/i
        
        if(pattern.test(args)){
            args = args.split(",")
            args.forEach((value, index) => args[index] = value.trim().toUpperCase())
            
            const byte = Utils.formatNumberToHex8Bit(args[1])

            this.PC++
            this.current += ` ${args[0]}`
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)

            this.PC++
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatBytesToMemory(byte)
            return true
        }

        pattern = /^([A-E]|[HL])(\s|\t)*,(\s|\t)*'.'$/i
        if(pattern.test(args)){
            args = args.split(",")
            args.forEach((value, index) => args[index] = value.trim())
            if(args.length > 3){
                return false
            }
            
            const byte = Utils.DecimalToHex8Bit(Number(args[1].charCodeAt(1)))

            this.PC++
            this.current += ` ${args[0].toUpperCase()}`
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)

            this.PC++
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatBytesToMemory(byte)
            return true
        }  
        return false
    }

    RST(arg){
        let pattern = /^[0-7]{1}$/
        
        if(pattern.test(arg)){
            this.PC++
            this.current += ` ${arg}`
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)
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
            
            this.PC++
            this.current += ` ${args[0]}`
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)
            
            this.PC++
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatBytesToMemory(bytes[1])
            this.PC++
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatBytesToMemory(bytes[0])
            return true
        }   

        pattern = /^([BDH])(\s|\t)*,(\s|\t)*.*$/i
        if(pattern.test(args)){
            args = args.split(",")
            args.forEach((value, index) => args[index] = value.trim())
            args[0] = args[0].toUpperCase()

            this.PC++
            this.current += ` ${args[0]}`
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)
            if(!(args[1] in this.Labels)){
                this.LabelsToFill.push([this.PC+1, args[1]])
                this.PC += 2
                return true
            }else{
                const bytes = this.Labels[args[1]]
                
                this.PC++
                this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatBytesToMemory(bytes.slice(2, 4))
                this.PC++
                this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatBytesToMemory(bytes.slice(0,2))
                return true
            }
        }
        return false
    }

    STAX(arg){
        const pattern = /^([BD])$/
        arg = arg.trim().toUpperCase()
    
        if(pattern.test(arg)){
            this.PC++
            this.current += ` ${arg}`
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)
            return true
        }
        return false
    }

    SHLD(arg){
        let pattern = /^(([0-9A-F]{1,4}H)|((((([0-5]?\d{1,4})|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])D?)|(0?[0-9]{1,2})))|([01]{1,16}B)|(([0-3]?[0-7]{1,2})(Q|O)))$/i
        arg = arg.trim()
    
        if(pattern.test(arg)){
            const bytes = Utils.formatNumberToHex16Bit(arg)
    
            this.PC++
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)
            this.PC++
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatBytesToMemory(bytes[1])
            this.PC++
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatBytesToMemory(bytes[0])
            return true
        }
        return false
    }

    STA(arg){
        let pattern = /^(([0-9A-F]{1,4}H)|((((([0-5]?\d{1,4})|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])D?)|(0?[0-9]{1,2})))|([01]{1,16}B)|(([0-3]?[0-7]{1,2})(Q|O)))$/i
        arg = arg.trim()
    
        if(pattern.test(arg)){
            const bytes = Utils.formatNumberToHex16Bit(arg)
    
            this.PC++
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)
            this.PC++
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatBytesToMemory(bytes[1])
            this.PC++
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatBytesToMemory(bytes[0])
            return true
        }
        return false
    }


    INX(arg){
        let pattern = /^([BDH]|SP)$/i
        arg = arg.trim()
    
        if(pattern.test(arg)){
            this.PC++
            this.current += ` ${arg}`
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)
            return true
        }
        return false
    }


    INR(arg){
        let pattern = /^([A-E]|[HL]|M)$/i
        arg = arg.trim()
    
        if(pattern.test(arg)){
            this.PC++
            this.current += ` ${arg}`
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)
            return true
        }
        return false
    }


    DCX(arg){
        let pattern = /^([BDH]|SP)$/i
        arg = arg.trim()
    
        if(pattern.test(arg)){
            this.PC++
            this.current += ` ${arg}`
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)
            return true
        }
        return false
    }


    DCR(arg){
        let pattern = /$([A-E]|[HL]|M)$/i
        arg = arg.trim()
    
        if(pattern.test(arg)){
            this.PC++
            this.current += ` ${arg}`
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)
            return true
        }
        return false
    }


    // RLC(){
    //     this.PC++
    //     this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)  
    // }


    // RAL(){
    //     this.PC++
    //     this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)  
    // }

    // RRC(){
    //     this.PC++
    //     this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)  
    // }


    // RAR(){
    //     this.PC++
    //     this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)  
    // }

    // DAA(){
    //     this.PC++
    //     this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current) 
    // }

    // STC(){
    //     this.PC++
    //     this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)
    // }

    // HLT(){
    //     this.PC++
    //     this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)
    // }

    DAD(arg){
        const pattern = /^(B|D|H|SP)$/i
        arg = arg.trim()
    
        if(pattern.test(arg)){
            this.PC++
            this.current += ` ${arg}`
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current) 
            return true
        }
        return false
    }
    

    LDAX(arg){
        arg = arg.trim()
        const pattern = /^([BD])$/i
    
        if(pattern.test(arg)){
            this.PC++
            this.current += ` ${arg}`
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current) 
            return true
        }
        return false
    }


    LHLD(arg){
        let pattern = /^(([0-9A-F]{1,4}H)|((((([0-5]?\d{1,4})|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])D?)|(0?[0-9]{1,2})))|([01]{1,16}B)|(([0-3]?[0-7]{1,2})(Q|O)))$/i
        arg = arg.trim()
    
        if(pattern.test(arg)){
            const bytes = Utils.formatNumberToHex16Bit(arg)
    
            this.PC++
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)
            this.PC++
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatBytesToMemory(bytes[1])
            this.PC++
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatBytesToMemory(bytes[0])
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
    
            this.PC++
            this.Memory[Utils.DecimalToHex16Bit(pc)] = Utils.formatInstructionToMemory(this.current)
            this.PC++
            this.Memory[Utils.DecimalToHex16Bit(pc)] = Utils.formatBytesToMemory(bytes[1])
            this.PC++
            this.Memory[Utils.DecimalToHex16Bit(pc)] = Utils.formatBytesToMemory(bytes[0])
            return true
        }
        return false
    }



    ADD(arg){
        arg = arg.trim()
        const pattern = /^([A-E]|H|L|M)$/i
    
        if(pattern.test(arg)){
            this.PC++
            this.current += ` ${arg}`
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)
            return true
        }
        return false
    }


    ADC(arg){
        arg = arg.trim()
        const pattern = /^([A-E]|H|L|M)$/i
    
        if(pattern.test(arg)){
            this.PC++
            this.current += ` ${arg}`
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)
            return true
        }
        return false
    }


    SUB(arg){
        console.log(123123);
        
        arg = arg.trim()
        const pattern = /^([A-E]|H|L|M)$/i
    
        if(pattern.test(arg)){
            this.PC++
            this.current += ` ${arg}`
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)
            return true
        }
        return false
    }


    SBB(arg){
        arg = arg.trim()
        const pattern = /^([A-E]|H|L|M)$/i
    
        if(pattern.test(arg)){
            this.PC++
            this.current += ` ${arg}`
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)
            return true
        }
        return false
    }

    ANA(arg){
        arg = arg.trim()
        const pattern = /^([A-E]|H|L|M)$/i

        if(pattern.test(arg)){
            this.PC++
            this.current += ` ${arg}`
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)
            return true
        }
        return false
    }

    XRA(arg){
        arg = arg.trim()
        const pattern = /^([A-E]|H|L|M)$/i

        if(pattern.test(arg)){
            this.PC++
            this.current += ` ${arg}`
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)
            return true
        }
        return false
    }

    ORA(arg){
        arg = arg.trim()
        const pattern = /^([A-E]|H|L|M)$/i

        if(pattern.test(arg)){
            this.PC++
            this.current += ` ${arg}`
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)
            return true
        }
        return false
    }

    CMP(arg){
        arg = arg.trim()
        const pattern = /^([A-E]|H|L|M)$/i

        if(pattern.test(arg)){
            this.PC++
            this.current += ` ${arg}`
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)
            return true
        }
        return false
    }

    // CMA(){
    //     this.PC++
    //     this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)  
    // }

    // CMC(){
    //     this.PC++
    //     this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)  
    // }

    CALL(arg){
        arg = arg.trim()
        let pattern = /^.*$/

        if(pattern.test(arg)){
            this.PC++
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)
            
            if(!(arg in this.Labels)){
                this.LabelsToFill.push([this.PC+1, arg])
                this.PC += 2
                return true
            }else{
                const bytes = this.Labels[arg]
                
                this.PC++
                this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatBytesToMemory(bytes.slice(2, 4))
                this.PC++
                this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatBytesToMemory(bytes.slice(0,2))
            }
            
            

            return true
        }

        pattern = /^(([0-9A-F]{1,4}H)|((((([0-5]?\d{1,4})|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])D?)|(0?[0-9]{1,2})))|([01]{1,16}B)|(([0-3]?[0-7]{1,2})(Q|O)))$/i
        if(pattern.test(arg)){
            const bytes = Utils.formatNumberToHex16Bit(arg)

            this.PC++
            this.Memory[Utils.DecimalToHex16Bit(pc)] = Utils.formatInstructionToMemory(this.current)
            this.PC++
            this.Memory[Utils.DecimalToHex16Bit(pc)] = Utils.formatBytesToMemory(bytes[1])
            this.PC++
            this.Memory[Utils.DecimalToHex16Bit(pc)] = Utils.formatBytesToMemory(bytes[0])
            return true
        }
        return false
    }
    
    // RET(){
    //     this.PC++
    //     this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)  
    // }

    // RNZ(){
    //     this.PC++
    //     this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)  
    // }


    POP(arg){
        arg = arg.trim()
        const pattern = /^([BDH]|PSW)$/i

        if(pattern.test(arg)){
            this.PC++
            this.current += ` ${arg}`
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)  
        }
    }

    PUSH(arg){
        arg = arg.trim()
        const pattern = /^([BDH]|PSW)$/i

        if(pattern.test(arg)){
            this.PC++
            this.current += ` ${arg}`
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)  
        }
    }


    addTwoBytesToMemory(arg){
        let pattern = /^((0{0,2}[0-9A-F]{1,2}H)|(((0?[0-2]?[0-5]{1,2}D?)|(0?[0-9]{1,2})))|([01]{1,8}B)|(([0-3]?[0-7]{1,2})(Q|O)))$/i
        
        if(pattern.test(arg)){
            this.PC++
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)
            this.PC++
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatBytesToMemory(Utils.formatNumberToHex8Bit(arg))
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
            this.PC++
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatInstructionToMemory(this.current)
            this.PC++
            this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatBytesToMemory(Utils.formatNumberToHex8Bit(arg))
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
            console.log(value);
            
            if(patternNum.test(value)){
                this.PC++
                this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatBytesToMemory(Utils.formatNumberToHex8Bit(value))
                
                continue
            }

            if(patterString.test(value)){
                for (let j = 1; j < value.length-1; j++) {
                    const letter = value[j];
                      
                    this.PC++
                    this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatBytesToMemory(Utils.DecimalToHex8Bit(Number(letter.charCodeAt(0))))
                }
                continue
            }

            if(patternAtSign.test(value)){
                for (let j = 0; j <= value.length-1; j++) {
                    const letter = value[j];
                      
                    this.PC++
                    this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatBytesToMemory(Utils.DecimalToHex8Bit(Number(letter.charCodeAt(0))))
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
                this.PC++
                this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatBytesToMemory(bytes[1])
                this.PC++
                this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatBytesToMemory(bytes[0])
                
                continue
            }

            if(patterString.test(value)){            
                for (let j = 1; j < value.length-1; j++) {
                    const letter = value[j];
                      
                    this.PC++
                    this.Memory[Utils.DecimalToHex16Bit(this.PC)] = Utils.formatBytesToMemory(Utils.DecimalToHex8Bit(Number(letter.charCodeAt(0))))
                }
                continue
            }
            return false
        }
        return true
    }
}
