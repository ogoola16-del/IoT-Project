const form =
    document.getElementById("doctor-login-form");

const errorMessage =
    document.getElementById("error-message");

const loginButton =
    document.getElementById("login-button");

const loginContent =
    document.getElementById("login-content");

const loginSuccess =
    document.getElementById("login-success");

const doctorName =
    document.getElementById("doctor-name");


// =========================
// FORM SUBMISSION
// =========================

form.addEventListener("submit", async (event) => {

    event.preventDefault();


    // =========================
    // GET VALUES
    // =========================

    const doctor_id =
        document
            .getElementById("doctor_id")
            .value
            .trim()
            .toUpperCase();


    const password =
        document
            .getElementById("password")
            .value;


    // =========================
    // CLEAR ERROR
    // =========================

    errorMessage.textContent = "";


    // =========================
    // DISABLE BUTTON
    // =========================

    loginButton.disabled = true;

    loginButton.textContent =
        "Logging in...";


    // =========================
    // SEND TO SERVER
    // =========================

    try {

        const response =
            await fetch(
                "/api/doctor/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        doctor_id,
                        password

                    })
                }
            );


        const data =
            await response.json();


        // =========================
        // HANDLE ERROR
        // =========================

        if (!response.ok) {

            errorMessage.textContent =
                data.error ||
                "Invalid Doctor ID or password.";

            loginButton.disabled = false;

            loginButton.textContent =
                "Login";

            return;

        }


        // =========================
        // SUCCESS
        // =========================

        console.log(
            "Doctor logged in:",
            data.doctor
        );


        doctorName.textContent =
            data.doctor.name;


        loginContent.style.display =
            "none";

        loginSuccess.style.display =
            "block";


        // =========================
        // REDIRECT
        // =========================

        setTimeout(() => {

            window.location.href =
                "index.html";

        }, 1500);


    }


    catch (error) {

        console.error(
            "Login error:",
            error
        );


        errorMessage.textContent =
            "Could not connect to the server.";


        loginButton.disabled = false;

        loginButton.textContent =
            "Login";

    }

});