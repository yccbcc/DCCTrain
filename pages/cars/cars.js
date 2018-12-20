// pages/cars/cars.js
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    cars: [],
    currentSel: -1,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {},
  onShow: function() {
    this.setData({
      cars: app.globalData.cars
    })
  },
  onHide: function() {},
  onUnload: function() {},

  //顶部点击事件
  topViewClick: function(e) {
    var index = e.currentTarget.dataset.index
    if (index == 0) { //复制
      if (this.data.currentSel == -1) {
        wx.showToast({
          title: '请选择一辆车',
          icon: 'none'
        })
        return;
      }
      var car = this.data.cars[this.data.currentSel];
      if (car.id == "00000001") {
        wx.showToast({
          title: '模拟机车禁止复制',
          icon: 'none'
        })
        return;
      }
      var newObj = JSON.parse(JSON.stringify(car));
      newObj.isDefault = false;
      newObj.isSelected = false;

      for (var j = 1; j < 10000; j++) {
        var length = 0;
        for (var i = 0; i < this.data.cars.length; i++) {
          if (this.data.cars[i].name == newObj.name + j) {
            break;
          }
          length++;
        }
        if (length == this.data.cars.length) {
          newObj.name = newObj.name + j;
          break;
        }
      }

      var timestamp = new Date().getTime()
      var num = parseInt(Math.random() * 10000 + 1, 10);
      newObj.id = timestamp + num + "";
      
      this.data.cars.splice(this.data.currentSel + 1, 0, newObj);
      app.globalData.cars = this.data.cars;
      
      this.setData({
        cars: this.data.cars
      })

      this.storageCars();

    } else if (index == 1) { //修改
      if (this.data.currentSel == -1) {
        wx.showToast({
          title: '请选择一辆车',
          icon: 'none'
        })
        return;
      }
      var car = this.data.cars[this.data.currentSel];
      if (car.isDefault) {
        wx.showToast({
          title: '默认机车禁止修改',
          icon: 'none'
        })
        return;
      }
      wx.navigateTo({
        url: './detail/detail?id=' + car.id,
      })
    } else if (index == 2) { //新增
      wx.navigateTo({
        url: './detail/detail?isAdd=1',
      })
    } else { //删除
      if (this.data.currentSel == -1) {
        wx.showToast({
          title: '请选择一辆车',
          icon: 'none'
        })
        return;
      }
      var car = this.data.cars[this.data.currentSel];
      if (car.isDefault) {
        wx.showToast({
          title: '默认机车禁止删除',
          icon: 'none'
        })
        return;
      }
      this.data.cars.splice(this.data.currentSel, 1);
      app.globalData.cars = this.data.cars;
      
      this.setData({
        cars: this.data.cars,
        currentSel : -1
      })
      
      this.storageCars();
    }
  },

  carClick: function(e) {
    console.log(e)

    this.setData({
      currentSel: e.currentTarget.dataset.index
    })
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