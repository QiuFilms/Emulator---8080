export class FileManager{
    static #currentFileName = "File.asm"

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
}