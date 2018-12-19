

App({

  onLaunch: function() {
    
    var model = wx.getSystemInfoSync().model
    this.globalData.isiPhone = model.substr(0, 6) == 'iPhone'
    this.globalData.windowWidth = wx.getSystemInfoSync().windowWidth
    this.globalData.windowHeight = wx.getSystemInfoSync().windowHeight

    var cars = wx.getStorageSync('cars')
    if (cars) {

      for (var i in cars) {
        var everyCar = cars[i]
        everyCar.speed = 0;
        everyCar.direction = 0;
        for (let i = 0; i <= 32; i++) {
          everyCar[`F${i}`].isSelected = false
        }
        var dangName = ["IV", "III", "II", "I"]
        var dangValue = [25, 50, 75, 100]
        for (let j = 0; j < 4; j++) {
          var name = dangName[j]
          var value = dangValue[3 - j]
          everyCar[name].isSelected = false
        }

      }

      this.globalData.cars = cars;
      for (let i in cars) {
        var car = cars[0]
        if (car.isSelected) {
          this.globalData.car = car;
        }
      }
    } else {
      for (var j in this.globalData.defCars) {
        var defCar = this.globalData.defCars[j];
        for (let i = 0; i <= 32; i++) {
          defCar[`F${i}`] = {
            name: `F${i}`,
            isSelected: false,
            minName: 'F' + i,
            lockNum:0,
          }
        }
        var dangName = ["IV", "III", "II", "I"]
        var dangValue = [25, 50, 75, 100]
        for (let j = 0; j < 4; j++) {
          var name = dangName[j]
          var value = dangValue[3 - j]
          defCar[name] = {
            name,
            value,
            isSelected: false
          }
        }
      }
      this.globalData.cars = this.globalData.defCars;
      this.globalData.car = this.globalData.defCars[0];
      wx.setStorage({
        key: 'cars',
        data: this.globalData.cars,
      })
    }

    console.log('有' + this.globalData.cars.length + '辆车', this.globalData.cars)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
  },
  globalData: {
    userInfo: null,
    isiPhone: true,
    windowWidth: 0,
    windowHeight: 0,

    //在ble界面保存的,  以后会移动到blemanager中保存
    connected: false,
    electriced: false,
    electricTxt: '0A',

    cars: null, //当前拥有的所有车辆
    car: null, //当前车辆
    defCars: [
      {
        id: '00000001',
        isDefault: true,
        isSelected: false,
        speed: 0,
        register: 1,
        direction: 0,
        'type': '模拟',
        'name': '模拟',
        'image': '/images/control/car_bg.png',
        'cab': '99',
        'maxSpeed': 126
      },
      { //默认车库 两辆车
        id: '00000002', //id
        isDefault: true, //默认车辆禁止修改
        isSelected: true,
        speed: 0, //当前速度
        register: 1, //一般为1, 当控制两辆车以上时1++,  暂时不需要考虑此属性ß
        direction: 0, //方向 0:左边, 1:右边
        'type': '数码', //数码机车:模拟机车
        'name': '数码',
        'image': '/images/control/car_bg.png',
        'cab': '3', //机车地址
        'maxSpeed': 126, //最高速度
        //'I': { name: 'I', value: 25, isSelected: false}
        // 'F0': { 'name': 'F0', isSelected:false} // f0 - f32
      }
    ]
  }
})