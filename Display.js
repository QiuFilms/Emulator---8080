const channel = new BroadcastChannel('app_channel');

export class Display{
    static #type = 0

    static setType(type){
        Display.#type = type
    }

    static openInTab(){
        window.open("http://127.0.0.1:5500/tab.html")
    }

    
    static update(content){
        if(Display.#type == 1){
            channel.postMessage({ content: content, actionID: 1 });
        }else{
            document.querySelector(".display").innerText += content
            document.querySelector(".display").scrollTo(0, document.querySelector(".display").scrollHeight);

        }
    }

    static clear(){
        if(Display.#type == 1){
            channel.postMessage({ content: content, actionID: 2 });
        }else{
            document.querySelector(".display").innerText = ""

        }
    }
}


channel.onmessage = (event) => {
  if(event.data.code == 1){
    Display.setType(1)
  }

if(event.data.code == 0){
    Display.setType(0)
  }

};
