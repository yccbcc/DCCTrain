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
    dangWeiNames: ['IV', 'III', 'II', 'I'],

    middleTopHeight: 50, //图片高度
    functionBtnHeight: 0, //功能键高度.计算得出
    functionSpaceHeight: 10, //功能键空隙

    selectedCarHeight: 40, //选择机车按钮高度
    canvasHeight: 0, //计算得到

    topViewHeight: 60, //电流高度
    middleViewHeight: 0, //中间视图高度. 计算得出
    bottomViewHeight: 60, //底部视图高度.

    isShowCarList: false,

    isLongPress: false,

    functionNames: [],
    functionEditsStatus: [],

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
    this.data.car = car;
    var functionNames = this.initFunctionNames();
    var functionEditsStatus = [];
    for (var i = 1; i <= 28; i++) {
      functionEditsStatus.push(false)
    }
    

    var middleViewHeight = app.globalData.windowHeight - (this.data.topViewHeight + this.data.bottomViewHeight)
    var functionHeight = (app.globalData.windowHeight - (this.data.topViewHeight + this.data.bottomViewHeight + this.data.middleTopHeight)) / 6 - this.data.functionSpaceHeight;
    var canvasHeight = middleViewHeight - this.data.middleTopHeight - this.data.selectedCarHeight - 20 - 20;
    this.setData({
      functionNames: functionNames,
      functionEditsStatus: functionEditsStatus,
      canvasHeight: canvasHeight,
      middleViewHeight: middleViewHeight,
      functionBtnHeight: functionHeight,
      cars: cars,
      car: car,
      currentSel: currentSel
    })
  },
  initFunctionNames:function(){
    var functionNames = [];
    var functionKeys = [
      ['F1', 'F2'],
      ['F3', 'F4'],
      ['F5', 'F6'],
      ['F7', 'F8'],
      ['F9', 'F10'],
      ['F11', 'F12'],
      ['F13', 'F14'],
      ['F15', 'F16'],
      ['F17', 'F18'],
      ['F19', 'F20'],
      ['F21', 'F22'],
      ['F23', 'F24'],
      ['F25', 'F26'],
      ['F27', 'F28']
    ];
    for (var i = 0; i < functionKeys.length; i++) {
      var d = [];
      var a = functionKeys[i];
      for (var j = 0; j < 2; j++) {
        var b = a[j]
        var c = this.data.car[b]
        d.push(c)
      }
      functionNames.push(d)
    }
    return functionNames;
  },
  onShow: function() {
    this.initBle();

    // const ctx = wx.createCanvasContext('speedCanvas')

    // // Create linear gradient
    // var width = app.globalData.windowWidth * 0.3 * 0.9
    // const grd = ctx.createLinearGradient(0, 0, 0, this.data.canvasHeight)
    // grd.addColorStop(0, 'red')
    // grd.addColorStop(0.5, 'yellow')
    // grd.addColorStop(1, 'green')

    // // Fill with gradient
    // ctx.setFillStyle(grd)
    // ctx.fillRect(0, 0, width, this.data.canvasHeight)
    // ctx.draw()
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
        var theNum = (parseInt(value.electricValue) / 500)
        var electricTxt = theNum.toFixed(2) + 'A';
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

  //机车列表的展示与隐藏
  showCarsListTap: function() {
    this.setData({
      isShowCarList: !this.data.isShowCarList
    })
  },
  //功能键复位
  functionResetTap: function() {
    var car = this.data.car;
    for (let i = 0; i <= 32; i++) {
      car[`F${i}`].isSelected = false;
    }
    this.updateSelCar({},false)
    bleManager.writeMsg({
      type: bleManager.type.functionTap_write,
      functionIndex: 0
    })
    bleManager.writeMsg({
      type: bleManager.type.functionTap_write,
      functionIndex: 5
    })
    bleManager.writeMsg({
      type: bleManager.type.functionTap_write,
      functionIndex: 9
    })
    bleManager.writeMsg({
      type: bleManager.type.functionTap_write,
      functionIndex: 13
    })
    bleManager.writeMsg({
      type: bleManager.type.functionTap_write,
      functionIndex: 21
    })
  },
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
    this.data.car = selCar;
    var functionNames = this.initFunctionNames()
    this.setData({
      currentSel: index,
      car: selCar,
      cars: this.data.cars,
      functionNames: functionNames
    })
    app.globalData.cars = this.data.cars;
    app.globalData.car = selCar;
    wx.setStorage({
      key: 'cars',
      data: this.data.cars,
    })
  },


  //功能键长恩事件
  functionBtnLongTap: function(e) {
    this.data.isLongPress = true;
    var section = e.currentTarget.dataset.sectionindex
    var cell = e.currentTarget.dataset.cellindex
    var index = section * 2 + cell
    this.data.functionEditsStatus[index] = true;
    
    this.setData({
      functionEditsStatus: this.data.functionEditsStatus,
    })

    console.log(this.data.functionEditsStatus)
  },
  bindconfirm: function(e) {
    console.log(e)
    var section = e.currentTarget.dataset.sectionindex
    var cell = e.currentTarget.dataset.cellindex
    var index = section * 2 + cell
    if(e.detail.value && e.detail.value.length > 0){
      this.data.car[`F${index}`].name = e.detail.value;
      var functionNames = this.initFunctionNames();
      this.setData({
        functionNames: functionNames
      })
      this.updateSelCar({},true)
    }
  },
  bindblur: function(e) {
    var section = e.currentTarget.dataset.sectionindex
    var cell = e.currentTarget.dataset.cellindex
    var index = section * 2 + cell
    this.data.functionEditsStatus[index] = false;

    this.setData({
      functionEditsStatus: this.data.functionEditsStatus,
    })
  },

  //功能键点击事件
  functionBtnTap: function(e) {
    if (this.data.isLongPress){
      this.data.isLongPress = false;
      return;
    }

    var section = e.currentTarget.dataset.sectionindex
    var cell = e.currentTarget.dataset.cellindex
    var index = section * 2 + cell

    var isEdit = this.data.functionEditsStatus[index]
    if(isEdit){
      return;
    }

    console.log(index)
    if (index > 28) {
      return;
    }
    this.data.car[`F${index}`].isSelected = !this.data.car[`F${index}`].isSelected
    this.updateSelCar({},false)
    bleManager.writeMsg({
      type: bleManager.type.functionTap_write,
      functionIndex: index
    })
  },

  //下方功能键
  stopTap: function() {
    this.handleSlidY(this.data.canvasHeight, false)
  },
  soonStopTap: function() {
    this.handleSlidY(-1, true)
  },

  directionTap: function() {
    this.data.car.direction = this.data.car.direction == 0 ? 1 : 0;
    this.updateSelCar({},false)
    this.writeSpeed(this.data.car.speed)
  },
  
  // 滑块事件
  bindtouchstart: function (e) {
    var y = e.changedTouches[0].y;
    this.handleSlidY(y, false)
  },
  bindtouchmove: function (e) {
    var y = e.changedTouches[0].y;
    if (y < 0) {
      y = 0
    } else if (y > this.data.canvasHeight) {
      y = this.data.canvasHeight
    }
    this.handleSlidY(y, false)
  },

  bindtouchend: function (e) {

  },
  handleSlidY: function (y, isSoonStop) {
console.log(y)
    var names = this.data.dangWeiNames
    for (let i = 0; i < names.length; i++) {
      this.data.car[names[i]].isSelected = false;
    }

    if (!isSoonStop) {
      var maxSpeed = parseInt(this.data.car.maxSpeed)
      var a = (this.data.canvasHeight - y) / this.data.canvasHeight
      var speed = parseInt(maxSpeed * a)
      this.data.car.speed = speed;
      this.updateSelCar({}, false)
      this.writeSpeed(speed)
    } else {
      this.data.car.speed = 0;
      this.updateSelCar({}, false)
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
    this.updateSelCar({},false)
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
  updateSelCar: function(para,isNeedReStorage) {
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
    if (isNeedReStorage){
      wx.setStorage({
        key: 'cars',
        data: this.data.cars,
      })
    }
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
        that.updateSelCar({},true)
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