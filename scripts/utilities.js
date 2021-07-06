
class mcanvas{
    constructor(toAddTo,name,sizex,sizey){
        if(sizey){
            $(toAddTo).append("<canvas id='"+name+"' height='"+sizey+"' width='"+sizex+"'></canvas>");
        }else{
            $(toAddTo).append("<canvas id='"+name+"' height='"+sizex+"' width='"+sizex+"'></canvas>");
        }
        this.elem = $("#"+name);
        this.canvas = this.elem[0];
        this.ctx = this.canvas.getContext("2d");
    }
 }
 
 
class Vec2 {
    constructor(x, y) {
         if(x.hasOwnProperty("x")){
              var out = y.sub(x);
              this.x = out.x;
              this.y = out.y
         }else{
              this.x = x;
              this.y = y;
         }
    }

    distance(vec) {
         var delta = this.sub(vec);
         return delta.magnitude();
    }

    add(vec) {
         return new Vec2(this.x + vec.x, this.y + vec.y);
    }
    sub(vec) {
         return new Vec2(this.x - vec.x, this.y - vec.y);
    }
    times(factor) {
         return new Vec2(this.x * factor, this.y * factor);
    }
    magnitude() {
         return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    normalised() {
         var out = this.times(1 / this.magnitude());
         return new Vec2(out.x,out.y);
    }
    dot(vec){
         return this.x * vec.x + this.y * vec.y;
    }
    angle(vec){
           return Math.acos((this.x * vec.x + this.y * vec.y) / Math.sqrt(this.x * this.x + this.y * this.y) / Math.sqrt(vec.x * vec.x + vec.y * vec.y));
    }
    
    clone(){
         return new Vec2(this.x,this.y);
    }
    
}



function clamp(min,val,max){
    return Math.max(min,Math.min(max,val));
 }
 
 

function updateDisabled(selector, value) {
     //value = can it be used?
     if (value) {
         $(selector).removeAttr("disabled");
     } else {
         $(selector).prop("disabled", "disabled");
     }
 }
 