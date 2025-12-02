document.getElementById("btnProblema").addEventListener("click", () => {
    const box = document.getElementById("infoBox");

    box.classList.remove("hidden");

    // Allow the browser to register the display change before fading in
    setTimeout(() => {
        box.classList.add("show");
    }, 20);
});

