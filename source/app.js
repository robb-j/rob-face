class RobTime extends HTMLElement {
	static get observedAttributes() {
		return ["width", "height", "background", "color"];
	}

	get width() {
		return parseInt(this.getAttribute("width") || "240");
	}
	get height() {
		return parseInt(this.getAttribute("height") || "240");
	}
	get canvas() {
		return this.querySelector("canvas");
	}
	get background() {
		return this.getAttribute("background") ?? "white";
	}
	get color() {
		return this.getAttribute("color") ?? "black";
	}

	/** @type {number | null} */
	timerId = null;

	/** @type {Date | null} */
	date = null;

	setup() {
		let { canvas } = this;
		if (!canvas) {
			canvas = document.createElement("canvas");
			this.append(canvas);
		}

		canvas.width = this.width;
		canvas.height = this.height;
	}
	connectedCallback() {
		this.setup();
		this.tick();
	}
	disconnectedCallback() {
		if (this.timerId) cancelAnimationFrame(this.timerId);
	}
	attributeChangedCallback() {
		this.setup();
	}

	tick() {
		this.render();
		this.timerId = requestAnimationFrame(() => this.tick());
	}

	render() {
		const { canvas, width, height, background, color } = this;
		const ctx = canvas?.getContext("2d");
		if (!ctx) return;

		ctx.fillStyle = background;
		ctx.fillRect(0, 0, width, height);

		ctx.fillStyle = color;
		ctx.strokeStyle = color;
		ctx.imageSmoothingEnabled = false;

		// const time = (this.date ?? new Date()).toISOString().split("T").join(" ");
		// ctx.fillText(time, width / 2, height / 2, width);

		const args = {
			pad: 15,
			handLength: height / 2 - 15,
			handWidth: ((width / 2 - 15) * 2) / 3,
			totalHours: 24,
			hourInterval: 2,
		};

		const referenceDate = this.date ?? new Date();

		const { hours, minutes, seconds } = getDateComponents(referenceDate);

		const formats = {
			time: new Intl.DateTimeFormat("en-gb", {
				hour: "numeric",
				minute: "2-digit",
			}),
			date: new Intl.DateTimeFormat("en-gb", {
				day: "numeric",
				month: "short",
				year: "numeric",
			}),
		};

		const computed = {
			hours: Math.round((hours / 24) * args.handLength),
			minutes: Math.round((minutes / 60) * args.handLength),
			seconds: Math.round((seconds / 60) * args.handLength),

			time: formats.time.format(referenceDate).replace(/^0/, ""),
			date: formats.date.format(referenceDate),
		};

		this.dispatchEvent(
			new CustomEvent("debug", {
				detail: { args, computed },
			})
		);

		// Hours
		ctx.fillRect(
			width / 2 + 1,
			args.pad + (args.handLength - computed.hours) - 1,
			args.handWidth,
			computed.hours
		);

		// Minutes
		ctx.fillRect(
			width / 2 + 1,
			height / 2 + 1,
			computed.minutes,
			args.handWidth
		);

		// Seconds
		ctx.fillRect(
			args.pad + (args.handLength - args.handWidth) - 1,
			height / 2 + 1,
			args.handWidth,
			computed.seconds
		);

		// time text
		const textPad = 10;
		ctx.textAlign = "right";
		ctx.font = "bold 32px Rubik";
		ctx.fillText(computed.time, width / 2 - textPad, height / 2 - textPad);

		// date text
		ctx.textAlign = "right";
		ctx.font = "13px Rubik";
		ctx.fillText(computed.date, width / 2 - textPad, height / 2 - textPad - 32);

		getOrCreateLink("icon").href = canvas.toDataURL("image/webp");
	}
}

/** @param {Date} date */
function getDateComponents(date) {
	const ms = date.getMilliseconds();
	const seconds = date.getSeconds();
	const minutes = date.getMinutes();
	const hours = date.getHours();
	const dateOfMonth = date.getDate();
	const month = date.getMonth();
	const year = date.getFullYear();

	return { ms, seconds, minutes, hours, dateOfMonth, month, year };
}

function getOrCreateLink(rel) {
	/** @type {HTMLLinkElement | null} */
	let elem = document.head.querySelector(`[rel="${rel}"`);
	if (elem) return elem;
	elem = document.createElement("link");
	elem.rel = rel;
	document.head.append(elem);
	return elem;
}

/** @satisfies {Record<string, HTMLInputElement>} */
const controls = {
	hours: document.querySelector("input[name=hours]"),
	minutes: document.querySelector("input[name=minutes]"),
	seconds: document.querySelector("input[name=seconds]"),
	override: document.querySelector("input[name=override]"),
	speed: document.querySelector("select[name=speed]"),
};

/** @satisfies {Record<string, HTMLButtonElement>} */
const buttons = {
	reset: document.querySelector("button[name=reset]"),
	override: document.querySelector("button[name=override]"),
};

/** @type {RobTime} */
const face = document.querySelector("rob-time");

/** @type {HTMLPreElement} */
const debug = document.querySelector("#debug");

function main() {
	customElements.define("rob-time", RobTime);

	// Setup state from controls / previous values
	if (controls.override.checked) face.date = new Date();
	updateControls(controls.override.checked);

	controls.hours.addEventListener("input", () => {
		face.date?.setHours(controls.hours.valueAsNumber);
	});
	controls.minutes.addEventListener("input", () => {
		face.date?.setMinutes(controls.minutes.valueAsNumber);
	});
	controls.seconds.addEventListener("input", () => {
		face.date?.setSeconds(controls.seconds.valueAsNumber);
	});
	controls.override.addEventListener("input", () => {
		console.log("checked", controls.override.checked);
		face.date = controls.override.checked ? new Date() : null;
		updateControls(controls.override.checked);
	});

	face.addEventListener("debug", (event) => {
		debug.innerHTML = JSON.stringify(event.detail, null, 2);
	});

	update();
}

let lastTick = Date.now();

function update() {
	// ...

	if (!face.date) {
		applyDate(new Date());
	}

	if (face.date && controls.speed.value) {
		const dt = Date.now() - lastTick;

		face.date.setMilliseconds(
			face.date.getMilliseconds() + dt * parseInt(speed.value)
		);
		applyDate(face.date);
	}

	lastTick = Date.now();
	requestAnimationFrame(update);
}

function applyDate(date) {
	controls.hours.value = date.getHours();
	controls.minutes.value = date.getMinutes();
	controls.seconds.value = date.getSeconds();
}

function updateControls(overidden) {
	controls.hours.disabled = !overidden;
	controls.minutes.disabled = !overidden;
	controls.seconds.disabled = !overidden;
	controls.speed.disabled = !overidden;
}

main();
