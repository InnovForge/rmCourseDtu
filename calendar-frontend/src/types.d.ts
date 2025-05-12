export interface AcademicYear {
	academicYearId: string;
	name: string;
}
export interface Semester {
	semesterId: string;
	name: string;
}

export interface SemesterResponse {
	success: boolean;
	data: Semester[];
	message: string;
}
export interface AcademicYearResponse {
	success: boolean;
	data: AcademicYear[];
	message: string;
}

export interface Course {
	code: string;
	name: string;
	courseId: string;
	semesterId: string;
}

export interface CourseResponse {
	success: boolean;
	data: Course[];
	message: string;
}
export interface ClassCourse {
	courseCode: string;
	registrationCode: string;
	classType: string;
	remainingSlots: string;
	registrationPeriod: {
		start: string;
		end: string;
	};
	weeks: string;
	schedule: Record<string, { start: string; end: string }>;
	canceledWeeks: Record<string, number[]>;
	rooms: string;
	location: string;
	lecturer: string;
	registrationStatus: string;
	deploymentStatus: string;
}

export interface CourseDetail {
	info: {
		title: string;
		code: string;
		credits: string;
		creditType: string;
		courseType: string;
		semester: string;
		prerequisite: string;
		corequisite: string;
		description: string;
	};
	class: ClassCourse[];
}

export interface CourseDetailResponse {
	success: boolean;
	data: CourseDetail;
	message: string;
}

export interface CalendarCourseResponse {
	sussess: boolean;
	data: ClassCourse;
	message: string;
}

export interface AcademicProgramResponse {
  success: boolean;
  data: {
    academicProgramId: string;
    name: string;
  }[];
  message: string;
}
