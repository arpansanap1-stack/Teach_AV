const teacherList = document.getElementById("teacherList");
const searchInput = document.getElementById("searchInput");
const filterChips = document.getElementById("filterChips");
const navActions = document.getElementById("navActions");

const modal = document.getElementById("availabilityModal");
const teacherDetails = document.getElementById("teacherDetails");
const availabilityList = document.getElementById("availabilityList");

let teachers = [];
let liveTeacherIds = new Set();
let favoriteIds = new Set();
let activeDept = "All";

const studentAuth = getAuth()?.role === "student" ? getAuth() : null;


// Nav bar auth state

function renderNavAuth() {

    if (studentAuth) {

        navActions.innerHTML = `
            <span class="student-greeting">Hi, ${studentAuth.name.split(" ")[0]}</span>
            <button id="navLogoutBtn" class="teacher-link logout-link" type="button">Log Out</button>
        `;

        document.getElementById("navLogoutBtn").addEventListener("click", logout);

    } else {

        navActions.innerHTML = `
            <a href="login.html" class="teacher-link">Log In →</a>
        `;

    }

}


// Fetch teachers

async function loadTeachers() {

    try {

        const response = await fetch("/api/teachers");

        teachers = await response.json();

        await loadFavorites();

        renderChips();
        await computeLiveStatus();
        renderTeachers(applyFilters());

    } catch (error) {

        teacherList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠</div>
                <h3>Unable to load faculty</h3>
                <p>Check your connection and refresh the page.</p>
            </div>
        `;
    }
}


// Load this student's saved favorites, if logged in

async function loadFavorites() {

    if (!studentAuth) return;

    try {

        const response = await fetch(`/api/students/${studentAuth.id}/favorites`, {
            headers: authHeader()
        });

        if (!response.ok) return;

        const favorites = await response.json();
        favoriteIds = new Set(favorites.map(f => f._id));

    } catch (error) {
        // favorites are a nice-to-have -- fail quietly
    }

}


// Toggle a teacher as favorite

async function toggleFavorite(teacherId) {

    if (!studentAuth) {
        showToast("Log in as a student to save favorites.", "error");
        return;
    }

    try {

        const response = await fetch(`/api/students/${studentAuth.id}/favorites/${teacherId}`, {
            method: "POST",
            headers: authHeader()
        });

        const data = await response.json();

        if (response.ok) {

            if (data.favorited) {
                favoriteIds.add(teacherId);
            } else {
                favoriteIds.delete(teacherId);
            }

            renderTeachers(applyFilters());

        } else {

            showToast(data.message || "Failed to update favorites.", "error");

        }

    } catch (error) {

        showToast("Failed to update favorites.", "error");

    }

}


// Figure out which teachers have a slot covering right now, today.

async function computeLiveStatus() {

    liveTeacherIds = new Set();

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    await Promise.all(teachers.map(async (teacher) => {

        try {

            const response = await fetch(`/api/availability/${teacher._id}`);
            const slots = await response.json();

            const isLive = slots.some(slot => {

                if (slot.date !== today) return false;

                const [startH, startM] = slot.startTime.split(":").map(Number);
                const [endH, endM] = slot.endTime.split(":").map(Number);

                const startMinutes = startH * 60 + startM;
                const endMinutes = endH * 60 + endM;

                return nowMinutes >= startMinutes && nowMinutes <= endMinutes;

            });

            if (isLive) liveTeacherIds.add(teacher._id);

        } catch (error) {
            // silently skip -- live badge is a nice-to-have, not critical
        }

    }));

}


// Department (+ favorites) filter chips

function renderChips() {

    const departments = ["All", ...new Set(teachers.map(t => t.department))];

    if (studentAuth) departments.push("Favorites");

    filterChips.innerHTML = departments.map(dept => `
        <button
            class="chip ${dept === activeDept ? "active" : ""}"
            data-dept="${dept}">
            ${dept === "Favorites" ? "★ Favorites" : dept}
        </button>
    `).join("");

    filterChips.querySelectorAll(".chip").forEach(chip => {
        chip.addEventListener("click", () => {
            activeDept = chip.dataset.dept;
            renderChips();
            renderTeachers(applyFilters());
        });
    });

}


// Combine search text + active department/favorites filter

function applyFilters() {

    const query = searchInput.value.toLowerCase();

    return teachers.filter(teacher => {

        const matchesQuery =
            teacher.name.toLowerCase().includes(query) ||
            teacher.subject.toLowerCase().includes(query) ||
            teacher.department.toLowerCase().includes(query);

        let matchesDept;

        if (activeDept === "Favorites") {
            matchesDept = favoriteIds.has(teacher._id);
        } else {
            matchesDept = activeDept === "All" || teacher.department === activeDept;
        }

        return matchesQuery && matchesDept;

    });

}


// Render teacher cards

function renderTeachers(data) {

    if (data.length === 0) {

        const isFavView = activeDept === "Favorites";

        teacherList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">${isFavView ? "★" : "○"}</div>
                <h3>${isFavView ? "No favorites yet" : "No teachers found"}</h3>
                <p>${isFavView ? "Tap the star on a teacher's card to save them here." : "Try a different name, department, or filter."}</p>
            </div>
        `;

        return;
    }


    teacherList.innerHTML = data.map(teacher => `

        <div class="teacher-card"
             onclick="showAvailability('${teacher._id}')">

            <div class="teacher-avatar">
                ${teacher.name.charAt(0).toUpperCase()}
            </div>

            <div class="teacher-info">

                <h3>${teacher.name}</h3>

                <p>${teacher.subject} · ${teacher.department}</p>

                <span class="room">
                    Room ${teacher.room}
                </span>

                ${
                    liveTeacherIds.has(teacher._id)
                    ? `<span class="badge-live">Available now</span>`
                    : ""
                }

            </div>

            <button
                class="fav-btn ${favoriteIds.has(teacher._id) ? "active" : ""}"
                onclick="event.stopPropagation(); toggleFavorite('${teacher._id}')"
                title="Save favorite"
                type="button">
                ★
            </button>

            <div class="arrow">
                →
            </div>

        </div>

    `).join("");
}


// Search

searchInput.addEventListener("input", () => {
    renderTeachers(applyFilters());
});


// Show availability

async function showAvailability(teacherId) {

    try {

        const teacherResponse =
            await fetch(`/api/teachers/${teacherId}`);

        const teacher =
            await teacherResponse.json();


        const availabilityResponse =
            await fetch(`/api/availability/${teacherId}`);

        const availability =
            await availabilityResponse.json();


        teacherDetails.innerHTML = `

            <div class="modal-teacher">

                <div class="teacher-avatar large">
                    ${teacher.name.charAt(0).toUpperCase()}
                </div>

                <div>
                    <h2>${teacher.name}</h2>
                    <p>${teacher.subject} · ${teacher.department}</p>
                    <span>Room ${teacher.room}</span>
                </div>

                <button
                    class="fav-btn modal-fav ${favoriteIds.has(teacher._id) ? "active" : ""}"
                    onclick="toggleFavorite('${teacher._id}')"
                    title="Save favorite"
                    type="button">
                    ★
                </button>

            </div>
        `;


        if (availability.length === 0) {

            availabilityList.innerHTML = `

                <div class="empty-state">

                    <div class="empty-icon">○</div>

                    <h3>No availability added</h3>

                    <p>
                        This teacher hasn't added any
                        available slots yet.
                    </p>

                </div>

            `;

        } else {

            const now = new Date();
            const today = now.toISOString().slice(0, 10);
            const nowMinutes = now.getHours() * 60 + now.getMinutes();

            availabilityList.innerHTML = availability.map(slot => {

                const [startH, startM] = slot.startTime.split(":").map(Number);
                const [endH, endM] = slot.endTime.split(":").map(Number);
                const startMinutes = startH * 60 + startM;
                const endMinutes = endH * 60 + endM;

                const isLive =
                    slot.date === today &&
                    nowMinutes >= startMinutes &&
                    nowMinutes <= endMinutes;

                return `
                    <div class="availability-card">

                        <div>

                            <strong>${formatDate(slot.date)}</strong>

                            <p>
                                ${slot.startTime} — ${slot.endTime}
                            </p>

                        </div>

                        <span class="available-badge">
                            ${isLive ? "Available now" : "Available"}
                        </span>

                        ${
                            slot.note
                            ? `<small>${slot.note}</small>`
                            : ""
                        }

                    </div>
                `;

            }).join("");

        }


        modal.classList.add("active");

    } catch (error) {

        console.error(error);
        showToast("Couldn't load that teacher's availability.", "error");

    }
}


// Date formatting

function formatDate(date) {

    return new Date(date + "T00:00:00")
        .toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric"
        });

}


// Close modal

function closeModal() {

    modal.classList.remove("active");

}


modal.addEventListener("click", (event) => {

    if (event.target === modal) {
        closeModal();
    }

});

document.addEventListener("keydown", (event) => {

    if (event.key === "Escape" && modal.classList.contains("active")) {
        closeModal();
    }

});


renderNavAuth();
loadTeachers();
