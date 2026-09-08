// ============================================================
// DOCTOR-SPECIFIC ACTIVE PATIENTS
// ============================================================

const activePatients = new Map(); // doctorId -> patient object

module.exports = {

    /**
     * Get the active patient for a specific doctor
     * @param {string} doctorId - The doctor's ID
     * @returns {object|null} Patient object or null
     */
    getActivePatient(doctorId) {
        if (!doctorId) {
            console.warn("getActivePatient called without doctorId");
            return null;
        }
        return activePatients.get(doctorId) || null;
    },

    /**
     * Set the active patient for a specific doctor
     * @param {string} doctorId - The doctor's ID
     * @param {object} patient - Patient object { patientId, name, age, gender }
     */
    setActivePatient(doctorId, patient) {
        if (!doctorId) {
            throw new Error("doctorId is required");
        }
        if (!patient || !patient.patientId) {
            throw new Error("Valid patient object with patientId is required");
        }
        activePatients.set(doctorId, patient);
    },

    /**
     * Clear the active patient for a specific doctor
     * @param {string} doctorId - The doctor's ID
     */
    clearActivePatient(doctorId) {
        if (!doctorId) {
            console.warn("clearActivePatient called without doctorId");
            return;
        }
        activePatients.delete(doctorId);
    },

    /**
     * Get all active patients (for debugging/admin purposes)
     * @returns {object} Map of doctorId to patient
     */
    getAllActivePatients() {
        return Object.fromEntries(activePatients);
    }

};