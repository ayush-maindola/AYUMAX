
const signupForm = document.getElementById("signup-form");

signupForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const message = document.getElementById("signup-message");

    try {
        const response = await fetch("http://127.0.0.1:5000/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                username: username,
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok) {
            message.textContent = data.message;
            message.style.color = "lightgreen";

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
