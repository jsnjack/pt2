<template>
  <div class="row item no-margin" :class="{ 'is-updating': isUpdating }">
    <div class="small-padding" @click="open" style="cursor: pointer">
      <div class="crop-text">{{ props.item.title }}</div>
      <div class="small-text">{{ hostname }}</div>
    </div>
    <!--    There is no change -->
    <div v-if="!diff.changed" class="small-padding max" style="text-align: right;">
      <div class="large-text">{{ diff.current }}</div>
    </div>
    <!-- There is a change -->
    <!-- Percentage -->
    <div v-if="diff.changed" class="small-padding" style="text-align: left; min-width: 100px;"
      :style="'background-color: ' + changeBackground + ';'">
      <div class="large-text bold" :style="'color: ' + 'white'">
        {{ relativeDiffText }}
      </div>
      <div class="small-text bold" :style="'color: ' + 'white'">
        {{ percText }}
      </div>
    </div>
    <!-- Comparing old and new -->
    <div v-if="diff.changed" class="small-padding max" style="text-align: right;">
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
    <div class="field label border small max" style="margin-left: 10px; margin-right: 10px;">
      <input type="text" class="small" v-model="newTitle" />
      <label>Rename item</label>
    </div>
  </div>

  <div v-show="showBottomMenu" class="row item no-margin">
    <div class="small-padding center">
      <button class="small circle transparent" @click="addLinkedItem">
        <i>library_add</i>
      </button>
      <button class="small circle transparent" @click="deleteItem">
        <i>delete</i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { extractPriceAndCurrency } from "@/assets/prices";
import { computed, defineEmits, defineProps, inject, onBeforeUnmount, onMounted, ref } from "vue";

const eventBus = inject("eventBus");

const emit = defineEmits(["updateItem", "addNewItem"]);

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

const isUpdating = ref(false);
const showBottomMenu = ref(false);
const newTitle = ref("");

const hostname = computed(() => {
  let url = new URL(props.item.url);
  return url.hostname;
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
  const parsedCurrent = extractPriceAndCurrency(props.item.currentValue);
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

function open() {
  browser.tabs.create({ url: props.item.url });
  window.close();
}

function deleteItem() {
  browser.storage.sync.remove(props.itemKey);
}

function addLinkedItem() {
  eventBus.emit("addNewItem", { "linkedTo": props.itemKey });
}

function toggleBottomMenu() {
  doRename();
  showBottomMenu.value = !showBottomMenu.value;
}

function doRename() {
  if (newTitle.value === props.item.title || newTitle.value === "") {
    return;
  }
  browser.storage.sync.set({
    [props.itemKey]: {
      ...props.item,
      title: newTitle.value,
    },
  });
}

onMounted(() => {
  eventBus.on("itemUpdateStarted", itemUpdateStartedHandler);
  eventBus.on("itemUpdateFinished", itemUpdateFinishedHandler);
  eventBus.emit("updateItem", { "key": props.itemKey });
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
  width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item {
  background-color: var(--surface-container-lowest);
}

.is-updating {
  filter: blur(2px);
}
</style>
