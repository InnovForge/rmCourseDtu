import { createApp } from "vue";
import { VueQueryPlugin } from "@tanstack/vue-query";
import "./style.css";
import App from "./App.vue";
import {
	createMemoryHistory,
	createRouter,
	createWebHistory,
} from "vue-router";
import Calendar from "./components/Calendar.vue";
import Search from "./components/Search.vue";
import Layout from "./components/Layout.vue";
import CourseDetail from "./components/CourseDetail.vue";

const routes = [
	{
		path: "/",
		component: Layout,
		children: [
			{ path: "/calendar", component: Calendar },
			{ path: "results", component: Search },

			{ path: "/c/:courseId", component: CourseDetail },
		],
	},
	{
		path: "/:pathMatch(.*)*",
		component: () => import("./components/NotFound.vue"),
	},
	// { path: '/search', component: AboutView },
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

createApp(App).use(router).use(VueQueryPlugin).mount("#app");
