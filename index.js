const table = document.querySelector(".bingo-container table");
const boardSelector = document.getElementById("board-selector");

function createTable(arr) {
    const selectedIndices = new Set();
    const result = [];

    if (arr.length < 24)
        throw new Error("Not enough data")

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
            boardSelector.append(option);
        }
        boardSelector.addEventListener("change", boardSelected.bind(this, data));
    })
    .catch(error => {
        console.error('Error loading the JSON file:', error);
    });


function boardSelected(data) {
    table.innerHTML = '';
    let tableData = createTable(data[parseInt(boardSelector.value)]["values"]);
    for (const i in tableData) {
        const row = tableData[i];
        const tr = document.createElement("tr");
        for (const j in row) {
            const square = row[j];
            const td = document.createElement("td");
            if (square != null) {
                td.innerText = square;
                td.addEventListener("click", cellClicked.bind(this, td, i, j))
            } else {
                td.classList.add("clicked");
            }
            td.setAttribute("counter", 0);
            tr.append(td);
        }
        table.append(tr);
    }
}

function cellClicked(td, i, j) {
    const cellActive = (cell) => cell.classList.contains("clicked");
    const getCounter = (cell) => parseInt(cell.getAttribute("counter"));
    const incrementCell = (cell) => cell.setAttribute("counter", getCounter(cell) + 1);
    const decrementCell = (cell) => cell.setAttribute("counter", getCounter(cell) - 1);
    
    td.classList.toggle("clicked");

    const modifyCell = cellActive(td) ? incrementCell : decrementCell;
    
    if ([...table.children[i].children].filter(cell => cell != td).every(cellActive)) {
        [...table.children[i].children].forEach(modifyCell);
    }
    if ([...table.children].map(row => row.children[j]).filter(cell => cell != td).every(cellActive)) {
        [...table.children].map(row => row.children[j]).forEach(modifyCell);
    }
    if (i == j && [...table.children].map((row, i) => row.children[i]).filter(cell => cell != td).every(cellActive)) {
        [...table.children].map((row, i) => row.children[i]).forEach(modifyCell);
    } else if (i == 4 - j && [...table.children].map((row, i) => row.children[4 - i]).filter(cell => cell != td).every(cellActive)) {
        [...table.children].map((row, i) => row.children[4 - i]).forEach(modifyCell);
    }
}