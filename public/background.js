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

browser.runtime.onMessage.addListener(function (message) {
  if (message.signalID === "inject-return-data") {
    browser.action.setBadgeText({ text: "1" });
    if (message.data.retargetKey) {
      retargetItem(message.data.retargetKey, message.data);
    } else {
      // Generate unique id
      let id = "item-" + new Date().getTime();
      let obj = {};
      obj[id] = normalizeInjectedItem(message.data);
      // Add new item to storage
      browser.storage.sync.set(obj);
    }
  }
});

function normalizeInjectedItem(item) {
  const timestamp = new Date().getTime();
  return {
    url: item.url,
    selector: item.selector,
    title: item.title,
    linkedTo: item.linkedTo || "",
    pinned: item.pinned || false,
    initialValue: item.initialValue || item.currentValue || "",
    currentValue: item.currentValue || "",
    history: buildHistory(item, item.currentValue || "", timestamp),
    lastUpdate: timestamp,
  };
}

function retargetItem(key, data) {
  browser.storage.sync.get(key).then(function (result) {
    const item = result[key];
    if (!item) {
      return;
    }

    const timestamp = new Date().getTime();
    browser.storage.sync.set({
      [key]: {
        url: data.url,
        selector: data.selector,
        title: item.title || data.title,
        linkedTo: item.linkedTo || "",
        pinned: item.pinned || false,
        initialValue: item.initialValue || data.currentValue || "",
        currentValue: data.currentValue || "",
        history: buildHistory(item, data.currentValue || "", timestamp),
        lastUpdate: timestamp,
      },
    });
  });
}

function getTextContentRecursive(element) {
  if (element === null) {
    return "";
  }
  let textContent = "";
  if (element.hasChildNodes()) {
    element.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        textContent += child.textContent + "\n";
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        textContent += getTextContentRecursive(child);
      }
    });
  }
  return textContent;
}

function buildHistory(item, value, timestamp) {
  const history = Array.isArray(item.history) ? item.history : [];
  const latestValue = history[0]?.value;

  if (latestValue === value) {
    return history;
  }

  return [
    {
      timestamp,
      value,
    },
    ...history,
  ].slice(0, 20);
}

function updateItem(key) {
  console.log(`[pt2-background-${key}] Updating item ...`);
  browser.storage.sync.get(key).then(function (result) {
    console.log(`[pt2-background-${key}] Found in storage:`, result);
    const item = result[key];
    console.log(`[pt2-background-${key}] Fetchning URL ${item.url}...`);
    fetch(item.url)
      .then(function (response) {
        console.log(
          `[pt2-background-${key}] status: ${response.status} ${response.statusText}`,
        );
        return response.text();
      })
      .then(
        function (text) {
          const hostname = new URL(item.url).hostname;
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, "text/html");
          let value = "";
          switch (hostname) {
            case "www.belsimpel.nl": {
              const el = doc.head.querySelector("#head_schema");
              const data = JSON.parse(el.textContent);
              value = `${data.offers.priceCurrency} ${data.offers.price}`;
              break;
            }
            default: {
              // Getting just textContent is not enough, as sometines the full price
              // is divided between multiple html elements
              const el2 = doc.querySelector(item.selector);
              value = getTextContentRecursive(el2);
            }
          }
          let obj = {};
          const timestamp = new Date().getTime();
          // API updates item in storage
          obj[key] = {
            url: item.url,
            selector: item.selector,
            title: item.title,
            linkedTo: item.linkedTo || "",
            pinned: item.pinned || false,
            initialValue: item.initialValue || value,
            currentValue: value,
            history: buildHistory(item, value, timestamp),
            lastUpdate: timestamp,
          };
          console.log(`[pt2-background-${key}] Updating storage to:`, obj);
          browser.storage.sync.set(obj);
        },
        function (error) {
          console.log(`[pt2-background-${key}]`, error);
        },
      );
  });
}
