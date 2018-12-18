// pages/cars/detail/detail.js

var tool = require("../../common/tool.js")

var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    keyNames: ['name', 'cab', 'maxSpeed', 'I', 'II', 'III', 'IV'],
    //edit时使用
    values: ['', '', '', , '', '', , '', ''],
    isAdd: true,
    id: '',

    car: null, //如果是修改
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    console.log("onlaod方法出发", options)
    this.data.isAdd = (options.isAdd == '1')
    this.data.id = options.id;
    if (!this.data.isAdd) {
      var cars = app.globalData.cars;
      for (var i in cars) {
        if (cars[i].id == this.data.id) {
          this.data.car = cars[i];
        }
      }
      console.log(cars, this.data.car)
      var car = this.data.car;
      this.setData({
        values: [car.name, car.cab, car.maxSpeed, car['I'].value, car['II'].value, car['III'].value, car['IV'].value]
      })
    }else{
      this.setData({
        values: ["", "", "126", "15", "30","50","80"]
      })
    }
  },

  //提交数据
  formSubmit: function(e) {

    var isNull = false;
    var value = e.detail.value;
    console.log(value)
    for (var i in value) {
      if (this.isNull(value[i])) {
        isNull = true;
        break;
      }
    }
    if (isNull) {
      wx.showToast({
        title: '数据不完整',
        icon: 'none',
        duration: 2000
      })
      return;
    }
    var cabValue = parseInt(e.detail.value.cab)
    if (cabValue > 10239 || cabValue < 1) {
      wx.showToast({
        title: '地址需要在1~10239之间',
        icon: 'none'
      })
      return;
    }

    var oneS = parseInt(e.detail.value['I'])
    var twoS = parseInt(e.detail.value['II'])
    var threeS = parseInt(e.detail.value['III'])
    var fourS = parseInt(e.detail.value['IV'])
    if((oneS > twoS || twoS > threeS) || threeS > fourS){
      wx.showToast({
        title: '请设置档位依次递增',
        icon: 'none'
      })
      return;
    }

    if (this.data.isAdd) {
      var timestamp = new Date().getTime() + '';
      value.id = timestamp;
      value.isDefault = false;
      value.isSelected = false;
      value.speed = 0;
      value.register = 1;
      value.direction = 0;
      value.type = "数码";
      value.image = null;
      value['I'] = {
        name: 'I',
        value: parseInt(value['I']),
        isSelected: false
      }
      value['II'] = {
        name: 'II',
        value: parseInt(value['II']),
        isSelected: false
      }
      value['III'] = {
        name: 'III',
        value: parseInt(value['III']),
        isSelected: false
      }
      value['IV'] = {
        name: 'IV',
        value: parseInt(value['IV']),
        isSelected: false
      }
      value.maxSpeed = parseInt(value.maxSpeed)

      for (let i = 0; i <= 32; i++) {
        value['F' + i] = {
          name: 'F' + i,
          isSelected: false,
          minName: 'F' + i,
        };
      }
      app.globalData.cars.push(value);

    } else {
      var cars = app.globalData.cars;
      for (var j in cars) {
        if (cars[j].id == this.data.id) {
          for (var key in value) {
            if (key == 'name' || key == 'cab') {
              cars[j][key] = value[key]
            } else if (key == 'maxSpeed') {
              cars[j][key] = parseInt(value[key])
            } else {
              cars[j][key].value = parseInt(value[key])
            }
          }
        }
      }
    }
    wx.setStorageSync('cars', app.globalData.cars)
    wx.showToast({
      title: '操作成功',
      icon: 'none'
    })
    setTimeout(() => {
      wx.navigateBack({

      })
    }, 1000);
    /**
        id: '00000002',
        isSelected: false,
        speed: 0,
        register: 1,
        direction: 0,
        'type': '模拟',
        'name': '模拟',
        'image': null,
        'cab': '99',
        'maxSpeed': 126
     */
  },


  bindinput: function(e) {
    var index = e.currentTarget.dataset.index
    if(index != 0){
      var valueStr = e.detail.value;
      if (tool.isNull(valueStr)) {
        return;
      }
      var value = parseInt(valueStr);
      if (isNaN(value)) {
        return '';
      }
      if (index == 1) {

        if (value > 10239) {
          wx.showToast({
            title: '地址需要在1~10239之间',
            icon: 'none'
          })
          return parseInt(value / 10);
        }
      } else if (index == 2) {

      } else if (index == 3 || index == 4 || index == 5 || index == 6) {
        if (value > 100) {
          wx.showToast({
            title: '速度为百分比,请在0~100之间取值',
            icon: 'none'
          })
          return parseInt(value / 10);
        }
      }
    }
    
  },

  isNull: function(a) {
    // String    
    if (a == "" || a == null || a == undefined) { // "",null,undefined
      return true;
    }
    if (!a) { // "",null,undefined,NaN
      return true;
    }
    return false;
  },


  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    console.log("onShow方法出发")

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})