//index.js
//获取应用实例
const app = getApp()
var bleManager = require("../common/ble/bleManager.js")
Page({
  data: {
    // 登录相关
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),

    //自定义相关
    //top电源相关
    electricTxt: '0',
    connected:false,
    electriced:false,
    electricInterval: null,
  },

  onLoad: function() {
    //this.getUserInfo;
    
  },
  onShow: function () {
    console.log('这是在主页的onShow中初始化回调信息')
    this.initBle();
  },
  onHide: function () {
    this.clearBle();
  },
  onUnload: function () {
    this.clearBle();
  },


//***********蓝牙直接相关*************/
  electricTap: function () {
    var type = this.data.electriced ? bleManager.type.electricStop_write : bleManager.type.electricOpen_write;
    console.log("写入-电源状态改变" + type);
    bleManager.writeMsg({
      type: type
    })
  },

  //初始化蓝牙相关
  initBle: function () {
    //电
    this.setData({
      electriced: app.globalData.electriced,
      connected: app.globalData.connected,
      electricTxt: app.globalData.electricTxt,
    })
    if (!this.data.electricInterval) {
      this.data.electricInterval = setInterval(function () {
        bleManager.writeMsg({
          type: bleManager.type.electricCheck_write,
        })
      }, 2000)
    }
    //设置回调
    var _this = this;
    bleManager.setChNotify((value) => {
      //电
      if (value.type == bleManager.type.electricCheck_read) {
        console.log("收到-电源值回调")
        var theNum = (parseInt(value.electricValue) / 500)
        var electricTxt = theNum.toFixed(2) + 'A';
        _this.setData({
          electricTxt: electricTxt
        })
        app.globalData.electricTxt = electricTxt;
      } else if (value.type == bleManager.type.electricStop_read) {
        console.log("收到-电源停止回调")
        _this.setData({
          electriced: false,
        })
        app.globalData.electriced = false;
      } else if (value.type == bleManager.type.electricOpen_read) {
        console.log("收到-电源开启回调")
        _this.setData({
          electriced: true,
        })
        app.globalData.electriced = true;
      }
    })
  },

  clearBle: function () {
    //电
    if (this.data.electricInterval) {
      clearInterval(this.data.electricInterval)
      this.data.electricInterval = null;
    }
    //特征回调
    bleManager.clearChNotify()
  },

  

/************** 其他ui相关 ************/

  //ui cell点击事件.
  cellTap: function(e) {
    let index = e.currentTarget.dataset.index;
    if (index == 0) {
      wx.navigateTo({
        url: '../control/control',
      })
    } else if (index == 1) {
      wx.navigateTo({
        url: '../cv/cv',
      })
    } else if (index == 2) {
      wx.navigateTo({
        url: '../cars/cars',
      })
    } else {
      wx.navigateTo({
        url: '../ble/ble',
      })
    }
  },








  //获取用户信息
  getUserInfo: function() {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  }
})