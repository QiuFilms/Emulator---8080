import { opCodes } from "./opcodes.js"

export class Utils{
    static DecimalToHex16Bit(dec){
        return dec.toString(16).toUpperCase().padStart(4, "0")
    }
    
    static BaseHexToTwoBytes(number){
        return [number.slice(0,2), number.slice(2)]
    }

    static DecimalToHex8Bit(dec){
        return dec.toString(16).toUpperCase().padStart(2, "0")
    }
    
    static ConvertToBytes(hex){
        return hex.substring(0, hex.length - 1).padStart(4, "0")
    }
    
    static ConvertToByte(hex){
        return hex.substring(0, hex.length - 1).slice(hex.length - 3, hex.length - 1).padStart(2, "0")
    }
    
    static Hex16Bit(number){
        const converted = this.ConvertToBytes(number)
        
        return [converted.slice(0,2), converted.slice(2)]
    }
    
    static Hex8Bit(number){
        return this.ConvertToByte(number)
    }
    
    static Increment16Bit(number){
        return (number == "FFFF" ? "0000" : Number(`0x${number}`) + 1).toString(16).toUpperCase().padStart(4, "0")
    }
    
    static Increment8Bit(number){
        return (number == "FF" ? "00" : Number(`0x${number}`) + 1).toString(16).toUpperCase().padStart(2, "0")
    }
    
    static Decrement16Bit(number){
        return (number == "0000" ? "FFFF" : Number(`0x${number}`) - 1).toString(16).toUpperCase().padStart(4, "0")
    }
    
    static Decrement8Bit(number){
        return (number == "00" ? "FF" : Number(`0x${number}`) - 1).toString(16).toUpperCase().padStart(2, "0")
    }
    
    static HexToDecimal(hex){
        return Number(`0x${hex}`)
    }
    
    static Addition8Bit(byte, value, FlagRegister, setCY = true){
        let sum = byte + value
        
        if(sum > 255){
            sum -= 256
            FlagRegister.setCarry(setCY ? 1 : FlagRegister.getCarry())
            FlagRegister.setAuxillaryCarry(1)
    
        }else if(sum >= 16 && byte < 16){
            FlagRegister.setCarry(setCY ? 0 : FlagRegister.getCarry())
            FlagRegister.setAuxillaryCarry(1)
    
        }else if(sum < 16){
            FlagRegister.setCarry(setCY ? 0 : FlagRegister.getCarry())
            FlagRegister.setAuxillaryCarry(0)
        }
    
        FlagRegister.setZero(sum == 0 ? 1 : 0)
        FlagRegister.setParity(this.checkParity(sum))
        FlagRegister.setSign(FlagRegister.getCarry() && FlagRegister.getSign() ? this.negate(FlagRegister.getSign()) : FlagRegister.getSign())
        return this.DecimalToHex8Bit(sum)
    }
    
    static Addition16Bit(byte, value){
        let sum = byte + value
        
    
        if(sum > 65535){
            sum -= 65536
        }
    
        return this.DecimalToHex16Bit(sum)
    }
    
    static Substraction16Bit(byte, value){
        let sum = byte + value
    
        if(sum < 0){
            sum += 65536
        }
    
        return this.DecimalToHex16Bit(sum)
    }
    
    
    
    static Substraction8Bit(byte, value, FlagRegister, setCY = true){
        let sub = byte - value 
 
        if(sub < 0){
            sub += 256
            FlagRegister.setCarry(setCY ? 1 : FlagRegister.getCarry())
            FlagRegister.setAuxillaryCarry(1)
            
        }else if(sub < 16 && byte >= 16){
            FlagRegister.setCarry(setCY ? 0 : FlagRegister.getCarry())
            FlagRegister.setAuxillaryCarry(1)
    
        }else if(sub >= 16){
            FlagRegister.setCarry(setCY ? 0 : FlagRegister.getCarry())
            FlagRegister.setAuxillaryCarry(0)
        }
    
        FlagRegister.setZero(sub == 0 ? 1 : 0)
        FlagRegister.setParity(this.checkParity(sub))
        FlagRegister.setSign(FlagRegister.getCarry() && !FlagRegister.getSign() ? this.negate(FlagRegister.getSign()) : FlagRegister.getSign())
        return this.DecimalToHex8Bit(sub)
    }
    
    static checkParity(byte){
        let count = 0;
        while (byte){
          count += byte & 1;
          byte >>= 1;
        }
        
        return count % 2 == 0 && count != 0 ? 1 : 0;
    }
    
    
    static formatInstructionToMemory(instruction){
        return [instruction.toUpperCase(), opCodes[instruction.toUpperCase()]]
    }
    
    static formatBytesToMemory(byte){
        return [byte + "H", byte]
    }
    
    static formatNumberToHex8Bit(number){ 
        let system = number.toString().at(-1).toUpperCase()

        if(system == "H"){
            return this.Hex8Bit(number)
        }
    
        if(system == "B"){
            return this.DecimalToHex8Bit(parseInt(number.slice(0, -1), 2))
        }
    
        if(system == "Q" || system == "O"){
            return this.DecimalToHex8Bit(parseInt(number.slice(0, -1), 8))
        }
    
        if(system == "D"){
            return this.DecimalToHex8Bit(parseInt(number.slice(0, -1)))
        }else{
            return this.DecimalToHex8Bit(parseInt(number))
        }
    }
    
    static formatNumberToHex16Bit(number){
        let system = number.toString().at(-1).toUpperCase()
        
        if(system == "H"){
            return this.Hex16Bit(number)
        }
    
        if(system == "B"){
            return this.BaseHexToTwoBytes(this.DecimalToHex16Bit(parseInt(number.slice(0, -1), 2)))
        }
    
        if(system == "Q" || system == "O"){
            return this.BaseHexToTwoBytes(this.DecimalToHex16Bit(parseInt(number.slice(0, -1), 8)))
        }
    
        if(system == "D"){
            return this.BaseHexToTwoBytes(this.DecimalToHex16Bit(parseInt(number.slice(0, -1))))
        }else{
            return this.BaseHexToTwoBytes(this.DecimalToHex16Bit(parseInt(number)))
        }
    }
    
    static negate(bit){
        return bit == 1 ? 0 : 1
    }
}

