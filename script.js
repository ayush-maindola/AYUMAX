
console.log("AYUMAX SCRIPT LOADED");

const form = document.getElementById("symptomForm");

if (form) {

    console.log("FORM FOUND");

    form.addEventListener("submit", async function (event) {

        // Prevent normal form reload
        event.preventDefault();
        event.stopPropagation();

        console.log("FORM SUBMITTED");

        const age = document.getElementById("age").value;
        const symptoms = document.getElementById("symptoms").value.trim();
        const duration = document.getElementById("duration").value;

        const result = document.getElementById("result");
        const submitButton = form.querySelector('button[type="submit"]');

        // Validate input
        if (!age || !symptoms || !duration) {
            result.textContent = "Please fill in all fields.";
            return;
        }

        result.style.display = "block";
        result.style.whiteSpace = "pre-wrap";
        result.textContent = "Saving your assessment...\nPlease wait.";

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Analysing...";
        }

        try {

            // STEP 1: SAVE ASSESSMENT

            console.log("STEP 1: Saving assessment");

            const saveResponse = await fetch(
                "https://ayumax-backend.onrender.com/check-symptoms",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        age: age,
                        symptoms: symptoms,
                        duration: duration
                    })
                }
            );

            const saveData = await saveResponse.json();

            console.log("SAVE STATUS:", saveResponse.status);
            console.log("SAVE DATA:", saveData);

            if (!saveResponse.ok) {
                throw new Error(
                    saveData.error || "Unable to save assessment."
                );
            }


            // STEP 2: REQUEST GEMINI AI

            console.log("STEP 2: Requesting Gemini AI");

            result.textContent =
                "AYUMAX AI is analysing your symptoms...\n\nPlease wait.";

            const aiResponse = await fetch(
                "https://ayumax-backend.onrender.com/analyze-symptoms",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        age: age,
                        symptoms: symptoms,
                        duration: duration
                    })
                }
            );

            const aiData = await aiResponse.json();

            console.log("AI STATUS:", aiResponse.status);
            console.log("AI DATA:", aiData);

            if (!aiResponse.ok) {
                throw new Error(
                    aiData.error || "AI analysis failed."
                );
            }

            if (
                typeof aiData.analysis !== "string" ||
                !aiData.analysis.trim()
            ) {
                throw new Error("AI returned an empty response.");
            }


            // STEP 3: STORE AI RESPONSE

            console.log("STEP 3: Saving AI response");

            const analysisData = {
                analysis: aiData.analysis,
                age: age,
                symptoms: symptoms,
                duration: duration
            };

            sessionStorage.setItem(
                "ayumaxAnalysis",
                JSON.stringify(analysisData)
            );

            // Verify stored response
            const storedData = sessionStorage.getItem("ayumaxAnalysis");

            console.log("SESSION STORAGE:", storedData);

            if (!storedData) {
                throw new Error("Unable to store AI analysis.");
            }


            // STEP 4: OPEN RESULT PAGE

            console.log("STEP 4: Opening result page");

            result.textContent = "Analysis complete! Opening your report...";

            window.location.assign("./result.html");

            return;

        } catch (error) {

            console.error("AYUMAX ERROR:", error);

            result.textContent =
                "Unable to complete your analysis.\n\n" +
                error.message +
                "\n\nPlease try again.";

        } finally {

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Analyse Symptoms →";
            }
        }
    });

    console.log("SUBMIT LISTENER ATTACHED");

} else {

    console.error("SYMPTOM FORM NOT FOUND!");

}
