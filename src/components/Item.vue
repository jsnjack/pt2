<template>
  <div
    class="row item no-margin"
    :class="{ 'is-drag-over': isDragOver, 'is-updating': isUpdating }"
    draggable="true"
    @auxclick.middle.prevent.stop="openWithoutClosing"
    @dragend="finishDrag"
    @dragleave="finishDrag"
    @dragover.prevent="showDropTarget"
    @dragstart.stop="startDrag"
    @drop.prevent.stop="dropItem"
    @mousedown.middle.prevent.stop
  >
    <div
      class="small-padding item-summary"
      style="cursor: pointer"
      @click="open"
    >
      <div class="title-line">
        <button
          :aria-label="props.item.pinned ? 'Unpin item' : 'Pin item'"
          class="transparent pin-button"
          :class="{ 'is-pinned': props.item.pinned }"
          type="button"
          @click.prevent.stop="togglePinned"
          @mousedown.stop
        >
          <i>{{ props.item.pinned ? "star" : "star_border" }}</i>
        </button>
        <div class="crop-text">{{ props.item.title }}</div>
      </div>
      <div class="small-text">{{ hostname }}</div>
    </div>
    <!--    There is no change -->
    <div
      v-if="!diff.changed"
      class="small-padding max"
      style="text-align: right"
    >
      <div class="large-text">{{ diff.current }}</div>
    </div>
    <!-- There is a change -->
    <!-- Percentage -->
    <div
      v-if="diff.changed"
      class="small-padding"
      style="text-align: left; min-width: 100px"
      :style="'background-color: ' + changeBackground + ';'"
    >
      <div class="large-text bold" :style="'color: ' + 'white'">
        {{ relativeDiffText }}
      </div>
      <div class="small-text bold" :style="'color: ' + 'white'">
        {{ percText }}
      </div>
    </div>
    <!-- Comparing old and new -->
    <div
      v-if="diff.changed"
      class="small-padding max"
      style="text-align: right"
    >
      <div class="large-text">{{ diff.current }}</div>
      <div class="overline small-text">{{ diff.initial }}</div>
    </div>
    <div class="small-padding" @click="toggleBottomMenu">
      <button class="small circle transparent">
        <i v-if="!showBottomMenu">keyboard_arrow_down</i>
        <i v-else>check</i>
      </button>
    </div>
  </div>

  <div v-show="showBottomMenu" class="row item no-margin">
    <div
      class="field label border small max"
      style="margin-left: 10px; margin-right: 10px"
    >
      <input v-model="newTitle" type="text" class="small" />
      <label>Rename item</label>
    </div>
  </div>

  <div v-show="showBottomMenu" class="row item no-margin">
    <div class="small-padding center">
      <button class="small circle transparent" @click="addLinkedItem">
        <i>library_add</i>
      </button>
      <button class="small circle transparent" @click="retargetItem">
        <i>my_location</i>
      </button>
      <button class="small circle transparent" @click="deleteItem">
        <i>delete</i>
      </button>
    </div>
  </div>

  <div v-if="showBottomMenu && historyEntries.length > 0" class="history-panel">
    <div class="small-text history-title">History</div>
    <div
      v-for="entry in historyEntries"
      :key="entry.timestamp"
      class="history-entry"
    >
      <span class="small-text">{{ entry.time }}</span>
      <span class="history-value">{{ entry.value }}</span>
    </div>
  </div>

  <LinkedItem
    v-for="linkedItem in props.item._linked"
    v-show="showBottomMenu || props.forceShowLinked"
    :key="linkedItem._key"
    :item="linkedItem"
    :item-key="linkedItem._key"
  />
</template>

<script setup>
import { extractPriceAndCurrency } from "@/assets/prices";
import { mergeDraggedItemInto, startItemDrag } from "@/itemDragDrop";
import {
  computed,
  defineProps,
  inject,
  onBeforeUnmount,
  onMounted,
  ref,
} from "vue";
import LinkedItem from "./LinkedItem.vue";

const eventBus = inject("eventBus");

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  itemKey: {
    type: String,
    required: true,
  },
  forceShowLinked: {
    type: Boolean,
    default: false,
  },
});

const isUpdating = ref(false);
const isDragOver = ref(false);
const showBottomMenu = ref(false);
const newTitle = ref("");

const hostname = computed(() => {
  let url = new URL(props.item.url);
  if (props.item._linked.length > 0) {
    return `${url.hostname} +${props.item._linked.length} more`;
  }
  return url.hostname;
});

const minCurrentPrice = computed(() => {
  let minPrice = extractPriceAndCurrency(props.item.currentValue);
  props.item._linked.forEach((linkedItem) => {
    let linkedItemPrice = extractPriceAndCurrency(linkedItem.currentValue);
    if (linkedItemPrice === null) {
      return;
    }
    if (linkedItemPrice.price < minPrice.price) {
      minPrice = linkedItemPrice;
    }
  });
  return minPrice;
});

const diff = computed(() => {
  let data = {
    changed: false,
    current: props.item.currentValue,
    initial: props.item.initialValue,
    diff: 0,
    perc: 0,
    currency: "",
  };
  const parsedCurrent = minCurrentPrice.value;
  const parsedInitial = extractPriceAndCurrency(props.item.initialValue);
  // If any of extractPriceAndCurrency returns null, it means that the price is not valid
  // and we will just show the diff as text
  if (parsedCurrent === null || parsedInitial === null) {
    data.changed = props.item.currentValue !== props.item.initialValue;
    return data;
  }
  console.log(
    `[pt2-popup] parsed current price for ${props.itemKey}`,
    parsedCurrent,
  );
  console.log(
    `[pt2-popup] parsed initial price for ${props.itemKey}`,
    parsedInitial,
  );
  data.changed = parsedCurrent.price !== parsedInitial.price;
  data.diff = parsedCurrent.price - parsedInitial.price;
  console.log(`[pt2-popup] diff for ${props.itemKey}`, data.diff);
  // Round diff to 2 digits
  data.diff = Math.round(data.diff * 100) / 100;
  console.log(`[pt2-popup] diff2 for ${props.itemKey}`, data.diff);
  // Round perc to 2 digits
  data.perc = Math.round((data.diff / parsedInitial.price) * 10000) / 100;

  // Normalize diff with extracted currency
  data.current = `${parsedCurrent.currency}${parsedCurrent.price}`;
  data.initial = `${parsedInitial.currency}${parsedInitial.price}`;
  data.currency =
    parsedCurrent.currency === parsedInitial.currency
      ? parsedCurrent.currency
      : `${parsedCurrent.currency}*`;
  console.log(`[pt2-popup] computed diff for ${props.itemKey}`, data);
  return data;
});

const relativeDiffText = computed(() => {
  if (diff.value.changed) {
    if (diff.value.diff < 0) {
      return `-${diff.value.currency}${Math.abs(diff.value.diff)}`;
    } else {
      return `+${diff.value.currency}${diff.value.diff}`;
    }
  }
  return "";
});

const percText = computed(() => {
  if (diff.value.changed) {
    if (diff.value.diff < 0) {
      return `${diff.value.perc}%`;
    } else {
      return `+${diff.value.perc}%`;
    }
  }
  return "";
});

const changeBackground = computed(() => {
  if (diff.value.changed) {
    if (diff.value.diff < 0) {
      return "green";
    } else {
      return "#d2451e";
    }
  }
  return "";
});

const historyEntries = computed(() => {
  if (!Array.isArray(props.item.history)) {
    return [];
  }

  return props.item.history.slice(0, 5).map((entry) => {
    return {
      timestamp: entry.timestamp,
      time: new Date(entry.timestamp).toLocaleString([], {
        day: "2-digit",
        month: "short",
      }),
      value: entry.value,
    };
  });
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

function deleteItem() {
  browser.storage.sync.remove(props.itemKey);
}

function addLinkedItem() {
  eventBus.emit("addNewItem", { linkedTo: props.itemKey });
}

function retargetItem() {
  eventBus.emit("retargetItem", { key: props.itemKey });
}

function toggleBottomMenu() {
  doRename();
  showBottomMenu.value = !showBottomMenu.value;
}

function doRename() {
  if (newTitle.value === props.item.title || newTitle.value === "") {
    return;
  }
  let obj = { ...props.item };
  obj.title = newTitle.value;
  browser.storage.sync.set({
    [props.itemKey]: removePrivateFields(obj),
  });
}

function togglePinned() {
  browser.storage.sync.set({
    [props.itemKey]: removePrivateFields({
      ...props.item,
      pinned: !props.item.pinned,
    }),
  });
}

function removePrivateFields(item) {
  return Object.fromEntries(
    Object.entries(item).filter(([key]) => !key.startsWith("_")),
  );
}

onMounted(() => {
  eventBus.on("itemUpdateStarted", itemUpdateStartedHandler);
  eventBus.on("itemUpdateFinished", itemUpdateFinishedHandler);
  eventBus.emit("updateItem", { key: props.itemKey });
  props.item._linked.forEach((linkedItem) => {
    eventBus.emit("updateItem", { key: linkedItem._key });
  });
  newTitle.value = props.item.title;
});

onBeforeUnmount(() => {
  eventBus.off("itemUpdateStarted", itemUpdateStartedHandler);
  eventBus.off("itemUpdateFinished", itemUpdateFinishedHandler);
});

function itemUpdateStartedHandler(payload) {
  if (payload.key === props.itemKey) {
    isUpdating.value = true;
  }
}

function itemUpdateFinishedHandler(payload) {
  if (payload.key === props.itemKey) {
    isUpdating.value = false;
  }
}
</script>

<style scoped>
.crop-text {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-summary {
  min-width: 0;
  width: 250px;
}

.title-line {
  align-items: center;
  display: flex;
  gap: 2px;
  min-width: 0;
}

.item {
  background-color: var(--surface-container-lowest);
}

.is-updating {
  filter: blur(2px);
}

.is-drag-over {
  outline: 2px dashed var(--primary);
  outline-offset: -2px;
}

.pin-button.is-pinned {
  background-color: transparent;
  color: var(--primary);
}

.pin-button.is-pinned > i {
  font-variation-settings: "FILL" 1;
}

.pin-button {
  align-items: center;
  block-size: 14px;
  border-radius: 3px;
  display: inline-flex;
  inline-size: 14px;
  justify-content: center;
  margin-left: -6px;
  min-block-size: 14px;
  min-inline-size: 14px;
  opacity: 0.55;
  padding: 0;
}

.pin-button.is-pinned,
.pin-button:hover {
  opacity: 1;
}

.pin-button > i {
  font-size: 14px;
}

.history-panel {
  background-color: var(--surface-container-lowest);
  border-top: 1px solid var(--outline-variant);
  padding: 6px 10px 8px;
}

.history-title {
  color: var(--on-surface-variant);
  margin-bottom: 2px;
}

.history-entry {
  align-items: baseline;
  display: grid;
  gap: 8px;
  grid-template-columns: 46px minmax(0, 1fr);
  min-height: 20px;
}

.history-value {
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
