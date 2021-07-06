var historyTime = 0;
class Cell {
    constructor(value) {
        this.value = value;
        this.history = [];
        this.history[0] = value;
        //historyTime++;
    }
    timeTravel() {

        $("#historyReadout").text(historyTime);
        //erase the fututre
        this.history = this.history.slice(0, historyTime);//this.history.filter((e,i)=>i<=historyTime)

        this.value = getLastElementOfArray(this.history);

    }
    change(newValue) {
        if (this.value != newValue) {
            this.value = newValue;
            historyTime++;
            this.history[historyTime] = this.value;//Save the new value.
            $("#historyReadout").text(historyTime);
        }
    }
}
function getLastElementOfArray(arr) {
    var array = arr.slice(0);
    return array.reverse().find(Boolean);
}
class Grower {
    constructor(pos, ctx, size, flavourFinder) {
        this.nei = [];
        this.flavour = 0;
        this.pos = pos;
        this.size = size;
        this.flavourFinder = flavourFinder;
        this.ctx = ctx;

    }

    Grow(force, onGrow, shouldContinueGrowing) {

        this.Draw();
        for (var i = 0; i < this.nei.length; i++) {
            if (this.nei[i].flavour.value != this.flavour.value) {
                if (shouldContinueGrowing(this.flavour, this.nei[i].flavour)) {
                    onGrow(this.flavour.value, this.nei[i].flavour.value);
                    this.nei[i].flavour.change(this.flavour.value);
                    this.nei[i].Draw();
                }
            }
        }
    }

    Draw() {
        this.ctx.fillStyle = this.flavourFinder(this.flavour.value);
        var px = Math.floor(this.pos.x * this.size);
        var py = Math.floor(this.pos.y * this.size);
        var size = Math.ceil(this.size);
        this.ctx.clearRect(px, py, size, size)
        this.ctx.fillRect(px, py, size, size);
        this.ctx.strokeStyle = "#f001";
        //this.ctx.beginPath();
        //this.ctx.rect(this.pos.x*this.size,this.pos.y*this.size,this.size,this.size);
        //this.ctx.stroke();
    }
}
class Painter {
    constructor(size, canvas) {
        this.grid = [];
        this.gridSize = size;
        this.canvas = canvas;
        this.pixSize = this.canvas.canvas.height / this.gridSize;

        for (var x = 0; x < this.gridSize; x++) {
            this.grid[x] = [];;
            for (var y = 0; y < this.gridSize; y++) {
                this.grid[x][y] = new Grower({ x: x, y: y }, this.canvas.ctx, this.pixSize, this.FlavourFinder);
                if (y < this.gridSize / 2) {
                    if (x < this.gridSize / 2) {
                        this.grid[x][y].flavour = new Cell(1);
                    } else {
                        this.grid[x][y].flavour = new Cell(2);
                    }
                } else {
                    if (x < this.gridSize / 2) {
                        this.grid[x][y].flavour = new Cell(3);
                    } else {
                        this.grid[x][y].flavour = new Cell(4);
                    }
                }
            }
        }



        for (var x = 0; x < this.gridSize; x++) {
            for (var y = 0; y < this.gridSize; y++) {
                for (var i = 0; i < 4; i++) {
                    var dx = Math.round(Math.sin(i / 4 * (2 * Math.PI)));
                    var dy = Math.round(Math.cos(i / 4 * (2 * Math.PI)));
                    if (this.IsPosInRangeOfGrid(new Vec2(x + dx, y + dy))) {
                        this.grid[x][y].nei.push(this.grid[x + dx][y + dy]);
                    };
                }
            }
        }


        this.Draw();
    }
    MouseEventToGridPos(e) {
        var offset = $(e.target).offset();
        var mousePos = { x: e.pageX - offset.left, y: e.pageY - offset.top };

        mousePos.x /= this.pixSize;
        mousePos.y /= this.pixSize;

        return mousePos;
    }
    IsPosInRangeOfGrid(pos) {
        var x = pos.x;
        var y = pos.y;
        return x < this.gridSize && x >= 0 && y < this.gridSize && y >= 0
    }
    Paint(c, radius, flavour, onGrow, shouldContinueGrowing) {
        var center = new Vec2(c.x, c.y);

        var growersToGrow = [];
        //center.x-=0.5;//offset to center of squares.
        //center.y-=0.5;

        for (var x = Math.floor(center.x) - radius; x < Math.min(center.x + radius, this.gridSize); x++) {

            for (var y = Math.floor(center.y) - radius; y < Math.min(center.y + radius, this.gridSize); y++) {
                var p = new Vec2(x, y);

                if (center.distance(p) < radius) {
                    if (this.IsPosInRangeOfGrid(p)) {
                        if (this.grid[x][y].flavour.value == flavour) {
                            growersToGrow.push(this.grid[x][y]);
                        }
                    }
                }
            }
        }
        //growersToGrow.push(this.grid[Math.floor(center.x)][Math.floor(center.y)]);
        for (var i = 0; i < growersToGrow.length; i++) {
            growersToGrow[i].Grow(flavour, onGrow, shouldContinueGrowing);
        }
        //this.Draw();
    }
    FlavourFinder(input) {
        var output = "red";
        if(input == -1){
            output = "#00000000"
        }
        if (input == 1) {
            output = "#B59345";
        }
        if (input == 2) {
            output = "#786C84";
        }
        if (input == 3) {
            output = "#62825C";
        }
        if (input == 4) {
            output = "#0F7173";
        }

        return output;
    }
    Draw() {
        for (var x = 0; x < this.gridSize; x++) {
            for (var y = 0; y < this.gridSize; y++) {
                this.grid[x][y].Draw();
            }
        }
    }


}
