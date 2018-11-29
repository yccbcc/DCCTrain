// pages/control/control.js

const app = getApp();
var bleManager = require('../common/ble/bleManager.js')

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

    //内容高度
    middleViewHeight: 0,
    middleTopHeight: 50,
    dangWeiNames: ['IV', 'III', 'II', 'I'],

    //车辆选择
    cars: null,
    car: null,
    currentSel: 0,
  },

  onLoad: function(options) {
    //设置ui 以及 当前车辆
    var cars = app.globalData.cars;
    var car = null;
    var currentSel = 0;
    for (let i = 0; i < cars.length; i++) {
      var everyCar = cars[i]
      if (everyCar.isSelected) {
        car = everyCar;
        currentSel = i;
      }
    }
    this.setData({
      middleViewHeight: app.globalData.windowHeight - (60 + 90),
      cars: cars,
      car: car,
      currentSel: currentSel
    })
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
        console.log("收到-电源值回调", value.electricValue)
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
      } else if (value.type == bleManager.type.speedChange_read) {
        console.log(`收到-速度回调-速度:${value.speed} 方向:${value.direction}`)
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


  /************** 其他ui相关 ************/

  //车辆点击事件  改变选中和车辆相关
  cellTap: function(e) {
    var index = e.currentTarget.dataset.index
    var selCar = this.data.cars[index]
    if (selCar.isSelected) {
      return;
    }
    for (var i in this.data.cars) {
      var car = this.data.cars[i];
      car.isSelected = false;
    }
    selCar.isSelected = true;
    this.setData({
      currentSel: index,
      car: selCar,
      cars: this.data.cars,
    })
    app.globalData.cars = this.data.cars;
    app.globalData.car = selCar;
    wx.setStorage({
      key: 'cars',
      data: this.data.cars,
    })
  },

  //功能键点击事件
  functionBtnTap: function(e) {

    var index = e.currentTarget.dataset.index
    if (index > 28) {
      return;
    }
    this.data.car[`F${index}`].isSelected = !this.data.car[`F${index}`].isSelected
    this.updateSelCar({})
    bleManager.writeMsg({
      type: bleManager.type.functionTap_write,
      functionIndex: index
    })
  },


  // 滑块事件
  bindtouchstart: function(e) {
    var y = e.changedTouches[0].y;
    this.handleSlidY(y, false)
  },
  bindtouchmove: function(e) {
    var y = e.changedTouches[0].y;
    if (y < 0) {
      y = 0
    } else if (y > 180) {
      y = 180
    }
    this.handleSlidY(y, false)
  },

  bindtouchend: function(e) {

  },
  //下方功能键
  stopTap: function() {
    this.handleSlidY(180, false)
  },
  soonStopTap: function() {
    this.handleSlidY(-1, true)
  },

  directionTap: function() {
    this.data.car.direction = this.data.car.direction == 1 ? 0 : 1;
    this.updateSelCar({})
    this.writeSpeed(this.data.car.speed)
  },
  handleSlidY: function(y, isSoonStop) {

    var names = this.data.dangWeiNames
    for (let i = 0; i < names.length; i++) {
      this.data.car[names[i]].isSelected = false;
    }

    if (!isSoonStop) {
      var maxSpeed = parseInt(this.data.car.maxSpeed)
      var a = (180 - y) / 180
      var speed = parseInt(maxSpeed * a)
      this.data.car.speed = speed;
      this.updateSelCar({})
      this.writeSpeed(speed)
    } else {
      this.data.car.speed = 0;
      this.updateSelCar({})
      this.writeSpeed(-1)
    }

  },
  //档位变化
  dangWeiClick: function(e) {
    var index = e.currentTarget.dataset.index
    var names = this.data.dangWeiNames
    var name = names[index]
    if (this.data.car[name].isSelected) {
      return;
    }

    var maxSpeed = parseInt(this.data.car.maxSpeed)
    var oneDang = parseInt(this.data.car['I'].value)
    var twoDang = parseInt(this.data.car['II'].value)
    var threeDang = parseInt(this.data.car['III'].value)
    var fourDang = parseInt(this.data.car['IV'].value)
    var dangs = [fourDang, threeDang, twoDang, oneDang]
    var selDang = dangs[index]
    var speed = parseInt(maxSpeed * (selDang / 100))

    for (let i = 0; i < names.length; i++) {
      this.data.car[names[i]].isSelected = false;
    }
    this.data.car[name].isSelected = true;
    this.data.car.speed = speed;
    this.updateSelCar({})

    this.writeSpeed(speed)
  },

  //写入速度
  writeSpeed: function(speed) {
    bleManager.writeMsg({
      type: bleManager.type.speedChange_write,
      speed: speed
    })
  },
  //更新数据 和 ui
  updateSelCar: function(para) {
    var selCar = Object.assign({}, this.data.car, para)
    for (let i in this.data.cars) {
      var car = this.data.cars[i]
      if (car.isSelected) {
        this.data.cars[i] = selCar
        break;
      }
    }
    app.globalData.cars = this.data.cars;
    app.globalData.car = selCar;
    this.setData({
      car: selCar
    })
  },


  /**************image相关********* */

  imageTap() {
    var that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['original'],
      sourceType: ['album', 'camera'],
      success(res) {
        // tempFilePath可以作为img标签的src属性显示图片
        const tempFilePaths = res.tempFilePaths
        console.log(res)
        that.data.car.image = tempFilePaths[0];
        that.updateSelCar({})
        wx.setStorage({
          key: 'cars',
          data: app.globalData.cars,
        })
        console.log(app.globalData.cars)
      },
      fail: function(error) {
        console.log(error)
      }
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