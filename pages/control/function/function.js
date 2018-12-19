// pages/control/function/function.js
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    functionArr:null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // var car = JSON.parse(options.car);
    var cars = wx.getStorageSync('cars')
    var car = cars[0]
    console.log(car)
    var functionKeysArr = [];
    var functionArr = [];
    for (let i = 0; i <= 32; i++) {
      functionKeysArr.push(`F${i}`)
    }
    for (let i = 0; i < functionKeysArr.length; i++) {
      var key = functionKeysArr[i]
      functionArr.push(car[key])
    }
    this.setData({
      functionArr: functionArr,
    })
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