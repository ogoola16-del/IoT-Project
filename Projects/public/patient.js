document.getElementById("new-patient-btn").addEventListener("click", async () => {

    const name = document.getElementById("patient-name").value.trim();
    const age = document.getElementById("patient-age").value;
    const gender = document.getElementById("patient-gender").value;
    const cardid = document.getElementById("patient-card-id").value;
    const weight = document.getElementById("patient-weight").value;
    const height = document.getElementById("patient-height").value;
    const bp = document.getElementById("patient-bp").value;

    if (!name || !age || !gender || !cardid || !weight || !height || !bp) {
        alert("Enter patient's details.");
        return;
    }

    try {

        const response = await fetch("http://localhost:3000/api/patient/new", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                age,
                gender,
                cardid,
                weight,
                height,
                bp
            })
        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.error);
            return;
        }

        // Save patient details for the dashboard
        sessionStorage.setItem("patientId", result.patientId);
        sessionStorage.setItem("patientName", result.name);
        sessionStorage.setItem("patientAge", result.age);
        sessionStorage.setItem("patientGender", result.gender);


        // Go to dashboard
        window.location.href = "dashboard.html";

    } catch (err) {

        console.error(err);
        alert("Could not connect to the server.");

    }

});


document.getElementById("load-patient-btn").addEventListener("click", async () => {

    const patientId = document.getElementById("patient-id").value.trim();

    if (!patientId) {
        alert("Enter Patient ID.");
        return;
    }

    try {

    const response = await fetch("api/patient/load", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            patientId
        })
    });

    const patient = await response.json();

    if (!response.ok) {
        alert(patient.error);
        return;
    }

    sessionStorage.setItem("patientId", patient.patient_id);
    sessionStorage.setItem("patientName", patient.name);
    sessionStorage.setItem("patientAge", patient.age);
    sessionStorage.setItem("patientGender", patient.gender);
    

    window.location.href = "dashboard.html";

} catch (err) {

    console.error(err);
    alert("Could not connect to the server.");

}

});