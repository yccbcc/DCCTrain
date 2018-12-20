import WeCropper from '../../../we-cropper/we-cropper.js'

var app = getApp()
const device = wx.getSystemInfoSync()
const width = device.windowWidth
const height = device.windowHeight - 50

Page({
  data: {
    cropperOpt: {
      id: 'cropper',
      width,
      height,
      scale: 2.5,
      zoom: 8,
      cut: {
        x: (width - 300) / 2,
        y: (height - 300) / 2,
        width: 300,
        height: 100
      }
    }
  },
  touchStart(e) {
    this.wecropper.touchStart(e)
  },
  touchMove(e) {
    this.wecropper.touchMove(e)
  },
  touchEnd(e) {
    this.wecropper.touchEnd(e)
  },
  getCropperImage() {
    this.wecropper.getCropperImage((avatar) => {
      if (avatar) {

        var pages = getCurrentPages()
        var controlPage = pages[pages.length - 2];
        controlPage.data.car.image = avatar

        for (var i = 0; i < controlPage.data.cars.length; i++) {
          var car = controlPage.data.cars[i]
          if (car.isSelected) {
            car.image = avatar;
          }
        }

        for (var i = 0; i < app.globalData.cars.length; i++) {
          var car = app.globalData.cars[i]
          if (car.isSelected) {
            car.image = avatar;
          }
        }

        this.storageCars()

        //console.log(pages)
        //  获取到裁剪后的图片
        wx.navigateBack({})
      } else {
        console.log('获取图片失败，请稍后重试')
      }
    })
  },
  uploadTap() {
    const self = this

    wx.chooseImage({
      count: 1, // 默认9
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success(res) {
        const src = res.tempFilePaths[0]
        //  获取裁剪图片资源后，给data添加src属性及其值
        self.wecropper.pushOrign(src)
      }
    })
  },
  onLoad(option) {
    const {
      cropperOpt
    } = this.data

    if (option.src) {
      cropperOpt.src = option.src
      new WeCropper(cropperOpt)
        .on('ready', (ctx) => {
          console.log(`wecropper is ready for work!`)
        })
        .on('beforeImageLoad', (ctx) => {
          console.log(`before picture loaded, i can do something`)
          console.log(`current canvas context:`, ctx)
          wx.showToast({
            title: '上传中',
            icon: 'loading',
            duration: 20000
          })
        })
        .on('imageLoad', (ctx) => {
          console.log(`picture loaded`)
          console.log(`current canvas context:`, ctx)
          wx.hideToast()
        })
        .on('beforeDraw', (ctx, instance) => {
          console.log(`before canvas draw,i can do something`)
          console.log(`current canvas context:`, ctx)
        })
        .updateCanvas()
    }
  },
  storageCars: function() {
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