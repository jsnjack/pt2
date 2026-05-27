<template>
  <section class="item-list">
    <div
      v-if="Object.keys(props.items).length === 0"
      class="empty-state middle-align center-align padding"
    >
      <div class="center-align">
        <i class="extra">orders</i>
        <h5>You have no items to track</h5>
      </div>
    </div>
    <div
      v-else-if="orderedItemsList.length === 0"
      class="empty-state middle-align center-align padding"
    >
      <div class="center-align">
        <i class="extra">search_off</i>
        <h5>No matching items</h5>
      </div>
    </div>
    <Item
      v-for="item in orderedItemsList"
      :key="item._key"
      :force-show-linked="isFiltering"
      :item="item"
      :item-key="item._key"
    />
  </section>
</template>

<script setup>
import { computed, defineEmits, defineProps, watch } from "vue";
import Item from "./Item.vue";

const emit = defineEmits(["visibleItemsChange"]);

const props = defineProps({
  items: {
    type: Object,
    required: true,
  },
  filterQuery: {
    type: String,
    default: "",
  },
});

const normalizedFilterQuery = computed(() =>
  props.filterQuery.trim().toLowerCase(),
);
const isFiltering = computed(() => normalizedFilterQuery.value.length > 0);

function normalizeSearchValue(value) {
  return String(value || "").toLowerCase();
}

function itemMatchesFilter(item, query) {
  if (!query) {
    return true;
  }

  let hostname = "";
  try {
    hostname = new URL(item.url).hostname;
  } catch {
    hostname = "";
  }

  return [
    item.title,
    item.url,
    hostname,
    item.currentValue,
    item.initialValue,
    item.selector,
  ]
    .map(normalizeSearchValue)
    .some((value) => value.includes(query));
}

const orderedItemsList = computed(() => {
  let orderedItems = [];
  const query = normalizedFilterQuery.value;

  // First, add all items that are not linked to another item (main items)
  for (let key in props.items) {
    if (props.items[key].linkedTo !== "") {
      continue;
    }
    orderedItems.push({ ...props.items[key] });
    orderedItems[orderedItems.length - 1]._key = key;
    orderedItems[orderedItems.length - 1]._linked = [];
  }

  // Then, add all items that are linked to another item (linked items)
  for (let key in props.items) {
    if (props.items[key].linkedTo !== "") {
      let linkedTo = props.items[key].linkedTo;
      let self = { ...props.items[key] };
      let linkedToItemIndex = orderedItems.findIndex(
        (item) => item._key === linkedTo,
      );
      if (linkedToItemIndex === -1) {
        console.error(
          `[ItemList] linked item ${key} is linked to ${linkedTo}, but ${linkedTo} is not in the list. Removing it.`,
        );
        browser.storage.sync.remove(key);
        continue;
      }
      self._key = key;
      orderedItems[linkedToItemIndex]._linked.push(self);
    }
  }

  if (query) {
    orderedItems = orderedItems
      .map((item) => {
        const linkedMatches = item._linked.filter((linkedItem) =>
          itemMatchesFilter(linkedItem, query),
        );

        if (itemMatchesFilter(item, query)) {
          return item;
        }

        if (linkedMatches.length > 0) {
          return {
            ...item,
            _linked: linkedMatches,
          };
        }

        return null;
      })
      .filter(Boolean);
  }

  return orderedItems.sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return a.title.localeCompare(b.title);
  });
});

const visibleItemUrls = computed(() => {
  const urls = [];
  const seenUrls = new Set();

  orderedItemsList.value.forEach((item) => {
    const visibleItems = isFiltering.value ? [item, ...item._linked] : [item];

    visibleItems.forEach((visibleItem) => {
      if (!visibleItem.url || seenUrls.has(visibleItem.url)) {
        return;
      }

      seenUrls.add(visibleItem.url);
      urls.push(visibleItem.url);
    });
  });

  return urls;
});

watch(
  visibleItemUrls,
  (urls) => {
    emit("visibleItemsChange", urls);
  },
  { immediate: true },
);
</script>

<style scoped>
.item-list {
  background-color: var(--surface-container-lowest);
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.empty-state {
  min-height: 260px;
}
</style>
