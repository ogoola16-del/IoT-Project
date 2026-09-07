const form =
    document.getElementById("doctor-form");

const errorMessage =
    document.getElementById("error-message");

const signupContent =
    document.getElementById("signup-content");

const successMessage =
    document.getElementById("success-message");

const doctorId =
    document.getElementById("doctor-id");

const organizationDisplay =
    document.getElementById("organization-display");

const signupButton =
    document.getElementById("signup-button");


// =========================
// FORM SUBMISSION
// =========================

form.addEventListener("submit", async (event) => {

    event.preventDefault();


    // =========================
    // GET FORM VALUES
    // =========================

    const organization_id =
        document
            .getElementById("organization_id")
            .value
            .trim()
            .toUpperCase();


    const name =
        document
            .getElementById("name")
            .value
            .trim();


    const email =
        document
            .getElementById("email")
            .value
            .trim();


    const password =
        document
            .getElementById("password")
            .value;


    const confirmPassword =
        document
            .getElementById("confirm-password")
            .value;


    // =========================
    // CLEAR ERROR
    // =========================

    errorMessage.textContent = "";


    // =========================
    // CHECK PASSWORD
    // =========================

    if (password !== confirmPassword) {

        errorMessage.textContent =
            "Passwords do not match.";

        return;
    }


    // =========================
    // DISABLE BUTTON
    // =========================

    signupButton.disabled = true;

    signupButton.textContent =
        "Verifying...";


    // =========================
    // SEND TO SERVER
    // =========================

    try {

        const response =
            await fetch(
                "/api/doctor/signup",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        organization_id,
                        name,
                        email,
                        password
                    })
                }
            );


        const data =
            await response.json();


        // =========================
        // HANDLE SERVER ERROR
        // =========================

        if (!response.ok) {

            errorMessage.textContent =
                data.error ||
                "Doctor registration failed.";

            signupButton.disabled = false;

            signupButton.textContent =
                "Verify & Submit";

            return;
        }


        // =========================
        // SUCCESS
        // =========================

        signupContent.style.display =
            "none";

        successMessage.style.display =
            "block";


        doctorId.textContent =
            data.doctor.doctor_id;


        organizationDisplay.textContent =
            data.doctor.organization_id;


        console.log(
            "Doctor registered successfully:",
            data.doctor
        );

    }


    catch (error) {

        console.error(
            "Signup error:",
            error
        );

        errorMessage.textContent =
            "Could not connect to the server.";

        signupButton.disabled = false;

        signupButton.textContent =
            "Verify & Submit";

    }

});