export class FlagRegister{
    constructor(){
        this.CY = 0
        this.AC = 0
        this.Z = 0
        this.P = 0
        this.S = 0
    }

    setCarry(value){
        this.CY = value
    }

    setAuxillaryCarry(value){
        this.AC = value
    }

    setZero(value){
        this.Z = value
    }

    setParity(value){
        this.P = value
    }

    setSign(value){
        this.S = value
    }

    
    getCarry(){
        return this.CY
    }

    getAuxillaryCarry(){
        return this.AC
    }

    getZero(){
        return this.Z
    }

    getParity(){
        return this.P
    }

    getSign(){
        return this.S
    }
}