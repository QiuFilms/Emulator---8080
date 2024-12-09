export class WorkerManager extends EventTarget{
    dispatchWorkers(workType, ...data){
        const {workerCount, workerFile, workerData, additional} = workType(data)

        let worker = this.createWorker(workerCount, workerFile)
        let response = worker.next()
        while(!response.done){ 
            response.value.worker.postMessage({ workerData: {
                ...workerData,
                chunk: workerData.chunks[response.value.iterator],
                chunksCount: workerData.chunks.length,
                additional: additional()
            }
            });

            const i = response.value.iterator 
            const workerResponse = response.value.worker
            workerResponse.onmessage = (e) => {
                this.dispatchEvent(new CustomEvent('done', {detail: {
                    ...e.data,
                    workerIndex: i
                }}));
                workerResponse.terminate();
            }

            workerResponse.onmessage.onerror = (event) => {
                console.log("There is an error with your worker!");
              };

            response = worker.next()
        }
        // const {chunks, chunkSize} = this.prepareWorkerData(array)

        // for(let [i, chunk] of chunks.entries()){
        //     const worker = new Worker(workerName, {type:"module"});
        //     worker.postMessage({ chunk, chunkIndex: i, additionalData:additionalData });

        //     worker.onmessage = (e) => {
        //         const {chunkIndex, chunk} = e.data

        //         this.dispatchEvent(new CustomEvent('done', {detail: {
        //             chunkIndex:chunkIndex,
        //             chunk:chunk,
        //             chunkSize:chunkSize,
        //             chunkCount: chunks.length
        //         }}));
        //     }
        // }
        // }   
    }


    * createWorker(workerCount, workerFile){
        let i = 0
        while(workerCount > i){
            yield {
                worker: new Worker(workerFile, {type:"module"}),
                iterator: i++
            }
        }
    }
}

export class WorkTypes{
    static findAndChange([array, previous]){
        const data = this.prepareWorkerData(array)
        return {
            workerCount: data.chunks.length,
            workerFile: "workerFindChangeAndReformat.js",
            workerData: data,
            additional: () => this.prepareWorkerData(previous).chunks
        }


    }

    static formatMultipleLines([array]){
        const data = this.prepareWorkerData(array)
        return {
            workerCount: data.chunks.length,
            workerFile: "workerFormatMultipleLines.js",
            workerData: data,
            additional:() => {}
        }
    }

    static prepareWorkerData(array){
        const chunkSize = Math.ceil(array.length / navigator.hardwareConcurrency);
        return this.#splitArray(array, chunkSize)
    }

    static #splitArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return {chunks: chunks, chunkSize: chunkSize};
    }
}