import { Hono } from "hono";
import * as pdaotao from "../controllers/get-list-learn";
const router = new Hono();

router.get("/semester", pdaotao.getSemester);
router.get("/academicYear", pdaotao.getAcademicYear);
router.get("/academicProgram", pdaotao.getAcademicProgram);
router.get("/search", pdaotao.searchCourse);
router.get("/listCourseDetail", pdaotao.getListCourseDetail);
router.get("/calendar/:courseCode",pdaotao.getCalendarByCourseCode);

export default router;
