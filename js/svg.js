/* (C) 2013 Peter Cook */
(function() {

var animdata = window.animdata || {};
window.animdata = animdata;
var test_data=0;

animdata.svg = {};

animdata.svg = animdata.svg || {};
animdata.svg.translate = function(t, y) {
  var x = t;
  if(typeof(t) === 'object') {
    x = t.x;
    y = t.y;
  }
  return 'translate('+(+x)+','+(+y)+')';
}

animdata.svg.rotate = function(a) {
  a = a * 180 / Math.PI;
  return 'rotate('+a+')';
}

animdata.svg.arc = function(mx0, my0, r, larc, sweep, mx1, my1) {
  return 'M'+mx0+','+my0+' A'+r+','+r+' 0 '+larc+','+sweep+' '+mx1+','+my1;
}

animdata.svg.pathAbsMove = function(x, y) {
	//console.log(x+"_______"+y)
	

	//y=y+20;
  return 'M' + x + ',' + y;
}

animdata.svg.pathAbsLine = function(x, y) {
	//console.log(z)
		//y=y+40;
		/*var value='';
	if(z==0)
	{
		y=y+20;
		value='L' + x + ',' + y;
	}
	else
	{
		//y=y+20;
		value='L' + x + ',' + y;
	}*/
  return 'L' + x + ',' + y;
}


})();