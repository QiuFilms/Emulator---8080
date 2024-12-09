import { CodeFormatter } from "./CodeFormatter";

self.onmessage = (e) => {
    const { chunk, chunkSize, additional } = e.data.workerData;
    
    // Process the chunk (example: multiply each element by 2)
    for (const [i, text] of chunk.entries()) {
        if(chunk[i] != additional[i]){
            chunk[i] = CodeFormatter.formatLine(text)
            self.postMessage({ data:{
                line: chunk[i],
                lineIndex: i,
                chunkSize : chunkSize
            }});
            break
        }
    }

};
