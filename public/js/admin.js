// Guard: only a logged-in admin gets past this line

const auth = requireRole("admin");

document.getElementById("logoutBtn").addEventListener("click", logout);


async function loadStats() {

    try {

        const response = await fetch("/api/admin/stats", { headers: authHeader() });

        if (response.status === 401 || response.status === 403) {
            logout();
            return;
        }

        const stats = await response.json();

        document.getElementById("statTeachers").textContent = stats.totalTeachers;
        document.getElementById("statSlots").textContent = stats.totalActiveSlots;
        document.getElementById("statLive").textContent = stats.liveNow;
        document.getElementById("statComplaints").textContent = stats.pendingComplaints;

        renderDepartments(stats.departments);

    } catch (error) {

        showToast("Couldn't load dashboard stats.", "error");

    }

}


function renderDepartments(departments) {

    const container = document.getElementById("deptBreakdown");
    const entries = Object.entries(departments);

    if (entries.length === 0) {
        container.innerHTML = `<div class="empty-state">No departments yet.</div>`;
        return;
    }

    const max = Math.max(...entries.map(([, count]) => count));

    container.innerHTML = entries
        .sort((a, b) => b[1] - a[1])
        .map(([dept, count]) => `
            <div class="dept-row">
                <span class="dept-name">${dept}</span>
                <div class="dept-bar-track">
                    <div class="dept-bar-fill" style="width:${(count / max) * 100}%"></div>
                </div>
                <span class="dept-count">${count}</span>
            </div>
        `).join("");

}


async function loadTeachers() {

    try {

        const response = await fetch("/api/admin/teachers", { headers: authHeader() });

        if (response.status === 401 || response.status === 403) {
            logout();
            return;
        }

        const teachers = await response.json();

        const table = document.getElementById("teacherTable");

        if (teachers.length === 0) {
            table.innerHTML = `<div class="empty-state">No faculty registered yet.</div>`;
            return;
        }

        table.innerHTML = teachers.map(teacher => `

            <div class="manage-card">

                <div>

                    <strong>${teacher.name}</strong>

                    <p>${teacher.subject} · ${teacher.department} · Room ${teacher.room}</p>

                    <small>${teacher.email} · ${teacher.slotCount} upcoming slot${teacher.slotCount === 1 ? "" : "s"}</small>

                </div>

                <div class="manage-card-actions">

                    <button
                        class="delete-btn"
                        onclick="removeTeacher('${teacher._id}', '${teacher.name.replace(/'/g, "\\'")}')">
                        Remove
                    </button>

                </div>

            </div>

        `).join("");

    } catch (error) {

        showToast("Couldn't load faculty list.", "error");

    }

}


async function removeTeacher(id, name) {

    const confirmDelete = confirm(`Remove ${name} and all their availability slots?`);

    if (!confirmDelete) return;

    try {

        const response = await fetch(`/api/teachers/${id}`, {
            method: "DELETE",
            headers: authHeader()
        });

        if (response.ok) {
            showToast(`${name} removed.`, "success");
            loadStats();
            loadTeachers();
        } else {
            showToast("Failed to remove faculty.", "error");
        }

    } catch (error) {

        showToast("Failed to remove faculty.", "error");

    }

}


async function loadComplaints() {

    try {

        const response = await fetch("/api/complaints", { headers: authHeader() });

        if (response.status === 401 || response.status === 403) {
            logout();
            return;
        }

        const complaints = await response.json();

        const container = document.getElementById("complaintList");

        if (complaints.length === 0) {
            container.innerHTML = `<div class="empty-state">No complaints filed yet.</div>`;
            return;
        }

        container.innerHTML = complaints.map(complaint => `

            <div class="manage-card">

                <div>

                    <strong>${complaint.subject}</strong>

                    <span class="status-badge ${complaint.status}">${complaint.status}</span>

                    <p>${complaint.message}</p>

                    <small>
                        From ${complaint.student?.name || "Unknown student"}
                        ${complaint.teacher ? ` · About ${complaint.teacher.name}` : " · General"}
                        · ${new Date(complaint.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </small>

                </div>

                ${
                    complaint.status === "open"
                    ? `
                        <div class="manage-card-actions">
                            <button class="edit-btn" onclick="resolveComplaint('${complaint._id}')">
                                Mark Resolved
                            </button>
                        </div>
                    `
                    : ""
                }

            </div>

        `).join("");

    } catch (error) {

        showToast("Couldn't load complaints.", "error");

    }

}


async function resolveComplaint(id) {

    try {

        const response = await fetch(`/api/complaints/${id}/resolve`, {
            method: "PATCH",
            headers: authHeader()
        });

        if (response.ok) {
            showToast("Complaint marked resolved.", "success");
            loadComplaints();
            loadStats();
        } else {
            showToast("Failed to update complaint.", "error");
        }

    } catch (error) {

        showToast("Failed to update complaint.", "error");

    }

}


loadStats();
loadTeachers();
loadComplaints();
