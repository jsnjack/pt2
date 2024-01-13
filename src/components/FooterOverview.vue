<template>
  <div class="small-padding footer">
    <nav>
      <button @click="addNewItem" class="small">
        <i>add</i>
        <span>Add</span>
      </button>
      <div class="max"></div>
      <div>//pt2</div>
    </nav>
  </div>
</template>

<script setup>

import { defineEmits } from 'vue'

const emit = defineEmits(['togglePopup'])

function addNewItem() {

  console.log("Emitting togglePopup event")
  emit('togglePopup')

  browser.tabs.query({ active: true, currentWindow: true })
    .then((tabs) => {
      let currentTab = tabs[0];
      if (!currentTab) {
        console.log("No active tab found, aborting");
        return;
      }
      console.log("Injecting pt code into current tab...")
      browser.scripting.executeScript({
        target: {
          tabId: currentTab.id,
        },
        files: ["inject.js"]
      });
    })
}
</script>

<style scoped>
.footer {
  background-color: var(--primary-container);
}
</style>
