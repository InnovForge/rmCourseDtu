import { Hono } from "hono";
import pdaotaoCached from "./get-list-learn";

const router = new Hono();

router.route("/courses/scraping", pdaotaoCached);

// router.get('/courses/scraping', (c) => {
//   return c.text('Scraping');
// });
//
export default router;

