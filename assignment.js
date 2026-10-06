document.addEventListener("DOMContentLoaded", function () {
    const assignmentLinks = document.querySelectorAll(".assignment-link");

    assignmentLinks.forEach(function (link) {
        link.addEventListener("click", function (event) {
            event.preventDefault();

            const assignmentPage = this.dataset.link;

            if (assignmentPage) {
                window.location.href = assignmentPage;
            }
        });
    });
});