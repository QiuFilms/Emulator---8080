const channel = new BroadcastChannel('app_channel');


channel.postMessage({ code: 1});
// Listen for incoming messages
channel.onmessage = (event) => {
  if(event.data.actionID == 1){
    document.querySelector(".display").innerText += event.data.content
    document.querySelector(".display").scrollTo(0, document.querySelector(".display").scrollHeight);

  }

  if(event.data.actionID == 2){
    document.querySelector(".display").innerText = ""
  }
};

window.addEventListener("beforeunload", () => {
  channel.postMessage({ code: 0});
});


