//引起图片消失的罪魁祸首. 千万不要打开以下代码.会带来我至今无法理解的bug.

// Array.prototype.indexOfArr = function (val) {
//   for (var i = 0; i < this.length; i++) {
//     if (this[i] == val) return i;
//   }
//   return -1;
// };

// Array.prototype.removeArrObj = function (val) {
//   var index = this.indexOf(val);
//   if (index > -1) {
//     this.splice(index, 1);
//   }
// };