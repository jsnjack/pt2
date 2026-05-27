<script setup>
import "beercss";

import FooterOverview from "./components/FooterOverview.vue";
import ItemList from "./components/ItemList.vue";

import { inject, onMounted, onUnmounted, ref } from "vue";

const eventBus = inject("eventBus");

let portToBackground = null;

const showPopup = ref(true);
const itemsList = ref({});
const filterQuery = ref("");

onMounted(() => {
  // Reset badge text
  browser.action.setBadgeText({ text: "" });

  // Read items from storage
  browser.storage.sync.get(null, function (items) {
    // items is an object with items in storage
    for (let key in items) {
      console.log(`[pt2-popup] found in storage ${key}`, items[key]);
      itemsList.value[key] = items[key];
    }
  });

  // Watch storage updates
  browser.storage.onChanged.addListener(function (changes) {
    console.log("[pt2-popup] storage changed: ", changes);
    for (let key in changes) {
      eventBus.emit("itemUpdateFinished", { key: key });
      if (changes[key].newValue) {
        itemsList.value[key] = changes[key].newValue;
      } else {
        delete itemsList.value[key];
      }
    }
  });

  // Connect to the background script
  portToBackground = browser.runtime.connect({ name: "popup" });
  portToBackground.onMessage.addListener(function (msg) {
    console.log("[pt2-popup] received msg from background script:", msg);
  });

  eventBus.on("updateItem", (payload) => {
    console.log(
      `[pt2-popup] asking background script to update ${payload.key}`,
    );
    portToBackground.postMessage({ signalID: "update-item", key: payload.key });
    eventBus.emit("itemUpdateStarted", { key: payload.key });
  });

  eventBus.on("addNewItem", (payload) => {
    console.log("[pt2-popup] asking background script to add a new item");
    showPopup.value = false;

    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      let currentTab = tabs[0];
      if (!currentTab) {
        return;
      }
      console.log(
        `[pt2-popup] injecting inject.js in the current tab (linked to ${payload.linkedTo})`,
      );
      function setLinkedTo(linkedTo) {
        document.body.setAttribute("pt2-linked-to", linkedTo);
      }
      browser.scripting.executeScript({
        target: {
          tabId: currentTab.id,
        },
        func: setLinkedTo,
        args: [payload.linkedTo || ""],
      });

      browser.scripting.executeScript({
        target: {
          tabId: currentTab.id,
        },
        files: ["inject.js"],
      });
    });
  });
});

onUnmounted(() => {
  // Disconnect from the background script
  if (portToBackground) {
    portToBackground.disconnect();
    portToBackground = null;
  }
});
</script>

<template>
  <main v-show="showPopup" class="popup-shell">
    <div class="filter-bar">
      <label class="filter-field">
        <i>search</i>
        <input
          v-model="filterQuery"
          aria-label="Filter items"
          placeholder="Filter"
          type="search"
        />
        <button
          v-if="filterQuery"
          aria-label="Clear filter"
          class="small transparent circle"
          type="button"
          @click="filterQuery = ''"
        >
          <i>close</i>
        </button>
      </label>
    </div>
    <ItemList :filter-query="filterQuery" :items="itemsList" />
    <FooterOverview @toggle-popup="showPopup = false" />
  </main>
</template>

<style scoped>
.popup-shell {
  display: flex;
  flex-direction: column;
  min-height: 360px;
}

.filter-bar {
  background-color: var(--surface-container-lowest);
  padding: 6px 8px 4px;
}

.filter-field {
  align-items: center;
  background-color: var(--surface-container);
  border: 1px solid var(--outline-variant);
  border-radius: 6px;
  display: flex;
  gap: 6px;
  height: 32px;
  padding: 0 8px;
}

.filter-field > i {
  font-size: 18px;
}

.filter-field > input {
  background: transparent;
  border: 0;
  flex: 1;
  font: inherit;
  height: 100%;
  min-width: 0;
  outline: 0;
  padding: 0;
}

.filter-field > button {
  block-size: 24px;
  inline-size: 24px;
  min-block-size: 24px;
  min-inline-size: 24px;
}
</style>
