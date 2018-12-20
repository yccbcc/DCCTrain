//  apages/ble/ble.js

var bleManager = require("../common/ble/bleManager.js")
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    devices: [],
    connected: false,
    name: '',
  },

  initBle: function() {
    var _this = this;
    bleManager.setGetDevicesNotify(devices => {
      _this.setData({
        devices: devices
      })
    })
    bleManager.setConnectedNotify(function(connected) {
      console.log("蓝牙已经连接成功,正在发送<e>进行确认")
      bleManager.writeMsg({
        type: bleManager.type.bleConnectSuc_write,
      })
    })
    bleManager.setNameNotify((name) => {
      _this.setData({
        name: name
      })
    })
    bleManager.setChsNotify(function(chs) {
      _this.setData({
        chs: chs
      })
    })
    bleManager.setChNotify(value => {
      if (value.type == bleManager.type.bleConnectSuc_read) {
        app.globalData.connected = true;
        _this.setData({
          connected: true
        })
        console.log("确认通信成功,可以开始通信了")
        wx.navigateBack({
          
        })
      }
    })
  },
  clearBle() {
    bleManager.clearGetDevicesNotify();
    bleManager.clearConnectedNotify();
    bleManager.clearNameNotify();
    bleManager.clearChsNotify();
    bleManager.clearChNotify();
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.initBle()
  },

  //调用方法
  openBluetoothAdapter: function() {
    bleManager.openBluetoothAdapter();
  },
  createBLEConnection: function(e) {
    bleManager.createBLEConnection(e)
  },
  closeBluetoothAdapter: function() {
    bleManager.closeBluetoothAdapter();
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
  onHide: function() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    this.clearBle()
    console.log('bcd')
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