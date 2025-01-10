export class Exeption{
    constructor(line, instruction){
        this.line = line
        this.instruction = instruction
        this.throw()
    }

    throw(){
        if(this.instruction === null){
            document.querySelector(".errorMessage").innerText = `Error at line ${this.line}: The instruction does not exist.`
        }else{
            document.querySelector(".errorMessage").innerText = `Error at line ${this.line}: The arguments does not corespond to the arguments required by instruction ${this.instruction.toUpperCase()}.`
        }

        const errorMessage = document.querySelector(".errorMessage")
        errorMessage.classList.remove("errorMessageSlideOut");
        errorMessage.classList.add("errorMessageSlideIn");
        

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
        const errorMessage = document.querySelector(".errorMessage")
        if(errorMessage.classList.contains("errorMessageSlideIn")){
            errorMessage.classList.remove("errorMessageSlideIn");
            errorMessage.classList.add("errorMessageSlideOut");
        }

        this.hideHighlighAffectedLine()
    }
}