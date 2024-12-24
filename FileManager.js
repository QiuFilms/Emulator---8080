export class FileManager{
    static #currentFileName = "File.asm"
    static #files

    static setCurrentFileName(name){
        this.#currentFileName = name
    }

    static prepareMemory(){
        if(!localStorage.getItem("files")){
            localStorage.setItem("files", JSON.stringify({}))
            this.#files = {}
        }

        if(!localStorage.getItem("recent")){
            localStorage.setItem("recent", JSON.stringify({}))
        }
    }

    
    static currentFileName(){
        return this.#currentFileName
    }

    static read(file, callback){
        const reader = new FileReader();

        reader.onload = (e) => {
            this.#currentFileName = file.name
            
            callback(e)
        };

        reader.onerror = function (e) {
            console.error("Błąd podczas odczytu pliku:", e.target.error);
        };

        reader.readAsText(file);
    }

    static save(data, name = this.#currentFileName){
        const blob = new Blob([data], {type: 'text/plain'});

        const link = document.createElement('a');  
        link.href = URL.createObjectURL(blob);
        link.download = name;

        link.click();
        URL.revokeObjectURL(link.href);
        //link.remove()
    }

    static loadFromMemory(name){
        localStorage.getItem("files")
        localStorage.getItem(name)
    }

    static addToMemory(data, name = this.#currentFileName){
        const files = JSON.parse(localStorage.getItem("files"))
        files[name] = data
        localStorage.setItem("files", JSON.stringify(files))
        //localStorage.setItem(name, data)
    }

    static saveToRecent(data){
        localStorage.setItem("recent", JSON.stringify(data))
    }

    static getRecent(){
        return JSON.parse(localStorage.getItem("recent"))
    }

    static getFiles(){
        return JSON.parse(localStorage.getItem("files"))
    }
}