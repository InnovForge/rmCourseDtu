import * as cheerio from "cheerio";

type ScrapingResult = {
	success: boolean;
	data?: cheerio.CheerioAPI;
	message?: string;
	errorType?: "TIMEOUT" | "SERVER_ERROR";
};

// const BASE_URL = "https://pdaotao.duytan.edu.vn/";

const scrapingData = async (url: string): Promise<ScrapingResult> => {
	try {
		const response = await fetch(url, {
			signal: AbortSignal.timeout(20000),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.text();
		const status = response.status;

		if (status !== 200 || !data) {
			return {
				success: false,
				message: "Unable to fetch data. Please try again later.",
				errorType: "SERVER_ERROR",
			};
		}
    // console.log(data)

		return {
			success: true,
			data: cheerio.load(data),
		};

	} catch (error: any) {
		if (error.name === "AbortError") {
			return {
				success: false,
				message: "Request timeout. Please try again later.",
				errorType: "TIMEOUT",
			};
		}
		return {
			success: false,
			message: "An unexpected error occurred. Please try again later.",
			errorType: "SERVER_ERROR",
		};
	}
};

export { scrapingData };
