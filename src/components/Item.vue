<template>
  <div class="row item no-margin" :style="'border-left: 4px ' + borderColour + ' solid; height: 100%;'">
    <div class="small-padding" @click="open" style="cursor: pointer;">
      <div class="crop-text">{{ props.item.title }}</div>
      <div class="small-text">{{ hostname }}</div>
    </div>
    <div class="max"></div>
    <div v-if="!diff.changed" class="small-padding">
      <div>{{ props.item.currentValue }}</div>
    </div>
    <div v-if="diff.changed" class="small-padding">
      <div class="large-text">{{ props.item.currentValue }}</div>
      <div class="overline small-text">{{ props.item.initialValue }}</div>
    </div>
    <div v-if="diff.changed && diff.diff !== 0" class="small-padding">
      <div class="large-text" :style="'color: ' + textColour">{{ relativeDiffText }}</div>
      <div class="small-text" :style="'color: ' + textColour">{{ diff.perc }}%</div>
    </div>
    <div class="small-padding" @click="deleteItem">
      <button class="small circle transparent">
        <i>delete</i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed, onMounted, defineEmits, inject } from 'vue'
import { accounting } from "accounting"

const eventBus = inject('eventBus')

const emit = defineEmits(['updateItem'])

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  itemKey: {
    type: String,
    required: true
  }
})

const hostname = computed(() => {
  let url = new URL(props.item.url);
  return url.hostname;
})

const convertToNumber = function (str) {
  // Check if it is string
  if (typeof str !== "string") {
    return 0;
  }
  if (str.indexOf(",") > 0) {
    if (str.split(",")[1].length !== 3) {
      return accounting.unformat(str, ",");
    }
  }
  return accounting.unformat(str);
}

const formatWithCurrency = function (str, example) {
  var currency = example.replace(/[0-9,\.]/g, "");
  if (parseInt(str[0], 10) > 0) {
    return str + currency;
  } else {
    return currency + str;
  }
}

const diff = computed(() => {
  const currentValueToPrice = convertToNumber(props.item.currentValue);
  const initialValueToPrice = convertToNumber(props.item.initialValue);
  let diff = 0;
  let perc = 0;
  if (currentValueToPrice !== 0 && initialValueToPrice !== 0) {
    diff = currentValueToPrice - initialValueToPrice;
    // Round perc to 2 digits
    perc = Math.round((diff / initialValueToPrice) * 10000) / 100;
  }
  const data = {
    changed: props.item.currentValue !== props.item.initialValue,
    current: currentValueToPrice,
    initial: initialValueToPrice,
    diff: diff,
    perc: perc,
  }
  console.log("diff computed: ", data)
  return data;
})

const relativeDiffText = computed(() => {
  if (diff.value.changed) {
    if (diff.value.diff < 0) {
      return "Save " + formatWithCurrency(Math.abs(diff.value.diff), props.item.currentValue);
    } else {
      return formatWithCurrency(diff.value.diff, props.item.currentValue) + " more";
    }
  }
  return "";
})

const borderColour = computed(() => {
  if (diff.value.changed) {
    if (diff.value.diff < 0) {
      return "green";
    } else {
      return "red";
    }
  }
  return "grey";
})

const textColour = computed(() => {
  if (diff.value.changed) {
    if (diff.value.diff < 0) {
      return "green";
    } else {
      return "red";
    }
  }
  return "";
})

function open() {
  browser.tabs.create({ url: props.item.url });
  window.close();
}

function deleteItem() {
  browser.storage.local.remove(props.itemKey);
}

onMounted(() => {
  eventBus.emit('updateItem', { key: props.itemKey })
})
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
</style>
