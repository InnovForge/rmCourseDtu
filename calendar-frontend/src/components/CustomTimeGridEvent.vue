<template>
  <div class="flex flex-col text-white w-full" :class="calendarEvent.isDuplicate ? 'bg-red-600' : 'bg-primary'">
    <div class="flex items-center gap-2">
      {{ calendarEvent.start.split(" ")[1] }} -
      {{ calendarEvent.end.split(" ")[1] }}
    <div>{{ calendarEvent.title }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { IconClockHour1 } from "@tabler/icons-vue";
import type { PropType } from "vue";

const props = defineProps({
  calendarEvent: {
    type: Object as PropType<{
      isDuplicate:boolean, 
      title: string;
      id: number | string;
      start: string;
      end: string;
    }>,
    required: true,
  }, 
});
</script>

<style>
.custom-event-modal {
  background-color: pink;
  color: cornflowerblue;
  font-weight: 700;
}
</style>
