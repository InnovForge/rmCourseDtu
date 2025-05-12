import { Context } from "hono";
import * as getL from "../services/get-list-learn";

export const getSemester = async (c: Context) => {
	try {
		const { env } = c;
		const id = c.req.query("id");
		if (!id) {
			return c.json(
				{
					success: false,
					message: "Missing id",
				},
				400,
			);
		}

		const data = await getL.semester(id);

		return c.json({
			success: true,
			data,
			message: "Get semester successfully",
		});
	} catch (error) {
		console.error(error);
		return c.json(
			{
				success: false,
				message: "Failed to get semester",
			},
			500,
		);
	}
};

export const getAcademicYear = async (c: Context) => {
	try {
		const { env } = c;
		const data = await getL.academicYear();

		return c.json({
			success: true,
			data,
			message: "Get academic year successfully",
		});
	} catch (error) {
		console.error(error);
		return c.json(
			{
				success: false,
				message: "Failed to get academic year",
			},
			500,
		);
	}
};

export const getAcademicProgram = async (c: Context) => {
	try {
		const { env } = c;
		const data = await getL.academicProgram();

		return c.json({
			success: true,
			data,
			message: "Get academic program successfully",
		});
	} catch (error) {
		console.error(error);
		return c.json(
			{
				success: false,
				message: "Failed to get academic program",
			},
			500,
		);
	}
};

export const searchCourse = async (c: Context) => {
	try {
		const query = c.req.query("q");
		const semester = c.req.query("semesterId");
    console.log("semester", semester);
		if (!query || !semester) {
			return c.json(
				{ success: false, message: "Missing query or semester" },
				400,
			);
		}

		const results = await getL.searchCourse(query, semester);

		return c.json({
			success: true,
			data: results,
			message: "Subjects found successfully",
		});
	} catch (error) {
		return c.json(
			{ success: false, message: "Failed to search subjects" },
			500,
		);
	}
};

export const getListCourseDetail = async (c: Context) => {
	try {
		const semesterId = c.req.query("semesterId");
		const courseId = c.req.query("courseId");

		if (!courseId || !semesterId) {
			return c.json({ success: false, message: "Missing url" }, 400);
		}

		const results = await getL.getListCourseDetail(courseId, semesterId);
    // console.log(results)

		return c.json({
			success: true,
			data: results,
			message: "Subjects found successfully",
		});
	} catch (error) {
		return c.json(
			{ success: false, message: "Failed to search subjects" },
			500,
		);
	}
};

export const getCalendarByCourseCode = async (c: Context) => {
	try {
		const sjc = c.req.param("courseCode");
		const sId = c.req.query("semesterId");

		if (!sjc || !sId) {
			return c.json({ success: false, message: "Missing name" }, 400);
		}
		let courseCode = sjc;

		if (sjc.includes(" ")) {
			const parts = sjc.split(" ");
			parts.pop();
			courseCode = parts.join(" ");
		}

		const id = await getL.searchCourse(courseCode, sId);

		// console.log("courseCode:", courseCode, "id", id); // "CMU-CS 246"

		const { courseId, semesterId } = id[0];

		if (!courseId || !semesterId)
			return c.json(
				{ success: false, message: "Missing courseId or semesterId" },
				400,
			);

		const results = await getL.getListCourseDetail(courseId, semesterId);

		const fullCourseCode = results;
		// console.log(fullCourseCode.class[0].subjectName,sjc );

		const matchedClasses = fullCourseCode.class.filter((item) =>
			item.courseCode.toLowerCase().includes(sjc.toLowerCase()),
		);

		return c.json({
			success: true,
			data: matchedClasses[0],
			message: "Subjects found successfully",
		});
	} catch (error) {
		console.error(error);
		return c.json(
			{ success: false, message: "Failed to search subjects" },
			500,
		);
	}
};
