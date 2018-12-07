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
  onLoad: function(options) {
  },
  onShow: function () {
        this.setData({
      cars: app.globalData.cars
    })
  },
  onHide: function () {
  },
  onUnload: function () {
  },

  //顶部点击事件
  topViewClick: function(e) {
    var index = e.currentTarget.dataset.index
    if (index == 0) {
      if (this.data.currentSel == -1) {
        wx.showToast({
          title: '请选择一辆车',
          icon: 'none'
        })
        return;
      }
      var car = this.data.cars[this.data.currentSel];
      var newObj = JSON.parse(JSON.stringify(car));
      newObj.isDefault = false;
      newObj.isSelected = false;
      this.data.cars.splice(this.data.currentSel + 1, 0, newObj);
      app.globalData.cars = this.data.cars;
      wx.setStorageSync('cars', this.data.cars)
      this.setData({
        cars: this.data.cars
      })
      console.log(this.data.cars)

    } else if (index == 1) {
      if (this.data.currentSel == -1) {
        wx.showToast({
          title: '请选择一辆车',
          icon: 'none'
        })
        return;
      }
      var car = this.data.cars[this.data.currentSel];
      if(car.isDefault){
        wx.showToast({
          title: '默认机车禁止修改',
          icon: 'none'
        })
        return;
      }
      wx.navigateTo({
        url: './detail/detail?id=' + car.id,
      })
    } else if (index == 2) {
      wx.navigateTo({
        url: './detail/detail?isAdd=1',
      })
    }else{
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
      wx.setStorageSync('cars', this.data.cars)
      this.setData({
        cars: this.data.cars
      })
      this.data.currentSel = -1;
    }
  },

  carClick: function(e) {
    console.log(e)

    this.setData({
      currentSel: e.currentTarget.dataset.index
    })
  },
})