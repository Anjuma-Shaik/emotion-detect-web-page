// const video = document.getElementById("video");
const resultDiv = document.getElementById("result");
const confidenceDiv = document.getElementById("confidence");
const overlay = document.getElementById("overlay");
let lastSpokenEmotion = "";
let voiceEnabled = true;

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models"),
  faceapi.nets.faceExpressionNet.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models")
]).then(startVideo);

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: {} })
    .then((stream) => { video.srcObject = stream; })
    .catch((err) => console.error("Error accessing webcam:", err));
}

video.addEventListener("play", () => {
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(overlay, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions();

    const resized = faceapi.resizeResults(detections, displaySize);
    overlay.getContext("2d").clearRect(0, 0, overlay.width, overlay.height);
    faceapi.draw.drawDetections(overlay, resized);
    faceapi.draw.drawFaceExpressions(overlay, resized);

    if (detections.length > 0) {
      const emotions = detections[0].expressions;
      const sorted = Object.entries(emotions).sort((a, b) => b[1] - a[1]);
      const topEmotion = sorted[0][0];

      // Label
      resultDiv.textContent = `Emotion: ${topEmotion}`;

      // Voice
      if (topEmotion !== lastSpokenEmotion && voiceEnabled) {
        speak(topEmotion);
        lastSpokenEmotion = topEmotion;
      }

      // Confidence bars
      confidenceDiv.innerHTML = sorted.map(([emo, val]) => `
        <div class="bar-label">${emo} ${(val*100).toFixed(1)}%</div>
        <div class="bar"><div class="bar-fill" style="width:${val*100}%;"></div></div>
      `).join("");
    } else {
      resultDiv.textContent = "No face detected";
      confidenceDiv.innerHTML = "";
    }
  }, 500);
});

function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(msg);
}

// Toggle Voice
document.getElementById("toggleVoice").addEventListener("click", () => {
  voiceEnabled = !voiceEnabled;
  document.getElementById("toggleVoice").textContent = voiceEnabled ? "🔊 Voice ON" : "🔇 Voice OFF";
});

// Restart Camera
document.getElementById("restartCam").addEventListener("click", () => {
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }
  startVideo();
});
