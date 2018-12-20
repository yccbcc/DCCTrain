// pages/control/function/function.js
const app = getApp();
var bleManager = require('../../common/ble/bleManager.js')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    functionArr: null,

  },
  car: null,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {

    var id = options.id;
    for (var i = 0; i < app.globalData.cars.length; i++) {
      var thecar = app.globalData.cars[i]
      if (thecar.id == id) {
        this.car = thecar
        break;
      }
    }

    this.timeoutArr = [];
    for (var i = 0; i <= 28; i++) {
      this.timeoutArr.push(null)
    }

    var functionKeysArr = [];
    var functionArr = [];
    for (let i = 0; i <= 28; i++) {
      functionKeysArr.push(`F${i}`)
    }
    for (let i = 0; i < functionKeysArr.length; i++) {
      var key = functionKeysArr[i]
      functionArr.push(this.car[key])
    }
    this.setData({
      functionArr: functionArr,
    })
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    var functionKeysArr = [];
    for (let i = 0; i <= 28; i++) {
      functionKeysArr.push(`F${i}`)
    }
    for (let i = 0; i < functionKeysArr.length; i++) {
      var key = functionKeysArr[i]
      this.car[key].isSelected = false;
    }

  },

  // 点击事件
  nametap: function(e) {
    var index = e.currentTarget.dataset.index

    var dic = this.data.functionArr[index];
    dic.isSelected = !dic.isSelected;
    this.setData({
      functionArr: this.data.functionArr
    })
    this.car[`F${index}`].isSelected = !this.car[`F${index}`].isSelected

    bleManager.writeMsg({
      type: bleManager.type.functionTap_write,
      functionIndex: index
    })

    var lockNum = this.car[`F${index}`].lockNum;
    if (lockNum != 0) { //按下. 未锁定有延时
      if (this.car[`F${index}`].isSelected) { //摁下
        var that = this;
        var timeout = setTimeout(function() {
          var dic = that.data.functionArr[index];
          dic.isSelected = !dic.isSelected;
          that.setData({
            functionArr: that.data.functionArr
          })
          that.car[`F${index}`].isSelected = !that.car[`F${index}`].isSelected
          bleManager.writeMsg({
            type: bleManager.type.functionTap_write,
            functionIndex: index
          })
          var timeout1 = that.timeoutArr[index]
          if (timeout1) {
            clearTimeout(timeout1)
            that.timeoutArr[index] = null;
          }
        }, lockNum * 1000)
        this.timeoutArr[index] = timeout;
      } else { //按键谈起
        var timeout = this.timeoutArr[index]
        if (timeout) {
          clearTimeout(timeout)
          this.timeoutArr[index] = null;
        }
      }
    }
  },
  bindinput: function(e) {
    var value = e.detail.value
    if (value == null || value.length == 0) {
      return;
    }
    if (value.length > 4) {
      wx.showToast({
        title: '名字不能超过四个字符',
        icon:'none'
      })
      return e.detail.value.substr(0,4);
    }
    //更新show数据
    var index = e.currentTarget.dataset.index
    var dic = this.data.functionArr[index]
    dic.name = value
    //更新源数据
    var key = 'F' + index;
    var fd = this.car[key]
    fd.name = value;

    this.storageCars()
  },
  locktap: function(e) {
    var index = e.currentTarget.dataset.index
    var dic = this.data.functionArr[index]
    if (dic.lockNum == 0) { //锁定 => 不锁定
      dic.lockNum = 0.3
    } else {
      dic.lockNum = 0
    }
    this.setData({
      functionArr: this.data.functionArr
    })

    var key = 'F' + index;
    var fd = this.car[key]
    fd.lockNum = dic.lockNum
    this.storageCars()
  },
  uptap: function(e) {
    var index = e.currentTarget.dataset.index
    var dic = this.data.functionArr[index]
    var num = (dic.lockNum) + 0.1
    dic.lockNum = parseFloat(num.toFixed(1))
    this.setData({
      functionArr: this.data.functionArr
    })

    var key = 'F' + index;
    var fd = this.car[key]
    fd.lockNum = dic.lockNum
    this.storageCars()
  },
  downtap: function(e) {
    var index = e.currentTarget.dataset.index
    var dic = this.data.functionArr[index]
    if (dic.lockNum > 0) { //锁定 => 不锁定
      var num = (dic.lockNum) - 0.1
      dic.lockNum = parseFloat(num.toFixed(1))
    } else {
      dic.lockNum = 0.0
    }
    this.setData({
      functionArr: this.data.functionArr
    })

    var key = 'F' + index;
    var fd = this.car[key]
    fd.lockNum = dic.lockNum
    this.storageCars()
  },


  storageCars: function () {
    var cars = JSON.parse(JSON.stringify(app.globalData.cars))
    for (var i = 0; i < cars.length; i++) {
      var car = cars[i]
      car.speed = 0;
      car.register = 1;
      car.direction = 0;
      for (let i = 0; i <= 28; i++) {
        car[`F${i}`].isSelected = false
      }
      var dangName = ["IV", "III", "II", "I"]
      for (let j = 0; j < 4; j++) {
        var name = dangName[j]
        car[name].isSelected = false
      }
    }
    wx.setStorage({
      key: 'cars',
      data: cars,
    })
  },
})