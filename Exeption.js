export class Exeption{
    constructor(line, instruction){
        this.line = line
        this.instruction = instruction
    }

    throw(){
        document.querySelector(".errorMessage").style.display = "block"

        if(this.instruction === null){
            document.querySelector(".errorMessage").innerText = `Error at line ${this.line}: The instruction does not exist.`
        }else{
            document.querySelector(".errorMessage").innerText = `Error at line ${this.line}: The arguments does not corespond to the arguments required by instruction ${this.instruction.toUpperCase()}.`
        }
        this.showHighlighAffectedLine()
    }

    showHighlighAffectedLine(){
        console.log(document.querySelectorAll("pre > span"));
        
        document.querySelectorAll("pre > span")[this.line - 1].classList.add("errorHighlight")
    }

    static hideHighlighAffectedLine(){
        const highlight = document.querySelector(".errorHighlight")
        if(highlight) highlight.classList.remove("errorHighlight")
    }

    static hide(){
        document.querySelector(".errorMessage").style.display = "none"
        this.hideHighlighAffectedLine()
    }
}