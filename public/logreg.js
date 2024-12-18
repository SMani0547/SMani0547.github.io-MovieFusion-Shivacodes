document.getElementById("show-register-form").addEventListener("click", () => {
    document.getElementById("register-form").style.display = "block";
    document.getElementById("login-form").style.display = "none";
});

document.getElementById("show-login-form").addEventListener("click", () => {
    document.getElementById("login-form").style.display = "block";
    document.getElementById("register-form").style.display = "none";
});

document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Login successful!");
            window.location.href = "/admin"; // Redirect to admin page
        } else {
            alert("Login failed. Please check your credentials.");
        }
    });
});

document.getElementById("register-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("new-username").value;
    const password = document.getElementById("new-password").value;

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Registration successful!");
            window.location.href = "/admin"; // Redirect to admin page
        } else {
            alert("Registration failed. Try a different username.");
        }
    });
});
