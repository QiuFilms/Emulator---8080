import { WorkerManager, WorkTypes } from "./WorkerManager.js"

export const regex8Bit = /(\s|\t)*(mvi|mov|stax|ldax)(\s|\t)+/i
const regex16Bit = /^(\s|\t)*(lxi|shld|lhld|pop|push|sphl|xthl|xchg)(\s|\t)+/i
const regex8BitArithmetical = /^(\s|\t)*(inr|dcr|rlc|ral|daa|stc|rrc|rar|cma|cmc|add|adc|sub|sbb|ana|xra|ora|cmp|adi|sui|ani|ori|aci|sbi|xri|cpi|stc)(\s|\t)+/i
const regex16BitArithmetical = /^(\s|\t)*(inx|dad|dcx)(\s|\t)+/i
const regexJumps = /^(\s|\t)*(rnz|rnc|rpo|rp|jnz|jnc|jpo|jp|jmp|cnz|cnc|cpo|cp|rst|rz|rc|rpe|rm|pchl|jz|jc|jpe|cz|cc|cpe|cm|call|out|in)(\s|\t)+/i
const regexMisc = /^(\s|\t)*(hlt|nop|ret)(\s|\t)*/i
const args = [/([A-E]|[HL]|M)(\s|\t)*,(\s|\t)*((0{0,2}[0-9A-F]{1,2}H)|(((0?[0-2]?[0-5]{1,2}D?)|(0?[0-9]{1,2})))|([01]{1,8}B)|(([0-3]?[0-7]{1,2})(Q|O)))/i]



export class CodeFormatter extends EventTarget{
    constructor(code){
        super()
        this.code = code
    }
    
    setCode(code){
        this.code = code
        return this
    }

    onChange(currentValue, previousValue){   
        if(currentValue.length - previousValue.length >= 2){
            const workerManager = new WorkerManager()
            workerManager.dispatchWorkers(WorkTypes.formatMultipleLines.bind(WorkTypes), currentValue)

            let iterator = 0
            const responseArray = new Array()
            workerManager.addEventListener("done", (e) => {
                const { data, workerIndex } = e.detail

                for(const [i, value] of data.chunk.entries()){
                    responseArray[workerIndex * data.chunkSize + i] = value
                }

                //responseArray.splice(workerIndex * data.chunkSize, data.chunk.length, ...data.chunk);

                iterator++
                if(iterator == data.chunksCount){
                    console.timeEnd("a")
                    this.setCode(responseArray)
                    this.updateCode()

                    const textarea = document.querySelector("textarea");

                    const keyupEvent = new KeyboardEvent("keyup", {
                        key: "a",
                        code: "KeyA",
                        keyCode: 65, 
                        charCode: 0, 
                        bubbles: true, 
                        cancelable: true 
                    });
                    
                    textarea.dispatchEvent(keyupEvent);
                }
            })

            return
        }

        if(currentValue.length > previousValue.length){
            for(let i = 0; i < currentValue.length; i++){
                if(typeof previousValue[i] == 'undefined'){ 
                    this.updateLine(currentValue[i], i)
                    continue
                }
                
                if(currentValue[i] != previousValue[i]){
                    this.updateLine(currentValue[i], i)
                }
            }
            return
        }


        if(currentValue.length < previousValue.length){
            for(let i = 0; i < previousValue.length; i++){
                if(typeof currentValue[i] == 'undefined'){
                    this.code.splice(i, this.code.length)
                    this.dispatchEvent(new CustomEvent('updateBreakPoints', {detail: i}));
                    // for(const breakPoint in breakPoints){
                    //     if(typeof code[breakPoint] == 'undefined' ){
                            
                    //     } 
                    //     //breakPoints.delete(breakPoint)
                    // }
                    this.updateCode()
                    break
                } 
                if(currentValue[i] !== previousValue[i]) this.updateLine(currentValue[i], i) 
    
            }
            //console.timeEnd("concatenation");
            return
        }
    }


    updateLine(text, index){
        this.code[index] = CodeFormatter.formatLine(text)
        this.updateCode()
    }

    static formatLine(line){
        let string = line.match(regex8Bit)
        if(string){
            const replacer = `<span class='instruction8bit'>${string[0]}</span>`
            line = line.replace(regex8Bit, replacer)
        }
    
    
        string = line.match(regex16Bit)
        if(string){
            const replacer = `<span class='instruction16bit'>${string[0]}</span>`
            line = line.replace(regex16Bit, replacer)
        }
    
    
        string = line.match(regex8BitArithmetical)
        if(string){
            const replacer = `<span class='instruction8bitArithmetical'>${string[0]}</span>`
            line = line.replace(regex8BitArithmetical, replacer)
        }
    
        string = line.match(regex16BitArithmetical)
        if(string){
            const replacer = `<span class='instruction16bitArithmetical'>${string[0]}</span>`
            line = line.replace(regex16BitArithmetical, replacer)
        }
    
        string = line.match(regexJumps)
        if(string){
            const replacer = `<span class='instructionJumps'>${string[0]}</span>`
            line = line.replace(regexJumps, replacer)
        }
    
        string = line.match(regexMisc)
        if(string){
            const replacer = `<span class='instructionMisc'>${string[0]}</span>`
            line = line.replace(regexMisc, replacer)
        }
        
        for (const argument of args) {
            string = line.match(argument)
            
            if(string){
                string = string[0].split(",")
                const replacer = `<span class='argumentRegister${string[0].toUpperCase()}'>${string[0]}</span>,<span class='argumentTwo'>${string[1]}</span>`
                line = line.replace(argument, replacer)
            }
        }
    
        return `<span class="line">${line}</span>`
    }


    updateCode(){
        // const combinedHTML = this.code.join("\n");
        // document.querySelector("pre").innerHTML = combinedHTML; 
        const fragment = document.createDocumentFragment();
        fragment.innerHTML = ""
        this.code.forEach((value) => {            
            fragment.innerHTML += value
        });

        document.querySelector("pre").innerHTML = fragment.innerHTML
    }
}
