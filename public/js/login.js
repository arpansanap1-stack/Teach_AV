const studentTabBtn = document.getElementById("studentTabBtn");
const teacherTabBtn = document.getElementById("teacherTabBtn");
const adminTabBtn = document.getElementById("adminTabBtn");

const studentPane = document.getElementById("studentPane");
const teacherPane = document.getElementById("teacherPane");
const adminPane = document.getElementById("adminPane");


function switchTab(which) {

    studentTabBtn.classList.toggle("active", which === "student");
    teacherTabBtn.classList.toggle("active", which === "teacher");
    adminTabBtn.classList.toggle("active", which === "admin");

    studentPane.style.display = which === "student" ? "block" : "none";
    teacherPane.style.display = which === "teacher" ? "block" : "none";
    adminPane.style.display = which === "admin" ? "block" : "none";

}

studentTabBtn.addEventListener("click", () => switchTab("student"));
teacherTabBtn.addEventListener("click", () => switchTab("teacher"));
adminTabBtn.addEventListener("click", () => switchTab("admin"));


// ============ STUDENT ============

const studentLoginForm = document.getElementById("studentLoginForm");
const studentSignupForm = document.getElementById("studentSignupForm");

document.getElementById("showStudentSignup").addEventListener("click", (event) => {
    event.preventDefault();
    studentLoginForm.style.display = "none";
    studentSignupForm.style.display = "block";
});

document.getElementById("showStudentLogin").addEventListener("click", (event) => {
    event.preventDefault();
    studentSignupForm.style.display = "none";
    studentLoginForm.style.display = "block";
});

studentLoginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = document.getElementById("studentLoginEmail").value;
    const password = document.getElementById("studentLoginPassword").value;

    try {

        const response = await fetch("/api/auth/student/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {

            setAuth({
                token: data.token,
                role: "student",
                id: data.student._id,
                name: data.student.name
            });

            window.location.href = "/";

        } else {

            showToast(data.message || "Login failed", "error");

        }

    } catch (error) {

        showToast("Login failed. Please try again.", "error");

    }

});

studentSignupForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const body = {
        name: document.getElementById("studentSignupName").value,
        email: document.getElementById("studentSignupEmail").value,
        password: document.getElementById("studentSignupPassword").value
    };

    try {

        const response = await fetch("/api/students", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.json();
            showToast(error.message || "Sign up failed", "error");
            return;
        }

        const loginResponse = await fetch("/api/auth/student/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: body.email, password: body.password })
        });

        const loginData = await loginResponse.json();

        if (loginResponse.ok) {

            setAuth({
                token: loginData.token,
                role: "student",
                id: loginData.student._id,
                name: loginData.student.name
            });

            showToast("Account created!", "success");

            window.location.href = "/";

        } else {

            showToast("Account created -- please log in.", "success");
            studentSignupForm.style.display = "none";
            studentLoginForm.style.display = "block";

        }

    } catch (error) {

        showToast("Sign up failed. Please try again.", "error");

    }

});


// ============ TEACHER ============

const teacherLoginForm = document.getElementById("teacherLoginForm");
const teacherSignupForm = document.getElementById("teacherSignupForm");

document.getElementById("showSignup").addEventListener("click", (event) => {
    event.preventDefault();
    teacherLoginForm.style.display = "none";
    teacherSignupForm.style.display = "block";
});

document.getElementById("showLogin").addEventListener("click", (event) => {
    event.preventDefault();
    teacherSignupForm.style.display = "none";
    teacherLoginForm.style.display = "block";
});

teacherLoginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {

        const response = await fetch("/api/auth/teacher/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {

            setAuth({
                token: data.token,
                role: "teacher",
                id: data.teacher._id,
                name: data.teacher.name
            });

            window.location.href = "teacher.html";

        } else {

            showToast(data.message || "Login failed", "error");

        }

    } catch (error) {

        showToast("Login failed. Please try again.", "error");

    }

});

teacherSignupForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const body = {
        name: document.getElementById("signupName").value,
        department: document.getElementById("signupDept").value,
        subject: document.getElementById("signupSubject").value,
        email: document.getElementById("signupEmail").value,
        room: document.getElementById("signupRoom").value,
        password: document.getElementById("signupPassword").value
    };

    try {

        const response = await fetch("/api/teachers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.json();
            showToast(error.message || "Sign up failed", "error");
            return;
        }

        const loginResponse = await fetch("/api/auth/teacher/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: body.email, password: body.password })
        });

        const loginData = await loginResponse.json();

        if (loginResponse.ok) {

            setAuth({
                token: loginData.token,
                role: "teacher",
                id: loginData.teacher._id,
                name: loginData.teacher.name
            });

            showToast("Account created!", "success");

            window.location.href = "teacher.html";

        } else {

            showToast("Account created -- please log in.", "success");
            teacherSignupForm.style.display = "none";
            teacherLoginForm.style.display = "block";

        }

    } catch (error) {

        showToast("Sign up failed. Please try again.", "error");

    }

});


// ============ ADMIN ============

document.getElementById("adminLoginForm").addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = document.getElementById("adminEmail").value;
    const password = document.getElementById("adminPassword").value;

    try {

        const response = await fetch("/api/auth/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {

            setAuth({ token: data.token, role: "admin" });

            window.location.href = "admin.html";

        } else {

            showToast(data.message || "Login failed", "error");

        }

    } catch (error) {

        showToast("Login failed. Please try again.", "error");

    }

});


// Already logged in? Skip straight to the right place.

(function redirectIfLoggedIn() {

    const auth = getAuth();

    if (auth?.role === "student") window.location.href = "/";
    if (auth?.role === "teacher") window.location.href = "teacher.html";
    if (auth?.role === "admin") window.location.href = "admin.html";

})();
