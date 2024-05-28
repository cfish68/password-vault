const socket = new WebSocket('ws://localhost:8081');

// Create a promise resolver map to handle different message types
const resolvers = {};

socket.onopen = function() {
    console.log("Socket connection established!");
};

socket.onerror = function(error) {
    console.error("WebSocket Error: ", error);
};

socket.onmessage = function(event) {
    const data = event.data;
    const type = parseInt(data.charAt(0));
    const success = parseInt(data.charAt(1));

    if (resolvers[type]) {
        if (success === 1) {
            resolvers[type].resolve(data);
        } else {
            resolvers[type].reject(new Error('Operation failed'));
        }
        delete resolvers[type];
    } else {
        console.warn("Received unhandled message type:", type);
    }
};

function sendMessageToServer(messageString, type) {
    return new Promise((resolve, reject) => {
        resolvers[type] = { resolve, reject };
        socket.send(messageString);
    });
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    switch (message.type) {
        case 1:
        case 2:
        case 3:
        case 4:
            try {
                const responseData = await sendMessageToServer(message.data, message.type);
                const website = responseData.slice(2, 12);
                const username = responseData.slice(12, 32);
                const password = responseData.slice(32, 52);
                sendResponse({ success: true, website, username, password });
            } catch (error) {
                sendResponse({ success: false });
            }
            break;
        case 5:
            try {
                await sendMessageToServer(message.data, message.type);
                sendResponse({ success: true });
            } catch (error) {
                sendResponse({ success: false });
            }
            break;

        default:
            console.warn("Unknown message type received:", message.type);
            sendResponse({ success: false });
            break;
    }

    return true;  // indicates that the response is sent asynchronously
});
