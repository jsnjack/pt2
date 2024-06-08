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
import { defineEmits, inject } from "vue";

const eventBus = inject("eventBus");

const emit = defineEmits(["addNewItem"]);

function addNewItem() {
  eventBus.emit("addNewItem", {});
}
</script>

<style scoped>
.footer {
  background-color: var(--primary-container);
}
</style>
