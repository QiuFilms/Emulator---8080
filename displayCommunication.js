
const channel = new BroadcastChannel('app_channel');

// Send a message

function post(content){
    channel.postMessage({ content: content, id: 1 });
}

function openTab(){
    window.open("http://127.0.0.1:5500/tab.html")
}

channel.onmessage = (event) => {
  //console.log('Message received in Tab 2:', event.data.code); // Logs: { message: 'Hello from Tab 1!', user: 'Alex' }

  if(event.data.code == 1){
    post("New Content")
  }
};

window.post = post