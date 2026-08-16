// Guard: only a logged-in student gets past this line

const auth = requireRole("student");

document.getElementById("greeting").textContent = `Hi, ${auth.name.split(" ")[0]}`;
document.getElementById("welcomeHeading").textContent = `Welcome back, ${auth.name.split(" ")[0]}`;
document.getElementById("logoutBtn").addEventListener("click", logout);


// ============ MENU BAR ============

const menuButtons = document.querySelectorAll(".menu-btn");
const sections = document.querySelectorAll(".dashboard-section");

function switchSection(name) {

    menuButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.section === name));
    sections.forEach(sec => sec.classList.toggle("active", sec.id === `section-${name}`));

    if (name === "favorites") renderFavoritesList();

}

menuButtons.forEach(btn => {
    btn.addEventListener("click", () => switchSection(btn.dataset.section));
});

document.querySelectorAll("[data-goto]").forEach(btn => {
    btn.addEventListener("click", () => switchSection(btn.dataset.goto));
});


// ============ SHARED STATE ============

const teacherList = document.getElementById("teacherList");
const searchInput = document.getElementById("searchInput");
const filterChips = document.getElementById("filterChips");

const modal = document.getElementById("availabilityModal");
const teacherDetails = document.getElementById("teacherDetails");
const availabilityList = document.getElementById("availabilityList");

let teachers = [];
let liveTeacherIds = new Set();
let favoriteIds = new Set();
let activeDept = "All";


async function bootstrap() {

    try {

        const response = await fetch("/api/teachers");
        teachers = await response.json();

        await loadFavorites();
        await computeLiveStatus();

        renderChips();
        renderTeachers(applyFilters());
        renderOverviewStats();
        populateComplaintTeacherOptions();

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


// ============ FAVORITES ============

async function loadFavorites() {

    try {

        const response = await fetch(`/api/students/${auth.id}/favorites`, { headers: authHeader() });

        if (!response.ok) return;

        const favorites = await response.json();
        favoriteIds = new Set(favorites.map(f => f._id));

    } catch (error) {
        // fail quietly -- favorites are a nice-to-have
    }

}

async function toggleFavorite(teacherId) {

    try {

        const response = await fetch(`/api/students/${auth.id}/favorites/${teacherId}`, {
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
            renderFavoritesList();
            renderOverviewStats();

        } else {

            showToast(data.message || "Failed to update favorites.", "error");

        }

    } catch (error) {

        showToast("Failed to update favorites.", "error");

    }

}

function renderFavoritesList() {

    const container = document.getElementById("favoritesList");
    const favTeachers = teachers.filter(t => favoriteIds.has(t._id));

    if (favTeachers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">★</div>
                <h3>No favorites yet</h3>
                <p>Star a teacher from Browse Faculty to save them here.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = favTeachers.map(teacher => teacherCardHTML(teacher)).join("");

}


// ============ LIVE STATUS ============

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
            // skip
        }

    }));

}


// ============ OVERVIEW ============

function renderOverviewStats() {

    document.getElementById("statFavorites").textContent = favoriteIds.size;

    const favLiveCount = [...favoriteIds].filter(id => liveTeacherIds.has(id)).length;
    document.getElementById("statFavLive").textContent = favLiveCount;

}

async function loadMyComplaintsCount() {

    try {

        const response = await fetch("/api/complaints/mine", { headers: authHeader() });
        const complaints = await response.json();

        const openCount = complaints.filter(c => c.status === "open").length;
        document.getElementById("statMyComplaints").textContent = openCount;

    } catch (error) {

        document.getElementById("statMyComplaints").textContent = "—";

    }

}


// ============ BROWSE / FILTER ============

function renderChips() {

    const departments = ["All", ...new Set(teachers.map(t => t.department))];

    filterChips.innerHTML = departments.map(dept => `
        <button class="chip ${dept === activeDept ? "active" : ""}" data-dept="${dept}">
            ${dept}
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

function applyFilters() {

    const query = searchInput.value.toLowerCase();

    return teachers.filter(teacher => {

        const matchesQuery =
            teacher.name.toLowerCase().includes(query) ||
            teacher.subject.toLowerCase().includes(query) ||
            teacher.department.toLowerCase().includes(query);

        const matchesDept = activeDept === "All" || teacher.department === activeDept;

        return matchesQuery && matchesDept;

    });

}

searchInput.addEventListener("input", () => {
    renderTeachers(applyFilters());
});


// ============ CARD RENDERING (shared by Browse + Favorites) ============

function teacherCardHTML(teacher) {

    return `
        <div class="teacher-card" onclick="showAvailability('${teacher._id}')">

            <div class="teacher-avatar">
                ${teacher.name.charAt(0).toUpperCase()}
            </div>

            <div class="teacher-info">
                <h3>${teacher.name}</h3>
                <p>${teacher.subject} · ${teacher.department}</p>
                <span class="room">Room ${teacher.room}</span>
                ${liveTeacherIds.has(teacher._id) ? `<span class="badge-live">Available now</span>` : ""}
            </div>

            <button
                class="fav-btn ${favoriteIds.has(teacher._id) ? "active" : ""}"
                onclick="event.stopPropagation(); toggleFavorite('${teacher._id}')"
                title="Save favorite"
                type="button">
                ★
            </button>

            <div class="arrow">→</div>

        </div>
    `;

}

function renderTeachers(data) {

    if (data.length === 0) {
        teacherList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">○</div>
                <h3>No teachers found</h3>
                <p>Try a different name, department, or filter.</p>
            </div>
        `;
        return;
    }

    teacherList.innerHTML = data.map(teacher => teacherCardHTML(teacher)).join("");

}


// ============ MODAL ============

async function showAvailability(teacherId) {

    try {

        const teacherResponse = await fetch(`/api/teachers/${teacherId}`);
        const teacher = await teacherResponse.json();

        const availabilityResponse = await fetch(`/api/availability/${teacherId}`);
        const availability = await availabilityResponse.json();

        teacherDetails.innerHTML = `
            <div class="modal-teacher">
                <div class="teacher-avatar large">${teacher.name.charAt(0).toUpperCase()}</div>
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
                    <p>This teacher hasn't added any available slots yet.</p>
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

                const isLive = slot.date === today && nowMinutes >= startMinutes && nowMinutes <= endMinutes;

                return `
                    <div class="availability-card">
                        <div>
                            <strong>${formatDate(slot.date)}</strong>
                            <p>${slot.startTime} — ${slot.endTime}</p>
                        </div>
                        <span class="available-badge">${isLive ? "Available now" : "Available"}</span>
                        ${slot.note ? `<small>${slot.note}</small>` : ""}
                    </div>
                `;

            }).join("");

        }

        modal.classList.add("active");

    } catch (error) {

        showToast("Couldn't load that teacher's availability.", "error");

    }

}

function formatDate(date) {
    return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
        weekday: "short", day: "numeric", month: "short", year: "numeric"
    });
}

function closeModal() {
    modal.classList.remove("active");
}

modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("active")) closeModal();
});


// ============ COMPLAINTS ============

function populateComplaintTeacherOptions() {

    const select = document.getElementById("complaintTeacher");

    select.innerHTML = `
        <option value="">General (not about a specific teacher)</option>
        ${teachers.map(t => `<option value="${t._id}">${t.name} — ${t.subject}</option>`).join("")}
    `;

}

document.getElementById("complaintForm").addEventListener("submit", async (event) => {

    event.preventDefault();

    const submitBtn = document.getElementById("complaintSubmitBtn");
    submitBtn.disabled = true;

    const body = {
        teacher: document.getElementById("complaintTeacher").value || undefined,
        subject: document.getElementById("complaintSubject").value,
        message: document.getElementById("complaintMessage").value
    };

    try {

        const response = await fetch("/api/complaints", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeader() },
            body: JSON.stringify(body)
        });

        if (response.ok) {

            document.getElementById("complaintForm").reset();
            showToast("Complaint submitted.", "success");
            loadMyComplaints();
            loadMyComplaintsCount();

        } else {

            const data = await response.json();
            showToast(data.message || "Failed to submit complaint.", "error");

        }

    } catch (error) {

        showToast("Failed to submit complaint.", "error");

    } finally {

        submitBtn.disabled = false;

    }

});

async function loadMyComplaints() {

    try {

        const response = await fetch("/api/complaints/mine", { headers: authHeader() });
        const complaints = await response.json();

        const container = document.getElementById("myComplaints");

        if (complaints.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">○</div>
                    <h3>No complaints filed</h3>
                    <p>Anything you submit will show up here.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = complaints.map(complaint => `
            <div class="manage-card">
                <div>
                    <strong>${complaint.subject}</strong>
                    <span class="status-badge ${complaint.status}">${complaint.status}</span>
                    <p>${complaint.message}</p>
                    <small>
                        ${complaint.teacher ? `About ${complaint.teacher.name}` : "General"}
                        · ${new Date(complaint.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </small>
                </div>
            </div>
        `).join("");

    } catch (error) {

        showToast("Couldn't load your complaints.", "error");

    }

}


bootstrap();
loadMyComplaints();
loadMyComplaintsCount();
