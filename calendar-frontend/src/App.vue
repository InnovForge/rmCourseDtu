<script setup lang="ts">
import { provide, ref, watch } from "vue";
import { RouterView } from "vue-router";
import type { CalendarCourse, CalendarCourseResponse } from "./types";
import { Button } from "./components/ui/button";

const selectedAcademicYearId = ref<string>("");
const selectedSemesterId = ref<string>("");
const dataCalendar = ref<any[]>([]);
const arrayCourse = ref<any[]>([]);
const academicProgram = ref<any[]>([]);

const isFetching = ref(false);

const academicContext = {
  selectedAcademicYearId,
  selectedSemesterId,
  arrayCourse,
  dataCalendar,
};

const BASE_URL = import.meta.env.VITE_BE;

const getCourseCalendar = async (
  q: string,
  semesterId: string,
): Promise<CalendarCourseResponse> =>
  await fetch(
    `${BASE_URL}/api/v1/courses/scraping/calendar/${q}?semesterId=${semesterId}`,
  ).then((response) => response.json());

watch(
  arrayCourse,
  async (newArray, oldValue) => {
    if (isFetching.value) return;
    isFetching.value = true;

    const semesterId = selectedSemesterId.value;

    const deletedCourseCodes = oldValue
      .filter(
        (oldCourse) =>
          !newArray.some(
            (newCourse) => newCourse.courseCode === oldCourse.courseCode,
          ),
      )
      .map((course) => course.courseCode);

    dataCalendar.value = dataCalendar.value.filter(
      (calendar) => !deletedCourseCodes.includes(calendar.courseCode),
    );

    for (const course of newArray) {
      if (course.isFetch) continue;

      try {
        const response = await getCourseCalendar(course.courseCode, semesterId);
        if (response) {
          dataCalendar.value.push(response.data);
          course.isFetch = true;
        }
      } catch (error) {
        console.error("Error fetching course calendar:", error);
      }
    }

    isFetching.value = false;
  },
  { deep: true },
);

provide("academicContext", academicContext);
</script>

<template>
  <div class="p-2">
    <RouterLink to="/calendar">
      <Button>
        <span class="text-sm">Calendar</span>
      </Button>
    </RouterLink>
    <div class="mt-4">
      <RouterView />
    </div>
    <!-- <HelloWorld msg="Vite + Vue" /> -->
    <!-- <div class="mt-4 w-full "> -->
    <!-- <Calendar /> -->
    <!-- </div> -->
  </div>
</template>

<style scoped></style>
