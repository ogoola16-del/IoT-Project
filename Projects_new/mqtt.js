const mqtt = require("mqtt");
const db = require("./db");
const activePatient = require("./activePatient");

// Connect to MQTT broker
const client = mqtt.connect(
    "wss://broker.hivemq.com:8884/mqtt"
);


client.on("connect", () => {

    const topics = [
        "patient/ecg",
        "patient/data"
    ];

    client.subscribe(topics, (err, granted) => {

        if (err) {
            console.error("Subscription error:", err);
            return;
        }

        console.log(
            "Subscribed to:",
            granted.map(g => g.topic).join(", ")
        );

    });

});


client.on("message", (topic, message) => {

    let data;

    try {
        data = JSON.parse(message.toString());
    } catch (err) {
        console.error("Invalid JSON received:", err);
        return;
    }


    // Get currently active patients
    const allActive = activePatient.getAllActivePatients();
    const doctorIds = Object.keys(allActive);


    switch (topic) {


        // ============================================================
        // ECG DATA
        // ============================================================

        case "patient/ecg": {

            // Use the first active patient if available
            const patient =
                doctorIds.length > 0
                    ? allActive[doctorIds[0]]
                    : null;


            // Do NOT save ECG if there is no patient
            if (!patient || !patient.patientId) {
                console.log("ECG packet ignored: no active patient.");
                break;
            }

            const patientId = patient.patientId;



            // Make sure the ESP32 actually sent an array of samples
            if (
                !Array.isArray(data.samples) ||
                data.samples.length === 0
            ) {

                console.log("Invalid ECG packet received");

                break;
            }


            // ========================================================
            // SAVE THE WHOLE PACKET AS ONE DATABASE ROW
            // ========================================================

            db.query(
                `INSERT INTO ecg_packets
                (patient_id, ecg_values, sample_count)
                VALUES (?, ?, ?)`,
                
                [
                    patientId,
                    JSON.stringify(data.samples),
                    data.samples.length
                ],

                (err) => {

                    if (err) {

                        console.error(
                            "Error saving ECG packet:",
                            err
                        );

                        return;
                    }

                    // Optional debugging message
                    // console.log(
                    //     `ECG packet saved: ${data.samples.length} samples`
                    // );

                }
            );


            break;
        }


        // ============================================================
        // OTHER PATIENT DATA
        // ============================================================

        case "patient/data": {

            const patient =
                doctorIds.length > 0
                    ? allActive[doctorIds[0]]
                    : null;


            // Do NOT save ECG if there is no patient
            if (!patient || !patient.patientId) {
                console.log("Patient data ignored: no active patient.");
                break;
            }

            const patientId = patient.patientId;



            db.query(
                `INSERT INTO vitals_data
                (
                    patient_id,
                    temperature,
                    humidity,
                    Air_Quality,
                    bpm,
                    spo2,
                    bodyTemp
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                
                [
                    patientId,
                    data.temperature,
                    data.humidity,
                    data.aqi,
                    data.bpm,
                    data.spo2,
                    data.body_temp
                ],

                (err) => {

                    if (err) {

                        console.error(
                            "Error saving patient data:",
                            err
                        );

                    }

                }
            );


            break;
        }


        // ============================================================
        // UNKNOWN TOPIC
        // ============================================================

        default:

            console.log(
                "Unhandled MQTT topic:",
                topic
            );

    }

});