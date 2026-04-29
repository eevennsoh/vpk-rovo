"use strict";

const fs = require("fs");
const path = require("path");

const DEFAULT_EVENT_LOG_FILE = ".symphony-events.jsonl";

class SymphonyEventLog {
	constructor(options = {}) {
		this.clock = options.clock || Date.now;
		this.filePath = options.filePath || path.join(options.root || process.cwd(), DEFAULT_EVENT_LOG_FILE);
	}

	append(event) {
		const entry = {
			timestamp: new Date(this.clock()).toISOString(),
			...event,
		};
		fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
		fs.appendFileSync(this.filePath, `${JSON.stringify(entry)}\n`);
		return entry;
	}

	readAll(options = {}) {
		if (!fs.existsSync(this.filePath)) {
			return [];
		}
		const lines = fs.readFileSync(this.filePath, "utf8").split(/\r?\n/).filter(Boolean);
		const selected = options.limit ? lines.slice(-options.limit) : lines;
		const events = [];
		for (const line of selected) {
			try {
				events.push(JSON.parse(line));
			} catch {
				events.push({
					parseError: true,
					raw: line,
				});
			}
		}
		return events;
	}
}

module.exports = {
	DEFAULT_EVENT_LOG_FILE,
	SymphonyEventLog,
};
