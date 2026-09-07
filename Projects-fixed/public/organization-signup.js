const form =
    document.getElementById("organization-form");

const successMessage =
    document.getElementById("success-message");

const organizationId =
    document.getElementById("organization-id");

const errorMessage =
    document.getElementById("error-message");


// =========================
// FORM SUBMISSION
// =========================

form.addEventListener("submit", async (event) => {

    event.preventDefault();


    // =========================
    // GET FORM VALUES
    // =========================

    const organization_name =
        document
            .getElementById("organization_name")
            .value
            .trim();


    const email =
        document
            .getElementById("email")
            .value
            .trim();


    const phone =
        document
            .getElementById("phone")
            .value
            .trim();


    const address =
        document
            .getElementById("address")
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
    // CHECK PASSWORDS
    // =========================

    if (password !== confirmPassword) {

        errorMessage.textContent =
            "Passwords do not match.";

        return;

    }


    // =========================
    // SEND DATA TO SERVER
    // =========================

    try {

        const response =
            await fetch(
                "/api/organization/signup",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        organization_name,
                        email,
                        phone,
                        address,
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
                "Organization signup failed.";

            return;

        }


        // =========================
        // SUCCESS
        // =========================

        errorMessage.textContent = "";

        form.style.display = "none";

        document.getElementById("signup-content").style.display = "none";

        successMessage.style.display = "block";

        organizationId.textContent =
            data.organizationId;


        console.log(
            "Organization created successfully:",
            data.organizationId
        );

    }


    catch (error) {

        console.error(
            "Signup error:",
            error
        );

        errorMessage.textContent =
            "Could not connect to the server.";

    }

});