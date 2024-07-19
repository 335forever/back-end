const { v4: uuidv4 } = require('uuid');

const matches = {};

function newMatch(playerA, playerB) {
    const matchId = uuidv4();
    
    matches[matchId] = {
        idA : playerA.id,
        idB : playerB.id,
        turn : Math.random() < 0.5 ? playerA.id : playerB.id,
        table : creatBlankTable(8,8),
        tick: 'X'
    }

    return matchId;
}

function checkWin(matchId, point, length) {
    const table = matches[matchId].table;
    const m = table.length;
    const n = table[0].length;
    
    const line1 = [];
    const line2 = [];
    const line3 = [];
    const line4 = [];

    let x = point.x;
    let y = point.y;

    // Lay line 1 ra
    for (let i = 0; i < n; i++) line1.push(table[x][i]);
    
    // Lay line 2 ra
    for (let i = 0; i < m; i++) line2.push(table[i][y]);
    
    // Lay line 3 ra
    const start = {x,y}
    while (start.x > 0 && start.y > 0) {
        start.x = start.x - 1;
        start.y = start.y - 1;
    }    
    while (start.x < m && start.y < n) {
        line3.push(table[start.x][start.y]);
        start.x = start.x + 1;
        start.y = start.y + 1;
    }

    // Lay line 4 ra
    const begin = {x,y}
    while (begin.x < m - 1 && begin.y > 0) {
        begin.x = begin.x + 1;
        begin.y = begin.y - 1;
    }   
    while (begin.x >= 0 && begin.y < n) {
        line4.push(table[begin.x][begin.y]);
        begin.x = begin.x - 1;
        begin.y = begin.y + 1;
    }
        
    return findLineWin(line1, length) || findLineWin(line2, length) || findLineWin(line3, length) || findLineWin(line4, length);
}
     
function removeMatch(matchId) {
    delete matches[matchId];
}

function findEnemyId(playerId) {
    for (let matchId in matches) {
        if (matches[matchId].idA == playerId)
            return matches[matchId].idB;
        else if (matches[matchId].idB == playerId)
            return matches[matchId].idA;
    }   
    
    return null;
}

function findMatch(playerId) {
    for (let matchId in matches) {
        if (matches[matchId].idA == playerId || matches[matchId].idB == playerId)
            return matchId
    }   
    
    return null;
}

function formatTable(table,m,n) {
    let cell = 0;
    const rows = [];
    for (let i = 0; i < m; i++) {
        const row = [];
        for (let j = 0; j < n; j++) {
            if (table[cell]) row.push(table[cell]);
            else row.push(null);
            cell++;
        }
        rows.push(row);
    }
    return rows;
}

function findLineWin(line, n) {
    // let stringLine = '';
    // for (let i = 0; i < line.length; i++) {
    //     if (line[i]) stringLine += line[i];
    //     else stringLine += ' ';
    // }

    const stringLine = line.reduce( (string, cell) => {
        return string + (cell ? cell : ' ')
    }, '')

    const regex = new RegExp(`(O{${n}}|X{${n}})`);
    const winLineStart = stringLine.search(regex);
    if (winLineStart !== -1) return stringLine[winLineStart];
    else return null;
}

function creatBlankTable(m,n) {
    const rows = []
    for (let i = 0; i < m; i++) {
        const row = []
        for (let j = 0; j < n; j++) row.push('')
        rows.push(row)   
    }
    return rows;
}

module.exports = {
    matches,
    newMatch,
    removeMatch,
    findEnemyId,
    findMatch,
    checkWin,
    findLineWin
}

