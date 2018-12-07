module.exports = {
  //截取两个字符之间的字符 并返回  🌰 "0><a><b><c" => "<c"   arr = ["<a>","<b>"]
  cutstr: function(text, start, end, arr) {
    var s = text.indexOf(start)
    if (s > -1) {
      var text2 = text.substr(s);
      var s2 = text2.indexOf(end);
      if (s2 > -1) {
        var result = text2.substr(0, s2 + 1);
        arr.push(result)
        text = text2.substr(s2 + 1)
        return cutstr(text, start, end, arr)
      } else {
        return text2;
      }
    }
    return "";
  },
  // 字符串是否以什么结尾
  endWith:function(oriStr,endStr) {
    var d = oriStr.length - endStr.length;
    return (d >= 0 && oriStr.lastIndexOf(endStr) == d)
  }
}

/**
 * 属性扩展
 * 
 * String.prototype.endWith = function(endStr) {
      var d = this.length - endStr.length;
      return (d >= 0 && this.lastIndexOf(endStr) == d)
    }
 */