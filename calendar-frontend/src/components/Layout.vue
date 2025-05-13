<script setup lang="ts">
import { RouterView, useRouter, useRoute } from "vue-router";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type {
  AcademicProgramResponse,
  AcademicYearResponse,
  SemesterResponse,
} from "@/types";
import { useQuery } from "@tanstack/vue-query";
import {
  computed,
  inject,
  onMounted,
  onUnmounted,
  ref,
  watch,
  type Ref,
} from "vue";

const BASE_URL = import.meta.env.VITE_BE;

const getAcademicYear = async (): Promise<AcademicYearResponse> =>
  await fetch(`${BASE_URL}/api/v1/courses/scraping/academicYear`).then(
    (response) => response.json(),
  );

const getSemester = async (acedemicYearId: string): Promise<SemesterResponse> =>
  await fetch(
    `${BASE_URL}/api/v1/courses/scraping/semester?id=${acedemicYearId}`,
  ).then((response) => response.json());

const getAcademicProgram = async (): Promise<AcademicProgramResponse> =>
  await fetch(`${BASE_URL}/api/v1/courses/scraping/academicProgram`).then(
    (response) => response.json(),
  );

const academicYear = ref<any[]>([]);
const semester = ref();

const academicContext = inject<{
  selectedAcademicYearId: Ref<string>;
  selectedSemesterId: Ref<string>;
  academicProgram: Ref<any[]>;
}>("academicContext");

// Cung cấp giá trị mặc định nếu không có context
const defaultContext = {
  selectedAcademicYearId: ref(""),
  selectedSemesterId: ref(""),
  dataCalendar: ref([]),
  academicProgram: ref([]),
};

const context = academicContext ?? defaultContext;

const { selectedAcademicYearId, selectedSemesterId, academicProgram } = context;

const { isPending, isError, data, error } = useQuery({
  queryKey: ["academicYear"],
  queryFn: async () => {
    const response = await getAcademicYear();
    if (response.success && response.data.length > 0) {
      academicYear.value = response.data;
      selectedAcademicYearId.value = response.data[0].academicYearId;
      return response.data;
    }
    return [];
  },
});

const {
  isPending: isPendingProgram,
  isError: isErrorProgram,
  data: dataProgram,
  error: errorProgram,
} = useQuery({
  queryKey: ["academicProgram"],
  queryFn: async () => {
    const response = await getAcademicProgram();
    if (response.success && response.data.length > 0) {
      academicProgram.value = response.data;
      return response.data;
    }
    return [];
  },
});

watch(selectedAcademicYearId, async (newVal) => {
  if (newVal && newVal.length > 0) {
    const semesterResponse = await getSemester(selectedAcademicYearId.value);
    if (semesterResponse.success) {
      semester.value = semesterResponse.data;
      selectedSemesterId.value =
        semesterResponse.data[semesterResponse.data.length - 1].semesterId;
    }
  }
});

const selectFruit = (fruit: string) => {
  selectedSemesterId.value = fruit;
};

const searchQuery = ref("");

const filteredResults = computed(() => {
  const query = searchQuery.value.toLowerCase();

  return academicProgram.value
    .map((item) => {
      const name = item.name.toLowerCase();
      let priority = 2;

      if (name.startsWith(query)) priority = 0;
      else if (name.includes(query)) priority = 1;

      return { ...item, priority };
    })
    .filter((item) => item.priority < 2)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 5);
});

const selectedIndex = ref(-1);

const onKeyDown = (e: KeyboardEvent) => {
  const max = filteredResults.value.length - 1;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    selectedIndex.value =
      selectedIndex.value < max ? selectedIndex.value + 1 : 0;
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    selectedIndex.value =
      selectedIndex.value > 0 ? selectedIndex.value - 1 : max;
  } else if (e.key === "Enter") {
    e.preventDefault();
    const selected =
      selectedIndex.value >= 0
        ? filteredResults.value[selectedIndex.value]
        : { name: searchQuery.value };

    if (selected) {
      searchQuery.value = selected.name;
      console.log("Selected item:", selected);
      onSelect(selected);
      selectedIndex.value = -1;
      isOpen.value = false;
    }
  }
};

const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);

const handleClickOutside = (event: MouseEvent) => {
  if (
    containerRef.value &&
    !containerRef.value.contains(event.target as Node)
  ) {
    isOpen.value = false;
    selectedIndex.value = -1;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  const route = useRoute();
  const queryParam = route.query.query as string;
  searchQuery.value = queryParam || "";
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

const router = useRouter();

const onSelect = (item: any) => {
  searchQuery.value = item.name;
  isOpen.value = false;
  selectedIndex.value = -1;

  router.push({
    path: "/results",
    query: {
      query: item.name,
      semesterId: selectedSemesterId.value,
    },
  });
};

const onInput = () => {
  isOpen.value = !!searchQuery.value;
};
</script>

<template>
  <div>
    <div class="w-full flex gap-2 items-center">
      <Select
        :defaultValue="academicYear[0]?.academicYearId"
        v-model="selectedAcademicYearId"
      >
        <SelectTrigger>
          <SelectValue placeholder="Chọn năm học" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup v-for="(year, index) in academicYear" :key="index">
            <SelectItem :value="year.academicYearId">
              {{ year.name }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <div class="flex flex-row gap-2" v-if="semester">
        <div v-for="(item, index) in semester" :key="index">
          <div
            @click="selectFruit(item.semesterId)"
            class="inline-flex items-center justify-center px-4 py-1.5 text-nowrap rounded-md cursor-pointer"
            :class="{
              'bg-primary text-white': item.semesterId === selectedSemesterId,
              'bg-secondary text-black': item.semesterId !== selectedSemesterId,
            }"
          >
            {{ item.name }}
          </div>
          <!-- <Button :variant="item.semesterId === selectedSemesterId ? 'default' : 'outline'" @click="selectFruit(item.semesterId)"> -->
          <!--   {{ item.name }} -->
          <!-- </Button> -->
        </div>
      </div>

      <div class="flex-1 relative max-w-xl" ref="containerRef">
        <Input
          autocorrect="off"
          autocomplete="off"
          v-model="searchQuery"
          id="search"
          type="text"
          placeholder="Tìm kiếm"
          class="pl-10 w-full"
          @focus="isOpen = true"
          @keydown="onKeyDown"
          @input="onInput"
        />
        <span
          class="absolute start-0 inset-y-0 flex items-center justify-center px-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-6 text-muted-foreground"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
        </span>
        <ul
          v-if="isOpen && searchQuery && filteredResults.length"
          class="absolute w-full bg-white border z-10 rounded-md shadow-lg top-10"
        >
          <li
            v-for="(item, index) in filteredResults"
            @click="onSelect(item)"
            :key="item.id"
            class="p-2 cursor-pointer"
            :class="{
              'bg-accent text-accent-foreground': index === selectedIndex,
            }"
          >
            {{ item.name }}
          </li>
        </ul>
      </div>
    </div>
    <div class="mt-4 w-full">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.PopoverContent {
  width: var(--reka-popover-trigger-width);
  max-height: var(--reka-popover-content-available-height);
}
</style>
