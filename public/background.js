let portToPopup;

browser.runtime.onConnect.addListener(function (port) {
    console.log("[pt2-background] Connected to popup script");
    portToPopup = port;

    // Listen for messages from the popup script
    portToPopup.onMessage.addListener(function (msg) {
        console.log("[pt2-background] Received message from popup script: ", msg);
        if (msg.signalID === "update-item") {
            // The user wants to update the item
            updateItem(msg.key);
        }
    });

    // Listen for the disconnect event
    portToPopup.onDisconnect.addListener(function () {
        console.log("[pt2-background] Disconnected from popup script");
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
    console.log(`[pt2-background-${key}] Updating item ...`);
    browser.storage.sync.get(key).then(function (result) {
        console.log(`[pt2-background-${key}] Found in storage:`, result);
        let item = result[key];
        console.log(`[pt2-background-${key}] Fetchning URL ${item.url}...`);
        fetch(item.url).then(function (response) {
            console.log(`[pt2-background-${key}] status: ${response.status} ${response.statusText}`);
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
            console.log(`[pt2-background-${key}]`, error);
        });
    });
}
