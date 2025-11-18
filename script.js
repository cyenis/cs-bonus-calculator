// Get DOM elements
const resultsTable = document.getElementById("results-table");
const form = document.getElementById("bonus-form");
const agentNameInput = document.getElementById("agentName");
const closedChatsInput = document.getElementById("closedChats");
const csatInput = document.getElementById("csat");
const previewSection = document.getElementById("preview-section");
const previewAmount = document.getElementById("preview-amount");
const previewChatBonus = document.getElementById("preview-chat-bonus");
const previewCsatBonus = document.getElementById("preview-csat-bonus");
const previewCsatMultiplier = document.getElementById("preview-csat-multiplier");
const progressBar = document.getElementById("progress-bar");
const tierInfo = document.getElementById("tier-info");
const resultCard = document.getElementById("result-card");
const bonusElement = document.getElementById("bonus");
const quoteElement = document.getElementById("quote");
const statsDashboard = document.getElementById("stats-dashboard");
const quickActionsBar = document.getElementById("quick-actions-bar");
const emptyState = document.getElementById("empty-state");

// Load results from local storage
const results = JSON.parse(localStorage.getItem("results")) || [];

// Sort state
let sortColumn = null;
let sortDirection = 'desc'; // 'asc' or 'desc'

// Podium exclusions
let excludedFromPodium = JSON.parse(localStorage.getItem("excludedFromPodium")) || [];

// Constants for bonus calculation
const MIN_CHATS = 500;
const MIN_CSAT = 90; // Note: CSAT below 90% reduces multiplier. Hard cutoff at 85% (no bonus if CSAT ≤ 85%)
const MAX_BONUS = 700; // Maximum bonus cap in EUR
const BASE_SALARY = 3000; // Base monthly salary per team member in EUR
const TIERS = [
    { threshold: 500, rate: 0.5, chats: 500 },   // 500-599: 0.5 EUR/chat
    { threshold: 600, rate: 1.0, chats: 600 },   // 600-699: 1.0 EUR/chat
    { threshold: 700, rate: 1.5, chats: 700 },   // 700-799: 1.5 EUR/chat
    { threshold: 800, rate: 2.0, chats: 800 },   // 800-899: 2.0 EUR/chat
    { threshold: 900, rate: 2.5, chats: 900 },   // 900-999: 2.5 EUR/chat
    { threshold: 1000, rate: 3.0, chats: 1000 }, // 1000+: 3.0 EUR/chat (maximum)
];

/**
 * Check if data qualifies for bonus
 * Only requires minimum chats - CSAT acts as multiplier (can be above or below 90%)
 */
function qualifiesForBonus(closedChats, csat) {
    return closedChats !== null &&
           csat !== null &&
           closedChats >= MIN_CHATS;
}

// Initialize
renderResults();
updateStatistics();
updateEmptyState();

// Tab Navigation
const navItems = document.querySelectorAll('.nav-item');
const tabContents = {
    'calculator': document.getElementById('calculator-section'),
    'documentation': document.getElementById('documentation-section'),
    'podium': document.getElementById('podium-section-wrapper')
};

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const targetTab = item.getAttribute('data-tab');

        // Update active nav item
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Show/hide tab contents
        Object.keys(tabContents).forEach(key => {
            if (key === targetTab) {
                tabContents[key].style.display = 'block';

                // If switching to podium, update it
                if (key === 'podium') {
                    updatePodiumView();
                }
            } else {
                tabContents[key].style.display = 'none';
            }
        });
    });
});

// Function to update podium view when tab is opened
function updatePodiumView() {
    const podiumSection = document.getElementById('podium-section');
    const podiumWrapper = document.getElementById('podium-section-wrapper');

    // Check if there are results with names
    const resultsWithNames = results.filter(r => r.agentName && r.agentName.trim() !== '');

    if (resultsWithNames.length === 0) {
        // Show message if no data
        if (!document.getElementById('no-podium-data')) {
            const noDataMessage = document.createElement('div');
            noDataMessage.id = 'no-podium-data';
            noDataMessage.className = 'podium-intro-card';
            noDataMessage.style.marginTop = '2em';
            noDataMessage.innerHTML = `
                <div style="font-size: 3rem; margin-bottom: 1em;">📊</div>
                <h3 style="color: #4a5568; font-size: 1.3rem; margin-bottom: 0.5em;">No Performance Data Yet</h3>
                <p style="color: #718096;">Calculate bonuses with agent names to see the top performers leaderboard!</p>
            `;
            podiumWrapper.appendChild(noDataMessage);
        }
        podiumSection.style.display = 'none';
    } else {
        // Remove no-data message if it exists
        const noDataMessage = document.getElementById('no-podium-data');
        if (noDataMessage) {
            noDataMessage.remove();
        }

        // Update and show podium
        updatePodium();

        // Move podium section into wrapper if not already there
        if (podiumSection.parentElement !== podiumWrapper) {
            podiumWrapper.appendChild(podiumSection);
        }
    }
}

// Real-time preview on input
closedChatsInput.addEventListener("input", updatePreview);
csatInput.addEventListener("input", updatePreview);

/**
 * Calculate bonus breakdown
 */
function calculateBonusBreakdown(closedChats, csat) {
    let baseVolumeBonus = 0;
    let csatMultiplier = 0;
    let totalBonus = 0;

    if (qualifiesForBonus(closedChats, csat)) {
        // Calculate base volume bonus using tiered rates
        for (let i = 0; i < TIERS.length; i++) {
            const currentTier = TIERS[i];
            const nextTier = TIERS[i + 1];

            // Check if we've reached this tier
            if (closedChats >= currentTier.threshold) {
                // Calculate how many chats are in this tier
                let chatsInTier;
                if (nextTier) {
                    // Not the last tier - chats capped by next tier
                    chatsInTier = Math.min(closedChats, nextTier.threshold) - currentTier.threshold;
                } else {
                    // Last tier - all remaining chats
                    chatsInTier = closedChats - currentTier.threshold;
                }

                baseVolumeBonus += chatsInTier * currentTier.rate;
            }
        }

        // CSAT acts as a multiplier on the volume bonus
        // Hard cutoff: 85% or below = 0x (no bonus)
        // Above 85%: 1 - ((90 - CSAT) / 10)
        if (csat <= 85) {
            csatMultiplier = 0;
        } else {
            csatMultiplier = Math.max(0, 1 - ((90 - csat) / 10));
        }

        totalBonus = baseVolumeBonus * csatMultiplier;

        // Apply maximum bonus cap
        const uncappedBonus = totalBonus;
        totalBonus = Math.min(totalBonus, MAX_BONUS);
    }

    // Calculate cost per chat (base salary + bonus) / chats
    const totalCost = BASE_SALARY + totalBonus;
    const costPerChat = closedChats > 0 ? totalCost / closedChats : 0;

    return {
        chatBonus: baseVolumeBonus,
        csatBonus: baseVolumeBonus * (csatMultiplier - 1), // Show the bonus gained/lost from CSAT
        totalBonus,
        isCapped: totalBonus === MAX_BONUS && baseVolumeBonus > 0,
        costPerChat: costPerChat,
        totalCost: totalCost
    };
}

/**
 * Update real-time preview
 */
function updatePreview() {
    const closedChats = Number(closedChatsInput.value) || 0;
    const csat = Number(csatInput.value) || 0;

    if (closedChats > 0 && csat > 0) {
        if (qualifiesForBonus(closedChats, csat)) {
            const { chatBonus, csatBonus, totalBonus } = calculateBonusBreakdown(closedChats, csat);

            let csatMultiplier;
            if (csat <= 85) {
                csatMultiplier = 0;
            } else {
                csatMultiplier = Math.max(0, 1 - ((90 - csat) / 10));
            }

            previewSection.style.display = "block";
            previewAmount.textContent = `EUR ${totalBonus.toFixed(2)}`;
            previewChatBonus.textContent = `EUR ${chatBonus.toFixed(2)}`;

            // Show warning if below CSAT threshold
            if (csat <= 85) {
                previewCsatBonus.textContent = `EUR 0.00`;
                previewCsatBonus.style.color = '#e53e3e';
                previewCsatMultiplier.textContent = `0.0x (Below 85% threshold)`;
                previewCsatMultiplier.style.color = '#e53e3e';
            } else {
                previewCsatBonus.textContent = `${csatBonus >= 0 ? '+' : ''}EUR ${csatBonus.toFixed(2)}`;
                previewCsatBonus.style.color = '';
                previewCsatMultiplier.textContent = `${csatMultiplier.toFixed(2)}x`;
                previewCsatMultiplier.style.color = '';
            }

            // Update progress bar
            updateProgressBar(closedChats);
        } else {
            previewSection.style.display = "none";
        }
    } else {
        previewSection.style.display = "none";
    }
}

/**
 * Update progress bar for next milestone
 */
function updateProgressBar(closedChats) {
    let nextMilestone = 600;
    let nextRate = 1.0;
    let currentProgress = 0;
    let progressPercentage = 0;

    // Find next milestone
    for (let i = 0; i < TIERS.length; i++) {
        if (closedChats < TIERS[i].chats) {
            nextMilestone = TIERS[i].chats;
            nextRate = TIERS[i].rate;
            break;
        }
    }

    // Calculate progress
    if (closedChats >= 500 && closedChats < 1000) {
        const previousMilestone = nextMilestone - 100;
        currentProgress = closedChats - previousMilestone;
        progressPercentage = (currentProgress / 100) * 100;

        tierInfo.textContent = `${currentProgress} / 100 chats to ${nextMilestone} (EUR ${nextRate.toFixed(2)}/chat!)`;
    } else if (closedChats >= 1000) {
        progressPercentage = 100;
        tierInfo.textContent = "Maximum tier reached! EUR 3.00/chat 🎉";
    } else {
        progressPercentage = (closedChats / 600) * 100;
        tierInfo.textContent = `Reach 600 chats for EUR 1.00/chat!`;
    }

    progressBar.style.width = `${Math.min(progressPercentage, 100)}%`;
}

/**
 * Show toast notification
 */
function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    const container = document.getElementById("toast-container");
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("show");
    }, 100);

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
            container.removeChild(toast);
        }, 300);
    }, 3000);
}

/**
 * Get motivational quote
 */
function getMotivationalQuote(bonus) {
    let quotes = [];

    if (bonus >= 300) {
        quotes = [
            "Outstanding performance! You're setting the bar high!",
            "Exceptional work! Your dedication truly shines!",
            "You're crushing it! Keep up the amazing work!",
            "Phenomenal results! You're a customer support superstar!"
        ];
    } else if (bonus >= 200) {
        quotes = [
            "Great job! Your hard work is paying off!",
            "Impressive performance! Keep it up!",
            "You're doing fantastic! The team appreciates you!",
            "Strong results! You're making a real difference!"
        ];
    } else if (bonus >= 100) {
        quotes = [
            "Good work! You're on the right track!",
            "Nice progress! Keep pushing forward!",
            "Solid performance! Every effort counts!",
            "Well done! Your customers appreciate you!"
        ];
    } else if (bonus > 0) {
        quotes = [
            "Every journey begins with a single step. Keep going!",
            "You've qualified! Now let's aim higher!",
            "Great start! There's more potential to unlock!",
            "You're on the board! Build on this momentum!"
        ];
    } else {
        quotes = [
            "Don't give up! Success is just around the corner!",
            "Every expert was once a beginner. Keep learning!",
            "Tomorrow is a new opportunity to excel!",
            "Challenges are what make life interesting. You've got this!"
        ];
    }

    return quotes[Math.floor(Math.random() * quotes.length)];
}

/**
 * Calculate and save bonus
 */
function calculateBonus() {
    const agentName = agentNameInput.value.trim();
    const closedChats = Number(closedChatsInput.value);
    const csat = Number(csatInput.value);

    // Don't calculate if closed chats is 0
    if (closedChats === 0) {
        showToast("Please enter the number of closed chats", "error");
        return;
    }

    const { totalBonus, costPerChat, totalCost } = calculateBonusBreakdown(closedChats, csat);
    const quote = getMotivationalQuote(totalBonus);

    // Show result card
    resultCard.style.display = "block";

    if (qualifiesForBonus(closedChats, csat)) {
        if (totalBonus > 0) {
            bonusElement.innerHTML = `Your bonus is <span class="highlight">EUR ${totalBonus.toFixed(2)}</span>`;
        } else {
            bonusElement.innerHTML = `You've qualified! <span class="highlight">Keep going to earn more!</span>`;
        }
    } else {
        bonusElement.innerHTML = `<span class="not-qualified">Not qualified this month</span><br><small>Minimum: ${MIN_CHATS} closed chats required</small>`;
    }

    quoteElement.textContent = quote;

    // Scroll to result
    setTimeout(() => {
        resultCard.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);

    // Hide result card after 8 seconds
    setTimeout(() => {
        resultCard.style.display = "none";
    }, 8000);

    // Save results
    const date = new Date().toLocaleDateString();
    const result = {
        date,
        agentName,
        closedChats,
        csat,
        bonus: totalBonus,
        costPerChat: costPerChat || 0,
        totalCost: totalCost || (BASE_SALARY + totalBonus)
    };
    results.unshift(result);
    localStorage.setItem("results", JSON.stringify(results));

    // Update UI
    addResultToTable(result);
    updateStatistics();
    updateEmptyState();
    showToast("Bonus calculated and saved successfully!", "success");

    // Clear form
    form.reset();
    previewSection.style.display = "none";
}

/**
 * Add result to table
 */
function addResultToTable(result) {
    const row = resultsTable.insertRow(0);
    const displayName = result.agentName || '-';
    const costPerChat = result.costPerChat || (result.totalCost || (BASE_SALARY + result.bonus)) / result.closedChats;
    row.innerHTML = `
        <td>${result.date}</td>
        <td>${displayName}</td>
        <td>${result.closedChats}</td>
        <td>${result.csat}%</td>
        <td class="bonus-cell">EUR ${result.bonus.toFixed(2)}</td>
        <td class="cost-per-chat">€${costPerChat.toFixed(2)}</td>
    `;
    row.classList.add("fade-in");

    // Add click handler to show calculation details
    row.onclick = () => showCalculationDetails(result);
}

/**
 * Sort results by column
 */
function sortResults(column) {
    // Toggle direction if clicking same column
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'desc'; // Default to descending for new column
    }

    // Sort the results array
    results.sort((a, b) => {
        let aVal, bVal;

        switch (column) {
            case 'date':
                aVal = new Date(a.date);
                bVal = new Date(b.date);
                break;
            case 'name':
                aVal = (a.agentName || '').toLowerCase();
                bVal = (b.agentName || '').toLowerCase();
                break;
            case 'chats':
                aVal = a.closedChats;
                bVal = b.closedChats;
                break;
            case 'csat':
                aVal = a.csat;
                bVal = b.csat;
                break;
            case 'bonus':
                aVal = a.bonus;
                bVal = b.bonus;
                break;
            default:
                return 0;
        }

        if (sortDirection === 'asc') {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
    });

    renderResults();
}

/**
 * Render all results with sort indicators
 */
function renderResults() {
    resultsTable.innerHTML = "";

    // Update table headers with sort indicators
    const headers = document.querySelectorAll('#results-table-container thead th');
    headers.forEach((header, index) => {
        const columns = ['date', 'name', 'chats', 'csat', 'bonus'];
        const columnName = columns[index];

        // Remove existing sort indicators
        header.innerHTML = header.textContent.replace(/ ↑| ↓/g, '');

        // Add sort indicator if this column is sorted
        if (sortColumn === columnName) {
            header.innerHTML += sortDirection === 'asc' ? ' ↑' : ' ↓';
        }

        // Make headers clickable
        header.style.cursor = 'pointer';
        header.style.userSelect = 'none';
        header.onclick = () => sortResults(columnName);
    });

    // Render rows with click handlers
    results.forEach((result, index) => {
        const row = resultsTable.insertRow();
        const agentName = result.agentName || '-';
        row.innerHTML = `
            <td>${result.date}</td>
            <td>${agentName}</td>
            <td>${result.closedChats}</td>
            <td>${result.csat}%</td>
            <td class="bonus-cell">EUR ${result.bonus.toFixed(2)}</td>
        `;

        // Add click handler to show calculation details
        row.onclick = () => showCalculationDetails(result);
    });
}

/**
 * Update statistics dashboard
 */
function updateStatistics() {
    if (results.length === 0) {
        statsDashboard.style.display = "none";
        quickActionsBar.style.display = "none";
        return;
    }

    statsDashboard.style.display = "grid";
    quickActionsBar.style.display = "flex";

    // Calculate total bonuses and average
    const totalBonuses = results.reduce((sum, r) => sum + r.bonus, 0);
    const avgBonus = totalBonuses / results.length;

    // Calculate total chats closed
    const totalChats = results.reduce((sum, r) => sum + r.closedChats, 0);

    // Calculate average team CSAT
    const avgCSAT = results.reduce((sum, r) => sum + r.csat, 0) / results.length;

    // Calculate team cost metrics
    const totalTeamCost = (BASE_SALARY * results.length) + totalBonuses;
    const avgCostPerChat = totalChats > 0 ? totalTeamCost / totalChats : 0;

    // Count unique team members (agents with names)
    const uniqueAgents = new Set(
        results
            .filter(r => r.agentName && r.agentName.trim() !== '')
            .map(r => r.agentName)
    );
    const teamSize = uniqueAgents.size;

    // Calculate team objective (team size * 500 chats)
    const teamObjective = teamSize * 500;

    // Calculate goal achievement (total chats - team objective)
    const goalAchievement = totalChats - teamObjective;
    const achievementPercentage = teamObjective > 0 ? ((totalChats / teamObjective) * 100) : 0;

    // Update dashboard
    document.getElementById("total-bonuses").textContent = `EUR ${totalBonuses.toFixed(2)}`;
    document.getElementById("total-team-members").textContent = teamSize;
    document.getElementById("total-chats").textContent = totalChats.toLocaleString();
    document.getElementById("team-objective").textContent = `${teamObjective.toLocaleString()} chats`;
    document.getElementById("avg-bonus").textContent = `EUR ${avgBonus.toFixed(2)}`;
    document.getElementById("avg-cost-per-chat").textContent = `€${avgCostPerChat.toFixed(2)}`;

    // Update average CSAT with color coding (goal is 92%)
    const avgCSATElement = document.getElementById("avg-csat");
    avgCSATElement.textContent = `${avgCSAT.toFixed(1)}%`;

    // Apply color based on CSAT thresholds centered on 92% goal
    avgCSATElement.className = 'stat-value';
    if (avgCSAT >= 95) {
        avgCSATElement.classList.add('excellent'); // Exceeding goal significantly
    } else if (avgCSAT >= 92) {
        avgCSATElement.classList.add('good'); // At or above goal
    } else if (avgCSAT >= 88) {
        avgCSATElement.classList.add('warning'); // Below goal
    } else {
        avgCSATElement.classList.add('danger'); // Significantly below
    }

    // Update goal achievement with color coding
    const goalAchievementElement = document.getElementById("goal-achievement");
    const goalPercentageElement = document.getElementById("goal-percentage");
    const goalCard = document.getElementById("goal-achievement-card");

    if (goalAchievement >= 0) {
        goalAchievementElement.textContent = `+${goalAchievement.toLocaleString()} chats`;
        goalAchievementElement.className = 'stat-value positive';
        goalPercentageElement.textContent = `${achievementPercentage.toFixed(1)}% of goal`;
        goalPercentageElement.style.color = '#38a169';
    } else {
        goalAchievementElement.textContent = `${goalAchievement.toLocaleString()} chats`;
        goalAchievementElement.className = 'stat-value negative';
        goalPercentageElement.textContent = `${achievementPercentage.toFixed(1)}% of goal`;
        goalPercentageElement.style.color = '#f56565';
    }
}

/**
 * Update podium with top performers
 */
function updatePodium() {
    const podiumSection = document.getElementById('podium-section');

    // Only show podium if we have results with agent names
    const resultsWithNames = results.filter(r => r.agentName && r.agentName.trim() !== '');

    if (resultsWithNames.length === 0) {
        podiumSection.style.display = 'none';
        return;
    }

    // Group results by agent name and calculate performance score
    const agentTotals = {};
    resultsWithNames.forEach(result => {
        const name = result.agentName;
        if (!agentTotals[name]) {
            agentTotals[name] = {
                name: name,
                totalBonus: 0,
                totalChats: 0,
                csatScores: [],
                count: 0
            };
        }
        agentTotals[name].totalBonus += result.bonus;
        agentTotals[name].totalChats += result.closedChats;
        agentTotals[name].csatScores.push(result.csat);
        agentTotals[name].count++;
    });

    // Convert to array, filter exclusions and qualifications, and sort by performance score
    const topPerformers = Object.values(agentTotals)
        .filter(agent => !excludedFromPodium.includes(agent.name)) // Filter out excluded agents
        .map(agent => {
            // Calculate average CSAT
            const avgCSAT = agent.csatScores.reduce((sum, score) => sum + score, 0) / agent.csatScores.length;

            // Calculate performance score: CSAT × Total Chats (if CSAT >= 88% and chats > 50)
            const performanceScore = (avgCSAT >= 88 && agent.totalChats > 50) ? avgCSAT * agent.totalChats : 0;

            return {
                ...agent,
                avgCSAT: avgCSAT,
                performanceScore: performanceScore
            };
        })
        .filter(agent => agent.performanceScore > 0) // Only include agents who qualify
        .sort((a, b) => b.performanceScore - a.performanceScore)
        .slice(0, 3);

    // Only show if we have at least 1 performer
    if (topPerformers.length === 0) {
        podiumSection.style.display = 'none';
        return;
    }

    podiumSection.style.display = 'block';

    // Update podium positions
    for (let i = 0; i < 3; i++) {
        const position = i + 1;
        const performer = topPerformers[i];

        if (performer) {
            document.getElementById(`performer-${position}-name`).textContent = performer.name;
            document.getElementById(`performer-${position}-chats`).textContent = performer.totalChats.toLocaleString();
            document.getElementById(`performer-${position}-csat`).textContent = performer.avgCSAT.toFixed(1) + '%';

            // Show the podium position
            document.getElementById(`podium-${position}`).style.opacity = '1';
        } else {
            // Hide this position if we don't have enough performers
            document.getElementById(`performer-${position}-name`).textContent = '-';
            document.getElementById(`performer-${position}-chats`).textContent = '-';
            document.getElementById(`performer-${position}-csat`).textContent = '-';
            document.getElementById(`podium-${position}`).style.opacity = '0.3';
        }
    }
}

/**
 * Update empty state visibility
 */
function updateEmptyState() {
    if (results.length === 0) {
        emptyState.style.display = "flex";
    } else {
        emptyState.style.display = "none";
    }
}

/**
 * Form submission
 */
form.addEventListener("submit", (event) => {
    event.preventDefault();
    calculateBonus();
});

/**
 * Clear history - Shared function
 */
function clearHistory() {
    if (results.length === 0) {
        showToast("No history to clear!", "info");
        return;
    }

    if (confirm("Are you sure you want to clear all history? This cannot be undone.")) {
        localStorage.removeItem("results");
        results.length = 0;
        resultsTable.innerHTML = "";
        updateStatistics();
        updateEmptyState();

        // Hide podium when history is cleared
        document.getElementById('podium-section').style.display = 'none';

        showToast("History cleared successfully!", "success");
    }
}

const clearHistoryBtn = document.getElementById("clear-history-btn");
const clearHistoryBtnTop = document.getElementById("clear-history-btn-top");
clearHistoryBtn.addEventListener("click", clearHistory);
clearHistoryBtnTop.addEventListener("click", clearHistory);

/**
 * Export to CSV - Shared function
 */
function exportToCSV() {
    if (results.length === 0) {
        showToast("No data to export!", "info");
        return;
    }

    const csvHeaders = ["Date", "Agent Name", "Closed Chats", "CSAT", "Bonus (EUR)", "Total Cost (EUR)", "Cost per Chat (EUR)"];
    const csvRows = results.map(result => {
        const agentName = result.agentName || '-';
        const totalCost = result.totalCost || (BASE_SALARY + result.bonus);
        const costPerChat = result.costPerChat || (totalCost / result.closedChats);
        return [
            result.date,
            `"${agentName}"`,
            result.closedChats,
            result.csat,
            result.bonus.toFixed(2),
            totalCost.toFixed(2),
            costPerChat.toFixed(2)
        ].join(",");
    });

    const csvContent = [csvHeaders.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `bonus_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Report exported successfully!", "success");
}

const exportBtn = document.getElementById("export-btn");
const exportBtnTop = document.getElementById("export-btn-top");
exportBtn.addEventListener("click", exportToCSV);
exportBtnTop.addEventListener("click", exportToCSV);

/**
 * CSV Upload & Bulk Processing
 */

// CSV Elements
const uploadArea = document.getElementById("upload-area");
const csvFileInput = document.getElementById("csv-file-input");
const csvPreviewSection = document.getElementById("csv-preview-section");
const dataPreview = document.getElementById("data-preview");
const fileNameSpan = document.getElementById("file-name");
const rowCountSpan = document.getElementById("row-count");
const calculateAllBtn = document.getElementById("calculate-all-btn");
const cancelUploadBtn = document.getElementById("cancel-upload-btn");

// Column Mapping Elements
const nameColumnSelect = document.getElementById("name-column");
const chatsColumnSelect = document.getElementById("chats-column");
const csatColumnSelect = document.getElementById("csat-column");

// CSV Data Storage
let csvHeaders = [];
let csvRows = [];
let parsedCSVData = [];

// Click to upload
uploadArea.addEventListener("click", () => {
    csvFileInput.click();
});

// Drag and drop handlers
uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("drag-over");
});

uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("drag-over");
});

uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("drag-over");

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileUpload(files[0]);
    }
});

// File input change
csvFileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
    }
});

/**
 * Handle file upload
 */
function handleFileUpload(file) {
    if (!file.name.endsWith('.csv')) {
        showToast("Please upload a CSV file", "error");
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showToast("File too large. Maximum size is 10MB", "error");
        return;
    }

    fileNameSpan.textContent = file.name;
    showToast("Reading CSV file...", "info");

    const reader = new FileReader();
    reader.onload = (e) => {
        const csvText = e.target.result;
        parseCSVFile(csvText);
    };
    reader.onerror = () => {
        showToast("Error reading file", "error");
    };
    reader.readAsText(file);
}

/**
 * Find column index by exact header name (from Node.js parser)
 */
function findColumnIndex(headers, searchName) {
    for (let i = 0; i < headers.length; i++) {
        if (headers[i] && headers[i].trim() === searchName) {
            return i;
        }
    }
    return -1;
}

/**
 * Parse CSV text - Enhanced with Intercom 17-column format support
 */
function parseCSVFile(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
        showToast("CSV file is empty or invalid", "error");
        return;
    }

    // Scan lines 1-10 to find the actual header row
    // Must contain ALL three Intercom columns to be considered the header
    let headerIndex = -1;
    let isIntercomFormat = false;

    for (let i = 0; i < Math.min(10, lines.length); i++) {
        const columns = parseCSVLine(lines[i]);

        // Check if this row has ALL three required Intercom columns
        const hasTeammate = columns.some(col => col && col.trim() === 'Teammate');
        const hasClosedConversations = columns.some(col => col && col.trim() === 'Closed conversations by teammates');
        const hasCSAT = columns.some(col => col && col.trim() === 'Teammate CSAT score');

        if (hasTeammate && hasClosedConversations && hasCSAT) {
            // Found the Intercom header row!
            headerIndex = i;
            isIntercomFormat = true;
            break;
        }
    }

    // If not Intercom format, try to find headers by keyword matching
    if (headerIndex === -1) {
        for (let i = 0; i < Math.min(10, lines.length); i++) {
            const columns = parseCSVLine(lines[i]);

            // Count how many columns look like headers (not just metadata)
            const headerLikeColumns = columns.filter(col => {
                if (!col) return false;
                const lower = col.toLowerCase();
                // Must look like a column name, not a title or metadata
                return (
                    (lower.includes('name') || lower.includes('teammate') || lower.includes('agent')) &&
                    !lower.includes('comparison') && // Exclude titles like "Comparison of Teammate performance"
                    !lower.includes('performance')
                ) || (
                    (lower.includes('chat') || lower.includes('conversation')) &&
                    lower.includes('closed')
                ) || (
                    lower.includes('csat') ||
                    lower.includes('satisfaction')
                );
            });

            // A valid header row should have multiple column-like entries
            if (headerLikeColumns.length >= 2 && columns.length > 2) {
                headerIndex = i;
                break;
            }
        }
    }

    // Default to first line if still not found
    if (headerIndex === -1) {
        headerIndex = 0;
        showToast("Could not auto-detect headers. Using first row.", "warning");
    }

    // Parse headers
    csvHeaders = parseCSVLine(lines[headerIndex]);

    // Parse data rows (start after header)
    csvRows = [];
    for (let i = headerIndex + 1; i < lines.length; i++) {
        const columns = parseCSVLine(lines[i]);

        // Skip empty rows
        if (columns.every(col => !col || !col.trim())) continue;

        // Skip summary rows (common in Intercom exports)
        if (columns[0] && columns[0].toLowerCase().includes('summary')) continue;

        csvRows.push(columns);
    }

    if (csvRows.length === 0) {
        showToast("No data rows found in CSV", "error");
        return;
    }

    rowCountSpan.textContent = csvRows.length;

    // Setup column mappers with auto-detection
    setupColumnMappers();

    // Show preview section
    csvPreviewSection.style.display = "block";

    const formatMsg = isIntercomFormat
        ? `Detected Intercom format: ${csvRows.length} rows, ${csvHeaders.length} columns`
        : `Found ${csvRows.length} rows with ${csvHeaders.length} columns`;
    showToast(formatMsg, "success");

    // Initial preview with auto-detected mapping
    updatePreviewFromMapping();
}

/**
 * Parse a single CSV line (handles quoted fields)
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current);
    return result;
}

/**
 * Setup column mapping dropdowns with auto-detection
 */
function setupColumnMappers() {
    // Clear existing options
    [nameColumnSelect, chatsColumnSelect, csatColumnSelect].forEach(select => {
        select.innerHTML = '';
    });

    // Add options for each header
    csvHeaders.forEach((header, index) => {
        // Show actual header name or placeholder for empty columns
        const optionText = (header && header.trim()) ? header.trim() : `[Empty Column ${index + 1}]`;

        nameColumnSelect.add(new Option(optionText, index));
        chatsColumnSelect.add(new Option(optionText, index));
        csatColumnSelect.add(new Option(optionText, index));
    });

    // Auto-detect best column matches
    autoDetectColumns();
}

// Add change listeners once (outside the function)
nameColumnSelect.addEventListener('change', () => updatePreviewFromMapping());
chatsColumnSelect.addEventListener('change', () => updatePreviewFromMapping());
csatColumnSelect.addEventListener('change', () => updatePreviewFromMapping());

/**
 * Auto-detect which columns contain what data
 * Enhanced with exact matching for Intercom format
 */
function autoDetectColumns() {
    // First try exact matches (for Intercom 17-column format)
    const nameIdx = findColumnIndex(csvHeaders, 'Teammate');
    const chatsIdx = findColumnIndex(csvHeaders, 'Closed conversations by teammates');
    const csatIdx = findColumnIndex(csvHeaders, 'Teammate CSAT score');

    if (nameIdx !== -1) {
        nameColumnSelect.value = nameIdx;
    }
    if (chatsIdx !== -1) {
        chatsColumnSelect.value = chatsIdx;
    }
    if (csatIdx !== -1) {
        csatColumnSelect.value = csatIdx;
    }

    // If exact matches didn't work, fall back to keyword matching
    if (nameIdx === -1 || chatsIdx === -1 || csatIdx === -1) {
        csvHeaders.forEach((header, index) => {
            const lowerHeader = (header || '').toLowerCase();

            // Detect name column (but exclude titles)
            if (nameIdx === -1 && !lowerHeader.includes('comparison') && !lowerHeader.includes('performance')) {
                if (lowerHeader.includes('name') || lowerHeader.includes('teammate') || lowerHeader.includes('agent')) {
                    nameColumnSelect.value = index;
                }
            }

            // Detect chats column (prefer "closed" over just "conversation")
            if (chatsIdx === -1) {
                if (lowerHeader.includes('closed') && (lowerHeader.includes('chat') || lowerHeader.includes('conversation'))) {
                    chatsColumnSelect.value = index;
                } else if (lowerHeader.includes('chat') || lowerHeader.includes('conversation')) {
                    chatsColumnSelect.value = index;
                }
            }

            // Detect CSAT column
            if (csatIdx === -1 && (lowerHeader.includes('csat') || lowerHeader.includes('satisfaction'))) {
                csatColumnSelect.value = index;
            }
        });
    }
}

/**
 * Clean and extract number from text
 */
function extractNumber(value) {
    if (!value) return null;

    const str = String(value).trim();
    if (!str || str === '-') return null;

    // Remove commas, spaces, and extract first number found
    const cleaned = str.replace(/[,\s]/g, '');
    const match = cleaned.match(/\d+\.?\d*/);

    if (match) {
        const num = parseFloat(match[0]);
        return isNaN(num) ? null : num;
    }

    return null;
}

/**
 * Extract CSAT score - handles multiple formats
 */
function extractCSAT(value) {
    if (!value) return null;

    const str = String(value).trim();
    if (!str || str === '-') return null;

    // Try to extract percentage (anything before % symbol)
    const percentMatch = str.match(/(\d+\.?\d*)\s*%/);
    if (percentMatch) {
        return parseFloat(percentMatch[1]);
    }

    // Try to extract just a number (assume it's already a percentage)
    const num = extractNumber(str);
    if (num !== null && num <= 100) {
        return num;
    }

    return null;
}

/**
 * Update preview based on current column mapping
 */
function updatePreviewFromMapping() {
    const nameCol = parseInt(nameColumnSelect.value);
    const chatsCol = parseInt(chatsColumnSelect.value);
    const csatCol = parseInt(csatColumnSelect.value);

    // Parse data with current mapping
    parsedCSVData = csvRows.map(row => {
        const name = row[nameCol] ? row[nameCol].trim() : null;
        const chats = extractNumber(row[chatsCol]);
        const csat = extractCSAT(row[csatCol]);

        return { name, closedConversations: chats, csatScore: csat };
    }).filter(row => {
        // Only include rows with names and not all dashes (inactive users)
        if (!row.name || row.name === '-') return false;

        // Skip rows where both chats and CSAT are null (all dashes)
        if (row.closedConversations === null && row.csatScore === null) return false;

        return true;
    });

    // Update preview table
    const previewRows = parsedCSVData.slice(0, 10);

    let html = `
        <h3 class="preview-title" style="margin-top: 2em;">Preview (First 10 Rows)</h3>
        <div class="preview-table-container">
            <table class="preview-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Closed Chats</th>
                        <th>CSAT Score</th>
                        <th>Estimated Bonus</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
    `;

    previewRows.forEach(row => {
        // Don't calculate bonus if closed chats is 0 or null
        let bonusDisplay = '-';
        let statusIcon = '⚠️';
        let statusText = 'No data';
        let statusClass = 'status-not-qualified';

        if (row.closedConversations && row.closedConversations > 0) {
            const { totalBonus } = calculateBonusBreakdown(
                row.closedConversations,
                row.csatScore || 0
            );
            bonusDisplay = `EUR ${totalBonus.toFixed(2)}`;

            const qualifies = qualifiesForBonus(row.closedConversations, row.csatScore);
            statusIcon = qualifies ? '✅' : '⚠️';
            statusText = qualifies ? 'Qualifies' : 'Below min';
            statusClass = qualifies ? 'status-qualified' : 'status-not-qualified';
        }

        html += `
            <tr>
                <td><strong>${row.name || '-'}</strong></td>
                <td>${row.closedConversations !== null ? row.closedConversations.toLocaleString() : '-'}</td>
                <td>${row.csatScore !== null ? row.csatScore.toFixed(1) + '%' : '-'}</td>
                <td><strong>${bonusDisplay}</strong></td>
                <td class="${statusClass}">${statusIcon} ${statusText}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    if (parsedCSVData.length > 10) {
        html += `<p class="preview-note">Showing 10 of ${parsedCSVData.length} total rows</p>`;
    }

    // Count qualified (must have valid data and meet thresholds)
    const qualified = parsedCSVData.filter(r =>
        qualifiesForBonus(r.closedConversations, r.csatScore)
    ).length;
    html += `<p class="preview-note"><strong>${qualified} of ${parsedCSVData.length}</strong> team members qualify for bonuses</p>`;

    dataPreview.innerHTML = html;
}

/**
 * Calculate all bonuses from CSV
 */
calculateAllBtn.addEventListener("click", () => {
    if (parsedCSVData.length === 0) {
        showToast("No data to process", "error");
        return;
    }

    const confirmMsg = `Calculate bonuses for ${parsedCSVData.length} team members?\n\nThis will add all calculations to your history.`;
    if (!confirm(confirmMsg)) {
        return;
    }

    let successCount = 0;
    let qualifiedCount = 0;
    const date = new Date().toLocaleDateString();

    parsedCSVData.forEach(member => {
        // Skip if closed chats is 0 or null
        if (!member.closedConversations || member.closedConversations === 0) {
            return;
        }

        const { totalBonus, costPerChat, totalCost } = calculateBonusBreakdown(
            member.closedConversations,
            member.csatScore || 0
        );

        if (qualifiesForBonus(member.closedConversations, member.csatScore)) {
            qualifiedCount++;
        }

        const result = {
            date,
            agentName: member.name,
            closedChats: member.closedConversations,
            csat: member.csatScore || 0,
            bonus: totalBonus,
            costPerChat: costPerChat || 0,
            totalCost: totalCost || (BASE_SALARY + totalBonus)
        };

        results.unshift(result);
        addResultToTable(result);
        successCount++;
    });

    // Save to localStorage
    localStorage.setItem("results", JSON.stringify(results));

    // Update UI
    updateStatistics();
    updateEmptyState();

    // Reset CSV upload
    resetCSVUpload();

    // Show summary
    showToast(`Successfully processed ${successCount} bonuses!`, "success");

    setTimeout(() => {
        showToast(`${qualifiedCount} team members qualified for bonuses`, "info");
    }, 1000);

    // Scroll to history
    setTimeout(() => {
        document.querySelector('.history-section').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }, 2000);
});

/**
 * Cancel CSV upload
 */
cancelUploadBtn.addEventListener("click", () => {
    resetCSVUpload();
    showToast("Upload cancelled", "info");
});

/**
 * Reset CSV upload state
 */
function resetCSVUpload() {
    csvFileInput.value = '';
    csvPreviewSection.style.display = 'none';
    csvHeaders = [];
    csvRows = [];
    parsedCSVData = [];
    dataPreview.innerHTML = '';
    fileNameSpan.textContent = '';
    rowCountSpan.textContent = '0';
    uploadArea.classList.remove('drag-over');

    // Clear column mappers
    [nameColumnSelect, chatsColumnSelect, csatColumnSelect].forEach(select => {
        select.innerHTML = '';
    });
}

/**
 * Podium Controls - Simplified
 */

const podiumSection = document.getElementById('podium-section');

// Toggle Podium - Shared function
function togglePodium() {
    // Validation
    if (results.length === 0) {
        showToast("Calculate some bonuses first to see top performers!", "info");
        return;
    }

    const resultsWithNames = results.filter(r => r.agentName && r.agentName.trim() !== '');
    if (resultsWithNames.length === 0) {
        showToast("Add agent names when calculating to track top performers", "warning");
        return;
    }

    // Switch to podium tab
    const podiumNavItem = document.querySelector('.nav-item[data-tab="podium"]');
    if (podiumNavItem) {
        podiumNavItem.click();
    }
}

const togglePodiumBtn = document.getElementById('toggle-podium-btn');
const togglePodiumBtnTop = document.getElementById('toggle-podium-btn-top');
togglePodiumBtn.addEventListener('click', togglePodium);
togglePodiumBtnTop.addEventListener('click', togglePodium);

// Close Podium button
const closePodiumBtn = document.getElementById('close-podium-btn');
closePodiumBtn.addEventListener('click', () => {
    podiumSection.style.display = 'none';
});

/**
 * Exclusions Management
 */

// Get exclusions elements
const manageExclusionsBtn = document.getElementById('manage-exclusions-btn');
const exclusionsPanel = document.getElementById('exclusions-panel');
const exclusionsList = document.getElementById('exclusions-list');
const saveExclusionsBtn = document.getElementById('save-exclusions-btn');
const cancelExclusionsBtn = document.getElementById('cancel-exclusions-btn');

// Open exclusions panel
manageExclusionsBtn.addEventListener('click', () => {
    // Get all unique agent names
    const uniqueNames = [...new Set(results
        .filter(r => r.agentName && r.agentName.trim() !== '')
        .map(r => r.agentName))
    ].sort();

    if (uniqueNames.length === 0) {
        showToast("No agent names found in history", "info");
        return;
    }

    // Build exclusions list
    exclusionsList.innerHTML = '';
    uniqueNames.forEach(name => {
        const isExcluded = excludedFromPodium.includes(name);
        const item = document.createElement('div');
        item.className = 'exclusion-item';
        item.innerHTML = `
            <input type="checkbox" id="exclude-${name}" ${isExcluded ? 'checked' : ''}>
            <label for="exclude-${name}">${name}</label>
        `;
        exclusionsList.appendChild(item);
    });

    // Show panel
    exclusionsPanel.style.display = 'block';
});

// Save exclusions
saveExclusionsBtn.addEventListener('click', () => {
    // Collect checked names
    const checkboxes = exclusionsList.querySelectorAll('input[type="checkbox"]');
    excludedFromPodium = [];

    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const name = checkbox.nextElementSibling.textContent;
            excludedFromPodium.push(name);
        }
    });

    // Save to localStorage
    localStorage.setItem('excludedFromPodium', JSON.stringify(excludedFromPodium));

    // Update podium
    updatePodium();

    // Hide panel
    exclusionsPanel.style.display = 'none';

    const count = excludedFromPodium.length;
    showToast(count > 0 ? `${count} ${count === 1 ? 'person' : 'people'} excluded from rankings` : 'All exclusions cleared', 'success');
});

// Cancel exclusions
cancelExclusionsBtn.addEventListener('click', () => {
    exclusionsPanel.style.display = 'none';
});

/**
 * Calculation Details Modal
 */

const calculationModal = document.getElementById('calculation-modal');
const modalOverlay = document.getElementById('modal-overlay');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalBody = document.getElementById('modal-body');

// Show calculation details
function showCalculationDetails(result) {
    const closedChats = result.closedChats;
    const csat = result.csat;
    const agentName = result.agentName || 'Agent';

    // Calculate detailed breakdown
    let volumeSteps = [];
    let baseVolumeBonus = 0;

    for (let i = 0; i < TIERS.length; i++) {
        const currentTier = TIERS[i];
        const nextTier = TIERS[i + 1];

        if (closedChats >= currentTier.threshold) {
            let chatsInTier;
            if (nextTier) {
                chatsInTier = Math.min(closedChats, nextTier.threshold) - currentTier.threshold;
            } else {
                chatsInTier = closedChats - currentTier.threshold;
            }

            const tierBonus = chatsInTier * currentTier.rate;
            baseVolumeBonus += tierBonus;

            if (chatsInTier > 0) {
                volumeSteps.push({
                    range: nextTier ? `${currentTier.threshold}-${nextTier.threshold - 1}` : `${currentTier.threshold}+`,
                    chatsInTier,
                    rate: currentTier.rate,
                    bonus: tierBonus
                });
            }
        }
    }

    let csatMultiplier;
    if (csat <= 85) {
        csatMultiplier = 0;
    } else {
        csatMultiplier = Math.max(0, 1 - ((90 - csat) / 10));
    }

    const totalBonus = baseVolumeBonus * csatMultiplier;
    const totalCost = result.totalCost || (BASE_SALARY + totalBonus);
    const costPerChat = result.costPerChat || (totalCost / closedChats);

    // Build modal content
    let html = `
        <div class="calc-summary">
            <div class="calc-summary-row">
                <span class="calc-summary-label">Agent:</span>
                <span class="calc-summary-value">${agentName}</span>
            </div>
            <div class="calc-summary-row">
                <span class="calc-summary-label">Date:</span>
                <span class="calc-summary-value">${result.date}</span>
            </div>
            <div class="calc-summary-row">
                <span class="calc-summary-label">Closed Chats:</span>
                <span class="calc-summary-value">${closedChats.toLocaleString()}</span>
            </div>
            <div class="calc-summary-row">
                <span class="calc-summary-label">CSAT Score:</span>
                <span class="calc-summary-value">${csat}%</span>
            </div>
            <div class="calc-summary-row">
                <span class="calc-summary-label">Total Bonus:</span>
                <span class="calc-summary-value">EUR ${totalBonus.toFixed(2)}</span>
            </div>
            <div class="calc-summary-row">
                <span class="calc-summary-label">Total Cost:</span>
                <span class="calc-summary-value">EUR ${totalCost.toFixed(2)}</span>
            </div>
            <div class="calc-summary-row">
                <span class="calc-summary-label">Cost per Chat:</span>
                <span class="calc-summary-value highlight">€${costPerChat.toFixed(2)}</span>
            </div>
        </div>

        <div class="calc-section">
            <div class="calc-section-title">📊 Step 1: Volume Bonus Calculation</div>
    `;

    volumeSteps.forEach((step, index) => {
        html += `
            <div class="calc-step">
                <div class="calc-step-header">
                    <span class="calc-step-label">Tier ${index + 1}: ${step.range} chats</span>
                    <span class="calc-step-value">EUR ${step.bonus.toFixed(2)}</span>
                </div>
                <div class="calc-step-formula">
                    ${step.chatsInTier} chats × EUR ${step.rate.toFixed(2)}/chat = EUR ${step.bonus.toFixed(2)}
                </div>
            </div>
        `;
    });

    html += `
            <div class="calc-step" style="background: #edf2f7; border-left-color: #2d3748;">
                <div class="calc-step-header">
                    <span class="calc-step-label">Base Volume Bonus Total</span>
                    <span class="calc-step-value">EUR ${baseVolumeBonus.toFixed(2)}</span>
                </div>
            </div>
        </div>

        <div class="calc-section">
            <div class="calc-section-title">⭐ Step 2: CSAT Multiplier</div>
            ${csat <= 85 ? `
                <div class="calc-multiplier-box" style="background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);">
                    <div class="calc-multiplier-label">CSAT Multiplier</div>
                    <div class="calc-multiplier-value">0.0x</div>
                    <div class="calc-multiplier-formula">
                        CSAT ${csat}% ≤ 85% threshold → No bonus
                    </div>
                </div>
            ` : `
                <div class="calc-multiplier-box">
                    <div class="calc-multiplier-label">CSAT Multiplier</div>
                    <div class="calc-multiplier-value">${csatMultiplier.toFixed(2)}x</div>
                    <div class="calc-multiplier-formula">
                        1 - ((90 - ${csat}) / 10) = ${csatMultiplier.toFixed(2)}x
                    </div>
                </div>
            `}
        </div>

        <div class="calc-section">
            <div class="calc-section-title">💰 Final Calculation</div>
            <div class="calc-final-result">
                <div class="calc-final-label">Total Bonus</div>
                <div class="calc-final-value">EUR ${totalBonus.toFixed(2)}</div>
                <div class="calc-final-formula">
                    EUR ${baseVolumeBonus.toFixed(2)} × ${csatMultiplier.toFixed(2)} = EUR ${totalBonus.toFixed(2)}
                </div>
            </div>
        </div>
    `;

    modalBody.innerHTML = html;
    calculationModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

// Close modal
function closeModal() {
    calculationModal.style.display = 'none';
    document.body.style.overflow = ''; // Restore scrolling
}

modalCloseBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && calculationModal.style.display === 'flex') {
        closeModal();
    }
});
