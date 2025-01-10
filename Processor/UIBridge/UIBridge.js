export class UIBridge extends EventTarget{
    events = new Object()
    breakPoints = new Set();
    lineAssociation = new Object();

    defineEvent(name, caller, data = {}){
        this.events[name] = new CustomEvent(name, { detail : {
            caller: caller,
            ...data
        }})
    }

    dispatch(name){
        this.dispatchEvent(this.events[name])
    }

    defineBreakPoints(){
        this.breakPoints.clear()
        for(const element of document.querySelectorAll(".breakPoint")){
            this.breakPoints.add(element.innerText)
        }
    }

    // setBreakPoints(breakPoints){
    //     this.breakPoints = breakPoints
    // }

    // getBreakPoints(breakPoints){
    //     this.breakPoints = breakPoints
    // }

    hasBreakPoint(programCounter){
        return this.breakPoints.has((programCounter in this.lineAssociation ? this.lineAssociation[programCounter] : -1).toString())
    }

    removeBreakPoint(programCounter){
        this.breakPoints.delete(this.lineAssociation[programCounter].toString())
    } 

    setLinePcAssociation(assoc){
        this.lineAssociation = assoc
    }

    // getLinePcAssociation(){
    //     return this.linePcAssociation
    // }
    

    getLineFromPC(programCounter){
        return this.lineAssociation[programCounter]
    }


    scrollToLine(line){
        this.dispatch("scrollToLine", line)
    }
}