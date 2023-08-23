// Get the table body where results will be displayed
const resultsTable = document.getElementById("results-table");

// Load results from local storage
const results = JSON.parse(localStorage.getItem("results")) || [];

// Render existing results in table
results.forEach((result) => {
    const row = resultsTable.insertRow();
    row.innerHTML = `<td>${result.date}</td><td>${result.closedChats}</td><td>${result.csat}</td><td>${result.position}</td><td>${result.bonus.toFixed(
        2
    )} \u20AC</td>`;
});

// Clear history button
const clearHistoryBtn = document.getElementById("clear-history-btn");
clearHistoryBtn.addEventListener("click", () => {
    localStorage.removeItem("results");
    resultsTable.innerHTML = "";
});

function calculateBonus() {
    const closedChats = document.getElementById("closedChats").value;
    const csat = document.getElementById("csat").value;
    const position = document.getElementById("position").value;

    let bonus = 0;
    let gif = "";

    // Calculate bonus based on position and performance
    if (position === "teamLead") {
        if (closedChats >= 490 && csat >= 90) {
            bonus =
                50 + ((closedChats - 490) / 10) * 2 + (csat - 90) * 10 * 3 * 0.7;
        }
    } else {
        if (closedChats >= 700 && csat >= 90) {
            bonus = 50 + ((closedChats - 700) / 10) * 2 + (csat - 90) * 10 * 3;
        }
    }

    // Determine GIF based on bonus amount
    if (bonus >= 300) {
        gif = "https://media.giphy.com/media/i3D35lrOfyzTkg5a9o/giphy.gif";
    } else if (bonus >= 200) {
        gif = "https://media.giphy.com/media/JpG2A9P3dPHXaTYrwu/giphy.gif";
    } else if (bonus >= 100) {
        gif = "https://media.giphy.com/media/xTiTnqUxyWbsAXq7Ju/giphy.gif";
    } else if (bonus = 0) {
        gif = "https://media.giphy.com/media/ckGndVa23sCk9pae4l/giphy.gif";
    } else {
        gif = "https://media.giphy.com/media/3oz8xAFtqoOUUrsh7W/giphy.gif";
    }

    // Display bonus
    const bonusElement = document.getElementById("bonus");
    if (bonus > 0) {
        bonusElement.innerHTML = `<strong>Your bonus is \u20AC${bonus.toFixed(
            2
        )}</strong>`;
    } else {
        bonusElement.textContent =
            "Sorry, you don't qualify for a bonus this month.";
    }

    // Display the GIF
    const gifElement = document.getElementById("gif");
    gifElement.src = gif;
    gifElement.style.display = "block";

    // Remove the GIF after 3 seconds
    setTimeout(() => {
        gifElement.style.display = "none";
    }, 3000);

    // Save results to local storage
    const date = new Date().toLocaleDateString();
    const result = { date, closedChats, csat, position, bonus };
    results.unshift(result);
    localStorage.setItem("results", JSON.stringify(results));

    // Add result to table
    const row = resultsTable.insertRow(0);
    row.innerHTML = `<td>${date}</td><td>${closedChats}</td><td>${csat}</td><td>${position}</td><td>${bonus.toFixed(
        2
    )} \u20AC</td>`;
}

const form = document.querySelector("form");
form.addEventListener("submit", (event) => {
    event.preventDefault();
    calculateBonus();
});

 // Connecting to wss://sock.birdie.so
 const socketBirdie = new WebSocket('wss://sock.birdie.so');

 // Connecting to wss://sock.hellozest.io
 const socketHelloZest = new WebSocket('wss://sock.hellozest.io');

 // Connecting to wss://sockm.hellozest.io
 const socketHelloZestM = new WebSocket('wss://sockm.hellozest.io');

 // You can then add event listeners for these sockets, for example:
 socketBirdie.addEventListener('message', function(event) {
     console.log('Message from server:', event.data);
 });
