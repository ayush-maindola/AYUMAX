
console.log("AYUMAX RESULT PAGE LOADED");

const analysisContent = document.getElementById("analysis-content");

const savedAnalysis = sessionStorage.getItem("ayumaxAnalysis");

if (savedAnalysis) {
    try {
        const data = JSON.parse(savedAnalysis);

        analysisContent.textContent = data.analysis;
    } catch (error) {
        analysisContent.textContent =
            "Unable to display your analysis. Please try again.";
        console.error("Result Error:", error);
    }
} else {
    analysisContent.textContent =
        "No analysis found. Please visit the Symptom Checker and try again.";
}
