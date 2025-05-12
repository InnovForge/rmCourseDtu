<script setup lang="ts">
import { ScheduleXCalendar } from "@schedule-x/vue";
import {
  createCalendar,
  createViewDay,
  createViewMonthAgenda,
  createViewMonthGrid,
  createViewWeek,
} from "@schedule-x/calendar";
// import "@schedule-x/theme-default/dist/index.css";
import "@schedule-x/theme-shadcn/dist/index.css";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { inject, onMounted, ref, watch, type Ref } from "vue";
import CustomTimeGridEvent from "./CustomTimeGridEvent.vue";

const academicContext = inject<{
  selectedAcademicYearId: Ref<string>;
  selectedSemesterId: Ref<string>;
  arrayCourse: Ref<any[]>;
  dataCalendar: Ref<any[]>;
}>("academicContext");

// Cung cấp giá trị mặc định nếu không có context
const defaultContext = {
  selectedAcademicYearId: ref(""),
  selectedSemesterId: ref(""),
  arrayCourse: ref([]),
  dataCalendar: ref([]),
};

const context = academicContext ?? defaultContext;

const weekdayMap: Record<string, number> = {
  T2: 1,
  T3: 2,
  T4: 3,
  T5: 4,
  T6: 5,
  T7: 6,
  CN: 0,
};

const seenTimes = new Map<string, any[]>();

function generateEventsFromCourse(course: any): any[] {
  const events: any[] = [];
  const start = new Date(
    course.registrationPeriod.start.split("/").reverse().join("-"),
  );

  for (const day in course.schedule) {
    const weekday = weekdayMap[day];
    if (weekday === undefined) continue;

    for (let week = 0; week < 10; week++) {
      const date = new Date(start);
      date.setDate(
        date.getDate() + (7 * week + ((weekday - date.getDay() + 7) % 7)),
      );

      const isoDate = date.toISOString().split("T")[0];
      const startTime = course.schedule[day].start;
      const endTime = course.schedule[day].end;

      const canceled = course.canceledWeeks?.[day]?.includes(week);
      if (canceled) continue;

      const key = `${isoDate} ${startTime}-${endTime}`;

      const event = {
        id: `${course.registrationCode}-${day}-${week}`,
        registrationCode: course.registrationCode,
        title: course.courseCode,
        start: `${isoDate} ${startTime}`,
        end: `${isoDate} ${endTime}`,
        location: course.location,
        isDuplicate: false,
      };

      if (!seenTimes.has(key)) {
        seenTimes.set(key, []);
      }

      const existing = seenTimes.get(key)!;
      if (existing.length > 0) {
        event.isDuplicate = true;
        for (const e of existing) {
          e.isDuplicate = true;
        }
      }

      existing.push(event);
      events.push(event);
    }
  }

  return events;
}

const calendarApp = createCalendar({
  // selectedDate: "2023-12-19",
  views: [
    createViewMonthGrid(),
    createViewDay(),
    createViewWeek(),
    createViewMonthAgenda(),
  ],
  theme: "shadcn",
  defaultView: "monthGrid",
  // weekOptions: {
  //   gridHeight: 1000,
  // },
  events: [
    {
      id: 1,
      title: "Event 1",
      start: "2023-12-19",
      end: "2023-12-19",
    },
    {
      id: 2,
      title: "Event 2",
      start: "2023-12-19",
      end: "2023-12-19",
    },
    {
      id: 3,
      title: "Event 3",
      start: "2025-05-09 11:00",
      end: "2025-05-09 12:00",
    },
    {
      id: 4,
      title: "Event 2",
      start: "2023-12-19",
      end: "2023-12-19",
    },
    {
      id: 5,
      title: "Event 2",
      start: "2023-12-20 12:00",
      end: "2023-12-20 13:00",
    },
  ],
});

watch(
  context.dataCalendar,
  () => {
    seenTimes.clear();
    updateCalendarEvents();
  },
  { deep: true },
);

function updateCalendarEvents() {
  const events = context.dataCalendar.value.flatMap(generateEventsFromCourse);
  // console.log("events", events.length, events);
  if (events.length > 0) calendarApp.events.set(events);
}
onMounted(() => {
  updateCalendarEvents();
});

const message = ref(
  academicContext?.arrayCourse.value
    .map((course) => course.courseCode)
    .join("\n") ?? "",
);

const handleUpdate = () => {

  const courseArray = message.value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((courseCode) => ({ courseCode, isFetch: true }));

  console.log("courseArray", courseArray);
  // console.log("arrayCourse before update", context.arrayCourse.value);

  context.arrayCourse.value.forEach((course) => {
    const newCourse = courseArray.find(
      (newCourse) => newCourse.courseCode === course.courseCode,
    );
    if (!newCourse) {
      course.isFetch = false;
    }
  });

  context.arrayCourse.value = context.arrayCourse.value.filter((course) => {
    return courseArray.some(
      (newCourse) => newCourse.courseCode === course.courseCode,
    );
  });

  courseArray.forEach((newCourse) => {
    const existingCourse = context.arrayCourse.value.find(
      (course) => course.courseCode === newCourse.courseCode,
    );
    if (!existingCourse) {
      context.arrayCourse.value.push({ ...newCourse, isFetch: false }); 
    }
  });

  console.log("arrayCourse after update", context.arrayCourse.value);
};

const customComponents = {
  monthGridEvent: CustomTimeGridEvent,
};

</script>

<template>
  <div class="w-full flex gap-2">
    <div class="flex-1">
      <ScheduleXCalendar
        :calendar-app="calendarApp"
        :custom-components="customComponents"
      />
    </div>
    <div class="basis-2xs flex flex-col">
      <Textarea
        v-model="message"
        class="border border-md w-full"
        placeholder="Type your message here."
      />
      <Button @click="handleUpdate" class="mt-2">Update</Button>
    </div>
  </div>
</template>
<style scoped>
.sx-vue-calendar-wrapper {
  width: 1200px;
  max-width: 100vw;
  height: 800px;
  max-height: 80vh;
}
</style>
