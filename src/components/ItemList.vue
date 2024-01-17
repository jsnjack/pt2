<template>
  <div class="medium-height middle-align center-align padding" style="background-color: var(--surface-container-lowest)"
    v-if="Object.keys(props.items).length === 0">
    <div class="center-align">
      <i class="extra">orders</i>
      <h5>You have no items to track</h5>
    </div>
  </div>
  <Item v-for="item in orderedItemsList" :key="item.key" :item="item" :itemKey="item.key" />
</template>

<script setup>
import Item from "./Item.vue";
import { defineProps, computed } from "vue";

const props = defineProps({
  items: {
    type: Object,
    required: true,
  },
});

const orderedItemsList = computed(() => {
  let orderedItems = [];
  for (let key in props.items) {
    orderedItems.push(props.items[key]);
    orderedItems[orderedItems.length - 1].key = key;
  }
  return orderedItems.sort((a, b) => {
    return a.title.localeCompare(b.title);
  });
});
</script>

<style scoped>
</style>
