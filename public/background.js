let portToPopup;

browser.runtime.onConnect.addListener(function (port) {
    console.log("Connected to popup script");
    portToPopup = port;

    // Listen for messages from the popup script
    portToPopup.onMessage.addListener(function (msg) {
        console.log("Received message from popup script: ", msg);
        if (msg.signalID === "update-item") {
            // The user wants to update the item
            console.log("Update item " + msg.key);
            updateItem(msg.key);
        }
    });

    // Listen for the disconnect event
    portToPopup.onDisconnect.addListener(function () {
        console.log("Disconnected from popup script");
    });
});

browser.runtime.onMessage.addListener(
    function (message, sender, sendResponse) {
        if (message.signalID === "inject-return-data") {
            // The user wants to add the new item
            browser.action.setBadgeText({ text: "1" });
            // Generate unique id
            let id = "" + new Date().getTime();
            let obj = {};
            obj[id] = message.data;
            // Add new item to storage
            browser.storage.sync.set(obj);
        }

    }
);

function updateItem(key) {
    console.log(`Background script is updating item ${key}...`);
    browser.storage.sync.get(key).then(function (result) {
        console.log("Found in storage:", result);
        let item = result[key];
        console.log(`Fetchning URL ${item.url}...`);
        fetch(item.url).then(function (response) {
            console.log(`status: ${response.status} ${response.statusText}`);
            return response.text();
        }).then(function (text) {
            let parser = new DOMParser();
            let doc = parser.parseFromString(text, "text/html");
            let value = doc.querySelector(item.selector).textContent;
            let obj = {};
            // API updates item in storage
            obj[key] = {
                currentValue: value,
                initialValue: item.initialValue || value,
                url: item.url,
                selector: item.selector,
                title: item.title,
                lastUpdate: new Date().getTime(),
            };
            browser.storage.sync.set(obj);
        }, function (error) {
            console.log(error);
        });
    });
}
