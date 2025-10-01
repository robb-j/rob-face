export class RobTime extends HTMLElement {
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

	set background(value) {
		if (value) {
			this.setAttribute("background", value);
			this.style.setProperty("--background", value);
		} else {
			this.removeAttribute("background");
			this.style.removeProperty("--background");
		}
	}
	get background() {
		return this.getAttribute("background") ?? "white";
	}

	set color(value) {
		if (value) {
			this.setAttribute("color", value);
			this.style.setProperty("--color", value);
		} else {
			this.removeAttribute("color");
			this.style.removeProperty("--color");
		}
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

			time: formats.time.format(referenceDate),
			date: formats.date.format(referenceDate),
		};

		this.dispatchEvent(
			new CustomEvent("debug", {
				detail: { args, computed },
			}),
		);

		// Hours
		ctx.fillRect(
			width / 2 + 1,
			args.pad + (args.handLength - computed.hours) - 1,
			args.handWidth,
			computed.hours,
		);

		// Minutes
		ctx.fillRect(
			width / 2 + 1,
			height / 2 + 1,
			computed.minutes,
			args.handWidth,
		);

		// Seconds
		ctx.fillRect(
			args.pad + (args.handLength - args.handWidth) - 1,
			height / 2 + 1,
			args.handWidth,
			computed.seconds,
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

export function getOrCreateLink(rel) {
	/** @type {HTMLLinkElement | null} */
	let elem = document.head.querySelector(`[rel="${rel}"`);
	if (elem) return elem;
	elem = document.createElement("link");
	elem.rel = rel;
	document.head.append(elem);
	return elem;
}
