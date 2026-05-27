<template>
  <div class="small-padding footer">
    <nav>
      <button class="small" @click="addNewItem">
        <i>add</i>
        <span>Add</span>
      </button>
      <div class="max"></div>
      <div>//pt2</div>
    </nav>
  </div>
</template>

<script setup>
import { inject } from "vue";

const eventBus = inject("eventBus");

function addNewItem() {
  eventBus.emit("addNewItem", {});
}
</script>

<style scoped>
.footer {
  background-color: var(--primary-container);
}
</style>
