<script setup lang="ts">
import type {
  ColumnDef,
  ColumnFiltersState,
  ExpandedState,
  SortingState,
  VisibilityState,
} from "@tanstack/vue-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FlexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from "@tanstack/vue-table";

import type { CourseDetail, CourseDetailResponse } from "@/types";
import { useQuery } from "@tanstack/vue-query";
import { computed, Fragment, h, inject, ref, watch, type Ref } from "vue";
import { useRoute } from "vue-router";
import { IconBadge4k, IconPlus } from "@tabler/icons-vue";

const route = useRoute();

const BASE_URL = import.meta.env.VITE_BE;

const getCourseDetail = async (
  semesterId: string,
  courseId: string,
): Promise<CourseDetailResponse> =>
  await fetch(
    `${BASE_URL}/api/v1/courses/scraping/listCourseDetail?semesterId=${semesterId}&courseId=${courseId}`,
  ).then((response) => response.json());

watch(
  () => route.params.courseId,
  (newId, oldId) => {
    // console.log("o", oldId, "n", newId);
    // react to route changes...
  },
);

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
const message = ref("");

const coursesIdString = computed(() => route.query.courseId as string);
const semesterIdString = computed(() => route.query.semesterId as string);

const { data, isLoading, isError } = useQuery({
  queryKey: ["search", coursesIdString, semesterIdString],
  queryFn: async () => {
    const semesterId = semesterIdString.value;
    const courseId = coursesIdString.value;

    if (!courseId || !semesterId) return;

    const response = await getCourseDetail(semesterId, courseId);
    return response.success ? response.data : undefined;
  },
  enabled: computed(() => !!coursesIdString.value && !!semesterIdString.value),
});

const columns: ColumnDef<CourseDetail["class"][0]>[] = [
  {
    accessorKey: "courseCode",
    header: "Tên lớp",
    cell: ({ row }) => row.original.courseCode,
  },
  {
    accessorKey: "registrationCode",
    header: "Mã đăng ký",
    cell: ({ row }) => row.original.registrationCode,
  },
  {
    accessorKey: "classType",
    header: "Loại hình",
    cell: ({ row }) => row.original.classType,
  },
  {
    accessorKey: "remainingSlots",
    header: "Số chỗ còn lại",
    cell: ({ row }) => row.original.remainingSlots,
  },
  {
    accessorKey: "registrationPeriod",
    header: "Hạn đăng ký",
    cell: ({ row }) => {
      const { start, end } = row.original.registrationPeriod;
      return `${start} - ${end}`;
    },
  },
  {
    accessorKey: "weeks",
    header: "Tuần học",
    cell: ({ row }) => row.original.weeks,
  },
  {
    accessorKey: "schedule",
    header: "Lịch học",
    cell: ({ row }) => {
      const schedule = row.original.schedule;
      const canceledWeeks = row.original.canceledWeeks;
      const convertDay = (day: string) => {
        const days: Record<string, string> = {
          Monday: "Thứ 2",
          Tuesday: "Thứ 3",
          Wednesday: "Thứ 4",
          Thursday: "Thứ 5",
          Friday: "Thứ 6",
          Saturday: "Thứ 7",
          Sunday: "Chủ nhật",
        };
        return days[day] || day;
      };

      return h(
        Fragment,
        {},
        Object.entries(schedule).map(([day, { start, end }]) =>
          h("div", { key: day }, [
            `${convertDay(day)}: ${start} - ${end}`,
            canceledWeeks?.[day]?.length
              ? h(
                  "span",
                  { class: "text-red-500" },
                  ` (Tuần Nghỉ: ${canceledWeeks[day].join(", ")})`,
                )
              : null,
          ]),
        ),
      );
    },
  },

  {
    accessorKey: "classRoom",
    header: "Phòng học",
    cell: ({ row }) => row.original.rooms,
  },
  {
    accessorKey: "location",
    header: "Địa điểm",
    cell: ({ row }) => row.original.location,
    maxSize: 100,
  },
  {
    accessorKey: "teacherName",
    header: "Giảng viên",
    cell: ({ row }) => row.original.lecturer,
  },
  {
    accessorKey: "registrationStatus",
    header: "Trạng thái đăng ký",
    cell: ({ row }) => row.original.registrationStatus,
  },
  {
    accessorKey: "deploymentStatus",
    header: "Trạng thái triển khai",
    cell: ({ row }) => row.original.deploymentStatus,
  },
  {
    accessorKey: "action",
    header: "Hành động",
    cell: ({ row }) => {
      const {  courseCode, registrationCode, classType, remainingSlots } =
        row.original;
      return h(
        "div",
        {
          onClick: () => {
            console.log( courseCode,registrationCode, classType, remainingSlots);
            const exists = context.arrayCourse.value.some(
              (item) => item.courseCode === courseCode,
            );

            if (!exists) {
              context.arrayCourse.value.push({
                courseCode,
                registrationCode,
                classType,
                remainingSlots,
                isFetch: false
              });
            }
          },
        },
        [
          h(IconPlus, {
            size: 20,
            class:
              "w-7 h-7 mx-auto text-primary/80 animate-spin-fast pointer-events-none",
          }),
        ],
      );
    },
  },
];

const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);
const columnVisibility = ref<VisibilityState>({});
const rowSelection = ref({});
const expanded = ref<ExpandedState>({});

const table = useVueTable({
  data: computed(() => data.value?.class ?? []),
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  state: {
    get sorting() {
      return sorting.value;
    },
    get columnFilters() {
      return columnFilters.value;
    },
    get columnVisibility() {
      return columnVisibility.value;
    },
    get rowSelection() {
      return rowSelection.value;
    },
    get expanded() {
      return expanded.value;
    },
  },
});
</script>
<template v-if="data && data.class">
  <!-- <div>{{ data }}</div> -->
  <div>
    <p>Tên môn học: {{ data?.info.title }}</p>
    <p>Mã môn học: {{ data?.info.code }}</p>
    <p>Số ĐVHT: {{ data?.info.credits }}</p>
    <p>Loại ĐVHT: {{ data?.info.creditType }}</p>
    <p>Học Kỳ: {{ data?.info.semester }}</p>
    <p>Môn học tiên quyết: {{ data?.info.prerequisite }}</p>
    <p>Môn học song hành: {{ data?.info.corequisite }}</p>
    <p>Mô tả môn học: {{ data?.info.description }}</p>
  </div>
  <div class="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
        >
          <TableHead v-for="header in headerGroup.headers" :key="header.id">
            <FlexRender
              v-if="!header.isPlaceholder"
              :render="header.column.columnDef.header"
              :props="header.getContext()"
            />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-if="table.getRowModel().rows?.length">
          <template v-for="row in table.getRowModel().rows" :key="row.id">
            <TableRow :data-state="row.getIsSelected() && 'selected'">
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </TableCell>
            </TableRow>
            <TableRow v-if="row.getIsExpanded()">
              <TableCell :colspan="row.getAllCells().length">
                {{ JSON.stringify(row.original) }}
              </TableCell>
            </TableRow>
          </template>
        </template>

        <TableRow v-else>
          <TableCell :colspan="columns.length" class="h-24 text-center">
            No results.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
  <!-- <Table> -->

  <!-- <TableCaption>A list of your recent invoices.</TableCaption> -->
  <!--   <TableHeader> -->
  <!--     <TableRow> -->
  <!--       <TableHead class="w-[100px]"> Tên lớp </TableHead> -->
  <!--       <TableHead>Mã đăng ki</TableHead> -->
  <!--       <TableHead>Loại hình</TableHead> -->
  <!--       <TableHead> Số chỗ còn lại </TableHead> -->
  <!--       <TableHead>Hạn đăng kí</TableHead> -->
  <!---->
  <!--       <TableHead>Tuần học</TableHead> -->
  <!--       <TableHead>Giờ học</TableHead> -->
  <!--       <TableHead>Phòng</TableHead> -->
  <!--       <TableHead>Địa điểm</TableHead> -->
  <!--       <TableHead>Giảng viên</TableHead> -->
  <!--       <TableHead>Tình trạng đăng kí</TableHead> -->
  <!--       <TableHead>Tình trạng triển khai </TableHead> -->
  <!--     </TableRow> -->
  <!--   </TableHeader> -->
  <!--   <TableBody> -->
  <!--     <TableRow v-if="data?.class" v-for="item in data.class"> -->
  <!--       <TableCell class="font-medium"> -->
  <!--         {{ item.subjectName }} -->
  <!--       </TableCell> -->
  <!--       <TableCell>{{ item.courseCode }}</TableCell> -->
  <!--       <TableCell>{{ item.classType }}</TableCell> -->
  <!--       <TableCell> -->
  <!--         {{ item.remainingSlots }} -->
  <!--       </TableCell> -->
  <!--       <TableCell> -->
  <!--         {{ item.registrationPeriod.start }} - -->
  <!--         {{ item.registrationPeriod.end }} -->
  <!--       </TableCell> -->
  <!--       <TableCell> -->
  <!--         {{ item.weeks }} -->
  <!--       </TableCell> -->
  <!--       <TableCell> -->
  <!--         <div v-for="(value, day) in item.schedule" :key="day"> -->
  <!--           {{ convertDay(day) }}: {{ value.start }} - {{ value.end }} -->
  <!--           <span v-if="item.canceledWeeks?.[day]?.length" class="text-red-500"> -->
  <!--             (Tuần Nghỉ: {{ item.canceledWeeks[day].join(", ") }}) -->
  <!--           </span> -->
  <!--         </div> -->
  <!--       </TableCell> -->
  <!--       <TableCell> -->
  <!--         {{ item.rooms }} -->
  <!--       </TableCell> -->
  <!--       <TableCell> -->
  <!--         {{ item.location }} -->
  <!--       </TableCell> -->
  <!--       <TableCell> -->
  <!--         {{ item.lecturer }} -->
  <!--       </TableCell> -->
  <!--       <TableCell> -->
  <!--         {{ item.registrationStatus }} -->
  <!--       </TableCell> -->
  <!--       <TableCell> -->
  <!--         {{ item.deploymentStatus }} -->
  <!--       </TableCell> -->
  <!--     </TableRow> -->
  <!--   </TableBody> -->
  <!-- </Table> -->
</template>
