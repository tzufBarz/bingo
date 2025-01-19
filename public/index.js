const socket = io();  // Automatically connects to the server

socket.on("connect", () => {
    console.log("Connected to server!");
});

socket.on("message", (data) => {
    console.log("Message from server:", data);
});

function sendMessage(msg) {
    socket.emit("message", msg);  // Send a message to the server
}

const table = document.querySelector(".bingo-container table");
const boardSelector = document.getElementById("board-selector");

let bingoes = 0;

function createTable(arr) {
    const selectedIndices = new Set();
    const result = [];

    if (arr.length < 24)
        throw new Error("Not enough data");

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

    return result;
}

fetch("data.json")
    .then(response => response.json())
    .then(data => {
        for (const i in data) {
            const option = document.createElement("option");
            option.value = i;
            option.innerText = data[i].name;
            if (data[i].values.length < 24) {
                option.disabled = true;
                option.innerText += ` (${data[i].values.length}/24)`;
            }
            boardSelector.append(option);
        }
        boardSelector.addEventListener("change", boardSelected.bind(null, data));
    })
    .catch(error => {
        console.error('Error loading the JSON file:', error);
    });


function boardSelected(data) {
    table.innerHTML = '';
    if (boardSelector.value < 0) return;
    let tableData = createTable(data[parseInt(boardSelector.value)]["values"]);
    for (const i in tableData) {
        const row = tableData[i];
        const tr = document.createElement("tr");
        for (const j in row) {
            const square = row[j];
            const td = document.createElement("td");
            if (square != null) {
                td.innerText = square;
                td.addEventListener("click", cellClicked.bind(null, td, i, j));
            } else {
                td.classList.add("clicked");
                td.classList.add("centre");
            }
            td.setAttribute("counter", 0);
            tr.append(td);
        }
        table.append(tr);
    }
}

function cellClicked(td, i, j) {
    const cellActive = cell => cell.classList.contains("clicked");
    const getCounter = cell => parseInt(cell.getAttribute("counter"));
    const incrementCell = cell => cell.setAttribute("counter", getCounter(cell) + 1);
    const decrementCell = cell => cell.setAttribute("counter", getCounter(cell) - 1);

    td.classList.toggle("clicked");

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
        potentialBingoes.push([...table.children].map((row, i) => [row.children[4 - i], Math.abs(j - i)]));

    potentialBingoes
        .filter(cells => cells
                .map(([cell, _]) => cell)
                .filter(cell => cell != td)
                .every(cellActive)) // Select actual (former) bingoes
        .forEach(cells =>
            cells.forEach(([cell, distance]) => {
                // Decrement if we've just lost a bingo
                if (!cellActive(td)) return decrementCell(cell);

                // Set distance and increment if we've gained a bingo
                // this is L∞ norm
                cell.setAttribute("distance", distance);
                return incrementCell(cell);
            })
        );
}
