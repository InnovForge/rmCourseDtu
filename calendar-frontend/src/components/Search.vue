<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { useRoute } from "vue-router";
import { computed, getCurrentScope, inject, ref, type Ref } from "vue";
import type { CourseResponse } from "@/types";
import { useQuery } from "@tanstack/vue-query";
import { RouterLink } from "vue-router";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const BASE_URL = import.meta.env.VITE_BE;

const getSearchCourse = async (
  query: string,
  semesterId: string,
): Promise<CourseResponse> =>
  await fetch(
    `${BASE_URL}/api/v1/courses/scraping/search?q=${query}&semesterId=${semesterId}`,
  ).then((response) => response.json());

const route = useRoute();

const queryString = computed(() => route.query.query as string);
const semesterString = computed(() => route.query.semesterId as string);

console.log(semesterString.value, queryString.value);

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

const { data, isLoading, isError } = useQuery({
  queryKey: ["search", queryString, semesterString],
  queryFn: async () => {
    const semesterId = semesterString.value;
    const query = queryString.value;

    if (!query || !semesterId) return;

    const response = await getSearchCourse(query, semesterId);
    return response.success ? response.data : [];
  },
  enabled: computed(() => !!queryString.value && !!semesterString.value),
});
</script>

<template>
  <div>
    <!-- <Button>{{ data }}</Button> -->
    <Table>
      <!-- <TableCaption>A list of your recent invoices.</TableCaption> -->
      <TableHeader>
        <TableRow>
          <TableHead class="w-[100px]"> Mã môn học </TableHead>
          <TableHead> Tên môn học </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="item in data">
          <TableCell class="font-medium">
            <RouterLink
              :to="`/c/${item.code}?courseId=${item.courseId}&semesterId=${item.semesterId}`"
            >
              {{ item.code }}
            </RouterLink>
          </TableCell>
          <TableCell>
            <RouterLink
              :to="`/c/${item.code}?courseId=${item.courseId}&semesterId=${item.semesterId}`"
            >
              {{ item.name }}
            </RouterLink>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>

<style scoped></style>
