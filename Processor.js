import { hexOpCodes } from "./opcodes.js"
import { FlagRegister } from "./Processor/FlagRegister.js"
import { ProgramCounter } from "./Processor/ProgramCounter.js"
import { Registers, REGISTER } from "./Processor/Registers.js"
import { Stack } from "./Processor/Stack.js"
import { Utils } from "./utils.js"

// const Regs = {
//     A:"00",
//     B:"00",
//     C:"00",
//     D:"00",
//     E:"00",
//     H:"00",
//     L:"00"
// }

// const Flags = {
//     S:0,
//     Z:0,
//     AC:0,
//     P:0,
//     CY:0
// }


var document = window.document
let offsetTop = 0
let scrollFromTop = 0

export class Processor{
    ProgramCounter = new ProgramCounter()
    Stack = new Stack()
    Registers = new Registers()
    FlagRegister = new FlagRegister()
    Ports = new Array()
    isPaused = false
    isEnd = false
    jump = false
    static breakPoints = new Set();

    constructor(lexer, bridge, workType){
        this.Memory = lexer.Memory
        this.Labels = lexer.Labels
        this.UIBridge = bridge
        this.isStep = workType
        
        this.ProgramCounter.setOrigin(lexer.getOrigin())
        this.defineUIEvents()
        this.UIBridge.dispatch("init");
    }

    static setBreakPoints(breakPoints){
        this.breakPoints = breakPoints
    }
    
    ///Setters
    // setOrigin(origin){
    //     this.ProgramCounter.setOrigin(origin)
    // }


    // setLinePcAssociation(assoc){
    //     this.linePcAssociation = assoc
    //     return this
    // }

    setWorkType(isStep){
        this.isStep = isStep
        return this
    }



    ///Event dispatchers
    highlightLine(){
        //this.dispatchEvent(new Event('running_highLightLine'));
        this.UIBridge.dispatch("running_highLightLine");
    }

    updateRegisters(){
        //this.dispatchEvent(new Event('running_updateRegisters'));
        this.UIBridge.dispatch("running_updateRegisters");

    }

    switchCodeEditorInput(){
        //this.dispatchEvent(new Event('running_switchCodeEditorInput'));
        this.UIBridge.dispatch("running_switchCodeEditorInput");

    }

    // reset(){
    //     //this.Memory = null
    //     //this.Labels = null
    //     //this.ProgramCounter = 2048
    //     //this.FlagRegister = structuredClone(Flags)
    //     //this.Registers = structuredClone(Regs)
    //     this.Ports = new Array()
    //     this.isPaused = false
    //     this.isEnd = false
    //     this.jump = false
    // }

    ///Init method
    // init({Memory, Labels}){
    //     this.defineUIEvents()
    //     this.reset()
    //     //this.Memory = Memory
    //     this.Labels = Labels
    //     //this.dispatchEvent(new Event('init'));
    //     this.UIBridge.dispatch("init");

    // }


    ///Listeners
    stepInputListener = (e) => {
        e.stopPropagation()
        e.preventDefault()
        this.updateRegisters()
        this.start() 
    }


    inputListener = (e) => {
        e.stopPropagation()
        e.preventDefault()

        this.Registers.set(REGISTER.A, Utils.DecimalToHex8Bit(e.which))
        this.updateRegisters()
        
        document.querySelector(".display").blur()
        document.querySelector(".display").textContent += String.fromCharCode(e.which)
        document.querySelector(".display").removeEventListener('keypress', e.target.inputListener)
        //this.dispatchEvent(new Event('running_displayUpdate'));
        this.isPaused = false
        this.start()     
    }


    stepAwaitForLastInputListener = (e) =>{
        e.stopPropagation()

        if(!this.isStep){
            e.preventDefault()
        }
        document.querySelector("body").removeEventListener("keypress", this.stepAwaitForLastInputListener)

        
        //this.dispatchEvent(new Event('stop'));
        this.UIBridge.dispatch("stop");

    }

    countinueAfterBreak = (e) => {
        e.stopPropagation()
        e.preventDefault()
        
        //Processor.breakPoints.delete(this.linePcAssociation[this.ProgramCounter.get()])
        Processor.breakPoints.delete(this.UIBridge.getLineFromPC(this.ProgramCounter.get()))
        document.body.removeEventListener("keypress", this.countinueAfterBreak)
        this.start()
    }

    defineUIEvents(){
        this.UIBridge.defineEvent("start", this)
        this.UIBridge.defineEvent("running_updateRegisters", this)
        this.UIBridge.defineEvent("running_switchCodeEditorInput", this)
        this.UIBridge.defineEvent("running_highLightLine", this)
        this.UIBridge.defineEvent("running_displayUpdate", this)
        this.UIBridge.defineEvent("running_hexHighlight", this)
        this.UIBridge.defineEvent("stop", this)
        this.UIBridge.defineEvent("break", this)
        this.UIBridge.defineEvent("init", this)
        this.UIBridge.defineEvent("checkIfLineInView", this)
    }

    start(){
        //this.dispatchEvent(new Event('start'));
        this.UIBridge.dispatch("start")
        
        while(this.ProgramCounter.get() <= Number(`0x${(Object.keys(this.Memory.return())).reduce((max, c) => c > max ? c : max)}`)){
            if(!(this.ProgramCounter.toHex() in this.Memory.return())){
                this.ProgramCounter.add(1)
                this.updateRegisters()
                continue
            }

            //const memCell = this.Memory[this.ProgramCounter.toHex()]

            const memCell = this.Memory.read(this.ProgramCounter.toHex())
            
            if(typeof memCell != "undefined" && memCell in hexOpCodes){
                
            //if(memCell.length != 1 && memCell[1] in hexOpCodes){

                    this.highlightLine()
                    this.UIBridge.dispatch("checkIfLineInView");

                    if(this.jump){
                        document.querySelector(".left").scrollTo({
                            top: offsetTop + scrollFromTop, // Adjust for container's current scroll position
                            behavior: "smooth",
                        });
                        this.jump = false
                    }

                    
                    if(this.UIBridge.hasBreakPoint(this.ProgramCounter.get())){
                        document.querySelector("body").addEventListener("keypress", this.countinueAfterBreak)
                        return
                    } 
                    
                    this.UIBridge.dispatch("running_hexHighlight");
                    const instruction = hexOpCodes[memCell].split(" ")[0]
                    this[instruction](hexOpCodes[memCell].split(" ")[1])
                    this.updateRegisters()
                    
                    
                    if(this.isPaused) return
                    if(this.isEnd) break
            } else {
                this.ProgramCounter.add(1)
                continue
            }
            this.updateRegisters()
            if(this.isStep && this.ProgramCounter.get() <= Number(`0x${(Object.keys(this.Memory.return())).reduce((max, c) => c > max ? c : max)}`)) return
        } 
        //console.log(this.Registers);
        // console.log(this.Memory);
        
        


        //console.log(!this.isStep , this.Memory[Utils.DecimalToHex16Bit(Number(`0x${(Object.keys(this.Memory)).reduce((max, c) => c > max ? c : max)}`))][1] != "D7" );
        //console.log(this.isStep || (!this.isStep , this.Memory[Utils.DecimalToHex16Bit(Number(`0x${(Object.keys(this.Memory.return())).reduce((max, c) => c > max ? c : max)}`))][1] == "D7" ));
        // let max = Number(`0x${(Object.keys(this.Memory.return())).reduce((max, c) => c > max ? c : max)}`)
        // console.log(this.Memory.read([this.ProgramCounter.offset(-1).toHexOffset()])[1]);
        //|| (!this.isStep , this.Memory.read([this.ProgramCounter.offset(-1).toHexOffset()]) == "D7" )
        if(this.isEnd || this.isStep ){
            document.querySelector("body").addEventListener("keypress", this.stepAwaitForLastInputListener)
            return
        }
        //document.querySelector("body").removeEventListener("keypress", this.stepInputListener)

        //this.dispatchEvent(new Event('stop'));
        this.UIBridge.dispatch("stop");

    }


    existInMemory(address){
        return address in this.Memory.return() ? this.Memory.read([address])[1] : "00"
    }

    nextBytes(address1, address2){
        return [this.Memory.read(address1), this.Memory.read(address2)]
    }

    getPSW(){
        return [this.Registers.get(REGISTER.A), Utils.DecimalToHex8Bit(parseInt(`${this.FlagRegister.getSign()}${this.FlagRegister.getZero()}0${this.FlagRegister.getAuxillaryCarry()}0${this.FlagRegister.getParity()}1${this.FlagRegister.getCarry()}`, 2))]
    }

    loadPSW(acc, flag){
        this.Registers.set(REGISTER.A, Utils.formatBytesToMemory(acc))
        const byte = Utils.HexToDecimal(flag).toString(2).padStart(8, "0")

        this.FlagRegister.setSign(byte[7])
        this.FlagRegister.setZero(byte[6])
        this.FlagRegister.setAuxillaryCarry(byte[4])
        this.FlagRegister.setParity(byte[2])
        this.FlagRegister.setCarry(byte[0])
    }

    HLT(){
        this.isEnd = true
        this.ProgramCounter.add(1)
    }

    MOV(args){
        args = args.split(",")

        if(args[0] != "M" && args[1] != "M"){
            this.Registers.set(args[0], this.Registers[args[1]])
        }

        if(args[0] == "M" && args[1] != "M"){
            //this.Memory[this.Registers.H+this.Registers.L] = Utils.formatBytesToMemory(this.Registers[args[1]])
            this.Memory.writeByte(this.Registers.get(REGISTER.H) + this.Registers.get(REGISTER.L), this.Registers.get(args[1]))
        }

        if(args[0] != "M" && args[1] == "M"){ 
            //this.Registers[args[0]] = this.Memory.read(this.Registers.H+this.Registers.L)
            this.Registers.set(args[0], this.Memory.read(this.Registers.get(REGISTER.H) + this.Registers.get(REGISTER.L)))

        }
        this.ProgramCounter.add(1)
    }


    MVI(arg){   
        //this.Registers[arg] = this.Memory.read(this.ProgramCounter.offset(1).toHexOffset())
        this.Registers.set(arg, this.Memory.read(this.ProgramCounter.offset(1).toHexOffset()))
        this.ProgramCounter.add(2)
    }


    RST(arg){

        if(arg == 1){
            document.querySelector(".display").textContent += String.fromCharCode(parseInt(this.Registers.get(REGISTER.A), 16))
            this.ProgramCounter.add(1)
            document.querySelector(".display").scrollTo(0, document.querySelector(".display").scrollHeight);
            
            return
        }

        if(arg == 2){
            document.querySelector(".display").focus()
            this.ProgramCounter.add(1)
            this.isPaused = true
            document.querySelector(".display").addEventListener("keypress", this.inputListener)
            document.querySelector(".display").scrollTo(0, document.querySelector(".display").scrollHeight);
            return
        }

        if(arg == 3){
            let address = this.Registers.get(REGISTER.H) + this.Registers.get(REGISTER.L)

            while(this.Memory.read(address) != "40"){
                document.querySelector(".display").textContent += String.fromCharCode(parseInt(this.Memory.read(address),16))
                address = Utils.DecimalToHex16Bit(Utils.HexToDecimal(address) + 1)
                document.querySelector(".display").scrollTo(0, document.querySelector(".display").scrollHeight);
            }
            this.ProgramCounter.add(1)
            
            return
        }


        if(arg == 4){
            //document.querySelector(".display").textContent += this.Registers.A[0]
            //document.querySelector(".display").textContent += this.Registers.A[1]
            document.querySelector(".display").textContent += this.Registers.get(REGISTER.A)[0]
            document.querySelector(".display").textContent += this.Registers.get(REGISTER.A)[1]


            document.querySelector(".display").scrollTo(0, document.querySelector(".display").scrollHeight);
            this.ProgramCounter.add(1)
            
            return
        }
        
    }

    LXI(arg){        
        const bytes = this.nextBytes(this.ProgramCounter.offset(2).toHexOffset(), this.ProgramCounter.offset(1).toHexOffset())

        if(arg != "SP"){
            //this.Registers[arg] = bytes[0]
            this.Registers.set(arg, bytes[0])
            //this.Registers[String.fromCharCode(arg.charCodeAt(0) + (arg == "H" ? 4 : 1))] = bytes[1]
            this.Registers.set(String.fromCharCode(arg.charCodeAt(0) + (arg == "H" ? 4 : 1)), bytes[1])
        }

        if(arg == "SP"){
            this.Stack.set(bytes[1] + bytes[0])
        }
        this.ProgramCounter.add(3)

    }


    STAX(arg){
        //this.Memory[this.Registers[arg] + this.Registers[String.fromCharCode(arg.charCodeAt(0) + 1)]] = Utils.formatBytesToMemory(this.Registers.A)
        //this.Memory.writeByte(this.Registers[arg] + this.Registers[String.fromCharCode(arg.charCodeAt(0) + 1)], this.Registers.A)
        this.Memory.writeByte(this.Registers.get(arg) + this.Registers.get(String.fromCharCode(arg.charCodeAt(0) + 1)), this.Registers.get(REGISTER.A))

        this.ProgramCounter.add(1)
    }


    SHLD(){
        const bytes = this.nextBytes(this.ProgramCounter.offset(2).toHexOffset(), this.ProgramCounter.offset(1).toHexOffset())
        //this.Memory[bytes.join("")] = Utils.formatBytesToMemory(this.Registers.L)
        this.Memory.writeByte(bytes.join(""), this.Registers.get(REGISTER.L))
        //this.Memory[Utils.Increment16Bit(bytes.join(""))] = Utils.formatBytesToMemory(this.Registers.H)
        this.Memory.writeByte(Utils.Increment16Bit(bytes.join("")), this.Registers.get(REGISTER.H))
        this.ProgramCounter.add(3)
    }

    STA(){
        const bytes = this.nextBytes(this.ProgramCounter.offset(2).toHexOffset(), this.ProgramCounter.offset(1).toHexOffset())
        //this.Memory[bytes.join("")] = Utils.formatBytesToMemory(this.Registers.A)
        this.Memory.writeByte(bytes.join(""), this.Registers.get(REGISTER.A))

        this.ProgramCounter.add(3)
    }


    LHLD(){
        const bytes = this.nextBytes(this.ProgramCounter.offset(2).toHexOffset(), this.ProgramCounter.offset(1).toHexOffset())
        this.Registers.set(REGISTER.L, this.Memory.read(bytes.join("")))
        this.Registers.set(REGISTER.H, this.Memory.read(Utils.Increment16Bit(bytes.join(""))))
        this.ProgramCounter.add(3)
    }


    INX(arg){
        if(arg != "SP"){
            const scdReg = String.fromCharCode(arg.charCodeAt(0) + (arg == "H" ? 4 : 1))
            const bytes = Utils.Addition16Bit(Utils.HexToDecimal(this.Registers.get(arg) + this.Registers.get(scdReg)), 1)
            
            this.Registers.set(arg, bytes.slice(0,2))
            this.Registers.set(scdReg, bytes.slice(2))
        }

        if(arg == "SP"){
            this.Stack.IncreamentStack()
        }
        this.ProgramCounter.add(1)
    }

    INR(arg){
        if(arg != "M"){  
            const byte = Utils.Addition8Bit(Utils.HexToDecimal(this.Registers.get(arg)), 1, this.FlagRegister, false)
            this.Registers.set(arg, byte)
        }

        if(arg == "M"){
            const byte = Utils.Addition8Bit(Utils.HexToDecimal(this.Memory.read(this.Registers.get(REGISTER.H) + this.Registersget(REGISTER.L))), 1, this.FlagRegister, false)
            //this.Memory[this.Registers.H + this.Registers.L] = Utils.formatBytesToMemory(byte)
            this.Memory.writeByte(this.Registers.get(REGISTER.H) + this.Registers.get(REGISTER.L), byte)

        }
        
        this.ProgramCounter.add(1)
    }


    DCX(arg){
        if(arg != "SP"){
            const scdReg = String.fromCharCode(arg.charCodeAt(0) + (arg == "H" ? 4 : 1))
            const bytes = Utils.Substraction16Bit(Utils.HexToDecimal(this.Registers.get(arg) + this.Registers.get(scdReg)), 1)
            
            this.Registers.set(arg, bytes.slice(0,2))
            this.Registers.set(scdReg, bytes.slice(2))
        }

        if(arg == "SP"){
            this.Stack.DecrementStack()
        }
        this.ProgramCounter.add(1)
    }



    DCR(arg){
        if(arg != "M"){  
            this.Registers.set(arg, Utils.Substraction8Bit(Utils.HexToDecimal(this.Registers.get(arg)), 1, this.FlagRegister, false))
        }

        if(arg == "M"){
            const byte =  Utils.Substraction8Bit(Utils.HexToDecimal(this.Memory.read(this.Registers.get(REGISTER.H) + this.Registers.get(REGISTER.L))), 1, this.FlagRegister, false)
            //this.Memory[this.Registers.H + this.Registers.L] = Utils.formatBytesToMemory(byte)
            this.Memory.writeByte(this.Registers.get(REGISTER.H) + this.Registers.get(REGISTER.L), byte)
            
        }

        this.ProgramCounter.add(1)
    }


    RLC(){
        const byte = Utils.HexToDecimal(this.Registers.get(REGISTER.A))
        
        let value
        if(byte >= 128){
            this.FlagRegister.setCarry(1)

            value = ((byte - 128) << 1) + 1
            this.Registers.set(REGISTER.A, Utils.DecimalToHex8Bit(value))
        }else{
            this.FlagRegister.setCarry(0)
            value = byte << 1
            this.Registers.set(REGISTER.A, Utils.DecimalToHex8Bit(value))
        }
        this.ProgramCounter.add(1)
    }


    RAL(){
        const byte = Utils.HexToDecimal(this.Registers.get(REGISTER.A))
        
        let value
        let newCY = byte >= 128 ? 1 : 0
        if(byte >= 128){
            value = ((byte - 128) << 1) + this.FlagRegister.getCarry()
            this.Registers.set(REGISTER.A, Utils.DecimalToHex8Bit(value))
        }else{
            value = (byte << 1) + this.FlagRegister.getCarry()
            this.Registers.set(REGISTER.A, Utils.DecimalToHex8Bit(value))
        }

        this.FlagRegister.setCarry(newCY)
        this.ProgramCounter.add(1)
    }


    RRC(){
        const byte = Utils.HexToDecimal(this.Registers.get(REGISTER.A))
        
        if(byte % 2 == 1){
            this.FlagRegister.setCarry(1)
        }else{
            this.FlagRegister.setCarry(0)
        }

        let value = ((byte - 128) >> 1) + this.FlagRegister.getCarry()
        if(this.FlagRegister.getCarry()){
            value = ((byte + 128) >> 1)
        }else{
            value = (byte >> 1)
        }

        this.Registers.set(REGISTER.A, Utils.DecimalToHex8Bit(value))
        this.ProgramCounter.add(1)
    }

    RAR(){
        const byte = Utils.HexToDecimal(this.Registers.get(REGISTER.A))

        
        let value
        let newCY = byte % 2 ? 1 : 0
        if(this.FlagRegister.getCarry()){
            value = ((byte + 128) >> 1)
        }else{
            value = (byte >> 1)
        }

        this.FlagRegister.setCarry(newCY)

        this.Registers.set(REGISTER.A, Utils.DecimalToHex8Bit(value))
        this.ProgramCounter.add(1)
    }


    DAA(){
        let LSN = Utils.HexToDecimal((this.Registers.get(REGISTER.A)).slice(1))
        this.FlagRegister.setCarry(0)
        this.FlagRegister.setAuxillaryCarry(0)
    
        if(LSN > 9 || FlagReg.AC == 1){
            LSN =  (LSN + 6)
            this.FlagRegister.setAuxillaryCarry(0)
            if(LSN > 15){
                LSN =  (LSN-16)
                this.FlagRegister.setAuxillaryCarry(1)
            }
        }

        let MSN = Utils.HexToDecimal((this.Registers.get(REGISTER.A)).slice(0, 1))
        if(MSN > 9 || FlagReg.CY == 1){
            MSN =  (MSN + 6)
            this.FlagRegister.setCarry(0)
            if(MSN > 15){
                MSN =  (MSN-16)
                this.FlagRegister.setCarry(1)
            }
        }

        let value = Utils.HexToDecimal(`${(MSN)}${LSN}`)
        this.FlagRegister.setZero(value == 0 ? 1 : 0)
        this.FlagRegister.setSign(0)
        this.FlagRegister.setParity(Utils.checkParity(value))
        this.Registers.set(REGISTER.A, Utils.DecimalToHex8Bit(value))

        this.ProgramCounter.add(1)
    }
    

    STC(){
        this.FlagRegister.setCarry(1)
        this.ProgramCounter.add(1)
    }


    DAD(arg){
        const HLValue = Utils.HexToDecimal(`${this.Registers.get(REGISTER.H)}${this.Registers.get(REGISTER.H)}`)
    
        let sum;
        if(arg != "SP"){
            const registersValue = Utils.HexToDecimal(`${this.Registers.get(arg)}${this.Registers.get(String.fromCharCode(arg.charCodeAt(0) + 1))}`)
            sum = HLValue + registersValue 
        }

        if(arg == "SP"){
            const valueFromSP = Utils.HexToDecimal(this.Memory.read(this.Registers.get(REGISTER.H) + this.Registers.get(REGISTER.H)))
            sum = HLValue + valueFromSP
        }
        

        if(sum > 65535){
            const bytes = Utils.DecimalToHex16Bit(sum - 65536)
            this.FlagRegister.setCarry(1)
            this.Registers.set(REGISTER.H, bytes.slice(0,2)) 
            this.Registers.set(REGISTER.L, bytes.slice(2))
        }else{
            const bytes = Utils.DecimalToHex16Bit(sum)
            this.FlagRegister.setCarry(0)
            this.Registers.set(REGISTER.H, bytes.slice(0,2)) 
            this.Registers.set(REGISTER.L, bytes.slice(2))
        }

        this.ProgramCounter.add(1)
    }


    LDAX(arg){
        this.Registers.set(REGISTER.A, this.Memory.read(this.Registers.get(arg) + this.Registers.get(String.fromCharCode(arg.charCodeAt(0) + 1))))

        this.ProgramCounter.add(1)
    }


    LHLD(){
        const bytes = this.nextBytes(this.ProgramCounter.offset(2).toHexOffset(), this.ProgramCounter.offset(1).toHexOffset())
    
        this.Registers.set(REGISTER.L, this.Memory.read(bytes.join("")))
        this.Registers.set(REGISTER.H, this.Memory.read(Utils.Increment16Bit(bytes.join(""))))
    
       
        //this.Memory[this.ProgramCounter.offset(1).toHexOffset()] = Utils.formatBytesToMemory(bytes[0])
        this.Memory.writeByte(this.ProgramCounter.offset(1).toHexOffset(), bytes[0])
        //this.Memory[this.ProgramCounter.offset(2).toHexOffset()] = Utils.formatBytesToMemory(bytes[1])
        this.Memory.writeByte(this.ProgramCounter.offset(2).toHexOffset(), bytes[1])

        this.ProgramCounter.add(3)
    }


    LDA(){
        const bytes = this.nextBytes(this.ProgramCounter.offset(2).toHexOffset(), this.ProgramCounter.offset(1).toHexOffset())
        this.Registers.set(REGISTER.A, this.Memory.read(bytes.join("")))

        //this.Memory[this.ProgramCounter.offset(1).toHexOffset()] = Utils.formatBytesToMemory(bytes[0])
        this.Memory.writeByte(this.ProgramCounter.offset(1).toHexOffset(), bytes[0])
        //this.Memory[this.ProgramCounter.offset(2).toHexOffset()] = Utils.formatBytesToMemory(bytes[1])
        this.Memory.writeByte(this.ProgramCounter.offset(2).toHexOffset(), bytes[1])
        this.ProgramCounter.add(3)
    }


    ADD(arg){
        let sum
        if(arg != "M"){
            sum = Utils.Addition8Bit(Utils.HexToDecimal(this.Registers.get(REGISTER.A)), Utils.HexToDecimal(this.Registers.get(arg)), this.FlagRegister)
        }

        if(arg == "M"){
            const address = this.Registers.get(REGISTER.H) + this.Registers.get(REGISTER.L) 
            sum = Utils.Addition8Bit(Utils.HexToDecimal(this.Registers.get(REGISTER.A)), Utils.HexToDecimal(this.Memory.read(address)), this.FlagRegister)
        }

        this.Registers.set(REGISTER.A, sum)    
        this.ProgramCounter.add(1)
    }


    ADC(arg){
        let sum
        if(arg != "M"){
            sum = Utils.Addition8Bit(Utils.HexToDecimal(this.Registers.get(REGISTER.A)), Utils.HexToDecimal(this.Registers.get(arg)) + this.FlagRegister.getCarry(), this.FlagRegister)
        }

        if(arg == "M"){
            const address = this.Registers.get(REGISTER.H) + this.Registers.get(REGISTER.L)
            sum = Utils.Addition8Bit(Utils.HexToDecimal(this.Registers.get(REGISTER.A)), Utils.HexToDecimal(this.Memory.read(address)) + this.FlagRegister.getCarry(), this.FlagRegister) 
        }

        this.Registers.set(REGISTER.A, sum)    
        this.ProgramCounter.add(1)
    }


    SUB(arg){
        let sum
        if(arg != "M"){
            sum = Utils.Substraction8Bit(Utils.HexToDecimal(this.Registers.get(REGISTER.A)), Utils.HexToDecimal(this.Registers.get(arg)), this.FlagRegister)
        }

        if(arg == "M"){
            const address = this.Registers.get(REGISTER.H) + this.Registers.get(REGISTER.L)
            sum = Utils.Substraction8Bit(Utils.HexToDecimal(this.Registers.get(REGISTER.A)), Utils.HexToDecimal(this.Memory.read(address)), this.FlagRegister)
        }

        this.Registers.set(REGISTER.A, sum)
        this.ProgramCounter.add(1)
    }


    SBB(arg){
        let sum
        if(arg != "M"){
            sum = Utils.Substraction8Bit(Utils.HexToDecimal(this.Registers.get(REGISTER.A)), Utils.HexToDecimal(this.Registers.get(arg)) + this.FlagRegister.getCarry(), this.FlagRegister)
        }

        if(arg == "M"){
            const address = this.Registers.get(REGISTER.H) + this.Registers.get(REGISTER.L) 
            sum = Utils.Substraction8Bit(Utils.HexToDecimal(this.Registers.get(REGISTER.A)), Utils.HexToDecimal(this.Memory.read(address)) + this.FlagRegister.getCarry(), this.FlagRegister) 
        }
        this.Registers.set(REGISTER.A, sum)
        this.ProgramCounter.add(1)
    }

    ANA(arg){
        if(arg == "M"){
            const address = this.Registers.get(REGISTER.H) + this.Registers.get(REGISTER.L)
            this.Registers.set(REGISTER.A, Utils.DecimalToHex8Bit(Utils.HexToDecimal(this.Registers.get(REGISTER.A)) & Utils.HexToDecimal(this.Memory.read(address))))
        }else{
            this.Registers.set(REGISTER.A, Utils.DecimalToHex8Bit(Utils.HexToDecimal(this.Registers.get(REGISTER.A)) & Utils.HexToDecimal(this.Registers.get(arg))))
        }

        this.FlagRegister.setSign(Utils.HexToDecimal(this.Registers.get(REGISTER.A)) >= 128 ? 1 : 0)
        this.FlagRegister.setZero(Utils.HexToDecimal(this.Registers.get(REGISTER.A)) == 0 ? 1 : 0)
        this.FlagRegister.setParity(Utils.checkParity(Utils.HexToDecimal(this.Registers.get(REGISTER.A))))
        this.FlagRegister.setCarry(0)
        this.FlagRegister.setAuxillaryCarry(0)
        this.ProgramCounter.add(1)
    }

    XRA(arg){
        if(arg == "M"){
            const address = this.Registers.get(REGISTER.H) + this.Registers.get(REGISTER.L)
            this.Registers.set(REGISTER.A, Utils.DecimalToHex8Bit(Utils.HexToDecimal(this.Registers.get(REGISTER.A)) ^ Utils.HexToDecimal(this.Memory.read(address))))
        }else{
            this.Registers.set(REGISTER.A, Utils.DecimalToHex8Bit(Utils.HexToDecimal(this.Registers.get(REGISTER.A)) ^ Utils.HexToDecimal(this.Registers.get(arg))))
        }

        this.FlagRegister.setSign(Utils.HexToDecimal(this.Registers.get(REGISTER.A)) >= 128 ? 1 : 0)
        this.FlagRegister.setZero(Utils.HexToDecimal(this.Registers.get(REGISTER.A)) == 0 ? 1 : 0)
        this.FlagRegister.setParity(Utils.checkParity(Utils.HexToDecimal(this.Registers.get(REGISTER.A))))
        this.FlagRegister.setCarry(0)
        this.FlagRegister.setAuxillaryCarry(0)
        this.ProgramCounter.add(1)
    }

    ORA(arg){
        if(arg == "M"){
            const address = this.Registers.get(REGISTER.H) + this.Registers.get(REGISTER.L)

            this.Registers.set(REGISTER.A, Utils.DecimalToHex8Bit(Utils.HexToDecimal(this.Registers.get(REGISTER.A)) | Utils.HexToDecimal(this.Memory.read(address))))
        }else{
            this.Registers.get(REGISTER.A, Utils.DecimalToHex8Bit(Utils.HexToDecimal(this.Registers.get(REGISTER.A)) | Utils.HexToDecimal(this.Registers.get(arg))))
        }

        this.FlagRegister.setSign(Utils.HexToDecimal(this.Registers.get(REGISTER.A)) >= 128 ? 1 : 0)
        this.FlagRegister.setZero(Utils.HexToDecimal(this.Registers.get(REGISTER.A)) == 0 ? 1 : 0)
        this.FlagRegister.setParity(Utils.checkParity(Utils.HexToDecimal(this.Registers.get(REGISTER.A))))
        this.FlagRegister.setCarry(0)
        this.FlagRegister.setAuxillaryCarry(0)
        this.ProgramCounter.add(1)
    }


    CMP(){
        if(arg == "M"){
            const address = this.Registers.get(REGISTER.H) + this.Registers.get(REGISTER.L)
            Utils.Substraction8Bit(Utils.HexToDecimal(this.Registers.get(REGISTER.A)), Utils.HexToDecimal(this.Memory.read(address)), this.FlagRegister)
        }else{
            Utils.Substraction8Bit(Utils.HexToDecimal(this.Registers.get(REGISTER.A)), Utils.HexToDecimal(this.Registers.get(arg)), this.FlagRegister)
        }
        this.ProgramCounter.add(1)
    }

    
    CMA(){
        const bin = Utils.HexToDecimal(this.Registers.get(REGISTER.A)).toString(2).padStart(8, "0")

        let num = ""
        for(bit of bin){
            num += Utils.negate(bit)
        }

        this.Registers.set(REGISTER.A, Utils.DecimalToHex8Bit(parseInt(num, 2)))
        this.ProgramCounter.add(1)
    }

    CMC(){
        this.FlagRegister.setCarry(Utils.negate(this.FlagRegister.getCarry()))
        this.ProgramCounter.add(1)
    }

    
    CALL(){
        //this.Memory[this.Stack.DecrementStack()] = Utils.formatBytesToMemory(Utils.DecimalToHex16Bit(this.ProgramCounter.get() + 3).slice(0, 2))
        //this.Stack.DecrementStack()
        //this.Stack.DecrementStack()

        this.Memory.writeByte(this.Stack.DecrementStack(), this.ProgramCounter.offset(3).toHexOffset().slice(0, 2))
        //this.Memory[this.Stack.DecrementStack()] = Utils.formatBytesToMemory(Utils.DecimalToHex16Bit(this.ProgramCounter.get() + 3).slice(2, 4))
        this.Memory.writeByte(this.Stack.DecrementStack(), this.ProgramCounter.offset(3).toHexOffset().slice(2, 4))

        //this.ProgramCounter.set(Utils.HexToDecimal(this.Memory[this.ProgramCounter.offset(2).toHexOffset()][1] + this.Memory[this.ProgramCounter.offset(1).toHexOffset()][1]))
        
        


        
        this.ProgramCounter.set(this.Memory.read(this.ProgramCounter.offset(2).toHexOffset()) + this.Memory.read(this.ProgramCounter.offset(1).toHexOffset()))

        
        //console.log(this.linePcAssociation, this.ProgramCounter.get());
        const container = document.querySelector(".left");
        const element = document.querySelectorAll("pre > span")[this.UIBridge.getLineFromPC(this.ProgramCounter.offset(0).getOffset())];
        

        // Scroll the container to the element
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        offsetTop = elementRect.top - containerRect.top
        scrollFromTop = container.scrollTop - 50
        this.jump = true
    }

    RET(){
        //this.ProgramCounter.set(Utils.HexToDecimal(this.Memory[this.Stack.IncreamentStack()][1] + this.Memory[this.Stack.DecrementStack()][1]));
        
        this.ProgramCounter.set(this.Memory.read(this.Stack.IncreamentStack()) + this.Memory.read(this.Stack.DecrementStack()))
  
        //console.log(this.linePcAssociation, this.ProgramCounter.get());
        
        const element = document.querySelectorAll("pre > span")[this.UIBridge.getLineFromPC(this.ProgramCounter.get())];
        const container = document.querySelector(".left");

        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        offsetTop = elementRect.top - containerRect.top
        scrollFromTop = container.scrollTop - 50
        this.jump = true

        this.Stack.IncreamentStack()
        this.Stack.IncreamentStack()
    }

    RNZ(){
        if(!this.FlagRegister.getZero()){
            this.RET()
        }else{
            this.ProgramCounter.add(1)
        }
    }

    RNC(){
        if(!this.FlagRegister.getCarry()){
            this.RET()
        }else{
            this.ProgramCounter.add(1)
        }
    }

    RPO(){
        if(!this.FlagRegister.getParity()){
            this.RET()
        }else{
            this.ProgramCounter.add(1)
        }
    }

    RZ(){
        if(this.FlagRegister.getZero()){
            this.RET()
        }else{
            this.ProgramCounter.add(1)
        }
    }

    RC(){
        if(this.FlagRegister.getCarry()){
            this.RET()
        }else{
            this.ProgramCounter.add(1)
        }
    }

    RPE(){
        if(this.FlagRegister.getParity()){
            this.RET()
        }else{
            this.ProgramCounter.add(1)
        }
    }

    RP(){
        if(!this.FlagRegister.getSign()){
            this.RET()
        }else{
            this.ProgramCounter.add(1)
        }
    }

    RM(){
        if(this.FlagRegister.getSign()){
            this.RET()
        }else{
            this.ProgramCounter.add(1)
        }
    }

    POP(arg){
        if(arg != "PSW"){
            this.Registers.set(String.fromCharCode(arg.charCodeAt(0) + (arg == "H" ? 4 : 1)), Utils.formatBytesToMemory(this.Memory.read(this.Stack.get())))
            this.Registers.set(arg, Utils.formatBytesToMemory(this.Memory.read(this.Stack.IncreamentStack())))
            this.Stack.IncreamentStack()
        }else{
            this.loadPSW(this.Memory.read(this.Stack.IncreamentStack()), this.Memory.read(this.Stack.get()))
            this.Stack.IncreamentStack()
        }
        this.ProgramCounter.add(1)
    }


    PUSH(arg){
        if(arg != "PSW"){
            //this.Memory[this.Stack.DecrementStack()] = Utils.formatBytesToMemory(this.Registers[arg])
            this.Memory.writeByte(this.Stack.DecrementStack(), this.Registers.get(arg))
            //this.Memory[this.Stack.DecrementStack()] = Utils.formatBytesToMemory(this.Registers[String.fromCharCode(arg.charCodeAt(0) + (arg == "H" ? 4 : 1))])
            this.Memory.writeByte(this.Stack.DecrementStack(), this.Registers.get(String.fromCharCode(arg.charCodeAt(0) + (arg == "H" ? 4 : 1))))
            
        }else{
            //this.Memory[this.Stack.DecrementStack()] = Utils.formatBytesToMemory(this.getPSW[0])
            this.Memory.writeByte(this.Stack.DecrementStack(), this.getPSW()[0])
            //this.Memory[this.Stack.DecrementStack()] = Utils.formatBytesToMemory(this.getPSW[1])
            this.Memory.writeByte(this.Stack.DecrementStack(), this.getPSW()[1])

        }
        this.ProgramCounter.add(1)
    }


    JMP(){
        //console.log(this.Memory[this.ProgramCounter.offset(2).toHexOffset()][1] + this.Memory[this.ProgramCounter.offset(1).toHexOffset()][1]);
        
        //this.ProgramCounter.set(Utils.HexToDecimal(this.Memory[this.ProgramCounter.offset(2).toHexOffset()][1] + this.Memory[this.ProgramCounter.offset(1).toHexOffset()][1]))
        this.ProgramCounter.set(this.Memory.read(this.ProgramCounter.offset(2).toHexOffset()) + this.Memory.read(this.ProgramCounter.offset(1).toHexOffset()))
        
        
        const container = document.querySelector(".left");
        const element = document.querySelectorAll("pre > span")[this.UIBridge.getLineFromPC(this.ProgramCounter.offset(0).getOffset())];


        // Scroll the container to the element
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        offsetTop = elementRect.top - containerRect.top
        scrollFromTop = container.scrollTop - 50
        this.jump = true
    }


    JNZ(){
        if(!this.FlagRegister.getZero()){
            this.JMP()
        }else{
            this.ProgramCounter.add(3)
        }
    }

    JNC(){
        if(!this.FlagRegister.getCarry()){
            this.JMP()
        }else{
            this.ProgramCounter.add(3)
        }
    }

    JPO(){
        if(!this.FlagRegister.getParity()){
            this.JMP()
        }else{
            this.ProgramCounter.add(3)
        }
    }

    JZ(){
        console.log(this.FlagRegister.getZero());
        
        if(this.FlagRegister.getZero()){
            this.JMP()
        }else{
            this.ProgramCounter.add(3)
        }
    }

    JC(){
        if(this.FlagRegister.getCarry()){
            this.JMP()
        }else{
            this.ProgramCounter.add(3)
        }
    }

    JPE(){
        if(this.FlagRegister.getParity()){
            this.JMP()
        }else{
            this.ProgramCounter.add(3)
        }
    }

    JP(){
        if(!this.FlagRegister.getSign()){
            this.JMP()
        }else{
            this.ProgramCounter.add(3)
        }
    }

    JM(){
        if(this.FlagRegister.getSign()){
            this.JMP()
        }else{
            this.ProgramCounter.add(3)
        }
    }


    CNZ(){
        if(!this.FlagRegister.getZero()){
            this.CALL()
        }else{
            this.ProgramCounter.add(3)
        }
    }

    CNC(){
        if(!this.FlagRegister.getCarry()){
            this.CALL()
        }else{
            this.ProgramCounter.add(3)
        }
    }

    CPO(){
        if(!this.FlagRegister.getParity()){
            this.CALL()
        }else{
            this.ProgramCounter.add(3)
        }
    }

    CZ(){
        if(this.FlagRegister.getZero()){
            this.CALL()
        }else{
            this.ProgramCounter.add(3)
        }
    }

    CC(){
        if(this.FlagRegister.getCarry()){
            this.CALL()
        }else{
            this.ProgramCounter.add(3)
        }
    }

    CPE(){
        if(this.FlagRegister.getParity()){
            this.CALL()
        }else{
            this.ProgramCounter.add(3)
        }
    }

    CP(){
        if(!this.FlagRegister.getSign()){
            this.CALL()
        }else{
            this.ProgramCounter.add(3)
        }
    }

    CM(){
        if(this.FlagRegister.getSign()){
            this.CALL()
        }else{
            this.ProgramCounter.add(3)
        }
    }


    ADI(){
        this.Registers.set(REGISTER.A, Utils.Addition8Bit(Utils.HexToDecimal(this.Registers.get(REGISTER.A)), Utils.HexToDecimal(this.Memory.read(this.ProgramCounter.offset(1).toHexOffset())), this.FlagRegister) )   
        this.ProgramCounter.add(2)
    }


    SUI(){
        this.Registers.set(REGISTER.A, Utils.Substraction8Bit(Utils.HexToDecimal(this.Registers.get(REGISTER.A)), Utils.HexToDecimal(this.Memory.read(this.ProgramCounter.offset(1).toHexOffset())), this.FlagRegister))
        this.ProgramCounter.add(2)
    }

    ACI(){
        this.Registers.set(REGISTER.A, Utils.Addition8Bit(Utils.HexToDecimal(this.Registers.get(REGISTER.A)), Utils.HexToDecimal(this.Memory.read(this.ProgramCounter.offset(1).toHexOffset())) + this.FlagRegister.getCarry() , this.FlagRegister)    ) 
        this.ProgramCounter.add(2)
    }


    SBI(){
        this.Registers.set(REGISTER.A, Utils.Substraction8Bit(Utils.HexToDecimal(this.Registers.get(REGISTER.A)), Utils.HexToDecimal(this.Memory.read(this.ProgramCounter.offset(1).toHexOffset())) + this.FlagRegister.getCarry(), this.FlagRegister))
        this.ProgramCounter.add(2)
    }


    setFlags(){
        this.FlagRegister.setSign(Utils.HexToDecimal(this.Registers.get(REGISTER.A)) >= 128 ? 1 : 0)
        this.FlagRegister.setZero(Utils.HexToDecimal(this.Registers.get(REGISTER.A)) == 0 ? 1 : 0)
        this.FlagRegister.setParity(Utils.checkParity(Utils.HexToDecimal(this.Registers.get(REGISTER.A))))
        this.FlagRegister.setCarry(0)
        this.FlagRegister.setAuxillaryCarry(0)
    }

    ANI(){
        this.Registers.set(REGISTER.A, Utils.DecimalToHex8Bit(Utils.HexToDecimal(this.Registers.get(REGISTER.A)) & Utils.HexToDecimal(this.Memory.read(this.ProgramCounter.offset(1).toHexOffset()))))
        this.setFlags()
        this.ProgramCounter.add(2)
    }


    ORI(){
        this.Registers.set(REGISTER.A, Utils.DecimalToHex8Bit(Utils.HexToDecimal(this.Registers.get(REGISTER.A)) | Utils.HexToDecimal(this.Memory.read(this.ProgramCounter.offset(1).toHexOffset()))))
        this.setFlags()
        this.ProgramCounter.add(2)
    }


    XRI(){
        this.Registers.set(REGISTER.A, Utils.DecimalToHex8Bit(Utils.HexToDecimal(this.Registers.get(REGISTER.A)) ^ Utils.HexToDecimal(this.Memory.read(this.ProgramCounter.offset(1).toHexOffset()))))
        this.setFlags()
        this.ProgramCounter.add(2)
    }


    CPI(){
        Utils.Substraction8Bit(Utils.HexToDecimal(this.Registers.get(REGISTER.A)), Utils.HexToDecimal(this.Memory.read(this.ProgramCounter.offset(1).toHexOffset())), this.FlagRegister)
        this.ProgramCounter.add(2)
    }

    XTHL(){
        const tempByteL = this.Registers.get(REGISTER.L)
        const tempByteH = this.Registers.get(REGISTER.H)

        this.Registers.set(REGISTER.L, this.Memory.read(this.Stack.get()))
        this.Registers.set(REGISTER.H, this.Memory.read(this.Stack.IncreamentStack()))

        this.Memory.writeByte(this.ProgramCounter.toHex(), tempByteL)
        this.Memory.writeByte(this.ProgramCounter.offset(1).toHexOffset(), tempByteH)
        this.ProgramCounter.add(1)
    }

    DI(){
        this.ProgramCounter.add(1)
    }

    EI(){
        this.ProgramCounter.add(1)
    }

    PCHL(){
        this.ProgramCounter.set(Utils.HexToDecimal(this.Registers.get(REGISTER.H) + this.Registers.get(REGISTER.L)))
        this.ProgramCounter.add(1)
    }

    SPHL(){
        this.Stack.set(this.Registers.get(REGISTER.H) + this.Registers.get(REGISTER.L))
        this.ProgramCounter.add(1)
    }

    XCHG(){
        const tempByteL = this.Registers.get(REGISTER.L)
        const tempByteH = this.Registers.get(REGISTER.H)

        this.Registers.set(REGISTER.L, this.Registers.get(REGISTER.D))
        this.Registers.set(REGISTER.H, this.Registers.get(REGISTER.E))

        this.Registers.set(REGISTER.D, tempByteL)
        this.Registers.set(REGISTER.E, tempByteH)

        this.ProgramCounter.add(1)
    }

    OUT(){
        this.Ports[this.Memory.read(this.ProgramCounter.get()+1)] = this.Registers.get(REGISTER.A)
        this.ProgramCounter.add(2)
    }

    IN(){
        const port = this.Memory.read(this.ProgramCounter.get()+1)
        this.Registers.set(REGISTER.A, this.Ports.includes(port) ? this.Ports[port] : "00")
        this.ProgramCounter.add(2)
    }
}


