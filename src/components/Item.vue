<template>
  <div class="row item no-margin" :class="{ 'is-updating': isUpdating }"
    :style="'border-left: 4px ' + borderColour + ' solid; height: 100%;'">
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
    <div v-if="diff.changed" class="small-padding max" style="text-align: left;">
      <div class="large-text" :style="'color: ' + textColour">
        {{ relativeDiffText }}
      </div>
      <div class="small-text" :style="'color: ' + textColour">
        {{ percText }}
      </div>
    </div>
    <!-- Comparing old and new -->
    <div v-if="diff.changed" class="small-padding">
      <div class="large-text">{{ diff.current }}</div>
      <div class="overline small-text">{{ diff.initial }}</div>
    </div>
    <div class="small-padding" @click="deleteItem">
      <button class="small circle transparent">
        <i>delete</i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed, onMounted, defineEmits, inject, ref, onBeforeUnmount } from "vue";
import { extractPriceAndCurrency } from "@/assets/prices";

const eventBus = inject("eventBus");

const emit = defineEmits(["updateItem"]);

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
      return `Save ${diff.value.currency}${Math.abs(diff.value.diff)}`;
    } else {
      return `${diff.value.currency}${diff.value.diff} extra`;
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

const borderColour = computed(() => {
  if (diff.value.changed) {
    if (diff.value.diff < 0) {
      return "green";
    } else {
      return "red";
    }
  }
  return "grey";
});

const textColour = computed(() => {
  if (diff.value.changed) {
    if (diff.value.diff < 0) {
      return "green";
    } else {
      return "red";
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

onMounted(() => {
  eventBus.on("itemUpdateStarted", itemUpdateStartedHandler);
  eventBus.on("itemUpdateFinished", itemUpdateFinishedHandler);
  eventBus.emit("updateItem", { "key": props.itemKey });
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
  max-width: 200px;
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
