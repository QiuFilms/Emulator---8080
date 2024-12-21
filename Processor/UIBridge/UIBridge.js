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
        //console.log(name);
        
        this.dispatchEvent(this.events[name])
    }

    setBreakPoints(breakPoints){
        this.breakPoints = breakPoints
    }


    getBreakPoints(breakPoints){
        this.breakPoints = breakPoints
    }

    hasBreakPoint(programCounter){
        return this.breakPoints.has(programCounter in this.linePcAssociation ? this.linePcAssociation[programCounter] : -1)
    }

    setLinePcAssociation(assoc){
        this.linePcAssociation = assoc
    }

    getLinePcAssociation(){
        return this.linePcAssociation
    }
    

    getLineFromPC(programCounter){
        return this.linePcAssociation[programCounter]
    }


    scrollToLine(line){
        this.dispatch("scrollToLine", line)
    }
}