export class Stack{
    Pointer = "0FFF"

    get(){
        return this.Pointer
    }

    set(value){
        this.Pointer = value
    }

    IncreamentStack(){
        //this.Pointer = (Number(`0x${this.Pointer}`) + 2).toString(16).toUpperCase().padStart(4, "0")
        this.Pointer = (Number(`0x${this.Pointer}`) + 1).toString(16).toUpperCase().padStart(4, "0")
        return this.Pointer
    }

    DecrementStack(){
        //this.Pointer = (Number(`0x${this.Pointer}`) - 2).toString(16).toUpperCase().padStart(4, "0")
        this.Pointer = (Number(`0x${this.Pointer}`) - 1).toString(16).toUpperCase().padStart(4, "0")
        return this.Pointer
    }

    INXStack(){
        this.Pointer = (Number(`0x${this.Pointer}`) + 1).toString(16).toUpperCase().padStart(4, "0")
        return this.Pointer

    }

    DCXStack(){
        this.Pointer = (Number(`0x${this.Pointer}`) - 1).toString(16).toUpperCase().padStart(4, "0")
        return this.Pointer

    }
}


