
const loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const message = document.getElementById("login-message");

    try {
        const response = await fetch("https://ayumax-backend.onrender.com/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok) {
            message.textContent = "Welcome, " + data.username + "!";
            message.style.color = "lightgreen";

            // Save login status for this browser tab
            sessionStorage.setItem("loggedIn", "true");

            window.location.href = "dashboard.html";

        } else {
            message.textContent = data.error;
            message.style.color = "red";
        }

    } catch (error) {
        message.textContent = "Unable to connect to AYUMAX server.";
        message.style.color = "red";
    }
});
