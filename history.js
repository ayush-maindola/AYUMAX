
const container = document.getElementById("history-container");
const logoutBtn = document.getElementById("logout-btn");

const API_URL = "https://ayumax-backend.onrender.com";

// Load assessment history
async function loadHistory() {

    try {
        const response = await fetch(`${API_URL}/history`, {
            method: "GET",
            credentials: "include"
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            throw new Error("Unable to load history");
        }

        const records = await response.json();

        container.innerHTML = "";

        if (records.length === 0) {
            container.innerHTML = `
                <div class="history-empty">
                    <div class="empty-icon">◷</div>
                    <h3>No Assessments Yet</h3>
                    <p>Your previous assessments will appear here.</p>
                    <a href="symptoms.html">Start Your First Assessment →</a>
                </div>
            `;
            return;
        }

        records.forEach((record, index) => {

            const card = document.createElement("div");
            card.className = "assessment-record";

            // Make card clickable
            card.style.cursor = "pointer";
            card.setAttribute("role", "link");
            card.tabIndex = 0;

            const date = new Date(record.created_at);

            const formattedDate = isNaN(date.getTime())
                ? record.created_at
                : date.toLocaleString();

            card.innerHTML = `
                <div class="record-top">
                    <span class="record-number">
                        ASSESSMENT #${index + 1}
                    </span>
                    <span class="record-date"></span>
                </div>

                <div class="record-details">
                    <div class="record-detail">
                        <span>AGE</span>
                        <strong class="record-age"></strong>
                    </div>

                    <div class="record-detail">
                        <span>DURATION</span>
                        <strong class="record-duration"></strong>
                    </div>
                </div>

                <div class="record-symptoms">
                    <span>REPORTED SYMPTOMS</span>
                    <p class="record-symptom-text"></p>
                </div>

                <div class="record-open-hint">
                    Click to view AI result →
                </div>
            `;

            card.querySelector(".record-date").textContent = formattedDate;
            card.querySelector(".record-age").textContent =
                record.age + " years";

            card.querySelector(".record-duration").textContent =
                record.duration;

            card.querySelector(".record-symptom-text").textContent =
                record.symptoms;

            // Open saved result
            function openResult() {
                window.location.href =
                    `result.html?id=${encodeURIComponent(record.id)}`;
            }

            card.addEventListener("click", openResult);

            card.addEventListener("keydown", function(event) {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openResult();
                }
            });

            container.appendChild(card);
        });

    } catch (error) {

        container.innerHTML = `
            <div class="history-error">
                Unable to load your records. Please try again.
            </div>
        `;

        console.error(error);
    }
}

loadHistory();


// Logout
if (logoutBtn) {

    logoutBtn.addEventListener("click", async function() {

        try {
            const response = await fetch(`${API_URL}/logout`, {
                method: "POST",
                credentials: "include"
            });

            if (response.ok) {
                sessionStorage.removeItem("loggedIn");
                window.location.href = "login.html";
            }

        } catch (error) {
            alert("Unable to logout. Please try again.");
        }
    });
}
