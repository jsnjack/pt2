<template>
  <div class="medium-height middle-align center-align padding" style="background-color: var(--surface-container-lowest)"
    v-if="Object.keys(props.items).length === 0">
    <div class="center-align">
      <i class="extra">orders</i>
      <h5>You have no items to track</h5>
    </div>
  </div>
  <Item v-for="item in orderedItemsList" :key="item._key" :item="item" :itemKey="item._key" />
</template>

<script setup>
import { computed, defineProps } from "vue";
import Item from "./Item.vue";

const props = defineProps({
  items: {
    type: Object,
    required: true,
  },
});

const orderedItemsList = computed(() => {
  let orderedItems = [];

  // First, add all items that are not linked to another item (main items)
  for (let key in props.items) {
    if (props.items[key].linkedTo !== "") {
      continue;
    }
    orderedItems.push(props.items[key]);
    orderedItems[orderedItems.length - 1]._key = key;
    orderedItems[orderedItems.length - 1]._linked = [];
  }

  // Then, add all items that are linked to another item (linked items)
  for (let key in props.items) {
    if (props.items[key].linkedTo !== "") {
      let linkedTo = props.items[key].linkedTo;
      let self = props.items[key];
      let linkedToItemIndex = orderedItems.findIndex((item) => item._key === linkedTo);
      if (linkedToItemIndex === -1) {
        console.error(`[ItemList] linked item ${key} is linked to ${linkedTo}, but ${linkedTo} is not in the list. Removing it.`);
        browser.storage.sync.remove(key);
        continue;
      }
      self._key = key;
      orderedItems[linkedToItemIndex]._linked.push(self);
    }
  }
  return orderedItems.sort((a, b) => {
    return a.title.localeCompare(b.title);
  });
});
</script>

<style scoped></style>
