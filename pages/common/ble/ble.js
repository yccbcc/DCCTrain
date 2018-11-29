function inArray(arr, key, val) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][key] === val) {
      return i;
    }
  }
  return -1;
}

// ArrayBuffer转16进度字符串示例
function ab2hex(buffer) {
  var hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function(bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('');
}

const ble = {

  test: 0,

  data: {
    devices: [],
    connected: false,
    chs: [],
    //selDevice
    canWrite: false,
    name: '',
    deviceId: '',
  },
  //是否已经开始搜索
  _discoveryStarted: false,
  //保存的相关id
  _deviceId: '',
  _serviceId: '',
  _characteristicId: '',
  //回调方法
  getDevicesNotify: null, //获取到设备的回调
  connectedNotify:null,
  nameNotify: null, //当前连接设备名称回调
  chsNotify: null, //所有已接受的设备特征回调
  chNotify: null, //特征change回调

  //对外方法 - 初始化
  openBluetoothAdapter() {
    wx.openBluetoothAdapter({
      success: (res) => {
        console.log('openBluetoothAdapter success', res)
        this.startBluetoothDevicesDiscovery()
      },
      fail: (res) => {
        if (res.errCode === 10001) {
          wx.onBluetoothAdapterStateChange(function(res) {
            console.log('onBluetoothAdapterStateChange', res)
            if (res.available) {
              this.startBluetoothDevicesDiscovery()
            }
          })
        }
      }
    })
  },
  //未提供 获取蓝牙状态的接口.
  getBluetoothAdapterState() {
    wx.getBluetoothAdapterState({
      success: (res) => {
        console.log('getBluetoothAdapterState', res)
        if (res.discovering) {
          this.onBluetoothDeviceFound()
        } else if (res.available) {
          this.startBluetoothDevicesDiscovery()
        }
      }
    })
  },
  startBluetoothDevicesDiscovery() {
    if (this._discoveryStarted) {
      return
    }
    this._discoveryStarted = true
    wx.startBluetoothDevicesDiscovery({
      allowDuplicatesKey: true,
      success: (res) => {
        console.log('startBluetoothDevicesDiscovery success', res)
        this.onBluetoothDeviceFound()
      },
    })
  },
  stopBluetoothDevicesDiscovery() {
    wx.stopBluetoothDevicesDiscovery()
  },
  onBluetoothDeviceFound() {
    var _this = this;
    wx.onBluetoothDeviceFound((res) => {
      res.devices.forEach(device => {
        if (!device.name && !device.localName) {
          return
        }
        const foundDevices = this.data.devices
        const idx = inArray(foundDevices, 'deviceId', device.deviceId)
        if (idx === -1) {
          foundDevices[foundDevices.length] = device
        } else {
          foundDevices[idx] = device
        }
        _this.getDevicesNotify && _this.getDevicesNotify(foundDevices);
      })
    })
  },
  //对外方法
  createBLEConnection(e) {
    var _this = this;
    const ds = e.currentTarget.dataset
    console.log("去连接的设备ID:",ds.deviceId)
    const deviceId = ds.deviceId
    const name = ds.name
    wx.createBLEConnection({
      deviceId,
      success: (res) => {

        _this.data.connected = true;
        _this.connectedNotify && _this.connectedNotify(true)

        _this.data.name = name;
        _this.nameNotify && _this.nameNotify(name)

        _this.data.deviceId = deviceId;

        _this.getBLEDeviceServices(deviceId)
      }
    })
    _this.stopBluetoothDevicesDiscovery()
  },
  //暂时未对外提供 断开连接的方法
  closeBLEConnection() {
    var _this = this;
    wx.closeBLEConnection({
      deviceId: this.data.deviceId
    })
    _this.data.connected = false;
    _this.connectedNotify && _this.connectedNotify(false)
    _this.data.chs = [];
    _this.data.canWrite = false;
  },
  getBLEDeviceServices(deviceId) {
    var _this = this;
    wx.getBLEDeviceServices({
      deviceId,
      success: (res) => {
        console.log("获取到设备服务成功:",res.services)
        var service_id = _this.filterService(res.services);
        _this.getBLEDeviceCharacteristics(deviceId, service_id)
        // for (let i = 0; i < res.services.length; i++) {
        //   if (res.services[i].isPrimary) {
        //     this.getBLEDeviceCharacteristics(deviceId, res.services[i].uuid)
        //     return
        //   }
        // }
      }
    })
  },
  //过滤主服务
  filterService(services) {
    let service_id = "";
    for (let i = 0; i < services.length; i++) {
      if (services[i].uuid.toUpperCase().indexOf('FFE0') != -1) {
        service_id = services[i].uuid;
        console.log("符合要求的服务ID:", service_id)
        break;
      }
    }
    return service_id;
  },
  getBLEDeviceCharacteristics(deviceId, serviceId) {
    wx.getBLEDeviceCharacteristics({
      deviceId,
      serviceId,
      success: (res) => {
        console.log('获取特征成功', res.characteristics)
        for (let i = 0; i < res.characteristics.length; i++) {
          let item = res.characteristics[i]
          // if (item.properties.read) {
          //   wx.readBLECharacteristicValue({
          //     deviceId,
          //     serviceId,
          //     characteristicId: item.uuid,
          //   })
          // }
          console.log("监听到的特征值",item)
          if (item.properties.write) {

            this.data.canWrite = true;
            this._deviceId = deviceId
            this._serviceId = serviceId
            this._characteristicId = item.uuid
          }
          if (item.properties.notify || item.properties.indicate) {
            console.log("开始监听特征值的变化")
            wx.notifyBLECharacteristicValueChange({
              deviceId,
              serviceId,
              characteristicId: item.uuid,
              state: true,
            })
          }
        }
      },
      fail(res) {
        console.error('getBLEDeviceCharacteristics', res)
      }
    })
    // 操作之前先监听，保证第一时间获取数据
    wx.onBLECharacteristicValueChange((characteristic) => {
      console.log('监听到特征变化:', characteristic)
      const idx = inArray(this.data.chs, 'uuid', characteristic.characteristicId)
      if (idx === -1) {
        this.data.chs[this.data.chs.length] = {
          uuid: characteristic.characteristicId,
          value: ab2hex(characteristic.value)
        }
      } else {
        this.data.chs[idx] = {
          uuid: characteristic.characteristicId,
          value: ab2hex(characteristic.value)
        }
      }
      this.chsNotify && this.chsNotify(this.data.chs)
      if(this.chNotify){
        console.log("在ble中有回调")
      }else{
        console.log("在ble中没有回调")
      }
      this.chNotify && this.chNotify(characteristic.value)
      // this.setData(data)
    })
  },

  writeCharacteristicBuf(buf) {
    wx.writeBLECharacteristicValue({
      deviceId: this._deviceId,
      serviceId: this._serviceId,
      characteristicId: this._characteristicId,
      value: buf,
    })
  },

  closeBluetoothAdapter() {
    wx.closeBluetoothAdapter()
    this._discoveryStarted = false
  },
}

module.exports = ble;

/***************** 接受命令 ************** */


/***************** 发送命令 ************** */