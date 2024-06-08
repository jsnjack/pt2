<template>
  <div class="row item no-margin">
    <div class="small-padding" @click="open" style="cursor: pointer">
      <div>{{ hostname }}</div>
    </div>
    <div class="small-padding max" style="text-align: right;">
      <div class="large-text">{{ price }}</div>
    </div>
  </div>
</template>

<script setup>
import { extractPriceAndCurrency } from "@/assets/prices";
import { computed, defineProps } from "vue";

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

</script>
<style scoped></style>
