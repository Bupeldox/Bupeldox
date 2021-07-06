class canvases {
    constructor(size, toAddTo) {

        this.elem = $(".canvases");
        this.canvasSize = size;

        this.canvases = {
            ground: new mcanvas(this.elem, "ground", this.canvasSize),
            units: new mcanvas(this.elem, "units", this.canvasSize),
            borders: new mcanvas(this.elem, "borders", this.canvasSize),
            mouseInput: new mcanvas(this.elem, "mouseInput", this.canvasSize),
        }
        this.elem = $(".gui");
        this.guiCanvases = {
            displacement: new mcanvas(this.elem, "displacement", 40, this.canvasSize),
        }
        this.elem = $(".canvi");
    }
}

class Terrain {
    constructor(size, canvas) {
        //Generate terrain
        var terrainGenerator = new worleyAndChunkGen(size);
        this.canvas = canvas;
        this.heights = terrainGenerator.GetMap();
        this.size = size;
        this.terrain = [];

        this.segments = [
            { min: 0, value: { name: "sea", color: "#36c" } },
            { min: 0.2, value: { name: "land", color: "#3c3" } },
            { min: 0.9, value: { name: "ore", color: "#883" } },
        ];

        for (var x = 0; x < this.heights.length; x++) {
            this.terrain[x] = [];
            for (var y = 0; y < this.heights.length; y++) {
                var value = this.heights[x][y];
                var terrainType = null;
                for (var i = 0; i < this.segments.length; i++) {
                    var seg = this.segments[i];
                    if (value > seg.min) {
                        terrainType = seg.value;
                    }
                }
                this.terrain[x][y] = terrainType;
            }
        }
    }

    Draw() {
        var ctx = this.canvas.ctx;

        var boxSize = Math.ceil(this.canvas.canvas.height / this.size);
        for (var x = 0; x < this.heights.length; x++) {
            for (var y = 0; y < this.heights.length; y++) {

                var xPos = Math.floor(x * boxSize);
                var yPos = Math.floor(y * boxSize);
                ctx.fillStyle = this.terrain[x][y].color;
                ctx.fillRect(xPos, yPos, boxSize, boxSize);

            }
        }
    }
}

function takeCalculator(steps) {
    var steps = 100;
    var output = 0;
    for (var i = 0; i < steps; i++) {
        output += 1 / Math.pow(-2, i);

    }
    return output;
}

class Player {
    constructor(startingSize, flavour) {
        this.size = startingSize;
        this.targetSize = startingSize;
        this.flavour = flavour;
    }
    delta() {
        return this.targetSize - this.size;
    }
    canGrow() {
        return this.size < this.targetSize;
    }
    canShrink() {
        return this.size > this.targetSize;
    }
}

class Game {
    constructor(size, scale, playerCount) {

        this.gridSize = size;
        this.canvases = new canvases(this.gridSize * scale, ".canvases");

        this.terrain = new Terrain(size, this.canvases.canvases.ground);
        this.terrain.Draw();


        this.painter = new Painter(this.gridSize, this.canvases.canvases.borders);

        this.isMouseDown = false;
        this.currentFlavour = 0;
        this.brushRadius = 0;

        $(this.canvases.canvases.mouseInput.canvas).on("mousedown", (e) => this.MouseDown(e));
        $(window).on("mouseup", (e) => this.MouseUp(e));
        $(this.canvases.canvases.mouseInput.canvas).on("mousemove", (e) => this.MouseMove(e));


        this.players = [];
        this.players[0] = new Player(0, 0); //Empty
        this.players[0].targetSize = -100000;
        this.players[0].flavour = -1;
        for (var i = 0; i < playerCount; i++) {
            this.players[i + 1] = new Player(size * size / 2, i + 1);
        }


        for(var x=0;x<this.terrain.terrain.length;x++){
            for(var y=0;y<this.terrain.terrain.length;y++){
                var t = this.terrain.terrain[x][y].name;
                if(t == "sea"){
                    this.painter.grid[x][y].flavour = new Cell(-1);
                }
            }
        }

        this.painter.Draw();
        this.UpdateAllPlayers();
        this.resetTargetSizes();

        this.minUndo = 1;
        historyTime = 1;
        this.UpdateGUI();
    }
    resetTargetSizes() {
        for (var i = 0; i < this.players.length; i++) {
            this.players[i].targetSize = this.players[i].size;
        }
    }
    MouseDown(e) {
        this.isMouseDown = true;
        var mousePos = this.painter.MouseEventToGridPos(e);
        this.brushRadius = $('input[name=brushSize]:checked', '#brushSize').val() - 0;
        this.currentFlavour = this.painter.grid[Math.floor(mousePos.x)][Math.floor(mousePos.y)].flavour.value
        this.PaintAtE(e);
    }
    MouseUp(e) {
        this.isMouseDown = false;
    }
    MouseMove(e) {
        if (this.isMouseDown) {
            this.PaintAtE(e);
        }
    }
    PaintAtE(e) {
        var mousePos = this.painter.MouseEventToGridPos(e);
        this.painter.Paint(
            mousePos,
            this.brushRadius,
            this.currentFlavour,
            (f, t) => this.onGrow(f, t),
            (a, b) => this.canGrow(a, b),
        );
        this.UpdateGUI();
    }
    canGrow(flavour, defendingFlavour) {
        //CanGrow
        if(flavour.value==-1){
            return false;
        }
        if (this.conflictResolution && (
            (flavour.value == this.conflictResolution.aggressorPlayer && defendingFlavour.value == this.conflictResolution.defendingPlayer) ||
            (defendingFlavour.value == this.conflictResolution.aggressorPlayer && flavour.value == this.conflictResolution.defendingPlayer))) {

            var canGrow = false;
            if (defendingFlavour.value == this.conflictResolution.aggressorPlayer) {
                //was this cell theirs before the conflict
                var CellValueBeforeConflict = getLastElementOfArray(defendingFlavour.history.slice(0, this.conflictResolution.historyPointAtWhichResolutionStarted + 1));
                canGrow = CellValueBeforeConflict == this.conflictResolution.defendingPlayer;
                if (!canGrow) {
                    return false;
                }
            }


            canGrow = this.players[flavour.value].canGrow()
            this.players[defendingFlavour.value].canShrink()
            return canGrow;

        }
        return false;
    }

    onGrow(flavour, grownInto) {
        this.players[flavour].size++;
        this.players[grownInto].size--;
        this.UpdateGUI();
    }
    QuitResolutionEarly() {
        var cr = this.conflictResolution;
        if (this.players[cr.aggressorPlayer].size <= cr.aggressorEndTarget) {
            this.conflictResolution = false;
            this.resetTargetSizes();
            this.minUndo = historyTime;
            this.UpdateGUI();
        }
    }
    ResolveBorder(aggressorFlavour, defenderFlavour, amountToTake) {
        amountToTake = amountToTake - 0;
        if (this.conflictResolution) {
            return;
        }
        var turns = 4; //Even means defender takes last 'bite'
        this.conflictResolution = {
            historyPointAtWhichResolutionStarted: historyTime,
            aggressorPlayer: aggressorFlavour,
            defendingPlayer: defenderFlavour,
            currentPlayer: aggressorFlavour,
            switchPlayer: function () {
                this.currentPlayer = this.currentRecedingPlayer();
            },
            currentRecedingPlayer: function () {
                if (this.currentPlayer == this.aggressorPlayer) {
                    return this.defendingPlayer
                } else { return this.aggressorPlayer }
            },
            aggressorEndTarget: this.players[aggressorFlavour].size + amountToTake - 0,
            amountToTake: amountToTake / takeCalculator(turns),
            totalTurns: turns,
            turn: 0,

        };
        this.players[aggressorFlavour].targetSize += this.conflictResolution.amountToTake;
        this.players[defenderFlavour].targetSize -= this.conflictResolution.amountToTake;
        this.UpdateGUI();
    }
    ResolveBorderStep() {
        if (this.conflictResolution &&
            this.players[this.conflictResolution.aggressorPlayer].targetSize ==
            this.players[this.conflictResolution.aggressorPlayer].size
        ) {
            this.minUndo = historyTime;
            this.conflictResolution.turn++;
            this.conflictResolution.amountToTake = Math.floor(this.conflictResolution.amountToTake / -2);
            if ( /*Math.abs(this.conflictResolution.amountToTake) < 10*/ this.conflictResolution.turn >= this.conflictResolution.totalTurns) {
                this.players[this.conflictResolution.aggressorPlayer].targetSize = this.players[this.conflictResolution.aggressorPlayer].size;
                this.players[this.conflictResolution.defendingPlayer].targetSize = this.players[this.conflictResolution.defendingPlayer].size;
                this.conflictResolution = null;
                this.UpdateGUI();
                return;
            }
            this.conflictResolution.switchPlayer();

            this.players[this.conflictResolution.aggressorPlayer].targetSize += this.conflictResolution.amountToTake;
            this.players[this.conflictResolution.defendingPlayer].targetSize -= this.conflictResolution.amountToTake;
            this.UpdateGUI();
        }
    }
    UpdateAllPlayers() {
        var flatGrid = this.painter.grid.slice().flat(1);

        for (var i = 0; i < this.players.length; i++) {
            var player = this.players[i];
            player.size = flatGrid.filter((i) => i.flavour.value == player.flavour).length;
        }
    }
    UpdateGUI() {
        var cr = this.conflictResolution;
        if (cr) {
            $("#conflictResolutionTurn").text(cr.currentPlayer);
            $("#conflictResolutionDisplacement").text(cr.amountToTake);
            $("#confictProgress").text(this.players[cr.currentPlayer].targetSize - this.players[cr.currentPlayer].size);


            updateDisabled("#quitResolutionButton", cr.currentPlayer == cr.aggressorPlayer && this.players[cr.aggressorPlayer].size <= cr.aggressorEndTarget);
            updateDisabled("#finishTurnButton", this.players[this.conflictResolution.aggressorPlayer].targetSize == this.players[this.conflictResolution.aggressorPlayer].size);
            //updateDisabled("#undoButton",this.conflictResolution && this.players[this.conflictResolution.aggressorPlayer].targetSize == this.players[this.conflictResolution.aggressorPlayer].size);




            var dCanvas = this.canvases.guiCanvases.displacement.canvas;
            var dctx = this.canvases.guiCanvases.displacement.ctx;

            dctx.clearRect(0, 0, dCanvas.width, dCanvas.height);

            var totalSize = this.players[cr.aggressorPlayer].size + this.players[cr.defendingPlayer].size;
            var endGoal = cr.aggressorEndTarget / totalSize;
            var aggressorProp = this.players[cr.aggressorPlayer].size / totalSize;
            var currentTarget = this.players[cr.aggressorPlayer].targetSize / totalSize;

            dctx.lineWidth = 8;
            dctx.strokeStyle = this.painter.FlavourFinder(cr.defendingPlayer);
            dctx.beginPath();
            dctx.moveTo(dCanvas.width / 2, 20);
            dctx.lineTo(dCanvas.width / 2, dCanvas.height - 20);
            dctx.stroke();

            dctx.beginPath();
            //aggressor
            dctx.strokeStyle = this.painter.FlavourFinder(cr.aggressorPlayer);
            dctx.moveTo(dCanvas.width / 2, ((dCanvas.height - 40) * (1 - aggressorProp)) + 20);
            dctx.lineTo(dCanvas.width / 2, dCanvas.height - 20);
            //defender
            dctx.stroke();



            dctx.beginPath();
            dctx.strokeStyle = "#000";
            dctx.lineWidth = 1;
            //line
            dctx.moveTo(dCanvas.width / 2, 20);
            dctx.lineTo(dCanvas.width / 2, dCanvas.height - 20);
            //MidWayMarker/ultimateTarget
            dctx.moveTo((dCanvas.width / 2) - 5, 20 + ((dCanvas.height - 40) * (1 - endGoal)));
            dctx.lineTo((dCanvas.width / 2) + 5, 20 + ((dCanvas.height - 40) * (1 - endGoal)));
            dctx.stroke();

            dctx.beginPath();
            dctx.strokeStyle = "#f00";
            dctx.moveTo((dCanvas.width / 2) - 10, 20 + ((dCanvas.height - 40) * (1 - currentTarget)));
            dctx.lineTo((dCanvas.width / 2) + 10, 20 + ((dCanvas.height - 40) * (1 - currentTarget)));
            dctx.stroke();

            var currentPainterColor = this.painter.FlavourFinder(cr.currentPlayer);
            $(".canvases").css("border","10px solid "+ currentPainterColor);
            var paintingIntoColor = this.painter.FlavourFinder(cr.currentRecedingPlayer());
            if (!(this.players[this.conflictResolution.currentPlayer].targetSize == this.players[this.conflictResolution.currentPlayer].size)) {
                if (cr.turn == 0) {
                    $("#instructions").html("<span style='background-color:" + currentPainterColor + "; color:#fff'>This player</span>, you paint your border into <span style='background-color:" + paintingIntoColor + "; color:#fff'>this player</span>. See the right for how much you can change.");
                }
                if (cr.turn == 1) {
                    $("#instructions").html("<span style='background-color:" + currentPainterColor + "; color:#fff'>This player</span>, you paint your border back into <span style='background-color:" + paintingIntoColor + "; color:#fff'>this player</span> to negotiate your borders. See the right for how much you can change.");
                } else {
                    $("#instructions").html("<span style='background-color:" + currentPainterColor + "; color:#fff'>This player</span>, you paint your border into <span style='background-color:" + paintingIntoColor + "; color:#fff'>this player</span>. See the right for how much you can change.");
                }
            } else {
                $("#instructions").html("You can't push any more! Click undo or Finish Resolution turn.");
            }


        } else {
            $(".canvases").css("border","10px solid transparent");
            $("#conflictResolutionTurn").text("(no conflict)");
            $("#conflictResolutionDisplacement").text("(no conflict)");
            $("#confictProgress").text("(no conflict)");
            $("#quitResolutionButton").prop("disabled", true);
            $("#finishTurnButton").prop("disabled", true);
            //$("#undoButton").prop("disabled",true);
            $("#instructions").text("Choose an aggressor,defender and amount, then press aggress!");
        }
    }
    undo(amount) {

        historyTime = Math.max(this.minUndo, historyTime - amount);
        for (var x = 0; x < this.painter.gridSize; x++) {
            for (var y = 0; y < this.painter.gridSize; y++) {
                this.painter.grid[x][y].flavour.timeTravel();
            }
        }
        this.UpdateAllPlayers();
        this.painter.Draw();
        this.UpdateGUI();
    }
}



var game = new Game(300, 2, 4);

function Aggress() {
    var aggressor = $("#aggressorSelect").val();
    var defender = $("#defenderSelect").val();
    var amount = $("#aggressAmount").val();
    if (aggressor != defender) {

        game.ResolveBorder(aggressor, defender, amount);
    }
}