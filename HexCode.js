import { hexOpCodes } from "./opcodes.js";
import { Utils } from "./utils.js";

export class HexCode{
    constructor(hexCode, lineAssociation){
        this.code = hexCode;
        this.lineAssociation = lineAssociation;
    }

    insertHexCode(){
        const sortedKeysDescending = Object.keys(this.code.return()).sort();

        for (const key of sortedKeysDescending) {
           //console.log(`Key: ${key}, Value: ${this.code.read(key)}`);
           this.#createElement(key, this.code.read(key))
        }

    }

    #createElement(key, value){
        const span = document.createElement("span")
        span.innerText = value
        span.classList.add("hexValue")
        span.id = `PC${Utils.HexToDecimal(key)}`
        document.querySelector(".hexValues").appendChild(span)

    }
}