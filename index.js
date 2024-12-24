import { CodeFormatter, regex8Bit } from "./CodeFormatter.js";
import { Exeption } from "./Exeption.js";
import { FileManager } from "./FileManager.js";
import { instructionsDefinitions } from "./instructionsDefinitions.js";
import { Lexer } from "./Lexer.js";
import { Processor } from "./Processor.js";
import { Memory } from "./Processor/Memory.js";
import { Stack } from "./Processor/Stack.js";
import { UIBridge } from "./Processor/UIBridge/UIBridge.js";
import { Utils } from "./utils.js";

var document = window.document

window.addEventListener('load', function() {  
    if(typeof FileManager.getRecent() != "undefined"){
        textarea.value = FileManager.getRecent() 
        textarea.selectionEnd = 0
        simulateInput("input", "textarea")
    }else{
        FileManager.prepareMemory()
    }
})

window.addEventListener('beforeunload', function() {  
    FileManager.saveToRecent(document.querySelector("textarea").value)
})


const textarea = document.querySelector("textarea");


const Bridge = new UIBridge()
function readASM(){
    if(document.querySelector("pre").querySelector(".currentLineEdited")){
        document.querySelector("pre > .currentLineEdited").classList.toggle("currentLineEdited")
    }

    const text = document.querySelector("textarea").value
    document.querySelector(".display").innerText = ""

    const memory = new Memory()
    const lexer = new Lexer(memory)
    const response = lexer.parse(text)
    
    const proc = new Processor(lexer, Bridge, this)
    //proc.setOrigin(lexer.getOrigin())
    
    
    document.querySelector(".stop").onclick = () => {
        if(proc.isEnd){
            simulateInput("keypress", "body")
        }
        stopASM(proc)
    }
    if(!response.status){
        return new Exeption(response.error.line, response.error.instruction).throw()
    }
    Exeption.hide()
    
    //proc.setLinePcAssociation(lexer.getAssociation())
    Bridge.setLinePcAssociation(lexer.getAssociation())
    Bridge.setBreakPoints(breakPoints)
    
    
    //Processor.setBreakPoints(breakPoints)
    //proc.setWorkType(this).init(response)
    //proc.setWorkType(this)
    //console.log(proc.Memory);
    
    document.querySelector(".start").style.display = "none"
    document.querySelector(".step").style.display = "none"
    document.querySelector(".stop").style.display = "flex"

    proc.start()

    //console.log(proc.Memory);

    
}

Bridge.addEventListener('running_updateRegisters', (e) => { 
    document.querySelector("#registerAvalue").innerText = `${e.detail.caller.Registers.A}H`
    document.querySelector("#registerBvalue").innerText = `${e.detail.caller.Registers.B}H`
    document.querySelector("#registerCvalue").innerText = `${e.detail.caller.Registers.C}H`
    document.querySelector("#registerDvalue").innerText = `${e.detail.caller.Registers.D}H`
    document.querySelector("#registerEvalue").innerText = `${e.detail.caller.Registers.E}H`
    document.querySelector("#registerHvalue").innerText = `${e.detail.caller.Registers.H}H`
    document.querySelector("#registerLvalue").innerText = `${e.detail.caller.Registers.L}H`

    document.querySelector("#registerPCvalue").innerText = `${e.detail.caller.ProgramCounter.toHex()}H`
    document.querySelector("#registerSPvalue").innerText = `${e.detail.caller.Stack.Pointer}H`
    
    document.querySelector("#flagSvalue").innerText = e.detail.caller.FlagRegister.getSign()
    document.querySelector("#flagZvalue").innerText = e.detail.caller.FlagRegister.getZero()
    document.querySelector("#flagACvalue").innerText = e.detail.caller.FlagRegister.getAuxillaryCarry()
    document.querySelector("#flagPvalue").innerText = e.detail.caller.FlagRegister.getParity()
    document.querySelector("#flagCYvalue").innerText = e.detail.caller.FlagRegister.getCarry()
});

Bridge.addEventListener('running_switchCodeEditorInput', (e) => {
    changePointerEvents()
})



Bridge.addEventListener('running_highLightLine', (e) => {
    const currentLineHighlight = document.querySelector("pre").querySelectorAll(".currentLine")[0]
    if(document.querySelector("pre").querySelectorAll(".currentLine").length != 0) currentLineHighlight.classList.remove("currentLine")


    //console.log(e.target.linePcAssociation[e.target.ProgramCounter.get()], e.target.linePcAssociation);
    
    if(typeof Bridge.getLineFromPC(e.detail.caller.ProgramCounter.get()) != 'undefined'){
        document.querySelectorAll("pre > span")[Bridge.getLineFromPC(e.detail.caller.ProgramCounter.get()) - 1].classList.add("currentLine")
    } 
})

Bridge.addEventListener('running_hexHighlight', (e) => {
    const currentHexHighlight = document.querySelector(".hexValues").querySelectorAll(".hexHighlight")[0]
    if(document.querySelector(".hexValues").querySelectorAll(".hexHighlight").length != 0) currentHexHighlight.classList.remove("hexHighlight")
    
        
    document.querySelector(`.hexValues > #PC${e.detail.caller.ProgramCounter.get()}`).classList.add("hexHighlight")
    document.querySelector(".hexHighlight").scrollIntoView({behavior: "smooth", block: "center", inline: "center"})

})

Bridge.addEventListener('stop', (e) => {
    stopASM(e.detail.caller)
})

Bridge.addEventListener('break', (e) => {
    const currentLineHighlight = document.querySelector("pre").querySelectorAll(".currentLine")[0]
    document.querySelector("textarea").focus()
    document.querySelector("textarea").style.pointerEvents = ""
    currentLineHighlight.classList.remove("currentLine")
})

Bridge.addEventListener('init', (e) => {
    if(e.detail.caller.isStep){
        document.querySelector("body").addEventListener("keypress", e.detail.caller.stepInputListener) 
    } 
})

Bridge.addEventListener('running_displayUpdate', (e) => {
    document.querySelector(".display").blur()
    document.querySelector(".display").textContent += String.fromCharCode(e.which)
    document.querySelector(".display").removeEventListener('keypress', e.detail.caller.inputListener)
})

Bridge.addEventListener('start', (e) => {
    if(document.querySelector("textarea").style.pointerEvents != "none") changePointerEvents()
})

Bridge.addEventListener('checkIfLineInView', (e) => {
    checkIfLineInView()
})

function stopASM(proc){
    document.querySelector(".hexValues").innerHTML = ""
    document.querySelector(".display").removeEventListener('keypress', proc.inputListener)
    
    document.querySelector("body").removeEventListener('keypress', proc.stepInputListener)
    document.querySelector(".stop").style.display = "none"
    document.querySelector(".start").style.display = "flex"
    document.querySelector(".step").style.display = "flex"
    
    if(document.querySelector("pre").querySelector(".currentLine")){
        document.querySelector("pre").querySelectorAll(".currentLine")[0].classList.remove("currentLine")
    }
    
    document.querySelector("textarea").focus()
    document.querySelector("textarea").style.pointerEvents = ""

}
window.stopASM = stopASM



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
    
    //EditorLineIndicator
    if(document.querySelector("pre").childNodes.length != 0){
        if(document.querySelector("pre").querySelector(".currentLineEdited")){
            document.querySelector("pre > .currentLineEdited").classList.toggle("currentLineEdited")
        }
        
        
        if(row <= document.querySelector("pre").childNodes.length){
            document.querySelectorAll("pre > span")[row - 1].classList.toggle("currentLineEdited")
        }
    }
    ////
    
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
        //console.log(instruction.getBoundingClientRect());

        
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
    Exeption.hideHighlighAffectedLine()
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
        simulateInput("input", "textarea")

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




document.querySelector(".fileInput").addEventListener("change", function(event) {
    
    const file = event.target.files[0]
    
    if(file){
        FileManager.read(file, (e) => {
            const textarea = document.querySelector("textarea");
            textarea.value = e.target.result;
            this.value = ""
            
            simulateInput("input", "textarea")
        })  
    }
});

document.querySelector(".saveButton").addEventListener("click", function(event) {
    const name = document.querySelector(".fileName").value
    const type = document.querySelector(".saveType").value

    if(type == "1"){
        FileManager.save(document.querySelector("textarea").value, name)
    }else{
        FileManager.addToMemory(document.querySelector("textarea").value, name)
    }
    //FileManager.save(document.querySelector("textarea").value)
});


document.querySelector('.errorMessage').addEventListener('click', () =>  Exeption.hide())


function simulateInput(event, element){
    const textarea = document.querySelector(element);

    const keyupEvent = new KeyboardEvent(event, {
        key: "a",
        code: "KeyA",
        keyCode: 65, 
        charCode: 0, 
        bubbles: true, 
        cancelable: true 
    });
    
    textarea.dispatchEvent(keyupEvent);
}




function checkIfLineInView(){  
        const observerCallback = (entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) {
                    const container = document.querySelector(".left");
                    const element = document.querySelector(".currentLine");
            
            
                    const containerRect = container.getBoundingClientRect();
                    const elementRect = element.getBoundingClientRect();

                    document.querySelector(".left").scrollTo({
                        top: elementRect.top - containerRect.top + container.scrollTop - 50,
                        behavior: "smooth",
                    });
                }
                observer.disconnect()
                    
            });
        }  
                    
        const observer = new IntersectionObserver(observerCallback, { root: null, threshold: 0 });

        observer.observe(document.querySelector(".currentLine"));
        
}


document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 's'){
        // if(localStorage.get(FileManager.currentFileName()) != document.querySelector("textarea").value){
        //     localStorage.setItem(FileManager.currentFileName(), document.querySelector("textarea").value)
        // }
        localStorage.setItem(FileManager.currentFileName(), document.querySelector("textarea").value)
        
      event.preventDefault();
    }

    if ((event.shiftKey || event.metaKey) && event.key === 'F10'){
        if(document.querySelector(".start").style.display == "none"){
            document.querySelector(".stop").click()
        }else{
            document.querySelector(".start").click()
        }
      event.preventDefault();

    }
});



document.querySelector(".customFileInput").addEventListener("click", (e) => {
    e.stopPropagation()
    document.querySelector(".files").classList.toggle("filesOpened")
    document.querySelector(".files > ul")

    const files = FileManager.getFiles()
    const ul = document.querySelector(".files > ul")

    while (ul.children.length > 3) {
        ul.removeChild(ul.children[3]);
    }

    for (const file in files) {
        const li = document.createElement("li")
        li.innerText = file
        li.onclick = () => {
            document.querySelector("textarea").value = files[file]
            FileManager.saveToRecent(files[file])
            FileManager.setCurrentFileName(file)
            textarea.selectionEnd = 0

            simulateInput("input", "textarea")
            simulateInput("keyup", "textarea")

            document.querySelector(".files").classList.toggle("filesOpened")


        }
        document.querySelector(".files > ul").appendChild(li)
    }
    
    function closeFiles(){
        if(document.querySelector(".files").classList.contains("filesOpened")){
            document.querySelector(".files").classList.toggle("filesOpened")
        }

        document.removeEventListener('click', closeFiles)
    }

    document.addEventListener('click', closeFiles);
})




document.querySelector(".upload").addEventListener("click", (e) => {
    e.stopPropagation()

    document.querySelector(".fileInput").click()
    //document.querySelector(".files").classList.toggle("filesOpened")
})

document.querySelector(".saveAs").addEventListener("click", (e) => {
    e.stopPropagation()

    document.querySelector(".files").classList.toggle("filesOpened")
    document.querySelector(".saveFileModal").showModal()

})

document.querySelector(".saveInBrowser").addEventListener("click", (e) => {
    e.stopPropagation()

    document.querySelector(".files").classList.toggle("filesOpened")
    FileManager.saveToRecent(document.querySelector("textarea").value)
})