function calculateBonus() {
    const closedChats = document.getElementById("closedChats").value;
    const csat = document.getElementById("csat").value;
    const position = document.getElementById("position").value;

    let bonus = 0;
    let gif = "";
    let thresholdChats = 700;
    let thresholdCsat = 90;

    if (position === "teamLead") {
        // Team leads have to dedicate only 70% of their time to chats
        thresholdChats = 700 * 0.8;
        thresholdCsat = 90;
    }

    if (closedChats >= thresholdChats && csat >= thresholdCsat) {
        bonus =
            50 +
            ((closedChats - thresholdChats) / 10) * 2 +
            (csat - thresholdCsat) * 10 * 3;
        document.getElementById(
            "bonus"
        ).textContent = `Your bonus is \u20AC${bonus.toFixed(2)}.`;

        if (bonus >= 300) {
            gif = "https://media.giphy.com/media/i3D35lrOfyzTkg5a9o/giphy.gif";
        } else if (bonus >= 200) {
            gif = "https://media.giphy.com/media/i3D35lrOfyzTkg5a9o/giphy.gif";
        } else if (bonus >= 100) {
            gif = "https://media.giphy.com/media/xTiTnqUxyWbsAXq7Ju/giphy.gif";
        } else {
            gif = "https://media.giphy.com/media/3oz8xAFtqoOUUrsh7W/giphy.gif";
        }
    } else {
        document.getElementById(
            "bonus"
        ).textContent = "Sorry, you don't qualify for a bonus this month.";
        gif = "https://media.giphy.com/media/ckGndVa23sCk9pae4l/giphy.gif";
    }

    // Display the GIF
    const gifElement = document.getElementById("gif");
    gifElement.src = gif;
    gifElement.style.display = "block";

    // Remove the GIF after 3 seconds
    setTimeout(() => {
        gifElement.style.display = "none";
    }, 3000);
}

const form = document.querySelector("form");
form.addEventListener("submit", (event) => {
    event.preventDefault();
    calculateBonus();
});
