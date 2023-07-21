/**
 * Opens a new window with POSTed form data
 */
export function openWindowWithPost(url: string, name: string, data: Record<string, string>) {
	const form = document.createElement("form");
	form.method = "POST";
	form.action = url;
	form.target = name; // or could just use Date.now()
	let submitButton = null;
	for (const [ k, v ] of Object.entries(data)) {
		const input = document.createElement("input");
		input.name = k;
		input.value = v;
		form.appendChild(input);
		if (k === "submit") submitButton = input;
	}
	form.style.display = "none";
	document.body.appendChild(form);

	window.open("", name);
	if (submitButton !== null) {
		//submitButton.click();
		HTMLFormElement.prototype.submit.call(form);
	} else {
		form.submit();
	}
}
