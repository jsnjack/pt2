
import { onMounted } from 'vue';

<template>
    <div class="fill medium-height middle-align center-align padding" v-if="Object.keys(props.items).length === 0">
        <div class="center-align">
            <i class="extra">orders</i>
            <h5>You have no items to track</h5>
        </div>
    </div>
    <Item v-for="(item, key) in props.items" :key="key" :item="item" :itemKey="key" />
</template>

<script setup>
import Item from './Item.vue'
import { defineProps } from 'vue'

const props = defineProps({
    items: {
        type: Object,
        required: true
    }
})
</script>
