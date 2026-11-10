console.log("AYUMAX RESULT PAGE LOADED");

const analysisContent = document.getElementById("analysis-content");

async function loadResult() {

    const params = new URLSearchParams(window.location.search);
    const assessmentId = params.get("id");

    if (!assessmentId) {
        analysisContent.textContent = "No assessment ID found.";
        return;
    }

    analysisContent.textContent = "Loading your saved AI analysis...";

    try {
        const response = await fetch(
            `https://ayumax-backend.onrender.com/assessment/${encodeURIComponent(assessmentId)}`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unable to load result.");
        }

        if (!data.analysis) {
            analysisContent.textContent =
                "No saved AI result is available for this older assessment.";
            return;
        }

        analysisContent.textContent = data.analysis;

    } catch (error) {
        console.error(error);
        analysisContent.textContent = error.message;
    }
}

loadResult();