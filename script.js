function calculateBonus() {
    const closedChats = document.getElementById("closedChats").value;
    const csat = document.getElementById("csat").value;
  
    let bonus = 0;
    let gif = "";
    if (closedChats >= 700 && csat >= 90) {
      bonus = 50 + ((closedChats - 700) / 10) * 2 + (csat - 90) * 10 * 3;
      document.getElementById(
        "bonus"
      ).textContent = `Your bonus is \u20AC${bonus.toFixed(2)}.`;
  
      if (bonus >= 300) {
        gif = "https://media.giphy.com/media/i3D35lrOfyzTkg5a9o/giphy.gif";
      } else if (bonus >= 200) {
        gif = "https://media.giphy.com/media/i3D35lrOfyzTkg5a9o/giphy.gif";
      } else if (bonus >= 100) {
        gif = "https://media.giphy.com/media/3oz8xAFtqoOUUrsh7W/giphy.gif";
      } else {
        gif = "https://media.giphy.com/media/xUPGcJDAqpL2e3dL8A/giphy.gif";
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
  