export class Stack{
    static Pointer = "0FFF"

    static IncreamentStack(){
        this.Pointer = (Number(`0x${this.Pointer}`) + 2).toString(16).toUpperCase().padStart(4, "0")
        return this.Pointer
    }

    static DecrementStack(){
        this.Pointer = (Number(`0x${this.Pointer}`) - 2).toString(16).toUpperCase().padStart(4, "0")
        return this.Pointer
    }

    static INXStack(){
        this.Pointer = (Number(`0x${this.Pointer}`) + 1).toString(16).toUpperCase().padStart(4, "0")
    }

    static DCXStack(){
        this.Pointer = (Number(`0x${this.Pointer}`) - 1).toString(16).toUpperCase().padStart(4, "0")
    }
}


