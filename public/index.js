const playerName = prompt("Enter name:");

const socket = io();
socket.emit("join", playerName)

socket.on("sendMessage", (message) => {
    console.log(message);
});

function sendMessage(msg) {
    socket.emit("sendMessage", msg);
}

const players = document.getElementById("players");

socket.on("addPlayer", ({name, bingoes}) => {
    const playerElement = document.createElement("div");
    const playerNameElement = document.createElement("span");
    const playerBingoesElement = document.createElement("span");
    playerNameElement.innerText = `${name}: `;
    playerBingoesElement.innerText = `${bingoes}`;
    playerElement.append(playerNameElement);
    playerElement.append(playerBingoesElement);
    players.append(playerElement);
});

socket.on("removePlayer", (index) => {
    players.children[index].remove();
})

socket.on("updateBingoes", ({playerIndex, newBingoes}) => {
    players.children[playerIndex].children[1].innerText = `${newBingoes}`;
});

const table = document.querySelector(".bingo-container table");
const boardSelector = document.getElementById("board-selector");
const captureButton = document.getElementById("capture-button");
const shareButton = document.getElementById("share-button");

if (!navigator.share) shareButton.style.display = "none";

let bingoes = 0;

function updateBingoes() {
    socket.emit("updateBingoes", bingoes);
}

function createTable(arr, partial = false) {
    if (arr.length < 24)
        return createTable(arr.concat(Array(24 - arr.length).fill("")), true);

    const selectedIndices = new Set();
    const result = [];

    let randomIndex;

    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            if (!result[i]) {
                result[i] = [];
            }
            if (i == 2 && j == 2) result[i][j] = null;
            else while (true) {
                randomIndex = Math.floor(Math.random() * arr.length);
                if (!selectedIndices.has(randomIndex)) {
                    selectedIndices.add(randomIndex);
                    result[i][j] = arr[randomIndex];
                    break;
                }
            }
        }
    }

    return [result, partial];
}

fetch("data.json")
    .then(response => response.json())
    .then(data => {
        for (const i in data) {
            const option = document.createElement("option");
            option.value = i;
            option.innerText = data[i].name;
            if (data[i].values.length < 24) option.innerText += ` (${data[i].values.length}/24)`;
            boardSelector.append(option);
        }
        boardSelector.addEventListener("change", boardSelected.bind(null, data));
        captureButton.addEventListener("click", captureClicked);
    })
    .catch(error => {
        console.error('Error loading the JSON file:', error);
    });


function boardSelected(data) {
    table.innerHTML = '';
    captureButton.disabled = true;
    shareButton.disabled = true;

    if (boardSelector.value < 0) return;
    const [tableData, partial] = createTable(data[parseInt(boardSelector.value)]["values"]);
    tableData.forEach((row, i) => {
        const tr = document.createElement("tr");
        row.forEach((square, j) => {
            const td = document.createElement("td");
            if (square != null) {
                td.innerText = square;
                td.addEventListener("click", cellClicked.bind(null, td, i, j, partial));
            } else {
                td.classList.add("clicked");
                td.classList.add("centre");
            }
            td.setAttribute("counter", 0);
            tr.append(td);
        });
        table.append(tr);
    });
    captureButton.disabled = false;
}

function cellClicked(td, i, j, partial) {
    const cellActive = cell => cell.classList.contains("clicked");
    const getCounter = cell => parseInt(cell.getAttribute("counter"));
    const incrementCell = cell => cell.setAttribute("counter", getCounter(cell) + 1);
    const decrementCell = cell => cell.setAttribute("counter", getCounter(cell) - 1);

    td.classList.toggle("clicked");

    // Don't bingo for partial boards
    if (partial) return;

    const potentialBingoes = [
        // Same row
        [...table.children[i].children].map((cell, col) => [cell, Math.abs(j - col)]),
        // Same column
        [...table.children].map(row => row.children[j]).map((cell, row) => [cell, Math.abs(i - row)]),
    ];

    // Main diagonal
    if (i == j)
        potentialBingoes.push([...table.children].map((row, i) => [row.children[i], Math.abs(j - i)]));

    // Secondary diagonal
    if (i == 4 - j)
        potentialBingoes.push([...table.children].map((row, idx) => [row.children[4 - idx], Math.abs(i - idx)]));

    potentialBingoes
        .filter(cells => cells
                .map(([cell, _]) => cell)
                .filter(cell => cell != td)
                .every(cellActive)) // Select actual (former) bingoes
        .forEach(cells => {
            bingoes += 2 * cellActive(td) - 1;
            updateBingoes();
            cells.forEach(([cell, distance]) => {
                // Decrement if we've just lost a bingo
                if (!cellActive(td)) return decrementCell(cell);

                // Set distance and increment if we've gained a bingo
                // this is L∞ norm
                cell.setAttribute("distance", distance);
                return incrementCell(cell);
            });
        });
}

function downloadCapture(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

async function captureClicked() {
    const filename = `bingo-result-${Date.now()}.png`;
    const canvas = await html2canvas(table);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));

    const file = new File([blob], filename);
    const toShare = {
        title: "Results of Bingo",
        files: [file],
    };
    if (!navigator.share || !navigator.canShare(toShare)) {
        downloadCapture(blob, filename);
        return;
    }

    shareButton.disabled = false;
    shareButton.addEventListener("click", () => navigator.share(toShare).catch(error => downloadCapture(blob, filename)));
}
