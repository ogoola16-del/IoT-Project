let mode = "live"; // "live" or "history"

const ctx = document.getElementById("ecgChart");

const HISTORY_LIMIT = 200;

const ecgLabels = [];
const ecgData = [];
const spo2Labels = [];
const spo2Data = [];

const tempLabels = [];
const tempData = [];

const envLabels = [];
const humidityData = [];
const roomTempData = [];

const sensorBtn = document.getElementById("sensorBtn");
const sensorMenu = document.getElementById("sensorMenu");

sensorBtn.addEventListener("click", function (e) {
    e.preventDefault();
    sensorMenu.classList.toggle("show");
});

document.addEventListener("click", function (e) {
    if (!sensorBtn.contains(e.target) &&
        !sensorMenu.contains(e.target)) {
        sensorMenu.classList.remove("show");
    }
});

const input = document.getElementById("patientID");
const patientSearch = document.querySelector(".search-container");
const patientList = document.getElementById("patient-list");

input.addEventListener("focus", loadPatientList);

input.addEventListener("keydown", async function (event) {

    if (event.key !== "Enter") return;

    const patientId = input.value.trim();

    if (!patientId) {
        alert("Enter a Patient ID.");
        return;
    }

    try {

        const response = await fetch("/api/patient/load", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ patientId })
        });

        const patient = await response.json();

        if (!response.ok) {
            alert(patient.error);
            return;
        }

        // Update the patient information on the dashboard
        loadActivePatient();   

        // Clear the search box
        input.value = "";
    } catch (err) {
        console.error(err);
        alert("Could not load patient.");
    }

});

async function loadPatientList() {
    document.getElementById("patient-list").style.display = "block";

    try {

        const response = await fetch("/api/patients");

        const patients = await response.json();

        const tableBody = document.getElementById("patient-table-body");

        // Clear any old rows
        tableBody.innerHTML = "";

        patients.forEach(patient => {

       const row = document.createElement("tr");

        row.innerHTML = `
            <td>${patient.patient_id}</td>
            <td>${patient.name}</td>
            <td>${patient.age}</td>
            <td>
                <button class="load-patient-btn" data-id = "${patient.patient_id}">Load</button>
            </td>
        `;

            tableBody.appendChild(row);
            const loadButton = row.querySelector(".load-patient-btn");

            loadButton.addEventListener("click", async function () {

            const patientId = this.dataset.id;

            try {

        const response = await fetch("/api/patient/load", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ patientId })
        });

        const patient = await response.json();

        if (!response.ok) {
            alert(patient.error);
            return;
        }

        // Update the patient information on the dashboard
        loadActivePatient();   

    } catch (err) {
        console.error(err);
        alert("Could not load patient.");
    }


    });


});

    } catch (err) {

        console.error(err);

    }

}

// Click anywhere outside the search area
document.addEventListener("click", function(event){

    if(!patientSearch.contains(event.target)){
        patientList.style.display = "none";
    }

});

const ecgChart = new Chart(ctx, {
    type: "line",
    data: {
        labels: ecgLabels,
        datasets: [{
            label: "Your ECG Signal",
            data: ecgData,
            borderColor: "rgb(10, 5, 142)",
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 2
        }]
    },
    options: {
        animation: false
    }
});

const spo2Chart = new Chart(
    document.getElementById("spo2Chart"),
    {
        type: "line",
        data: {
            labels: spo2Labels,
            datasets: [{
                label: "SpO2 (%)",
                data: spo2Data,
                borderColor: "green",
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            animation: false
        }
    }
)

const tempChart = new Chart(
    document.getElementById("tempChart"),
    {
        type: "line",
        data: {
            labels: tempLabels,
            datasets: [{
                label: "Body Temperature (°C)",
                data: tempData,
                borderColor: "orange",
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0,
            }]
        },
        options: {
            animation: false
        }
    }
)

const envChart = new Chart(
    document.getElementById("envChart"),
    {
        type: "line",
        data: {
            labels: envLabels,

            datasets: [

                {
                    label: "Humidity (%)",
                    data: humidityData,
                    borderColor: "pink",
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                    unit: "%"
                },

                {
                    label: "Temperature (°C)",
                    data: roomTempData,
                    borderColor: "red",
                    borderWidth: 2,
                    tension: 0.3,
                    unit: "°C",
                }

            ]
        },
        options: {
            animation: false,
            interaction: {
                mode: "index",
                intersect: false
            },
            plugins: {
        tooltip: {
        enabled: true,
        callbacks: {
            label: function(context) {
                const unit = context.dataset.unit || "";
                return `${context.dataset.label}: ${context.parsed.y}${unit}`;
            }
        }
    }
}
    
        }
    });


// =========================
// SENSOR CONFIG (maps type -> chart + DOM refs)
// =========================
const sensorUIConfig = {
    ecg: {
        chart: ecgChart,
        labels: ecgLabels,
        data: ecgData,
        cardId: "ecg-data",
        unit: "" 
    },
    roomTemp: {
        chart: envChart,
        labels: envLabels,
        data: roomTempData,
        cardId: "roomtemp-value",
        unit: "°C"
    },
    spo2: {
        chart: spo2Chart,
        labels: spo2Labels,
        data: spo2Data,
        cardId: "spo2-value",
        unit: "%"
    },
    hum: {
        chart: envChart,
        labels: envLabels,
        data: humidityData,
        cardId: "humidity-value",
        unit: "%"
    },
    body_temp: {
        chart: tempChart,
        labels: tempLabels,
        data: tempData,
        cardId: "temp-value",
        unit: "°C"
    },
    aq: {
        cardId: "aq-value",
        unit: "AQI"
    },
    bpm: {
        cardId: "bpm-value",
        unit: "BPM"
    }
};

// =========================
// MQTT LIVE DATA
// =========================
const client = mqtt.connect(
    "wss://broker.hivemq.com:8884/mqtt"
);

client.on("connect", () => {
    console.log("Connected to MQTT broker");
    client.subscribe("patient/ecg");
    client.subscribe("patient/data");
});

client.on("message", (topic, message) => {

    if (mode !== "live") return;

    const data = JSON.parse(message.toString());

    if (topic === "patient/ecg") {
        handleECG(data);
    }

    if (topic === "patient/data") {
        handlePatientData(data);
    }
});

function handleECG(data) {

    data.samples.forEach(sample => {

        ecgChart.data.labels.push("");

        ecgChart.data.datasets[0].data.push(sample);

        if (ecgChart.data.datasets[0].data.length > 300) {
            ecgChart.data.labels.shift();
            ecgChart.data.datasets[0].data.shift();
        }

    });

    ecgChart.update("none");
}


function handlePatientData(data) {

    updateCards(data);

    updateSpO2Chart(data.spo2);

    updateEnvironmentChart(data.temperature,
        data.humidity
    );
    updateTempChart(data.body_temp);

}

function updateCards(data) {

    document.getElementById("spo2-value").textContent = data.spo2;

    document.getElementById("bpm-value").textContent = data.bpm;

    document.getElementById("roomtemp-value").textContent = data.temperature;

    document.getElementById("humidity-value").textContent = data.humidity;

    document.getElementById("aq-value").textContent = data.aqi;

    document.getElementById("temp-value").textContent = data.body_temp;

}

function updateSpO2Chart(value) {

    spo2Chart.data.labels.push("");

    spo2Chart.data.datasets[0].data.push(value);

    if (spo2Chart.data.datasets[0].data.length > 100) {
        spo2Chart.data.labels.shift();
        spo2Chart.data.datasets[0].data.shift();
    }

    spo2Chart.update("none");
}

function updateEnvironmentChart(temperature,humidity) {

    envChart.data.labels.push("");

    envChart.data.datasets[1].data.push(temperature);
    envChart.data.datasets[0].data.push(humidity);

    if (envChart.data.labels.length > 100) {
        envChart.data.labels.shift();
        envChart.data.datasets[1].data.shift();
        envChart.data.datasets[0].data.shift();
    }   
    envChart.update("none");
}

function updateTempChart(value) {

    tempChart.data.labels.push("");

    tempChart.data.datasets[0].data.push(value);

    if (tempChart.data.datasets[0].data.length > 100) {
        tempChart.data.labels.shift();
        tempChart.data.datasets[0].data.shift();
    }

    tempChart.update("none");
}

// =========================
// VIEW HISTORY BUTTON
// =========================
document.getElementById("view-history-btn")
.addEventListener("click", () => {
    mode = "history";
    console.log("Mode:", mode);
    const datePicker =
        document.getElementById("history-date");

    datePicker.style.display = "inline-block";

    datePicker.showPicker?.();

});


// =========================
// LOAD HISTORY ON DATE CHANGE
// =========================
document.getElementById("history-date")
.addEventListener("change", () => {

    const selectedDate =
        document.getElementById("history-date").value;

    if (!selectedDate) return;
    
    // mode = "history";
    // console.log("Mode:", mode);

    // Loop through every sensor and load its history
    Object.keys(sensorUIConfig).forEach(type => {
        loadHistory(type, selectedDate);
    });
});


// =========================
// FETCH HISTORY DATA
// =========================
mode !== "live";

async function loadHistory(type, date) {

    const config = sensorUIConfig[type];
    const patientRes = await fetch("/api/patient/active");
    const patient = await patientRes.json();

    const patientId = patient.patientId;
    console.log(patientId, date, type);
    try {

        const res = await fetch(
            `/api/history/${type}?date=${date}&patientId=${patientId}&limit=${HISTORY_LIMIT}`
        );

        const data = await res.json();
        console.log(type, data);
        // CHECK IF DATA EXISTS
        if (config.chart && (!data || data.length === 0)) {

            config.labels.length = 0;
            config.data.length = 0;
            config.chart.update();

            document.getElementById(config.cardId).textContent =
                `No ${type} data for ${date}`;

            return;
        }

        if (config.cardId && (!data || data.length === 0)) {

            document.getElementById(config.cardId).textContent =
                `No ${type} data for ${date}`;

            return;
        }

        //update chart only if chart exists
        if (config.chart) {
            config.labels.length = 0;
            config.data.length = 0;
       
        data.forEach(d => {
        config.labels.push(" ");
        config.data.push(d.value);
        });
            
        while (config.labels.length > HISTORY_LIMIT) {
            config.labels.shift();
            config.data.shift();
        }

        config.chart.update();
        
        }

        document.getElementById(config.cardId).textContent =
        `Viewing ${type} data for ${date}`;

        if(config.cardId !== "ecg-data"){const last5 = data.slice(-5).map(d => d.value);

        document.getElementById(config.cardId).textContent =
            last5.join(`${config.unit}, `) + config.unit;
        }
        console.log(type, data.slice(-5));

    }
    catch (err) {
        console.error(`Error loading history for ${type}:`, err);
    }

}

// =========================
// GO LIVE MODE
// =========================
function goLive() {

    mode = "live";
    document.getElementById("history-date").style.display = "none";

    // Clear all charts and reset cards
    Object.entries(sensorUIConfig).forEach(([type, config]) => {

        // Clear charts (only sensors that have charts)
        if (config.chart) {
            config.labels.length = 0;
            config.data.length = 0;
            config.chart.update();
        }

        // Reset cards
        if (config.cardId === "ecg-data") {
            document.getElementById(config.cardId).textContent = "Live ECG";
        } else {
            document.getElementById(config.cardId).textContent = "--";
        }
    });

    document.getElementById("history-date").style.display = "none";
}

function updateDateTime() {
    const now = new Date();

    //update greeting
    const hour = now.getHours();

    if (hour < 12) {
        greeting.textContent = "Good Morning 🌞!";
    } else if (hour < 17) {
        greeting.textContent = "Good Afternoon 🕑!";
    } else {
        greeting.textContent = "Good Evening 🌃!";
    }


    //update date
    const date =
now.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
});
    //update time
    const time =
        now.toLocaleTimeString('en-GB');
    

    document.getElementById("datetime").textContent =
        `${date} | ${time}`;
}

// Run immediately
updateDateTime();

// Check every minute in case the day changes at midnight
setInterval(updateDateTime, 1000);

//ACTIVE PATIENT INFO
async function loadActivePatient() {

    try {

        const response = await fetch("api/patient/active");

        if (!response.ok) {
            throw new Error("No active patient");
        }

        const patient = await response.json();

        document.getElementById("patient-name").textContent =
            "Patient Name: " + patient.name;

        document.getElementById("patient-age").textContent =
            "Patient Age: " + patient.age;

        document.getElementById("patient-id").textContent =
            "Patient ID: " + patient.patientId;

    } catch (err) {

        console.log(err);

        document.getElementById("patient-name").textContent =
            "Patient Name:";

        document.getElementById("patient-age").textContent =
            "Patient Age:";

        document.getElementById("patient-id").textContent =
            "Patient ID:";
    }
}
//LOAD DASHBOARD ACTIVE PATIENT INFO
window.addEventListener("load", () => {
    loadActivePatient();
});




//------------------------------------------------------------------------------------------------------------------------------------------
//DUSTBIN
// can remove this don't understand it
// function playHistory(data) {

//     let i = 0;

//     const step = 200; // 👈 SKIP EVERY 2 POINTS (spacing control)

//     const interval = setInterval(() => {

//         if (i >= data.length) {
//             clearInterval(interval);
//             return;
//         }

//         const point = data[i];

//         // ecgLabels.push(
//         //     new Date(point.created_at).toLocaleTimeString()
//         // );

//         ecgLabels.push(
//             new Date(point.created_at).toString()
//         );

//         ecgData.push(point.ecg_value);

//         // keep chart clean
//         if (ecgLabels.length > 200) {
//             ecgLabels.shift();
//             ecgData.shift();
//         }

//         ecgChart.update();

//         i += step; // 👈 THIS CREATES SPACING

//     }, 80); // 👈 slower = more visible spacing
// }

// =========================
// GO LIVE MODE
// =========================
// function goLive() {

//     mode = "live";

//     ecgLabels.length = 0;
//     ecgData.length = 0;

//     ecgChart.update();

//     document.getElementById("ecg-data")
//     .textContent = "Live ECG";

//     document.getElementById("history-date")
//     .style.display = "none";
// }

        //safety trim in case backend ever returns more than history limit
        // while (config.labels.length > HISTORY_LIMIT) {
        //     config.labels.shift();
        //     config.data.shift();
        // }

        // config.chart.update();

        // //PLAY HISTORY WITH SPACING
        // playHistory(data);

        // document.getElementById("ecg-data").textContent =
        //     `Viewing history: ${date}`;

        // ---- UPDATE INFO CARD (last 5 readings) ----
    //     if(config.cardId !== "ecg-data"){const last5 = data.slice(-5).map(d => d.value);

    //     document.getElementById(config.cardId).textContent =
    //         last5.join(`${config.unit}, `) + config.unit;
    // }