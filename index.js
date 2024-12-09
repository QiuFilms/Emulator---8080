import { CodeFormatter, regex8Bit } from "./CodeFormatter.js";
import { instructionsDefinitions } from "./instructionsDefinitions.js";
import { Lexer } from "./Lexer.js";
import { Processor } from "./Processor.js";
import { Stack } from "./stack.js";
import { Utils } from "./utils.js";

var document = window.document

window.addEventListener('load', function() {  
    
})


const textarea = document.querySelector("textarea");

const proc = new Processor()
function readASM(){
    //button.style.pointerEvents = "none"

    //document.querySelector(".display").textContent = ""
    const text = document.querySelector("textarea").value

    const lexer = new Lexer()
    lexer.init(text)
    console.log(lexer.Memory);
    
    proc.setLinePcAssociation(lexer.getAssociation())
    Processor.setBreakPoints(breakPoints)
    proc.setWorkType(this).init(lexer)
    proc.start()
    //console.log(proc.Memory);
}

proc.addEventListener('running_updateRegisters', (e) => {
    document.querySelector("#registerAvalue").innerText = `${e.target.Registries.A}H`
    document.querySelector("#registerBvalue").innerText = `${e.target.Registries.B}H`
    document.querySelector("#registerCvalue").innerText = `${e.target.Registries.C}H`
    document.querySelector("#registerDvalue").innerText = `${e.target.Registries.D}H`
    document.querySelector("#registerEvalue").innerText = `${e.target.Registries.E}H`
    document.querySelector("#registerHvalue").innerText = `${e.target.Registries.H}H`
    document.querySelector("#registerLvalue").innerText = `${e.target.Registries.L}H`
    document.querySelector("#registerPCvalue").innerText = `${Utils.DecimalToHex16Bit(e.target.PC)}H`
    document.querySelector("#registerSPvalue").innerText = `${Stack.Pointer}H`
    
    document.querySelector("#flagSvalue").innerText = e.target.FlagReg.S
    document.querySelector("#flagZvalue").innerText = e.target.FlagReg.Z
    document.querySelector("#flagACvalue").innerText = e.target.FlagReg.AC
    document.querySelector("#flagPvalue").innerText = e.target.FlagReg.P
    document.querySelector("#flagCYvalue").innerText = e.target.FlagReg.CY
});

proc.addEventListener('running_switchCodeEditorInput', (e) => {
    changePointerEvents()
})



proc.addEventListener('running_highLightLine', (e) => {
    const currentLineHighlight = document.querySelector("pre").querySelectorAll(".currentLine")[0]
    if(document.querySelector("pre").querySelectorAll(".currentLine").length != 0) currentLineHighlight.classList.remove("currentLine")
    if(typeof e.target.linePcAssociation[e.target.PC]-1 != 'undefined') document.querySelectorAll("pre > span")[e.target.linePcAssociation[e.target.PC]-1].classList.add("currentLine")    
})

proc.addEventListener('stop', (e) => {
    const currentLineHighlight = document.querySelector("pre").querySelectorAll(".currentLine")[0]
    document.querySelector("textarea").focus()
    document.querySelector("textarea").style.pointerEvents = ""
    currentLineHighlight.classList.remove("currentLine")
})

proc.addEventListener('init', (e) => {
    document.querySelector(".display").removeEventListener('keypress', e.target.inputListener)
    document.querySelector(".display").removeEventListener('keypress', e.target.stepInputListener)
    
    if(e.target.isStep) document.querySelector("body").addEventListener("keypress", e.target.stepInputListener) 
    
})

proc.addEventListener('running_displayUpdate', (e) => {
    document.querySelector(".display").blur()
    document.querySelector(".display").textContent += String.fromCharCode(e.which)
    document.querySelector(".display").removeEventListener('keypress', e.target.inputListener)
})

proc.addEventListener('start', (e) => {
    if(document.querySelector("textarea").style.pointerEvents != "none") changePointerEvents()
})


function changePointerEvents(){
    let textarea = document.querySelector("textarea")

    if(textarea.style.pointerEvents == "none"){
        textarea.style.pointerEvents = ""
    }else{
        textarea.style.pointerEvents = "none"
    }
}

window.auto_grow = auto_grow
window.readASM = readASM



function getCaretRow() {
    const caretPos = textarea.selectionStart; 
    const text = textarea.value;
    
    const lines = text.split("\n");
    
    let currentPos = 0;
    for (let i = 0; i < lines.length; i++) {
        currentPos += lines[i].length + 1;
        
        if (caretPos < currentPos) {
            return i + 1;
        }
    }
    return lines.length
}

function showDefinition(){
    const hoverElement = document.querySelector(".def")
    const row = getCaretRow()
    const parser = new DOMParser()

    
    if(!(typeof codeFormatter.code[row - 1] != 'undefined' && codeFormatter.code[row - 1].length)){

        hoverElement.style.display = "none"
        document.querySelector(".definition").style.display = "none"
        return
    }

    const def = parser.parseFromString(codeFormatter.code[row - 1], "text/html")
    if(!def){
        hoverElement.style.display = "none"
        document.querySelector(".definition").style.display = "none"
        return
    }

    const instruction = def.querySelector("[class^=instruction]")
    if(!instruction){
        hoverElement.style.display = "none"
        document.querySelector(".definition").style.display = "none"
        return
    }


    if(instruction.innerText.trim().toLowerCase() in instructionsDefinitions){
        hoverElement.style.display = "flex"
        
        //document.querySelector(".definition").style.display = "block"
        document.querySelector(".definition").innerHTML = `<span class='${instruction.className}'>${instruction.innerText.trim().toUpperCase()}</span> - ${instructionsDefinitions[instruction.innerText.trim().toLowerCase()]}`
        console.log(instruction.getBoundingClientRect());
        
        console.log(row);
        
        document.querySelector(".definition").style.top =  row == 1 ? 26 + "px" : 24 * (row - 1) - 18 + "px" 
        //console.log(24 * (row) - 4 + "px");
        
        hoverElement.style.top = 5 + 24 * (row - 1) + "px"
    }

}

// Event listener to log the row number
textarea.addEventListener("input", showDefinition);
textarea.addEventListener("click", showDefinition);
textarea.addEventListener("keyup", showDefinition);

document.querySelector(".def").addEventListener("mouseenter",() => {
    document.querySelector(".definition").style.display = "block"
})

document.querySelector(".def").addEventListener("mouseleave",() => {
    document.querySelector(".definition").style.display = "none"
})

const breakPoints = new Set()
window.breakPoints = breakPoints



function addBreakPoint(){
    if(!this.classList.contains("breakPoint")){
        breakPoints.add(parseInt(this.innerText))
        this.classList.add("breakPoint")
        Processor.setBreakPoints(breakPoints)
        return
    }

    breakPoints.delete(parseInt(this.innerText))
    this.classList.remove("breakPoint")
}
window.addBreakPoint = addBreakPoint


let previousValue = document.querySelector("textarea").value.split("\n");

let isInserted
document.querySelector("textarea").addEventListener("input", function(e){
    isInserted =  e.inputType == "insertFromPaste"
    
    const currentValue = this.value.split("\n");
    handleNew(currentValue, e)

    previousValue = currentValue
})

document.querySelector("textarea").addEventListener("focus", function(e){
    document.querySelector("pre").querySelectorAll(".currentLine").length == 0 ? null : document.querySelector("pre").querySelectorAll(".currentLine")[0].classList.remove("currentLine")
})


const codeFormatter = new CodeFormatter([""])

function handleNew(currentValue){
    if((currentValue.length == 1 && previousValue == "")){  
        codeFormatter.updateLine(currentValue[0], 0)
        return
    }

    codeFormatter.onChange(currentValue, previousValue)

    codeFormatter.addEventListener("updateBreakPoints", (e) => {
        //e.detail
    })


    const row  = getCaretRow()


    if(currentValue.length == previousValue.length && typeof codeFormatter.code[row - 1] != "undefined"){
        if(typeof document.querySelectorAll("pre > span")[row - 1] != 'undefined'){
            const parser = new DOMParser()
            codeFormatter.code[row - 1] = CodeFormatter.formatLine(currentValue[row - 1])
            
            document.querySelectorAll("pre > span")[row - 1].innerHTML = parser.parseFromString(codeFormatter.code[row - 1], "text/html").querySelector("span").innerHTML
        }

        return
    }
}



document.querySelector('textarea').addEventListener('keydown', function(e) {
    if (e.key == 'Tab') {
        
        e.preventDefault();
        let start = this.selectionStart;
        let end = this.selectionEnd;
    
        // set textarea value to: text before caret + tab + text after caret
        this.value = this.value.substring(0, start) +
          "\t" + this.value.substring(end);
    
        // put caret at right position again
        this.selectionStart =
        this.selectionEnd = start + 1;
    }
})

document.querySelector('textarea').addEventListener('keyup', function(e) {
    let linesNumber = document.querySelectorAll(".lineIndicator > li").length
    let lines = codeFormatter.code.length

    while(linesNumber < lines){
        let newLi = document.createElement("li")
        
        newLi.innerText = parseInt(document.querySelectorAll(".lineIndicator > li").length) + 1
        document.querySelector(".lineIndicator").appendChild(newLi)
        newLi.onclick = () => addBreakPoint.call(newLi)
        linesNumber = document.querySelectorAll(".lineIndicator > li").length
    }
    if(lines == linesNumber) return

    while(linesNumber > lines){
        if(lines == 0) break
        document.querySelector(".lineIndicator").removeChild(document.querySelector(".lineIndicator").lastChild)
        linesNumber = document.querySelectorAll(".lineIndicator > li").length
    }
  });

function auto_grow(element) {
    element.style.height = "0px";
    element.style.height = (element.scrollHeight) - 14 > element.parentElement.clientHeight ? (element.scrollHeight) - 14 + "px" : 0;

}


