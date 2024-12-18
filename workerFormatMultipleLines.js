import { CodeFormatter } from "./CodeFormatter.js"; 

self.onmessage = (e) => {
    const { chunk, chunkSize, chunksCount } = e.data.workerData;
    
    // Process the chunk (example: multiply each element by 2)
    for (const [i, text] of chunk.entries()) {
        chunk[i] = CodeFormatter.formatLine(text)
        //updateLine(chunk, text, i)
    }

    // Send the modified chunk back to the main thread
    self.postMessage({ data : {
        chunk: chunk,
        chunkSize: chunkSize,
        chunksCount: chunksCount
    }});
};


