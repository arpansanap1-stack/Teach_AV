// Shared toast notification utility

(function () {

    let container = document.querySelector(".toast-container");

    if (!container) {
        container = document.createElement("div");
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    window.showToast = function (message, type = "info", duration = 3200) {

        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add("exit");
            setTimeout(() => toast.remove(), 200);
        }, duration);

    };

})();
