import { hexOpCodes } from "./opcodes.js"
import { Stack } from "./stack.js"
import { Utils } from "./utils.js"

const Regs = {
    A:"00",
    B:"00",
    C:"00",
    D:"00",
    E:"00",
    H:"00",
    L:"00"
}

const Flags = {
    S:0,
    Z:0,
    AC:0,
    P:0,
    CY:0
}


var document = window.document
let offsetTop = 0
let scrollFromTop = 0

export class Processor extends EventTarget{
    static breakPoints = new Set();
    ///Setters
    setLinePcAssociation(assoc){
        this.linePcAssociation = assoc
        return this
    }

    setWorkType(isStep){
        this.isStep = isStep
        return this
    }

    static setBreakPoints(breakPoints){
        this.breakPoints = breakPoints
    }

    ///Event dispatchers
    highlightLine(){
        this.dispatchEvent(new Event('running_highLightLine'));
    }

    updateRegisters(){
        this.dispatchEvent(new Event('running_updateRegisters'));
    }

    switchCodeEditorInput(){
        this.dispatchEvent(new Event('running_switchCodeEditorInput'));
    }

    reset(){
        this.Memory = null
        this.Labels = null
        this.PC = 2048
        this.FlagReg = structuredClone(Flags)
        this.Registries = structuredClone(Regs)
        this.Ports = new Array()
        this.isPaused = false
        this.isEnd = false
        this.jump = false
    }

    ///Init method
    init({Memory, Labels}){
        this.reset()
        this.Memory = Memory
        this.Labels = Labels
        this.dispatchEvent(new Event('init'));
    }


    ///Listeners
    stepInputListener = (e) => {
        e.stopPropagation()
        e.preventDefault()
        console.log("stepInputListener");
        this.updateRegisters()
        this.start() 
    }


    inputListener = (e) => {
        e.stopPropagation()
        e.preventDefault()
        this.Registries.A = Utils.DecimalToHex8Bit(e.which)
        
        
        document.querySelector(".display").blur()
        document.querySelector(".display").textContent += String.fromCharCode(e.which)
        document.querySelector(".display").removeEventListener('keypress', e.target.inputListener)
        //this.dispatchEvent(new Event('running_displayUpdate'));
        this.isPaused = false
        this.start()     
    }


    stepAwaitForLastInputListener = (e) =>{
        e.stopPropagation()
        e.preventDefault()
        document.querySelector("body").removeEventListener("keypress", this.stepAwaitForLastInputListener)

        
        this.dispatchEvent(new Event('stop'));
    }

    countinueAfterBreak = (e) => {
        e.stopPropagation()
        e.preventDefault()
        
        Processor.breakPoints.delete(this.linePcAssociation[this.PC])
        
        document.body.removeEventListener("keypress", this.countinueAfterBreak)
        this.start()
    }

    start(){
        
        this.dispatchEvent(new Event('start'));
        while(this.PC <= Number(`0x${(Object.keys(this.Memory)).reduce((max, c) => c > max ? c : max)}`)){
            if(!(Utils.DecimalToHex16Bit(this.PC) in this.Memory)){
                this.PC++
                this.updateRegisters()
                continue
            }

            const memCell = this.Memory[Utils.DecimalToHex16Bit(this.PC)]

            if(memCell.length != 1 && memCell[1] in hexOpCodes){
                    this.highlightLine()
                    
                    if(this.jump){
                        document.querySelector(".left").scrollTo({
                            top: offsetTop + scrollFromTop, // Adjust for container's current scroll position
                            behavior: "smooth",
                        });
                        this.jump = false
                    }

                    if(Processor.breakPoints.has(this.PC in this.linePcAssociation ? this.linePcAssociation[this.PC] : -1)){
                        document.querySelector("body").addEventListener("keypress", this.countinueAfterBreak)
                        return
                    } 

                    const instruction = hexOpCodes[memCell[1]].split(" ")[0]
                    this[instruction](hexOpCodes[memCell[1]].split(" ")[1])

                    
                    if(this.isEnd) break
                    if(this.isPaused) return
            } else {
                this.PC++
                continue
            }
            this.updateRegisters()
            if(this.isStep && this.PC <= Number(`0x${(Object.keys(this.Memory)).reduce((max, c) => c > max ? c : max)}`)) return
        } 
        //console.log(this.Registries);
        // console.log(this.Memory);
        
        


        //console.log(!this.isStep , this.Memory[Utils.DecimalToHex16Bit(Number(`0x${(Object.keys(this.Memory)).reduce((max, c) => c > max ? c : max)}`))][1] != "D7" );
        console.log(this.isStep || (!this.isStep , this.Memory[Utils.DecimalToHex16Bit(Number(`0x${(Object.keys(this.Memory)).reduce((max, c) => c > max ? c : max)}`))][1] == "D7" ));
        
        if(this.isStep || (!this.isStep , this.Memory[Utils.DecimalToHex16Bit(Number(`0x${(Object.keys(this.Memory)).reduce((max, c) => c > max ? c : max)}`))][1] == "D7" )){
            console.log("Stp");
            
            document.querySelector("body").addEventListener("keypress", this.stepAwaitForLastInputListener)
            return
        }
        //document.querySelector("body").removeEventListener("keypress", this.stepInputListener)

        this.dispatchEvent(new Event('stop'));
    }

    existInMemory(address){
        return address in this.Memory ? this.Memory[address][1] : "00"
    }

    nextBytes(address1, address2){
        return [this.existInMemory(address1), this.existInMemory(address2)]
    }

    getPSW(){
        return [this.Registries.A, Utils.DecimalToHex8Bit(parseInt(`${this.FlagReg.S}${this.FlagReg.Z}0${this.FlagReg.AC}0${this.FlagReg.P}1${this.FlagReg.CY}`, 2))]
    }

    loadPSW(acc, flag){
        this.Registries.A = Utils.formatBytesToMemory(acc)
        const byte = Utils.HexToDecimal(flag).toString(2).padStart(8, "0")

        this.FlagReg.S = byte[7]
        this.FlagReg.Z = byte[6]
        this.FlagReg.AC = byte[4]
        this.FlagReg.P = byte[2]
        this.FlagReg.CY = byte[0]
    }

    HLT(){
        this.isEnd = true
        this.PC++
    }

    MOV(args){
        args = args.split(",")

        if(args[0] != "M" && args[1] != "M"){
            this.Registries[args[0]] = this.Registries[args[1]]
        }

        if(args[0] == "M" && args[1] != "M"){
            this.Memory[this.Registries.H+this.Registries.L] = Utils.formatBytesToMemory(this.Registries[args[1]])
        }

        if(args[0] != "M" && args[1] == "M"){ 
            this.Registries[args[0]] = this.existInMemory(this.Registries.H+this.Registries.L)
        }
        this.PC++
    }


    MVI(arg){
        this.Registries[arg] = this.existInMemory(Utils.DecimalToHex16Bit(this.PC+1))
        this.PC += 2
    }


    RST(arg){
        if(arg == 1){
            document.querySelector(".display").textContent += String.fromCharCode(parseInt(this.Registries.A, 16))
            this.PC++
            document.querySelector(".display").scrollTo(0, document.querySelector(".display").scrollHeight);
            
            return
        }

        if(arg == 2){
            document.querySelector(".display").focus()
            this.PC++
            this.isPaused = true
            document.querySelector(".display").addEventListener("keypress", this.inputListener)
            document.querySelector(".display").scrollTo(0, document.querySelector(".display").scrollHeight);
            return
        }

        if(arg == 3){
            let address = this.Registries.H + this.Registries.L

            while(this.existInMemory(address) != "40"){
                document.querySelector(".display").textContent += String.fromCharCode(parseInt(this.existInMemory(address),16))
                address = Utils.DecimalToHex16Bit(Utils.HexToDecimal(address) + 1)
                document.querySelector(".display").scrollTo(0, document.querySelector(".display").scrollHeight);
            }
            this.PC++
            
            return
        }


        if(arg == 4){
            document.querySelector(".display").textContent += this.Registries.A[0]
            document.querySelector(".display").textContent += this.Registries.A[1]
            document.querySelector(".display").scrollTo(0, document.querySelector(".display").scrollHeight);
            this.PC++
            
            return
        }
        
    }

    LXI(arg){
        const bytes = this.nextBytes(Utils.DecimalToHex16Bit(this.PC+2), Utils.DecimalToHex16Bit(this.PC+1))

        if(arg != "SP"){
            this.Registries[arg] = bytes[0]
            this.Registries[String.fromCharCode(arg.charCodeAt(0) + (arg == "H" ? 4 : 1))] = bytes[1]
        }

        if(arg == "SP"){
            Stack.Pointer = bytes[1] + bytes[0] 
        }
        this.PC += 3

    }


    STAX(arg){
        this.Memory[this.Registries[arg] + this.Registries[String.fromCharCode(arg.charCodeAt(0) + 1)]] = Utils.formatBytesToMemory(this.Registries.A)
        this.PC++
    }


    SHLD(){
        const bytes = this.nextBytes(Utils.DecimalToHex16Bit(this.PC+2), Utils.DecimalToHex16Bit(this.PC+1))
        this.Memory[bytes.join("")] = Utils.formatBytesToMemory(this.Registries.L)
        this.Memory[Utils.Increment16Bit(bytes.join(""))] = Utils.formatBytesToMemory(this.Registries.H)
        this.PC += 3
    }

    STA(){
        const bytes = this.nextBytes(Utils.DecimalToHex16Bit(this.PC+2), Utils.DecimalToHex16Bit(this.PC+1))
        this.Memory[bytes.join("")] = Utils.formatBytesToMemory(this.Registries.A)
        this.PC += 3
    }


    LHLD(){
        const bytes = this.nextBytes(Utils.DecimalToHex16Bit(this.PC+2), Utils.DecimalToHex16Bit(this.PC+1))
        this.Registries.L = this.existInMemory(bytes.join(""))
        this.Registries.H = this.existInMemory(Utils.Increment16Bit(bytes.join("")))
        this.PC += 3
    }


    INX(arg){
        if(arg != "SP"){
            const scdReg = String.fromCharCode(arg.charCodeAt(0) + (arg == "H" ? 4 : 1))
            const bytes = Utils.Addition16Bit(Utils.HexToDecimal(this.Registries[arg] + this.Registries[scdReg]), 1)
            
            this.Registries[arg] = bytes.slice(0,2)
            this.Registries[scdReg] = bytes.slice(2)
        }

        if(arg == "SP"){
            Stack.INXStack()
        }
        this.PC++
    }

    INR(arg){
        if(arg != "M"){  
            const byte = Utils.Addition8Bit(Utils.HexToDecimal(this.Registries[arg]), 1, this.FlagReg, false)
            this.Registries[arg] = byte 
        }

        if(arg == "M"){
            const byte = Utils.Addition8Bit(Utils.HexToDecimal(this.existInMemory(this.Registries.H + this.Registries.L)), 1, this.FlagReg, false)
            this.Memory[this.Registries.H + this.Registries.L] = Utils.formatBytesToMemory(byte)
        }
        
        this.PC++
    }


    DCX(arg){
        if(arg != "SP"){
            const scdReg = String.fromCharCode(arg.charCodeAt(0) + (arg == "H" ? 4 : 1))
            const bytes = Utils.Substraction16Bit(Utils.HexToDecimal(this.Registries[arg] + this.Registries[scdReg]), 1)
            
            this.Registries[arg] = bytes.slice(0,2)
            this.Registries[scdReg] = bytes.slice(2)
        }

        if(arg == "SP"){
            Stack.DCXStack()
        }
        this.PC++
    }



    DCR(arg){
        if(arg != "M"){  
            this.Registries[arg] = Utils.Substraction8Bit(Utils.HexToDecimal(this.Registries[arg]), 1, this.FlagReg, false)
        }

        if(arg == "M"){
            const byte =  Utils.Substraction8Bit(Utils.HexToDecimal(this.existInMemory(this.Registries.H + this.Registries.L)), 1, this.FlagReg, false)
            this.Memory[this.Registries.H + this.Registries.L] = Utils.formatBytesToMemory(byte)
        }

        this.PC++
    }


    RLC(){
        const byte = Utils.HexToDecimal(this.Registries.A)
        
        let value
        if(byte >= 128){
            this.FlagReg.CY = 1

            value = ((byte - 128) << 1) + 1
            this.Registries.A = Utils.DecimalToHex8Bit(value)
        }else{
            this.FlagReg.CY = 0
            value = byte << 1
            this.Registries.A = Utils.DecimalToHex8Bit(value)
        }
        this.PC++
    }


    RAL(){
        const byte = Utils.HexToDecimal(this.Registries.A)
        
        let value
        let newCY = byte >= 128 ? 1 : 0
        if(byte >= 128){
            value = ((byte - 128) << 1) + this.FlagReg.CY
            this.Registries.A = Utils.DecimalToHex8Bit(value)
        }else{
            value = (byte << 1) + this.FlagReg.CY
            this.Registries.A = Utils.DecimalToHex8Bit(value)
        }

        this.FlagReg.CY = newCY
        this.PC++
    }


    RRC(){
        const byte = Utils.HexToDecimal(this.Registries.A)
        
        if(byte % 2 == 1){
            this.FlagReg.CY = 1
        }else{
            this.FlagReg.CY = 0
        }

        let value = ((byte - 128) >> 1) + this.FlagReg.CY
        if(this.FlagReg.CY){
            value = ((byte + 128) >> 1)
        }else{
            value = (byte >> 1)
        }

        this.Registries.A = Utils.DecimalToHex8Bit(value)
        this.PC++
    }

    RAR(){
        const byte = Utils.HexToDecimal(this.Registries.A)

        
        let value
        let newCY = byte % 2 ? 1 : 0
        if(this.FlagReg.CY){
            value = ((byte + 128) >> 1)
        }else{
            value = (byte >> 1)
        }

        this.FlagReg.CY = newCY

        this.Registries.A = Utils.DecimalToHex8Bit(value)
        this.PC++
    }


    DAA(){
        let LSN = Utils.HexToDecimal((this.Registries.A).slice(1))
        this.FlagReg.CY = 0
        this.FlagReg.AC = 0
    
        if(LSN > 9 || FlagReg.AC == 1){
            LSN =  (LSN + 6)
            this.FlagReg.AC = 0
            if(LSN > 15){
                LSN =  (LSN-16)
                this.FlagReg.AC = 1
            }
        }

        let MSN = Utils.HexToDecimal((this.Registries.A).slice(0, 1))
        if(MSN > 9 || FlagReg.CY == 1){
            MSN =  (MSN + 6)
            this.FlagReg.CY = 0
            if(MSN > 15){
                MSN =  (MSN-16)
                this.FlagReg.CY = 1
            }
        }

        let value = Utils.HexToDecimal(`${(MSN)}${LSN}`)
        this.FlagReg.Z = value == 0 ? 1 : 0
        this.FlagReg.S = 0
        this.FlagReg.P = checkParity(value)
        this.Registries.A = Utils.DecimalToHex8Bit(value)

        this.PC++
    }
    

    STC(){
        this.FlagReg.CY = 1
        this.PC++
    }


    DAD(arg){
        const HLValue = Utils.HexToDecimal(`${this.Registries.H}${this.Registries.L}`)
    
        let sum;
        if(arg != "SP"){
            const registersValue = Utils.HexToDecimal(`${this.Registries[arg]}${this.Registries[String.fromCharCode(arg.charCodeAt(0) + (arg == "H" ? 4 : 1))]}`)
            sum = HLValue + registersValue 
        }

        if(arg == "SP"){
            const valueFromSP = Utils.HexToDecimal(this.existInMemory(this.Registries.H + this.Registries.L))
            sum = HLValue + valueFromSP
        }
        

        if(sum > 65535){
            const bytes = Utils.DecimalToHex16Bit(sum - 65536)
            this.FlagReg.CY = 1
            this.Registries.H = bytes.slice(0,2)
            this.Registries.L = bytes.slice(2)
        }else{
            const bytes = Utils.DecimalToHex16Bit(sum)
            this.FlagReg.CY = 0
            this.Registries.H = bytes.slice(0,2)
            this.Registries.L = bytes.slice(2)
        }

        this.PC++
    }


    LDAX(arg){
        this.Registries.A = this.existInMemory(this.Registries[arg] + this.Registries[String.fromCharCode(arg.charCodeAt(0) + 1)])

        this.PC++
    }


    LHLD(){
        const bytes = this.nextBytes(Utils.DecimalToHex16Bit(this.PC+2), Utils.DecimalToHex16Bit(this.PC+1))
    
        this.Registries.L = this.existInMemory(bytes.join(""))
        this.Registries.H = this.existInMemory(Utils.Increment16Bit(bytes.join("")))
    
       
        this.Memory[Utils.DecimalToHex16Bit(this.PC + 1)] = Utils.formatBytesToMemory(bytes[0])
        this.Memory[Utils.DecimalToHex16Bit(this.PC + 2)] = Utils.formatBytesToMemory(bytes[1])
        this.PC += 3
    }


    LDA(){
        const bytes = this.nextBytes(Utils.DecimalToHex16Bit(this.PC+2), Utils.DecimalToHex16Bit(this.PC+1))
        this.Registries.A = this.existInMemory(bytes.join(""))

        this.Memory[Utils.DecimalToHex16Bit(this.PC + 1)] = Utils.formatBytesToMemory(bytes[0])
        this.Memory[Utils.DecimalToHex16Bit(this.PC + 2)] = Utils.formatBytesToMemory(bytes[1])
        this.PC += 3
    }


    ADD(arg){
        let sum
        if(arg != "M"){
            sum = Utils.Addition8Bit(Utils.HexToDecimal(this.Registries.A), Utils.HexToDecimal(this.Registries[arg]), this.FlagReg)
        }

        if(arg == "M"){
            const address = this.Registries.H + this.Registries.L 
            sum = Utils.Addition8Bit(Utils.HexToDecimal(this.Registries.A), Utils.HexToDecimal(this.existInMemory(address)), this.FlagReg)
        }

        this.Registries.A = sum    
        this.PC++
    }


    ADC(arg){
        let sum
        if(arg != "M"){
            sum = Utils.Addition8Bit(Utils.HexToDecimal(this.Registries.A), Utils.HexToDecimal(this.Registries[arg]) + this.FlagReg.CY, this.FlagReg)
        }

        if(arg == "M"){
            const address = this.Registries.H + this.Registries.L 
            sum = Utils.Addition8Bit(Utils.HexToDecimal(Registries.A), Utils.HexToDecimal(this.existInMemory(address)) + this.FlagReg.CY, this.FlagReg) 
        }

        this.Registries.A = sum    
        this.PC++
    }


    SUB(arg){
        let sum
        if(arg != "M"){
            sum = Utils.Substraction8Bit(Utils.HexToDecimal(this.Registries.A), Utils.HexToDecimal(this.Registries[arg]), this.FlagReg)
        }

        if(arg == "M"){
            const address = this.Registries.H + this.Registries.L 
            sum = Utils.Substraction8Bit(Utils.HexToDecimal(this.Registries.A), Utils.HexToDecimal(this.existInMemory(address)), this.FlagReg)
        }

        this.Registries.A = sum
        this.PC++
    }


    SBB(arg){
        let sum
        if(arg != "M"){
            sum = Utils.Substraction8Bit(Utils.HexToDecimal(this.Registries.A), Utils.HexToDecimal(this.Registries[arg]) + this.FlagReg.CY, this.FlagReg)
        }

        if(arg == "M"){
            const address = this.Registries.H + this.Registries.L 
            sum = Utils.Substraction8Bit(Utils.HexToDecimal(Registries.A), Utils.HexToDecimal(this.existInMemory(address)) + this.FlagReg.CY, this.FlagReg) 
        }
        this.Registries.A = sum
        this.PC++
    }

    ANA(arg){
        if(arg == "M"){
            const address = this.Registries.H + this.Registries.L
            this.Registries.A = Utils.DecimalToHex8Bit(Utils.HexToDecimal(this.Registries.A) & Utils.HexToDecimal(this.existInMemory(address)))
        }else{
            this.Registries.A = Utils.DecimalToHex8Bit(Utils.HexToDecimal(this.Registries.A) & Utils.HexToDecimal(this.Registries[arg]))
        }

        this.FlagReg.S = Utils.HexToDecimal(this.Registries.A) >= 128 ? 1 : 0
        this.FlagReg.Z = Utils.HexToDecimal(this.Registries.A) == 0 ? 1 : 0
        this.FlagReg.P = checkParity(Utils.HexToDecimal(this.Registries.A))
        this.FlagReg.CY = 0
        this.FlagReg.AC = 0
        this.PC++
    }

    XRA(arg){
        if(arg == "M"){
            const address = this.Registries.H + this.Registries.L
            this.Registries.A = Utils.DecimalToHex8Bit(Utils.HexToDecimal(this.Registries.A) ^ Utils.HexToDecimal(this.existInMemory(address)))
        }else{
            this.Registries.A = Utils.DecimalToHex8Bit(Utils.HexToDecimal(this.Registries.A) ^ Utils.HexToDecimal(this.Registries[arg]))
        }

        this.FlagReg.S = Utils.HexToDecimal(this.Registries.A) >= 128 ? 1 : 0
        this.FlagReg.Z = Utils.HexToDecimal(this.Registries.A) == 0 ? 1 : 0
        this.FlagReg.P = checkParity(Utils.HexToDecimal(this.Registries.A))
        this.FlagReg.CY = 0
        this.FlagReg.AC = 0
        this.PC++
    }

    ORA(arg){
        if(arg == "M"){
            const address = this.Registries.H + this.Registries.L
            this.Registries.A = Utils.DecimalToHex8Bit(Utils.HexToDecimal(this.Registries.A) | Utils.HexToDecimal(this.existInMemory(address)))
        }else{
            this.Registries.A = Utils.DecimalToHex8Bit(Utils.HexToDecimal(this.Registries.A) | Utils.HexToDecimal(this.Registries[arg]))
        }

        this.FlagReg.S = Utils.HexToDecimal(this.Registries.A) >= 128 ? 1 : 0
        this.FlagReg.Z = Utils.HexToDecimal(this.Registries.A) == 0 ? 1 : 0
        this.FlagReg.P = checkParity(Utils.HexToDecimal(this.Registries.A))
        this.FlagReg.CY = 0
        this.FlagReg.AC = 0
        this.PC++
    }


    CMP(){
        if(arg == "M"){
            const address = this.Registries.H + this.Registries.L 
            Utils.Substraction8Bit(Utils.HexToDecimal(this.Registries.A), Utils.HexToDecimal(this.existInMemory(address)), this.FlagReg)
        }else{
            Utils.Substraction8Bit(Utils.HexToDecimal(this.Registries.A), Utils.HexToDecimal(this.Registries[arg]), this.FlagReg)
        }
        this.PC++
    }

    
    CMA(){
        const bin = Utils.HexToDecimal(this.Registries.A).toString(2).padStart(8, "0")

        let num = ""
        for(bit of bin){
            num += Utils.negate(bit)
        }

        this.Registries.A = num
        this.PC++
    }

    CMC(){
        this.FlagReg.CY = Utils.negate(this.FlagReg.CY)
        this.PC++
    }

    
    CALL(){
        this.Memory[Stack.DecrementStack()] = Utils.formatBytesToMemory(Utils.DecimalToHex16Bit(this.PC + 3).slice(0, 2))
        this.Memory[Stack.DecrementStack()] = Utils.formatBytesToMemory(Utils.DecimalToHex16Bit(this.PC + 3).slice(2, 4))
        
        this.PC = Utils.HexToDecimal(this.Memory[Utils.DecimalToHex16Bit(this.PC+2)][1] + this.Memory[Utils.DecimalToHex16Bit(this.PC+1)][1])
        console.log(this.linePcAssociation, this.PC);
        
        // const element = document.querySelectorAll("pre > span")[this.linePcAssociation[this.PC + 1]];

        // element.scrollIntoView({
        //     behavior: "smooth", // Smooth scrolling (or use "auto" for instant scrolling)
        //     block: "nearest",    // Align the element in the viewport: "start", "center", "end", "nearest"
        //     inline: "nearest",  // Horizontal alignment (optional, defaults to "nearest")
        // });

        const container = document.querySelector(".left");
        const element = document.querySelectorAll("pre > span")[this.linePcAssociation[this.PC + 1]];


        // Scroll the container to the element
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        offsetTop = elementRect.top - containerRect.top
        scrollFromTop = container.scrollTop - 50
        this.jump = true
    }

    RET(){
        this.PC = Utils.HexToDecimal(this.Memory[Stack.IncreamentStack()][1] + this.Memory[Stack.DecrementStack()][1]) 
  
        console.log(this.linePcAssociation, this.PC);
        
        const element = document.querySelectorAll("pre > span")[this.linePcAssociation[this.PC]];
        const container = document.querySelector(".left");
        // element.scrollIntoView({
        //     behavior: "smooth", // Smooth scrolling (or use "auto" for instant scrolling)
        //     block: "start",    // Align the element in the viewport: "start", "center", "end", "nearest"
        //     inline: "nearest",  // Horizontal alignment (optional, defaults to "nearest")
        // });
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        offsetTop = elementRect.top - containerRect.top
        scrollFromTop = container.scrollTop - 50
        this.jump = true

        Stack.IncreamentStack()
        Stack.IncreamentStack()
    }

    RNZ(){
        if(!this.FlagReg.Z){
            this.RET()
        }else{
            this.PC++
        }
    }

    RNC(){
        if(!this.FlagReg.CY){
            this.RET()
        }else{
            this.PC++
        }
    }

    RPO(){
        if(!this.FlagReg.P){
            this.RET()
        }else{
            this.PC++
        }
    }

    RZ(){
        if(this.FlagReg.Z){
            this.RET()
        }else{
            this.PC++
        }
    }

    RC(){
        if(this.FlagReg.CY){
            this.RET()
        }else{
            this.PC++
        }
    }

    RPE(){
        if(this.FlagReg.P){
            this.RET()
        }else{
            this.PC++
        }
    }

    RP(){
        if(!this.FlagReg.S){
            this.RET()
        }else{
            this.PC++
        }
    }

    RM(){
        if(this.FlagReg.S){
            this.RET()
        }else{
            this.PC++
        }
    }

    POP(arg){
        if(arg != "PSW"){
            this.Registries[String.fromCharCode(arg.charCodeAt(0) + (arg == "H" ? 4 : 1))] = Utils.formatBytesToMemory(this.existInMemory(Stack.Pointer))
            this.Registries[arg] = Utils.formatBytesToMemory(this.existInMemory(Stack.IncreamentStack()))
            Stack.IncreamentStack()
        }else{
            this.loadPSW(this.existInMemory(Stack.IncreamentStack()), this.existInMemory(Stack.Pointer))
            Stack.IncreamentStack()
        }
        this.PC++
    }


    PUSH(arg){
        if(arg != "PSW"){
            this.Memory[Stack.DecrementStack()] = Utils.formatBytesToMemory(this.Registries[arg])
            this.Memory[Stack.DecrementStack()] = Utils.formatBytesToMemory(this.Registries[String.fromCharCode(arg.charCodeAt(0) + (arg == "H" ? 4 : 1))])
        }else{
            this.Memory[Stack.DecrementStack()] = Utils.formatBytesToMemory(this.getPSW[0])
            this.Memory[Stack.DecrementStack()] = Utils.formatBytesToMemory(this.getPSW[1])
        }
        this.PC++
    }


    JMP(){
        this.PC = Utils.HexToDecimal(this.Memory[Utils.DecimalToHex16Bit(this.PC+2)][1] + this.Memory[Utils.DecimalToHex16Bit(this.PC+1)][1])
        const container = document.querySelector(".left");
        const element = document.querySelectorAll("pre > span")[this.linePcAssociation[this.PC + 1]];


        // Scroll the container to the element
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        offsetTop = elementRect.top - containerRect.top
        scrollFromTop = container.scrollTop - 50
        this.jump = true
    }


    JNZ(){
        if(!this.FlagReg.Z){
            this.JMP()
        }else{
            this.PC += 3
        }
    }

    JNC(){
        if(!this.FlagReg.CY){
            this.JMP()
        }else{
            this.PC += 3
        }
    }

    JPO(){
        if(!this.FlagReg.P){
            this.JMP()
        }else{
            this.PC += 3
        }
    }

    JZ(){
        if(this.FlagReg.Z){
            this.JMP()
        }else{
            this.PC += 3
        }
    }

    JC(){
        if(this.FlagReg.CY){
            this.JMP()
        }else{
            this.PC += 3
        }
    }

    JPE(){
        if(this.FlagReg.P){
            this.JMP()
        }else{
            this.PC += 3
        }
    }

    JP(){
        if(!this.FlagReg.S){
            this.JMP()
        }else{
            this.PC += 3
        }
    }

    JM(){
        if(this.FlagReg.S){
            this.JMP()
        }else{
            this.PC += 3
        }
    }


    CNZ(){
        if(!this.FlagReg.Z){
            this.CALL()
        }else{
            this.PC += 3
        }
    }

    CNC(){
        if(!this.FlagReg.CY){
            this.CALL()
        }else{
            this.PC += 3
        }
    }

    CPO(){
        if(!this.FlagReg.P){
            this.CALL()
        }else{
            this.PC += 3
        }
    }

    CZ(){
        if(this.FlagReg.Z){
            this.CALL()
        }else{
            this.PC += 3
        }
    }

    CC(){
        if(this.FlagReg.CY){
            this.CALL()
        }else{
            this.PC += 3
        }
    }

    CPE(){
        if(this.FlagReg.P){
            this.CALL()
        }else{
            this.PC += 3
        }
    }

    CP(){
        if(!this.FlagReg.S){
            this.CALL()
        }else{
            this.PC += 3
        }
    }

    CM(){
        if(this.FlagReg.S){
            this.CALL()
        }else{
            this.PC += 3
        }
    }


    ADI(){
        this.Registries.A = Utils.Addition8Bit(Utils.HexToDecimal(this.Registries.A), Utils.HexToDecimal(this.existInMemory(Utils.DecimalToHex16Bit(this.PC + 1))), this.FlagReg)    
        this.PC += 2
    }


    SUI(){
        this.Registries.A = Utils.Substraction8Bit(Utils.HexToDecimal(this.Registries.A), Utils.HexToDecimal(this.existInMemory(Utils.DecimalToHex16Bit(this.PC + 1))), this.FlagReg)
        this.PC += 2
    }

    ACI(){
        this.Registries.A = Utils.Addition8Bit(Utils.HexToDecimal(this.Registries.A), Utils.HexToDecimal(this.existInMemory(Utils.DecimalToHex16Bit(this.PC + 1))) + this.FlagReg.CY , this.FlagReg)    
        this.PC += 2
    }


    SBI(){
        this.Registries.A = Utils.Substraction8Bit(Utils.HexToDecimal(this.Registries.A), Utils.HexToDecimal(this.existInMemory(Utils.DecimalToHex16Bit(this.PC + 1))) + this.FlagReg.CY, this.FlagReg)
        this.PC += 2
    }


    setFlags(){
        this.FlagReg.S = Utils.HexToDecimal(this.Registries.A) >= 128 ? 1 : 0
        this.FlagReg.Z = Utils.HexToDecimal(this.Registries.A) == 0 ? 1 : 0
        this.FlagReg.P = checkParity(Utils.HexToDecimal(this.Registries.A))
        this.FlagReg.CY = 0
        this.FlagReg.AC = 0
    }

    ANI(){
        this.Registries.A = Utils.DecimalToHex8Bit(Utils.HexToDecimal(this.Registries.A) & Utils.HexToDecimal(this.existInMemory(Utils.DecimalToHex16Bit(this.PC + 1))))
        this.setFlags()
        this.PC += 2
    }


    ORI(){
        this.Registries.A = Utils.DecimalToHex8Bit(Utils.HexToDecimal(this.Registries.A) | Utils.HexToDecimal(this.existInMemory(Utils.DecimalToHex16Bit(this.PC + 1))))
        this.setFlags()
        this.PC += 2
    }


    XRI(){
        this.Registries.A = Utils.DecimalToHex8Bit(Utils.HexToDecimal(this.Registries.A) ^  Utils.HexToDecimal(this.existInMemory(Utils.DecimalToHex16Bit(this.PC + 1))))
        this.setFlags()
        this.PC += 2
    }


    CPI(){
        Utils.Substraction8Bit(Utils.HexToDecimal(this.Registries.A), Utils.HexToDecimal(this.existInMemory(Utils.DecimalToHex16Bit(this.PC + 1))), this.FlagReg)
        this.PC += 2
    }

    XTHL(){
        const tempByteL = this.Registries.L
        const tempByteH = this.Registries.H

        this.Registries.L = this.existInMemory(Utils.DecimalToHex16Bit(PC))
        this.Registries.H = this.existInMemory(Utils.DecimalToHex16Bit(PC + 1))

        this.Memory(Utils.DecimalToHex16Bit(PC)) = Utils.formatBytesToMemory(tempByteL)
        this.Memory(Utils.DecimalToHex16Bit(PC + 1)) = Utils.formatBytesToMemory(tempByteH)
        this.PC++
    }

    DI(){
        this.PC++
    }

    EI(){
        this.PC++
    }

    PCHL(){
        this.PC = Utils.HexToDecimal(this.Registries.H + this.Registries.L)
        this.PC++
    }

    SPHL(){
        Stack.Pointer = this.Registries.H + this.Registries.L
        this.PC++
    }

    XCHG(){
        const tempByteL = this.Registries.L
        const tempByteH = this.Registries.H

        this.Registries.L = this.Registries.D
        this.Registries.H = this.Registries.E

        this.Registries.D = tempByteH
        this.Registries.E = tempByteL

        this.PC++
    }

    OUT(){
        this.Ports[this.existInMemory(this.PC+1)] = this.Registries.A
        this.PC += 2
    }

    IN(){
        const port =  this.existInMemory(this.PC+1)
        this.Registries.A = this.Ports.includes(port) ? this.Ports[port] : "00"
        this.PC += 2
    }
}


