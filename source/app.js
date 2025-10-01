import { RobTime } from "./rob-time.js";

/** @satisfies {Record<string, HTMLInputElement>} */
const controls = {
	hours: document.querySelector("input[name=hours]"),
	minutes: document.querySelector("input[name=minutes]"),
	seconds: document.querySelector("input[name=seconds]"),
	override: document.querySelector("input[name=override]"),
	speed: document.querySelector("select[name=speed]"),
	background: document.querySelector("input[name=background]"),
	color: document.querySelector("input[name=color]"),
};

/** @type {RobTime} */
const face = document.querySelector("rob-time");

/** @type {HTMLPreElement} */
const debug = document.querySelector("#debug");

function main() {
	customElements.define("rob-time", RobTime);

	// Setup state from controls / previous values
	updateControls(controls.override.checked);
	if (controls.override.checked) face.date = new Date();
	face.background = controls.background.value;
	face.color = controls.color.value;

	// Add event listeners
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

	controls.background.addEventListener("input", () => {
		face.background = controls.background.value;
	});
	controls.color.addEventListener("input", () => {
		face.color = controls.color.value;
	});

	face.addEventListener("debug", (event) => {
		debug.innerHTML = JSON.stringify(event.detail, null, 2);
	});

	// start the loop
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
			face.date.getMilliseconds() + dt * parseInt(speed.value),
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
