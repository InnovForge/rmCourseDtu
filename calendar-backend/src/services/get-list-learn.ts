import { scrapingData } from "../lib/cheerio";

export const academicYear = async () => {
	const url =
		"https://courses.duytan.edu.vn/Modules/academicprogram/ajax/LoadNamHoc.aspx";
	const scraping = await scrapingData(url);

	if (!scraping.success || !scraping.data) {
		throw new Error(scraping.message);
	}
	const $ = scraping.data;
	const rows = $("option")
		.slice(1)
		.map((_, el) => {
			return {
				academicYearId: $(el).val(),
				name: $(el).text().trim(),
			};
		})
		.get();

	return rows;
};

export const semester = async (id: string) => {
	const url = `https://courses.duytan.edu.vn/Modules/academicprogram/ajax/LoadHocKy.aspx?namhoc=${id}`;

	const scraping = await scrapingData(url);

	if (!scraping.success || !scraping.data) {
		throw new Error(scraping.message);
	}

	const $ = scraping.data;

	const rows = $("option")
		.slice(1)
		.map((_, el) => {
			return {
				semesterId: $(el).val(),
				name: $(el).text().trim(),
			};
		})
		.get();

	return rows;
};

export const academicProgram = async () => {
	const url =
		"https://courses.duytan.edu.vn/Modules/academicprogram/ajax/LoadCourses.aspx";
	return scrapingData(url).then((scraping) => {
		if (!scraping.success || !scraping.data) {
			throw new Error(scraping.message);
		}
		const $ = scraping.data;
		const rows = $("option")
			.slice(1)
			.map((_, el) => {
				return {
					academicProgramId: $(el).val(),
					name: $(el).text().trim(),
				};
			})
			.get();
		return rows;
	});
};

export const searchCourse = async (q: string, semester: string) => {
	const url = `https://courses.duytan.edu.vn/Modules/academicprogram/CourseResultSearch.aspx?keyword2=*${q}*&scope=1~3~2&hocky=${semester}`;

	const scraping = await scrapingData(url);

	if (!scraping.success || !scraping.data) {
		throw new Error(scraping.message);
	}

	const $ = scraping.data;

	const rows = $("tr")
		.slice(2)
		.map((_, el) => {
			const code = $(el).find("td").eq(0).text().trim();
			const title = $(el).find("td").eq(1).text().trim();

			const rawHref = $(el).find("td").eq(0).find("a").attr("href") ?? "";
			const cleanedHref = rawHref.replace(/^(\.\.\/)+/, ""); // Remove leading "../" segments

			let courseId: string | null = null; // mã môn
			let timespan: string | null = null; // đây là id học (semester)  truy vấn

			if (cleanedHref.includes("?")) {
				const params = new URLSearchParams(cleanedHref.split("?")[1]);
				courseId = params.get("courseid");
				timespan = params.get("timespan");
			}

			return {
				code,
				name: title,
				courseId: courseId,
				semesterId: timespan,
			};
		})
		.get();

	return rows;
};

export const getListCourseDetail = async (
	courseId: string,
	semesterId: string,
) => {
	const url = `https://courses.duytan.edu.vn/Modules/academicprogram/CourseClassResult.aspx?courseid=${courseId}&semesterid=${semesterId}&timespan=${semesterId}`;
  // console.log(url)
	const scraping = await scrapingData(url);

	if (!scraping.success || !scraping.data) {
		throw new Error(scraping.message);
	}
	const $ = scraping.data;

	const title = $(".ico-namnganhhoc span").text().trim();

	const info = $(".tb_coursedetail").find("table");

	const rows = info.find("tr");

	const keyMap: Record<string, string> = {
		"Mã môn": "code",
		"Số ĐVHT": "credits",
		"Loại ĐVHT": "creditType",
		"Loại hình": "courseType",
		"Học kỳ": "semester",
		"Môn học tiên quyết": "prerequisite",
		"Môn học song hành": "corequisite",
		"Mô tả môn học": "description",
	};

	const detail: Record<string, string> = {};
	detail["title"] = title;

	rows.each((_, row) => {
		const tds = $(row).find("td");
		if (tds.length >= 2) {
			const rawKey = tds.eq(0).text().trim();
			const viKey = rawKey
				.replace(/^[-–—]\s*/, "")
				.replace(/:$/, "")
				.trim();
			const enKey = keyMap[viKey] ?? viKey;
			const value = tds.eq(1).text().trim();
			detail[enKey] = value;
		}
	});

	const headers: string[] = [];
	$(".calendar thead tr th").each(function () {
		const headerText = $(this).text().replace(/\s+/g, " ").trim();
		headers.push(headerText);
	});

	const result: any[] = [];

	$(".calendar tbody tr.lop").each(function () {
		const row: Record<string, any> = {};

		$(this)
			.find("td")
			.each(function (i) {
				const cellText = $(this).text().replace(/\s+/g, " ").trim();
				const key = headers[i] || `col${i}`;
				row[key] = cellText;
			});

		// Map tiếng Việt -> tiếng Anh
		const mappedRow: Record<string, any> = {
			courseCode: row["Tên lớp"],
			registrationCode: row["Mã đăng ký"],
			classType: row["Loại hình"],
			remainingSlots: row["Số chỗ Còn lại"],
			registrationPeriod: row["Hạn đăng ký"],
			weeks: row["Tuần học"],
			schedule: null,
			canceledWeeks: null,
			rooms: row["Phòng"],
			location: row["Địa điểm"],
			lecturer: row["Giảng viên"],
			registrationStatus: row["Tình trạng Đăng ký"],
			deploymentStatus: row["Tình trạng Triển khai"],
		};

		const registrationPeriod = row["Hạn đăng ký"];
		if (registrationPeriod) {
			const [start, end] = registrationPeriod.split(" ");
			mappedRow.registrationPeriod = { start, end };
		}
		const studyStart = new Date();
		const studyEnd = new Date(studyStart.getTime() + 1 * 24 * 60 * 60 * 1000);

		mappedRow.studyPeriod = {
			start: studyStart.toISOString().split("T")[0],
			end: studyEnd.toISOString().split("T")[0],
		};

		const scheduleRaw = row["Giờ học"];
		if (scheduleRaw) {
			const { times, cancelWeeks } = parseSchedule(scheduleRaw);
			mappedRow.schedule = times;
			mappedRow.canceledWeeks = cancelWeeks;
		}

		result.push(mappedRow);
	});

	return {
		info: detail,
		class: result,
	};
};

function parseSchedule(raw: string) {
	const [timePart, cancelPartRaw] = raw.split("Tuần hủy:");
	const result: {
		times: Record<string, { start: string; end: string }>;
		cancelWeeks: Record<string, number[]>;
	} = {
		times: {},
		cancelWeeks: {},
	};

	// Giờ học
	const timeMatches = [
		...timePart.matchAll(/(T[2-7]):\s*([\d:]+)\s*-\s*([\d:]+)/g),
	];
	for (const [, day, start, end] of timeMatches) {
		result.times[day] = { start, end };
	}

	const cancelMatches = cancelPartRaw?.matchAll(
		/(T[2-7]):\s*Hủy\s*([\d,\s]+)/g,
	);
	if (cancelMatches) {
		for (const [, day, weeks] of cancelMatches) {
			const weekArray = weeks.split(",").map((w) => parseInt(w.trim(), 10));
			result.cancelWeeks[day] = weekArray;
		}
	}

	return result;
}

export const getCalendarByCourseCode = async (
	subjectCode: string,
	semesterId: string,
) => {
	const get = await searchCourse(subjectCode, semesterId);

	return get;
};
