
// our global namespace with default difficulty setting
var Mynesweeper = Mynesweeper || {
    game: null,
    currDiff: { width: 9, height: 9, numBombs: 10 },
    colorArr: ["", "blue", "green", "red", "darkblue", "darkred", "black", "purple", "pink"]
};

// immutable difficulty type
Mynesweeper.Difficulty = Object.freeze({
    EASY: { width: 9, height: 9, numBombs: 10 },
    MEDIUM: { width: 16, height: 16, numBombs: 40 },
    HARD: { width: 30, height: 16, numBombs: 99 }
});

// immutable cell mark type
Mynesweeper.Flag = Object.freeze({
    NONE: "no flag",
    MINE: "mine",
    UNSURE: "unsure"
});

Mynesweeper.refresh = function () {
    $(document).ready(function () {
        $("#winMsg").hide();
        $("#loseMsg").hide();
    })
    Mynesweeper.game = new Mynesweeper.Grid();
    Mynesweeper.game.init();
    Mynesweeper.game.start();
}

// cell object of which game board grid is composed
Mynesweeper.Cell = function (count) {
    var _this = this;
    _this.revealed = false;
    _this.isBomb = false;
    _this.numAdjBombs = 0;
    _this.flag = Mynesweeper.Flag.NONE;
    _this.clickable = true;
    _this.id = count;
};

// game board grid composed of cells
Mynesweeper.Grid = function () {
    var _this = this;
    _this.myDifficulty = Mynesweeper.currDiff;
    _this.cells = [];
    _this.numCells = _this.myDifficulty.width * _this.myDifficulty.height;
    _this.bombCells = [];
    _this.numCellsLeft = _this.myDifficulty.numCells;
};

// randomly generate bomb cells
Mynesweeper.Grid.prototype.genBombCells = function () {
    var _this = this;
    var currNumBombs = 0;
    var n;

    while (currNumBombs < _this.myDifficulty.numBombs) {
        n = Math.floor(Math.random() * (_this.numCells));
        // if cell has not already been assigned bomb, ensures array of unique values
        if (!_this.bombCells.some(function (element) { return element == n; })) {
            _this.bombCells.push(n);
            currNumBombs++;
        }
    }
};

// fired after a win or a loss, reveals locations of all bombs and renders cells unclickable
Mynesweeper.Grid.prototype.revealAllBombs = function (gridContext) {
    var w = gridContext.myDifficulty.width;
    var row, col;

    for (var i = 0; i < gridContext.bombCells.length; i++) {
        row = Math.floor(gridContext.bombCells[i] / w);
        col = gridContext.bombCells[i] % w;
        $("#" + gridContext.bombCells[i]).hide();
        $("#td" + gridContext.bombCells[i]).html("<small><span class='glyphicon glyphicon-fire'></span></small>");
    }

    for (var i = 0; i < gridContext.cells.length; i++) {
        for (var j = 0; j < gridContext.cells[0].length; j++) {
            gridContext.cells[i][j].clickable = false;
        }
    }
};

// initialize game board
Mynesweeper.Grid.prototype.init = function () {
    var _this = this;
    _this.myDifficulty = Mynesweeper.currDiff;
    var h = _this.myDifficulty.height;
    var w = _this.myDifficulty.width;
    _this.cells = [];
    _this.bombCells = [];
    _this.numCells = w * h;
    _this.numCellsLeft = _this.numCells;

    var count = 0;

    // populate cells array and display game board
    $(document).ready(function () {
        $("#grid").empty();
        for (var i = 0; i < h; i++) {
            _this.cells.push([]);
            $("#grid").append("<tr id='row" + i + "'></tr>");
            for (var j = 0; j < w; j++) {
                _this.cells[i].push(new Mynesweeper.Cell(count));
                $("#row" + i).append("<td align='center' id='td" + count +
                    "'><button id='" + count + "' class='cell btn btn-info'></button></td>");
                count++;
            }
        }
    });

    // assign random cells as bombs, incrementing each adjacent cell's numAdjBombs
    var row, col;
    _this.genBombCells();
    for (var i = 0; i < _this.bombCells.length; i++) {
        row = Math.floor(_this.bombCells[i] / w);
        col = _this.bombCells[i] % w;
        _this.cells[row][col].isBomb = true;

        try { _this.cells[row - 1][col].numAdjBombs++; } catch (err) { }
        try { _this.cells[row - 1][col - 1].numAdjBombs++; } catch (err) { }
        try { _this.cells[row][col - 1].numAdjBombs++; } catch (err) { }
        try { _this.cells[row + 1][col - 1].numAdjBombs++; } catch (err) { }
        try { _this.cells[row + 1][col].numAdjBombs++; } catch (err) { }
        try { _this.cells[row + 1][col + 1].numAdjBombs++; } catch (err) { }
        try { _this.cells[row][col + 1].numAdjBombs++; } catch (err) { }
        try { _this.cells[row - 1][col + 1].numAdjBombs++; } catch (err) { }
    }
};

Mynesweeper.Grid.prototype.start = function () {
    var _this = this;
    var h = _this.myDifficulty.height;
    var w = _this.myDifficulty.width;

    // uncomment this block to cheat
    //var arow = 0, acol = 0;
    //for (var i = 0; i < _this.cells.length * _this.cells[0].length; i++) {
    //    arow = Math.floor(i / w);
    //    acol = i % w;

    //    if (_this.cells[arow][acol].isBomb) {
    //        document.getElementById(i).innerHTML = "B";
    //    }
    //    else {
    //        document.getElementById(i).innerHTML = _this.cells[arow][acol].numAdjBombs;
    //    }
    //}

    $(document).ready(function () {
        $(".cell").mousedown(function (e) {
            // keep row, col local to this anon function, otherwise they're closured
            var row = Math.floor(this.id / w);
            var col = this.id % w;
            if (_this.cells[row][col].clickable) {
                if (e.which == 1) { // left click
                    if (_this.cells[row][col].flag != Mynesweeper.Flag.MINE) {

                        $("#" + this.id).fadeOut(3000);
                        _this.numCellsLeft--;
                        console.log("left: " + _this.numCellsLeft + "  bombs: " + _this.myDifficulty.numBombs);
                        
                        if (_this.cells[row][col].isBomb) {
                            _this.revealAllBombs(_this);
                            $("#loseMsg").show();
                        }
                        else if (_this.numCellsLeft == _this.myDifficulty.numBombs) {
                            _this.revealAllBombs(_this);
                            $("#winMsg").show();
                        }
                        else {
                            if (_this.cells[row][col].numAdjBombs != 0) {
                                var color = Mynesweeper.colorArr[_this.cells[row][col].numAdjBombs];
                                $("#td" + this.id).html("<b style='color: " + color + "'>" + _this.cells[row][col].numAdjBombs + "</b>");
                            }
                            _this.cells[row][col].revealed = true;

                            // if no adjacent bombs, reveal all adjacent cells
                            if (_this.cells[row][col].numAdjBombs == 0) {
                                var cellArr = [];
                                if (row != 0)
                                    cellArr.push(_this.cells[row - 1][col]);
                                if (row != 0 && col != 0)
                                    cellArr.push(_this.cells[row - 1][col - 1]);
                                if (row != 0 && col != (_this.myDifficulty.width - 1))
                                    cellArr.push(_this.cells[row - 1][col + 1]);
                                if (row != _this.myDifficulty.height - 1)
                                    cellArr.push(_this.cells[row + 1][col]);
                                if (row != (_this.myDifficulty.height - 1) && col != 0)
                                    cellArr.push(_this.cells[row + 1][col - 1]);
                                if (row != (_this.myDifficulty.height - 1) && col != (_this.myDifficulty.width - 1))
                                    cellArr.push(_this.cells[row + 1][col + 1]);
                                if (col != 0)
                                    cellArr.push(_this.cells[row][col - 1]);
                                if (col != (_this.myDifficulty.width - 1))
                                    cellArr.push(_this.cells[row][col + 1]);

                                _this.revealAdjCells(cellArr, _this);
                            }
                        }
                    }
                }
                else if (e.which == 3) { // right click, toggle through flag options
                    if (_this.cells[row][col].flag === Mynesweeper.Flag.NONE) {
                        _this.cells[row][col].flag = Mynesweeper.Flag.MINE;
                        document.getElementById(this.id).className = "cell btn btn-danger";
                    }
                    else if (_this.cells[row][col].flag === Mynesweeper.Flag.MINE) {
                        _this.cells[row][col].flag = Mynesweeper.Flag.UNSURE;
                        document.getElementById(this.id).className = "cell btn btn-warning";
                    }
                    else {
                        _this.cells[row][col].flag = Mynesweeper.Flag.NONE;
                        document.getElementById(this.id).className = "cell btn btn-info";
                    }
                }
            }
            
        });
    });
};

// 
Mynesweeper.Grid.prototype.revealAdjCells = function (cellArr, gridContext) {
    for (var i = 0; i < cellArr.length; i++) {
        if (!cellArr[i].revealed) {
            // if open cell, keep spreading click
            if (cellArr[i].numAdjBombs == 0) {
                // simulate mouse click on this cell
                $("#" + cellArr[i].id).trigger(jQuery.Event("mousedown", { which: 1 }));
            }
            else {
                var color = Mynesweeper.colorArr[cellArr[i].numAdjBombs];
                $("#td" + cellArr[i].id).html("<b style='color: " + color + "'>" + cellArr[i].numAdjBombs + "</b>");
                cellArr[i].revealed = true;
                
                if (gridContext.numCellsLeft == gridContext.myDifficulty.numBombs) {
                    gridContext.revealAllBombs(gridContext);
                    $("#winMsg").show();
                }
                gridContext.numCellsLeft--;
            }
        }
    }
};

(function () {
    $(document).ready(function () {
        $("#easy").click(function () {
            Mynesweeper.currDiff = Mynesweeper.Difficulty.EASY;
        });

        $("#medium").click(function () {
            Mynesweeper.currDiff = Mynesweeper.Difficulty.MEDIUM;
        });

        $("#hard").click(function () {
            Mynesweeper.currDiff = Mynesweeper.Difficulty.HARD;
        });

        $(".refresh").click(function () {
            Mynesweeper.refresh();
        });
    });
})();