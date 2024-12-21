export class Registers{
    A = "00"
    B = "00"
    C = "00"
    D = "00"
    E = "00"
    H = "00"
    L = "00"

    get(reg){
        return this[reg]
    }

    set(reg, value){
        this[reg] = value
    }

    return(){
        return {
            A: this.A,
            B: this.B,
            C: this.C,
            D: this.D,
            E: this.E,
            H: this.H,
            L: this.L
        }
    }
}

export const REGISTER = {
    A: "A",
    B: "B",
    C: "C",
    D: "D",
    E: "E",
    H: "H",
    L: "L"
}