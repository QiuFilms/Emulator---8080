export class Labels{
    #labels = {}

    add(key, value){
        this.#labels[key] = value
    }

    get(key){
        return this.#labels[key]
    }
}