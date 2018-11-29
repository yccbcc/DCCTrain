module.exports =  {
  isNull: function (obj) {
    // 
    if (!obj || obj == null || obj == undefined) { // null,undefined
      return true;
    }
    if (obj == 'NaN' || obj == 'null') {
      return true;
    }
    //String
    if (String.prototype.isPrototypeOf(obj) && obj.length == 0) {
      return true;
    }
    // Array
    if (Array.prototype.isPrototypeOf(obj) && obj.length === 0) { // "",[]
      return true;
    }
    // Object {}
    if (Object.prototype.isPrototypeOf(obj) && Object.keys(obj).length === 0) { // 普通对象使用 for...in 判断，有 key 即为 false
      return true;
    }
    return false;
  }
}