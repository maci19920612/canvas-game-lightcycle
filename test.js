function P(){
    console.log(this);
}

var a = function(){
    console.log(this);
};
function G(){
    this.error2 = "NEM MACI";
    a.apply(this);

}


var a = new G();