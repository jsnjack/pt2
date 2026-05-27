<template>
  <div
    class="row item no-margin"
    :class="{ 'is-drag-over': isDragOver }"
    draggable="true"
    @auxclick.middle.prevent.stop="openWithoutClosing"
    @dragend="finishDrag"
    @dragleave="finishDrag"
    @dragover.prevent="showDropTarget"
    @dragstart.stop="startDrag"
    @drop.prevent.stop="dropItem"
    @mousedown.middle.prevent.stop
  >
    <div class="small-padding" style="cursor: pointer" @click="open">
      <div>{{ hostname }}</div>
    </div>
    <div class="small-padding max" style="text-align: right">
      <div class="large-text">{{ price }}</div>
    </div>
  </div>
</template>

<script setup>
import { extractPriceAndCurrency } from "@/assets/prices";
import { mergeDraggedItemInto, startItemDrag } from "@/itemDragDrop";
import { computed, defineProps, ref } from "vue";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  itemKey: {
    type: String,
    required: true,
  },
});

const isDragOver = ref(false);

const hostname = computed(() => {
  let url = new URL(props.item.url);
  return url.hostname;
});

const price = computed(() => {
  if (!props.item.currentValue) {
    return "N/A";
  }
  let price = extractPriceAndCurrency(props.item.currentValue);
  if (!price) {
    return "N/A";
  }
  return `${price.price} ${price.currency}`;
});

function open() {
  browser.tabs.create({ url: props.item.url });
  window.close();
}

function openWithoutClosing() {
  browser.tabs.create({ active: false, url: props.item.url });
}

function startDrag(event) {
  startItemDrag(event, props.itemKey);
}

function showDropTarget() {
  isDragOver.value = true;
}

function finishDrag() {
  isDragOver.value = false;
}

async function dropItem(event) {
  finishDrag();
  await mergeDraggedItemInto(event, props.itemKey);
}
</script>
<style scoped>
.is-drag-over {
  outline: 2px dashed var(--primary);
  outline-offset: -2px;
}
</style>
