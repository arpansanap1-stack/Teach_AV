// Guard: only logged-in teachers get past this line

const auth = requireRole("teacher");

const selectedTeacher = document.getElementById("selectedTeacher");
const welcomeHeading = document.getElementById("welcomeHeading");

const availabilityForm = document.getElementById("availabilityForm");
const teacherAvailability = document.getElementById("teacherAvailability");

const availabilitySubmitBtn = document.getElementById("availabilitySubmitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

let editingSlotId = null;


document.getElementById("logoutBtn").addEventListener("click", logout);


// Load own profile

async function loadProfile() {

    try {

        const response = await fetch(`/api/teachers/${auth.id}`);
        const teacher = await response.json();

        welcomeHeading.textContent = `Welcome back, ${teacher.name.split(" ")[0]}`;

        selectedTeacher.innerHTML = `

            <div class="teacher-mini">

                <div class="teacher-avatar">
                    ${teacher.name.charAt(0).toUpperCase()}
                </div>

                <div>

                    <strong>${teacher.name}</strong>

                    <p>${teacher.subject} · ${teacher.department}</p>

                    <span>
                        ${teacher.email} · Room ${teacher.room}
                    </span>

                </div>

            </div>

            <button class="text-btn" id="removeProfileBtn" type="button">
                Remove my profile
            </button>
        `;

        document.getElementById("removeProfileBtn")
            .addEventListener("click", removeProfile);

    } catch (error) {

        showToast("Couldn't load your profile.", "error");

    }

}


// Remove profile

async function removeProfile() {

    const confirmDelete = confirm(
        "This removes your profile and every availability slot you've added. Continue?"
    );

    if (!confirmDelete) return;

    try {

        const response = await fetch(`/api/teachers/${auth.id}`, {
            method: "DELETE",
            headers: authHeader()
        });

        if (response.ok) {
            showToast("Profile removed.", "success");
            logout();
        } else {
            showToast("Failed to remove profile.", "error");
        }

    } catch (error) {

        showToast("Failed to remove profile.", "error");

    }

}


// Load availability

async function loadAvailability() {

    try {

        const response = await fetch(`/api/availability/${auth.id}`);
        const availability = await response.json();

        if (availability.length === 0) {

            teacherAvailability.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">○</div>
                    <h3>No availability added yet</h3>
                    <p>Add a slot above so students can find you.</p>
                </div>
            `;

            return;
        }

        teacherAvailability.innerHTML = availability.map(slot => `

            <div class="manage-card">

                <div>

                    <strong>
                        ${formatDate(slot.date)}
                    </strong>

                    <p>
                        ${slot.startTime}
                        —
                        ${slot.endTime}
                    </p>

                    ${
                        slot.note
                        ? `<small>${slot.note}</small>`
                        : ""
                    }

                </div>

                <div class="manage-card-actions">

                    <button
                        class="edit-btn"
                        onclick='beginEdit(${JSON.stringify(slot)})'>
                        Edit
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteAvailability('${slot._id}')">
                        Delete
                    </button>

                </div>

            </div>

        `).join("");

    } catch (error) {

        showToast("Couldn't load availability.", "error");

    }

}


// Begin editing a slot -- populate the form and switch to edit mode

function beginEdit(slot) {

    document.getElementById("date").value = slot.date;
    document.getElementById("startTime").value = slot.startTime;
    document.getElementById("endTime").value = slot.endTime;
    document.getElementById("note").value = slot.note || "";

    editingSlotId = slot._id;

    availabilitySubmitBtn.textContent = "Save changes";
    cancelEditBtn.style.display = "block";

    availabilityForm.scrollIntoView({ behavior: "smooth", block: "center" });

}


function resetFormToAddMode() {

    editingSlotId = null;

    availabilityForm.reset();

    availabilitySubmitBtn.textContent = "+ Add Availability";
    cancelEditBtn.style.display = "none";

}

cancelEditBtn.addEventListener("click", resetFormToAddMode);


// Add / update availability

availabilityForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const date = document.getElementById("date").value;
    const startTime = document.getElementById("startTime").value;
    const endTime = document.getElementById("endTime").value;
    const note = document.getElementById("note").value;

    if (startTime >= endTime) {
        showToast("End time must be after start time.", "error");
        return;
    }

    availabilitySubmitBtn.disabled = true;

    try {

        const isEditing = Boolean(editingSlotId);

        const url = isEditing
            ? `/api/availability/${editingSlotId}`
            : "/api/availability";

        const response = await fetch(url, {

            method: isEditing ? "PUT" : "POST",

            headers: {
                "Content-Type": "application/json",
                ...authHeader()
            },

            body: JSON.stringify({
                teacher: auth.id,
                date,
                startTime,
                endTime,
                note
            })

        });

        if (response.ok) {

            resetFormToAddMode();
            await loadAvailability();

            showToast(
                isEditing ? "Availability updated." : "Availability added.",
                "success"
            );

        } else {

            const data = await response.json();
            showToast(data.message || "Something went wrong.", "error");

        }

    } catch (error) {

        showToast("Something went wrong. Please try again.", "error");

    } finally {

        availabilitySubmitBtn.disabled = false;

    }

});


// Delete availability

async function deleteAvailability(id) {

    const confirmDelete = confirm("Remove this availability slot?");

    if (!confirmDelete) return;

    try {

        await fetch(`/api/availability/${id}`, {
            method: "DELETE",
            headers: authHeader()
        });

        if (editingSlotId === id) resetFormToAddMode();

        showToast("Slot removed.", "success");

        loadAvailability();

    } catch (error) {

        showToast("Failed to remove slot.", "error");

    }

}


// Format date

function formatDate(date) {

    return new Date(date + "T00:00:00")
        .toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric"
        });

}


loadProfile();
loadAvailability();
