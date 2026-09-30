const panels = ["dashboard", "trends", "script", "storyboard", "export"];

function show(id) {
panels.forEach(panel => {
const element = document.getElementById(panel);
if (element) element.classList.toggle("active", panel === id);
});

document.querySelectorAll(".nav").forEach(button => {
button.classList.toggle("active", button.dataset.panel === id);
});
}

document.querySelectorAll(".nav").forEach(button => {
button.addEventListener("click", () => show(button.dataset.panel));
});

/* -----------------------------
TREND IDEAS
----------------------------- */

function useIdea(text) {
const ideaBox = document.getElementById("idea");

if (ideaBox) {
ideaBox.value = text;
show("script");
ideaBox.focus();
}
}

/* -----------------------------
AI SCRIPT GENERATOR
----------------------------- */

async function generateScript() {
const idea = document.getElementById("idea").value.trim();
const format = document.getElementById("format").value;
const length = document.getElementById("length").value;
const output = document.getElementById("scriptOut");

if (!idea) {
output.textContent = "Please enter a video idea first.";
return;
}

output.textContent = "Generating your script...";

try {
const response = await fetch("/api/script", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
idea,
format,
length
})
});

const data = await response.json();

if (!response.ok) {
  throw new Error(data.error || "Script generation failed.");
}

output.textContent = data.script;

buildStoryboardFromScript(data.script);

} catch (error) {
console.error(error);

output.textContent =
  "Could not generate the script.\n\n" +
  error.message +
  "\n\nMake sure the Trend Forge backend is running.";

}
}

/* -----------------------------
STORYBOARD
----------------------------- */

let sceneNumber = 0;

function addScene(title = "", description = "") {
sceneNumber++;

const container = document.getElementById("scenes");

const scene = document.createElement("div");
scene.className = "scene";
scene.dataset.scene = sceneNumber;

scene.innerHTML = `
<div class="scene-header">
<strong>Scene ${sceneNumber}</strong>
<button onclick="removeScene(this)">Remove</button>
</div>

<input
  class="scene-title"
  placeholder="Scene title"
  value="${escapeHTML(title)}"
>

<textarea
  class="scene-description"
  placeholder="Describe what should happen in this scene..."
>${escapeHTML(description)}</textarea>

`;

container.appendChild(scene);
}

function removeScene(button) {
const scene = button.closest(".scene");

if (scene) {
scene.remove();
renumberScenes();
}
}

function renumberScenes() {
const scenes = document.querySelectorAll("#scenes .scene");

scenes.forEach((scene, index) => {
scene.dataset.scene = index + 1;

const heading = scene.querySelector(".scene-header strong");

if (heading) {
  heading.textContent = `Scene ${index + 1}`;
}

});

sceneNumber = scenes.length;
}

function buildStoryboardFromScript(script) {
const container = document.getElementById("scenes");

if (!container) return;

container.innerHTML = "";
sceneNumber = 0;

const lines = script
.split("\n")
.map(line => line.trim())
.filter(Boolean);

let scenes = [];

lines.forEach(line => {
if (
/scene\s*\d+/i.test(line) ||
/hook/i.test(line) ||
/ending/i.test(line) ||
/call to action/i.test(line)
) {
scenes.push(line);
}
});

if (scenes.length === 0) {
scenes = [
"Opening hook",
"Main point",
"Supporting visual",
"Final point",
"Call to action"
];
}

scenes.slice(0, 10).forEach((scene, index) => {
addScene(
scene.replace(/^scene\s*\d*[:.-]?\s*/i, ""),
"Create a visual scene for: ${scene}"
);
});

show("storyboard");
}

/* -----------------------------
VIDEO GENERATION
----------------------------- */

async function renderVideo() {
const scenes = [...document.querySelectorAll("#scenes .scene")];

if (scenes.length === 0) {
alert("Add at least one scene before rendering.");
return;
}

const project = {
resolution: document.querySelector("#export select")?.value || "1080 × 1920",
format: "MP4",

scenes: scenes.map(scene => ({
  title: scene.querySelector(".scene-title")?.value || "",
  description: scene.querySelector(".scene-description")?.value || ""
}))

};

const button = document.querySelector(
'#storyboard button.primary'
);

if (button) {
button.disabled = true;
button.textContent = "Generating video...";
}

try {
const response = await fetch("/api/video", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify(project)
});

const data = await response.json();

if (!response.ok) {
  throw new Error(data.error || "Video generation failed.");
}

if (data.url) {
  showVideoResult(data.url);
} else if (data.id) {
  await monitorVideo(data.id);
}

} catch (error) {
console.error(error);

alert(
  "Video generation failed.\n\n" +
  error.message
);

} finally {
if (button) {
button.disabled = false;
button.textContent = "Render video";
}
}
}

/* -----------------------------
VIDEO STATUS
----------------------------- */

async function monitorVideo(videoId) {
show("export");

const statusBox = document.getElementById("videoStatus");

if (statusBox) {
statusBox.textContent = "AI is generating your video...";
}

const maxAttempts = 120;

for (let attempt = 0; attempt < maxAttempts; attempt++) {

await wait(5000);

const response = await fetch(
  `/api/video/${encodeURIComponent(videoId)}`
);

const data = await response.json();

if (!response.ok) {
  throw new Error(data.error || "Could not check video status.");
}

if (statusBox) {
  statusBox.textContent =
    `Video generation status: ${data.status || "processing"}...`;
}

if (data.url) {
  showVideoResult(data.url);
  return;
}

if (
  data.status === "failed" ||
  data.status === "canceled"
) {
  throw new Error(
    data.error || "The video generation job failed."
  );
}

}

throw new Error("Video generation timed out.");
}

/* -----------------------------
VIDEO RESULT
----------------------------- */

function showVideoResult(url) {
show("export");

const panel = document.getElementById("export");

let result = document.getElementById("videoResult");

if (!result) {
result = document.createElement("div");
result.id = "videoResult";
result.className = "card";

panel.appendChild(result);

}

result.innerHTML = `
<h3>🎉 Video ready</h3>

<video
  controls
  playsinline
  style="width:100%;max-width:720px;border-radius:14px;"
  src="${escapeAttribute(url)}">
</video>

<br><br>

<a
  href="${escapeAttribute(url)}"
  target="_blank"
  rel="noopener"
  class="primary"
>
  Open / Download Video
</a>

`;
}

/* -----------------------------
UTILITIES
----------------------------- */

function wait(milliseconds) {
return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function escapeHTML(value) {
return String(value)
.replaceAll("&", "&")
.replaceAll("<", "<")
.replaceAll(">", ">")
.replaceAll('"', """)
.replaceAll("'", "'");
}

function escapeAttribute(value) {
return escapeHTML(value);
}

/* -----------------------------
INITIAL PROJECT
----------------------------- */

document.addEventListener("DOMContentLoaded", () => {
const scenes = document.getElementById("scenes");

if (scenes && scenes.children.length === 0) {
addScene(
"Opening Hook",
"Create an attention-grabbing opening visual."
);
}

const renderButton = document.querySelector(
'#storyboard button.primary'
);

if (renderButton) {
renderButton.onclick = renderVideo;
}
});
