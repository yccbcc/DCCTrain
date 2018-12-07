// pages/CV/cv.js

var app = getApp()
var bleManager = require("../common/ble/bleManager.js")
var tool = require("../common/tool.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {

    //top电源相关
    electricTxt: '0',
    connected: false,
    electriced: false,
    electricInterval: null,

    cvValueRightTxt: '', //右侧获取到的cv值 0~255
    cvValueErSelStatus: [], //下方二进制的选定状态
    cvAddressNum: '',

    //cv
    checkboxItems: [{
        value: '7',
      },
      {
        value: '6',
      },
      {
        value: '5'
      },
      {
        value: '4',
        checked: false
      },
      {
        value: '3'
      },
      {
        value: '2'
      },
      {
        value: '1'
      },
      {
        value: '0'
      },
    ],
  },
  //记录值
  _cvLeftNum: '',
  _allSendMsgs: [],
  //high128
  _firstBack_six_0_value: -100,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {

  },
  onShow: function() {
    this.initBle();
  },
  onHide: function() {
    this.clearBle();
  },
  onUnload: function() {
    this.clearBle();
  },

  //***********蓝牙直接相关*************/

  electricTap: function() {
    var type = this.data.electriced ? bleManager.type.electricStop_write : bleManager.type.electricOpen_write;
    console.log("写入-电源状态改变" + type);
    bleManager.writeMsg({
      type: type
    })
  },

  //初始化蓝牙相关
  initBle: function() {
    //电
    this.setData({
      electriced: app.globalData.electriced,
      connected: app.globalData.connected,
      electricTxt: app.globalData.electricTxt,
    })
    if (!this.data.electricInterval) {
      this.data.electricInterval = setInterval(function() {
        bleManager.writeMsg({
          type: bleManager.type.electricCheck_write,
        })
      }, 2000)
    }
    //设置回调
    bleManager.setChNotify((value) => {
      //电
      if (value.type == bleManager.type.electricCheck_read) {
        console.log("收到-电源值回调")
        var electricTxt = (parseInt(value.electricValue)) + '/1000';
        this.setData({
          electricTxt: electricTxt
        })
        app.globalData.electricTxt = electricTxt;
      } else if (value.type == bleManager.type.electricStop_read) {
        console.log("收到-电源停止回调")
        this.setData({
          electriced: false,
        })
        app.globalData.electriced = false;
      } else if (value.type == bleManager.type.electricOpen_read) {
        console.log("收到-电源开启回调")
        this.setData({
          electriced: true,
        })
        app.globalData.electriced = true;
      } else if (value.type == bleManager.type.cv_read) {
        var random1 = value.randomNum1;
        var random2 = value.randomNum2;
        var arrMsgs = this._allSendMsgs.concat()
        for (var i = 0; i < arrMsgs.length; i++) {
          var sendMsg = arrMsgs[i]
          if (sendMsg.randomNum1 == random1 + '' && sendMsg.randomNum2 == random2 + '') { //找到对应发出的消息
            var type = sendMsg.type;
            var backVlaue = parseInt(value.cvValue)
            var backAddress = parseInt(value.cvAddress)
            if (type == bleManager.type.cv_get_write) { //读cv值
              if (backVlaue >= 0 && backVlaue <= 255) {
                this.shiJinzhi22JinZhi(backVlaue)
                this.showToast("读取cv值成功")
              } else {
                this.showToast("读取cv值不成功")
              }
            } else if (type == bleManager.type.cv_set_write) { //设置cv值
              if (backVlaue == -1) {
                this.showToast("编程cv值失败")
              } else {
                this.showToast("编程cv值成功")
              }
            } else if (type == bleManager.type.carAddress_get_first_wirte) { // get Address
              var backValueStr = backVlaue.toString(2)
              var l = backValueStr.length;
              var s1 = "0000000";         //用于补齐，满8位
              if (l < 8) {
                var s2 = s1.slice(0, 8 - l);      //截取需要补齐的位数
                backValueStr = s2 + backValueStr;    //在前面进行补齐
              }
              var bit5 = parseInt(backValueStr.substr(2, 1))
              if (bit5 == 0) { //six == 0
                var backObj = bleManager.writeMsg({
                  type: bleManager.type.carAddress_get_sixValue_0_write
                })
                this._allSendMsgs.push(backObj);
              } else { //six != 0
                var timestamp3 = new Date().getTime()
                var backObj = bleManager.writeMsg({
                  type: bleManager.type.carAddress_get_sixValue_1_17_write
                })
                backObj.time = timestamp3;
                this._allSendMsgs.push(backObj);
                var backObj2 = bleManager.writeMsg({
                  type: bleManager.type.carAddress_get_sixValue_1_18_write
                })
                backObj2.time = timestamp3;
                this._allSendMsgs.push(backObj2);
              }
            } else if (type == bleManager.type.carAddress_get_sixValue_0_write) { //six == 0
              this.setData({
                cvAddressNum: backVlaue + ''
              })
            } else if (type == bleManager.type.carAddress_get_sixValue_1_17_write) { //get six != 0 17
              for (let i = 0; i < this._allSendMsgs.length; i++) {
                var msg = this._allSendMsgs[i]
                if (msg.time == sendMsg.time && msg.type == bleManager.type.carAddress_get_sixValue_1_18_write) {
                  if (tool.isNull(msg.value) == false) {
                    var a = this.colcullateR17AndR18(backVlaue, parseInt(msg.value))
                    this.setData({
                      cvAddressNum: a + ''
                    })
                    break;
                  }
                }
              }
              sendMsg.value = backVlaue + '';
            } else if (type == bleManager.type.carAddress_get_sixValue_1_18_write) { //get six != 0 18
              for (let i = 0; i < this._allSendMsgs.length; i++) {
                var msg = this._allSendMsgs[i]
                if (msg.time == sendMsg.time && msg.type == bleManager.type.carAddress_get_sixValue_1_17_write) {
                  if (tool.isNull(msg.value) == false) {
                    var a = this.colcullateR17AndR18(parseInt(msg.value), backVlaue)
                    this.setData({
                      cvAddressNum: a + ''
                    })
                    break;
                  }
                }
              }
              sendMsg.value = backVlaue + '';
            } else if (type == bleManager.type.carAddress_set_low128_R29_write) { // set 地址 <=128
              var backValueStr = backVlaue.toString(2)
              var l = backValueStr.length;
              var s1 = "0000000";         //用于补齐，满8位
              if (l < 8) {
                var s2 = s1.slice(0, 8 - l);      //截取需要补齐的位数
                backValueStr = s2 + backValueStr;    //在前面进行补齐
              }
              var bit5 = parseInt(backValueStr.substr(2, 1))
              if (bit5 == 1) { //six == 1  //发送value-32
                var backObj = bleManager.writeMsg({
                  type: bleManager.type.carAddress_set_low128_sixValue_0_write,
                  cvValue: backVlaue - 32
                })
                backObj.value = backVlaue - 32;
                this._allSendMsgs.push(backObj);
              } else { //six != 1
                var res = this.data.cvAddressNum
                var backObj = bleManager.writeMsg({
                  type: bleManager.type.carAddress_set_low128_first_write,
                  cvValue: res
                })
                this._allSendMsgs.push(backObj)
              }
            } else if (type == bleManager.type.carAddress_set_low128_sixValue_0_write) { // 第六位返回值 -1
              //低地址: six = 1
              if (backVlaue == -1) {
                var _this = this;
                setTimeout(function () {
                  var backObj = bleManager.writeMsg({
                    type: bleManager.type.carAddress_set_low128_sixValue_0_write,
                    cvValue: sendMsg.value
                  })
                  _this._allSendMsgs.push(backObj);
                }, 1000)
              } else {
                var res = this.data.cvAddressNum
                var backObj = bleManager.writeMsg({
                  type: bleManager.type.carAddress_set_low128_first_write,
                  cvValue: res
                })
                this._allSendMsgs.push(backObj)
              }
            } else if (type == bleManager.type.carAddress_set_low128_first_write) { // set r1
              if (backVlaue == -1) {
                this.showToast("set机车地址失败")
              } else {
                this.showToast("set机车地址成功")
              }
            } else if (type == bleManager.type.carAddress_set_high128_first_write) { //高地址 第一次交互
              var backValueStr = backVlaue.toString(2)
              var l = backValueStr.length;
              var s1 = "0000000";         //用于补齐，满8位
              if (l < 8) {
                var s2 = s1.slice(0, 8 - l);      //截取需要补齐的位数
                backValueStr = s2 + backValueStr;    //在前面进行补齐
              }
              var bit5 = parseInt(backValueStr.substr(2, 1))
              if (bit5 == 0) { //six == 0  //发送value+32
                var backObj = bleManager.writeMsg({
                  type: bleManager.type.carAddress_set_high128_sixValue_0_write,
                  cvValue: backVlaue + 32
                })
                backObj.value = backVlaue + 32;
                this._allSendMsgs.push(backObj);
              } else { //six != 0
                var res = this.data.cvAddressNum
                var r17 = this.colcullateR17AndR18Value(res).r17
                var r18 = this.colcullateR17AndR18Value(res).r18
                var timestamp3 = new Date().getTime()
                var backObj = bleManager.writeMsg({
                  type: bleManager.type.carAddress_set_high128_17_write,
                  cvValue: r17
                })
                backObj.time = timestamp3;
                this._allSendMsgs.push(backObj);
                var backObj2 = bleManager.writeMsg({
                  type: bleManager.type.carAddress_set_high128_18_write,
                  cvValue: r18
                })
                backObj2.time = timestamp3;
                this._allSendMsgs.push(backObj2);
              }
            } else if (type == bleManager.type.carAddress_set_high128_sixValue_0_write) {  //第六位1
              //高第一第一次返回: six = 0
              if (backVlaue == -1) {
                var _this = this;
                setTimeout(function() {
                  var backObj = bleManager.writeMsg({
                    type: bleManager.type.carAddress_set_high128_sixValue_0_write,
                    cvValue: sendMsg.value
                  })
                  _this._allSendMsgs.push(backObj);
                }, 1000)
              } else {
                var res = this.data.cvAddressNum
                var r17 = this.colcullateR17AndR18Value(res).r17
                var r18 = this.colcullateR17AndR18Value(res).r18
                var timestamp3 = new Date().getTime()
                var backObj = bleManager.writeMsg({
                  type: bleManager.type.carAddress_set_high128_17_write,
                  cvValue: r17
                })
                backObj.time = timestamp3;
                this._allSendMsgs.push(backObj);
                var backObj2 = bleManager.writeMsg({
                  type: bleManager.type.carAddress_set_high128_18_write,
                  cvValue: r18
                })
                backObj2.time = timestamp3;
                this._allSendMsgs.push(backObj2);
              }
            } else if (type == bleManager.type.carAddress_set_high128_17_write) { // set r17
              for (let i = 0; i < this._allSendMsgs.length; i++) {
                var msg = this._allSendMsgs[i]
                if (msg.time == sendMsg.time && msg.type == bleManager.type.carAddress_set_high128_18_write) {
                  if (tool.isNull(msg.value) == false) {
                    var a = this.colcullateR17AndR18(backVlaue, parseInt(msg.value))
                    if (a == this.data.cvAddressNum) {
                      this.showToast(`set机车地址:${this.data.cvAddressNum}成功`)
                    } else {
                      this.showToast(`set机车地址:${this.data.cvAddressNum}失败`)
                    }
                    break;
                  }
                }
              }
              sendMsg.value = backVlaue + '';
            } else if (type == bleManager.type.carAddress_set_high128_18_write) { //set r18
              for (let i = 0; i < this._allSendMsgs.length; i++) {
                var msg = this._allSendMsgs[i]
                if (msg.time == sendMsg.time && msg.type == bleManager.type.carAddress_set_high128_17_write) {
                  if (tool.isNull(msg.value) == false) {
                    var a = this.colcullateR17AndR18(parseInt(msg.value), backVlaue)
                    if (a == this.data.cvAddressNum) {
                      this.showToast(`set机车地址:${this.data.cvAddressNum}成功`)
                    } else {
                      this.showToast(`set机车地址:${this.data.cvAddressNum}失败`)
                    }
                    break;
                  }
                }
              }
              sendMsg.value = backVlaue + '';
            }
            break;
          }
        }
      }
    })
  },

  clearBle: function() {
    //电
    if (this.data.electricInterval) {
      clearInterval(this.data.electricInterval)
      this.data.electricInterval = null;
    }
    //特征回调
    bleManager.clearChNotify()
  },
  //计算
  colcullateR17AndR18: function(r17, r18) {
    var min17 = (r17 - 192) * 256;
    return min17 + r18;
  },
  colcullateR17AndR18Value: function(res) {
    var r17 = parseInt(res / 256) + 192
    var min17 = (r17 - 192) * 256;
    var r18 = res - min17;
    return {
      r17,
      r18
    }
  },
  showToast: function(str) {
    wx.showToast({
      title: str,
      icon: 'none'
    })
  },

  /************** 其他ui相关 ************/

  //机车地址:

  //下方机车地址
  bindinputAddress: function(e) {
    if (tool.isNull(e.detail.value)) {
      this.data.cvAddressNum = ''
      return;
    }
    var value = parseInt(e.detail.value);
    if (isNaN(value)) {
      this.data.cvAddressNum = '';
      return;
    }
    if (value > 10239) {
      wx.showToast({
        title: '需要在1~10239之间',
        icon: 'none'
      })
      return parseInt(value / 10);
    }
    this.data.cvAddressNum = value;
  },
  cvAddressGetTap: function() {
    var backObj = bleManager.writeMsg({
      type: bleManager.type.carAddress_get_first_wirte
    })
    this._allSendMsgs.push(backObj)
  },
  cvAddressSetTap: function() {
    if (tool.isNull(this.data.cvAddressNum + '')) {
      return;
    }
    var value = this.data.cvAddressNum;
    if (value > 10239 || value < 1) {
      wx.showToast({
        title: '需要在1~10239之间',
        icon: 'none'
      })
      return;
    }
    if (value <= 128) {
      var backObj = bleManager.writeMsg({
        type: bleManager.type.carAddress_set_low128_R29_write,
      })
      this._allSendMsgs.push(backObj)
    } else {
      var backObj = bleManager.writeMsg({
        type: bleManager.type.carAddress_set_high128_first_write
      })
      this._allSendMsgs.push(backObj)
    }
  },

  //cv 地址与值
  bindinputCVLeft: function(e) {
    if (tool.isNull(e.detail.value)) {
      this._cvLeftNum = ''
      return;
    }
    var value = parseInt(e.detail.value);
    if (isNaN(value)) {
      this._cvLeftNum = '';
      return;
    }
    if (value > 1024) {
      wx.showToast({
        title: '地址需要在0~1024之间',
        icon: 'none'
      })
      return parseInt(value / 10);
    }
    this._cvLeftNum = value;
  },
  bindinputCVRight: function(e) {
    if (tool.isNull(e.detail.value)) {
      this.data.cvValueRightTxt = ''
      return;
    }
    var value = parseInt(e.detail.value);
    if (isNaN(value)) {
      this.data.cvValueRightTxt = ''
      return;
    }
    if (value > 255) {
      wx.showToast({
        title: 'set值在0~255之间',
        icon: 'none'
      })
      return parseInt(value / 10);;
    }
    this.shiJinzhi22JinZhi(value);
  },

  cvValueGetTap: function(e) {
    if (tool.isNull(this._cvLeftNum + "")) {
      return;
    }
    if (this._cvLeftNum > 0 && this._cvLeftNum <= 1024) {
      var backObj = bleManager.writeMsg({
        type: bleManager.type.cv_get_write,
        cvAddress: this._cvLeftNum
      })
      this._allSendMsgs.push(backObj)
    } else {
      wx.showToast({
        title: 'set值在1~1024之间',
        icon: 'none'
      })
    }
  },
  cvValueSetTap: function(e) {
    if (tool.isNull(this._cvLeftNum + "")) {
      return;
    }
    if (tool.isNull(this.data.cvValueRightTxt + "")) {
      return;
    }
    if (this._cvLeftNum <= 0 || this._cvLeftNum > 1024) {
      wx.showToast({
        title: 'set值在1~1024之间',
        icon: 'none'
      })
      return;
    }
    if (this._cvRightNum < 0 || this._cvRightNum > 255) {
      wx.showToast({
        title: 'set值在0~255之间',
        icon: 'none'
      })
      return;
    }
    var backObj = bleManager.writeMsg({
      type: bleManager.type.cv_set_write,
      cvAddress: this._cvLeftNum,
      cvValue: this.data.cvValueRightTxt
    })
    this._allSendMsgs.push(backObj);
  },

  checkboxChange: function(e) {
    var checked = e.detail.value
    var changed = {}
    for (var i = 0; i < this.data.checkboxItems.length; i++) {
      if (checked.indexOf(this.data.checkboxItems[i].value) !== -1) {
        changed['checkboxItems[' + i + '].checked'] = true
      } else {
        changed['checkboxItems[' + i + '].checked'] = false
      }
    }
    var sum = this.erJinZhi210jinzhi(checked);
    changed['cvValueRightTxt'] = sum + ''
    this.setData(changed)
  },

  erJinZhi210jinzhi: function(checked) {
    var sum = 0;
    for (var i in checked) {
      var mi = checked[i]
      sum += Math.pow(2, parseInt(mi))
    }
    return sum;
  },
  shiJinzhi22JinZhi: function(backVlaue) {
    var backValueStr = backVlaue.toString(2)
    var l = backValueStr.length;
    var s1 = "0000000";         //用于补齐，满8位
    if (l < 8) {
      var s2 = s1.slice(0, 8 - l);      //截取需要补齐的位数
      backValueStr = s2 + backValueStr;    //在前面进行补齐
    }
    for (let i = 0; i < 8; i++) {
      var isSel = parseInt(backValueStr.substr(i, 1))
      this.data.checkboxItems[i].checked = isSel;
    }
    this.setData({
      checkboxItems: this.data.checkboxItems,
      cvValueRightTxt: backVlaue + ''
    })
  },
})

/************************** ab <--> 16进制字符串  ***************** */
function ab2hex(buffer) {
  let bufferType = Object.prototype.toString.call(buffer)
  if (buffer != '[object ArrayBuffer]') {
    return
  }
  let dataView = new DataView(buffer)

  var hexStr = '';
  for (var i = 0; i < dataView.byteLength; i++) {
    var str = dataView.getUint8(i);
    var hex = (str & 0xff).toString(16);
    hex = (hex.length === 1) ? '0' + hex : hex;
    hexStr += hex;
  }
  return hexStr.toUpperCase();
}

function hex2ab(str) {
  if (str == null) {
    return new ArrayBuffer(0);
  }
  if (typeof(str) == "number") {
    let buffer = new ArrayBuffer(1)
    let dataView = new DataView(buffer)
    dataView.setUint8(0, str)
    return buffer;
  }
  if (typeof(str) == "string") {
    var buffer = new ArrayBuffer(Math.ceil(str.length / 2));
    let dataView = new DataView(buffer)

    let ind = 0;
    for (var i = 0; i < str.length; i += 2) {
      let code = parseInt(str.substr(i, 2), 16)
      dataView.setUint8(ind, code)
      ind++
    }
    return buffer;
  }
}

/********** 字符串(英文) <---> 16进制 ************ */
function str2hex(str) {
  if (str === "")
    return "";
  var hexCharCode = [];
  // 　　hexCharCode.push("0x");
  for (var i = 0; i < str.length; i++) {
    hexCharCode.push((str.charCodeAt(i)).toString(16));
  }
  return hexCharCode.join("");
}

// 16进制转字符串
function hex2str(hexCharCodeStr) {
  var trimedStr = hexCharCodeStr.trim();
  var rawStr =
    trimedStr.substr(0, 2).toLowerCase() === "0x" ?
    trimedStr.substr(2) :
    trimedStr;
  var len = rawStr.length;
  if (len % 2 !== 0) {
    alert("Illegal Format ASCII Code!");
    return "";
  }
  var curCharCode;
  var resultStr = [];
  for (var i = 0; i < len; i = i + 2) {
    curCharCode = parseInt(rawStr.substr(i, 2), 16); // ASCII Code Value
    resultStr.push(String.fromCharCode(curCharCode));
  }
  return resultStr.join("");
}