
const logoutBtn = document.getElementById("logout-btn");

// Check login and get username
async function loadDashboard() {
    try {
        const response = await fetch(
            "http://127.0.0.1:5000/me",
            {
                method: "GET",
                credentials: "include"
            }
        );

        if (!response.ok) {
            sessionStorage.removeItem("loggedIn");
            window.location.href = "login.html";
            return;
        }

        const data = await response.json();

        document.querySelector(".user-name").textContent =
            "Welcome, " + data.username;

    } catch (error) {
        alert("Unable to connect to AYUMAX server.");
    }
}

loadDashboard();


// Logout
if (logoutBtn) {
    logoutBtn.addEventListener("click", async function() {
        try {
            const response = await fetch(
                "http://127.0.0.1:5000/logout",
                {
                    method: "POST",
                    credentials: "include"
                }
            );

            if (response.ok) {
                sessionStorage.removeItem("loggedIn");
                window.location.href = "login.html";
            }

        } catch (error) {
            alert("Unable to logout. Please try again.");
        }
    });
}
