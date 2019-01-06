const ble = require("./ble.js")
const strManager = require("../stringExt.js")
const app = getApp()
const manager = {
  chNotify: null,
  maxNum: 999,
  type: {
    none: -1,
    electricCheck_write: 1, //检测电源  <c>
    electricCheck_read: 2, //返回<axxx> xxx/1000
    electricStop_write: 3, //关闭电源 <1>
    electricStop_read: 4, //返回 <p1>  短路<p2> <p3> 放在哪???
    electricOpen_write: 5, //打开电源 <0>
    electricOpen_read: 6, //返回 <p0>

    bleConnectSuc_write: 7, //蓝牙连接成功 <e>
    bleConnectSuc_read: 8, //返回 <0>

    speedChange_write: 9, //速度改变 <f  CAB  BYTE1  [BYTE2]>
    speedChange_read: 10, //返回: <TREGISTER  SPEED  DIRECTION>

    functionTap_write: 11, //功能键改变

    /**
     * <r CALLBACKNUM|CALLBACKSUB|CV VALUE>
     * 1.get返回
     * 2.set返回
     * 
     * 3.getAddress第一次返回
     * 4.get第六位为0返回
     * 5.get二进制第六位为1,R17返回 <r random1|random2|17 value>  cv=17
     * 6.get二进制第六位为1,R18返回 <r random1|random2|18 value>  cv=18
     * 
     * 7.setAddress 1-128之间时,返回 <r random1|random2|1 value>  cv=1 value=-1报错 一致成功
     * 8.setAddress 129-10239之间, 返回 <r random1|random2|29 value>
     * 9.setAddress 129-10239, 第一次发送后 收到返回值 二进制第六位 为0时. 返回<r random1|random2|29 value> value=-1循环发送     
     * 10.set最后发送,R17返回 <r random1|random2|17 value>  cv=17
     * 11.set最后发送,R18返回 <r random1|random2|18 value>  cv=18
     *
     * 
     */
    cv_read: 12,

    cv_get_write: 13, //CV点击Get <R CV CALLBACKNUM CALLBACKSUB>
    cv_set_write: 14, //CV点击Set <W CV VALUE CALLBACKNUM CALLBACKSUB>

    carAddress_get_first_wirte: 15, //Get第一次发送 <R 29 randomNum1 randomNum2>
    carAddress_get_sixValue_0_write: 16, //Get时 二进制第六位为0发送 <R 1 random1 random2>
    carAddress_get_sixValue_1_17_write: 17, //Get时 二进制第六位为1发送 <R 17 random1 random2>
    carAddress_get_sixValue_1_18_write: 18, //Get时 二进制第六位为1发送 <R 18 random1 random2>

    carAddress_set_low128_R29_write: 19, //Set 在1-128之间时第一次发送 <R 29 random1 random2>
    carAddress_set_low128_sixValue_0_write: 20, //Set 在1-128之间时第一次发送 <W 29 value-16 random1 random2>
    carAddress_set_low128_first_write: 21, //Set 在1-128之间时第一次发送 <W 1 value random1 random2>

    carAddress_set_high128_first_write: 22, //Set 在129-10239之间时 <R 29 random1 random2>
    carAddress_set_high128_sixValue_0_write: 23, //set 在129以上返回值二进制第5位为0时. 发送<W 29 value random1 random2>
    carAddress_set_high128_17_write: 24, // cv17 <W 17 random1 random2>
    carAddress_set_high128_18_write: 25, // cv18 <W 18 random1 random2>
  },

  /************************** 交互方法  ***************** */

  //特征值回调
  setChNotify(func) {
    this.chNotify = func;
    ble.chNotify = ab => {
      this.readMsg(ab)
    }
  },
  clearChNotify() {
    if (this.chNotify) {
      this.chNotify = null;
    }
    if (ble.chNotify) {
      ble.chNotify = null;
    }
  },
  //获取蓝牙设备回调
  setGetDevicesNotify: function(func) {
    ble.getDevicesNotify = func
  },
  clearGetDevicesNotify: function() {
    if (ble.getDevicesNotify) {
      ble.getDevicesNotify = null;
    }
  },
  //连接状态
  setConnectedNotify: function(func) {
    ble.connectedNotify = func;
  },
  clearConnectedNotify: function() {
    if (ble.connectedNotify) {
      ble.connectedNotify = null;
    }
  },
  //已连接设备的name
  setNameNotify: function(func) {
    ble.nameNotify = func;
  },
  clearNameNotify: function() {
    if (ble.nameNotify) {
      ble.nameNotify = null;
    }
  },
  //所有特征值的改变 回调
  setChsNotify: function(func) {
    ble.chsNotify = func;
  },
  clearChsNotify: function() {
    if (ble.chsNotify) {
      ble.chsNotify = null;
    }
  },


  //初始化
  openBluetoothAdapter: function() {
    ble.openBluetoothAdapter();
  },
  closeBluetoothAdapter: function () {
    ble.closeBluetoothAdapter();
  },
  
  createBLEConnection: function(e) {
    ble.createBLEConnection(e)
  },
  



  /************************** 写 / 读  ***************** */
  writeMsg(e) { //e: {type:0,speed:0, functionIndex:32,cvAddress:0,cvValue:0,}

    var backObj = {
      type: e.type
    }; //需要返回页面的值   //{randowNum1:0,randomNum2:0,type:none}
    var msg = ""
    var car = app.globalData.car;

    if (e.type == this.type.electricCheck_write) {
      if (app.globalData.connected && app.globalData.electriced) {
        msg = "<c>"
      } else {
        return;
      }
    }

    if (e.type == this.type.bleConnectSuc_write) {
      msg = "<e>"
    } else {
      if (!app.globalData.connected) {
        wx.showToast({
          title: '请连接蓝牙',
          icon: 'none'
        })
        return;
      }
      if (e.type == this.type.electricStop_write) {
        msg = "<0>"
      } else if (e.type == this.type.electricOpen_write) {
        msg = "<1>"
      } else {
        if (!app.globalData.electriced) {
          wx.showToast({
            title: '请接通电源',
            icon: 'none'
          })
          return;
        }
        if (e.type == this.type.speedChange_write) {
          //  这里的/速度/不做处理 需要控制器处理好,发过来. -1急停 0停止 ridection:方向 0右1左
          msg = `<t ${car.register} ${car.cab} ${e.speed} ${car.direction}>`
        } else if (e.type == this.type.functionTap_write) {
          var index = e.functionIndex;
          if (index >= 0 && index <= 4) {
            var type1 = 128 + funcIsSel(1) * 1 + funcIsSel(2) * 2 + funcIsSel(3) * 4 + funcIsSel(4) * 8 + funcIsSel(0) * 16;
            msg = `<f ${car.cab} ${type1}>`
          } else if (index >= 5 && index <= 8) {
            var type1 = 176 + funcIsSel(5) * 1 + funcIsSel(6) * 2 + funcIsSel(7) * 4 + funcIsSel(8) * 8
            msg = `<f ${car.cab} ${type1}>`
          } else if (index >= 9 && index <= 12) {
            var type1 = 160 + funcIsSel(9) * 1 + funcIsSel(10) * 2 + funcIsSel(11) * 4 + funcIsSel(12) * 8
            msg = `<f ${car.cab} ${type1}>`
          } else if (index >= 13 && index <= 20) {
            var type1 = 222
            var type2 = funcIsSel(13) * 1 + funcIsSel(14) * 2 + funcIsSel(15) * 4 + funcIsSel(16) * 8 + funcIsSel(17) * 16 + funcIsSel(18) * 32 + funcIsSel(19) * 64 + funcIsSel(20) * 128;
            msg = `<f ${car.cab} ${type1} ${type2}>`
          } else if (index >= 21 && index <= 28) {
            var type1 = 223
            var type2 = funcIsSel(21) * 1 + funcIsSel(22) * 2 + funcIsSel(23) * 4 + funcIsSel(24) * 8 + funcIsSel(25) * 16 + funcIsSel(26) * 32 + funcIsSel(27) * 64 + funcIsSel(28) * 128;
            msg = `<f ${car.cab} ${type1} ${type2}>`
          } else { //如果恩建为不锁定状态则发送两次不同指令,间隔0.5s???
            return;
          }
        } else if (e.type == this.type.cv_get_write) { //cv-get
          //Get <R CV CALLBACKNUM CALLBACKSUB> Set <W CV VALUE CALLBACKNUM CALLBACKSUB>
          var randomNum1 = randomNum(1, this.maxNum)
          var randomNum2 = randomNum(1, this.maxNum)
          msg = `<R ${e.cvAddress} ${randomNum1} ${randomNum2}>`
          backObj.randomNum1 = randomNum1;
          backObj.randomNum2 = randomNum2;
        } else if (e.type == this.type.cv_set_write) { //cv-set
          var randomNum1 = randomNum(1, this.maxNum)
          var randomNum2 = randomNum(1, this.maxNum)
          msg = `<W ${e.cvAddress} ${e.cvValue} ${randomNum1} ${randomNum2}>`
          backObj.randomNum1 = randomNum1;
          backObj.randomNum2 = randomNum2;
        } else if (e.type == this.type.carAddress_get_first_wirte) {
          var randomNum1 = randomNum(1, this.maxNum)
          var randomNum2 = randomNum(1, this.maxNum)
          msg = `<R 29 ${randomNum1} ${randomNum2}>`
          backObj.randomNum1 = randomNum1;
          backObj.randomNum2 = randomNum2;
        }
        //         carAddress_set_low128_first_write: 19, //Set 在1-128之间时第一次发送 <W 1 value random1 random2>
        //           carAddress_set_high128_first_write: 20, //Set 在129-10239之间时 <R 29 random1 random2>
        //             carAddress_set_high128_sixValue_0_write: 21,//set 在129以上返回值二进制第六位为0时. 发送<W 29 value random1 random2>
        //               carAddress_set_high128_17_write: 22, // cv17 <W 17 value random1 random2>
        //                 carAddress_set_high128_18_write: 23, // cv18 <W 18 value random1 random2>
        else if (e.type == this.type.carAddress_get_sixValue_0_write) {
          var randomNum1 = randomNum(1, this.maxNum)
          var randomNum2 = randomNum(1, this.maxNum)
          msg = `<R 1 ${randomNum1} ${randomNum2}>`
          backObj.randomNum1 = randomNum1;
          backObj.randomNum2 = randomNum2;
        } else if (e.type == this.type.carAddress_get_sixValue_1_17_write) {
          var randomNum1 = randomNum(1, this.maxNum)
          var randomNum2 = randomNum(1, this.maxNum)
          msg = `<R 17 ${randomNum1} ${randomNum2}>`
          backObj.randomNum1 = randomNum1;
          backObj.randomNum2 = randomNum2;
        } else if (e.type == this.type.carAddress_get_sixValue_1_18_write) {
          var randomNum1 = randomNum(1, this.maxNum)
          var randomNum2 = randomNum(1, this.maxNum)
          msg = `<R 18 ${randomNum1} ${randomNum2}>`
          backObj.randomNum1 = randomNum1;
          backObj.randomNum2 = randomNum2;
        } else if (e.type == this.type.carAddress_set_low128_R29_write) {
          var randomNum1 = randomNum(1, this.maxNum)
          var randomNum2 = randomNum(1, this.maxNum)
          msg = `<R 29 ${randomNum1} ${randomNum2}>`
          backObj.randomNum1 = randomNum1;
          backObj.randomNum2 = randomNum2;
        } else if (e.type == this.type.carAddress_set_low128_sixValue_0_write) {
          var randomNum1 = randomNum(1, this.maxNum)
          var randomNum2 = randomNum(1, this.maxNum)
          msg = `<W 29 ${e.cvValue} ${randomNum1} ${randomNum2}>`
          backObj.randomNum1 = randomNum1;
          backObj.randomNum2 = randomNum2;
        } else if (e.type == this.type.carAddress_set_low128_first_write) {
          var randomNum1 = randomNum(1, this.maxNum)
          var randomNum2 = randomNum(1, this.maxNum)
          msg = `<W 1 ${e.cvValue} ${randomNum1} ${randomNum2}>`
          backObj.randomNum1 = randomNum1;
          backObj.randomNum2 = randomNum2;
        } else if (e.type == this.type.carAddress_set_high128_first_write) {
          var randomNum1 = randomNum(1, this.maxNum)
          var randomNum2 = randomNum(1, this.maxNum)
          msg = `<R 29 ${randomNum1} ${randomNum2}>`
          backObj.randomNum1 = randomNum1;
          backObj.randomNum2 = randomNum2;
        } else if (e.type == this.type.carAddress_set_high128_sixValue_0_write) {
          var randomNum1 = randomNum(1, this.maxNum)
          var randomNum2 = randomNum(1, this.maxNum)
          msg = `<W 29 ${e.cvValue} ${randomNum1} ${randomNum2}>`
          backObj.randomNum1 = randomNum1;
          backObj.randomNum2 = randomNum2;
        } else if (e.type == this.type.carAddress_set_high128_17_write) {
          var randomNum1 = randomNum(1, this.maxNum)
          var randomNum2 = randomNum(1, this.maxNum)
          msg = `<W 17 ${e.cvValue} ${randomNum1} ${randomNum2}>`
          backObj.randomNum1 = randomNum1;
          backObj.randomNum2 = randomNum2;
        } else if (e.type == this.type.carAddress_set_high128_18_write) {
          var randomNum1 = randomNum(1, this.maxNum)
          var randomNum2 = randomNum(1, this.maxNum)
          msg = `<W 18 ${e.cvValue} ${randomNum1} ${randomNum2}>`
          backObj.randomNum1 = randomNum1;
          backObj.randomNum2 = randomNum2;
        }

      }
    }

    console.log("写入蓝牙", msg)
    //发送
    var hex = str2hex(msg)
    var ab = hex2ab(hex)
    ble.writeCharacteristicBuf(ab);
    //返回到控制器的值
    backObj.type = e.type;
    return backObj;
  },

  tempStr: "",

  readMsg(ab) {
    if (!this.chNotify) {
      console.log("在manager中没有回调")
      return;
    }
    var hex = ab2hex(ab)
    var str = hex2str(hex)
    console.log("接收到ab->str:", str)

    var allStr = this.tempStr + str;
    var allOrders = []
    //属性扩展
    this.tempStr = strManager.cutstr(allStr, "<", ">", allOrders)
    for (var i = 0; i < allOrders.length; i++) {
      var order = allOrders[i]
      this.handleReadStr(order)
    }
  },
  handleReadStr: function(str) {
    if (str.indexOf("<") != 0 || !str.endsWith(">")) {
      return;
    }
    var value = {} //{type:type,electricValue:1000, speed:0,direction:0, randomNum1:0,randomNum2:0,cvValue:0,cvAddress:0,}
    var type = this.type.none;
    if (str.indexOf("<a") == 0) {
      type = this.type.electricCheck_read;
      if (str.length > 3) {
        value.electricValue = str.substr(2, str.length - 3)
      } else {
        value.electricValue = '0'
      }
    } else if (str == "<p0>" || str == '<p2>' || str == '<p3>') {
      type = this.type.electricStop_read;
    } else if (str == "<p1>") {
      type = this.type.electricOpen_read;
    } else if (str == "<O>") {
      type = this.type.bleConnectSuc_read;
    } else if (str.indexOf("<T") == 0) {
      //<TREGISTER  SPEED  DIRECTION> <T1 50 0>  收到什么数据就返回什么速度,控制器去具体处理
      type = this.type.speedChange_read;
      var speedArr = str.split(' ');
      if (speedArr.length == 3) {
        value.speed = speedArr[1]
        value.direction = speedArr[2].substr(0, speedArr[2].length - 1)
      } else {
        return;
      }
    } else if (str.indexOf('<r') == 0) {
      //cv编程 get/set  <rCALLBACKNUM|CALLBACKSUB|CV VALUE>   这里注意与下方二进制对应
      type = this.type.cv_read;
      var arr = str.split(' ')
      if (arr.length == 2) {
        var cvValue = arr[1].substr(0, arr[1].length - 1)
        value.cvValue = cvValue;
        var secStr = arr[0];
        var arr2 = secStr.split('|');
        if (arr2.length == 3) {
          var randomNum1 = arr2[0].substr(2, arr2[0].length - 2);
          var randomNum2 = arr2[1];
          var cvAddress = arr2[2];
          value.randomNum1 = randomNum1;
          value.randomNum2 = randomNum2;
          value.cvAddress = cvAddress;
        } else {
          return;
        }
      } else {
        return;
      }
    } else {
      console.log("收到-未知类型的消息", str)
      return;
    }
    //回调到控制器
    value.type = type;
    this.chNotify(value)
  }
}


module.exports = manager;

/************ 工具********  */
function funcIsSel(index) {
  var car = app.globalData.car;
  var key = 'F' + index;
  var dict = car[key]
  return dict.isSelected;
}
//获取随机数
function randomNum(minNum, maxNum) {
  switch (arguments.length) {
    case 1:
      return parseInt(Math.random() * minNum + 1, 10);
      break;
    case 2:
      return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
      break;
    default:
      return 0;
      break;
  }
}


/************************** ab <--> 16进制字符串  ***************** */
function ab2hex(buffer) {
  let bufferType = Object.prototype.toString.call(buffer)
  if (buffer != '[object ArrayBuffer]') {
    return
  }
  let dataView = new DataView(buffer)

  var hexStr = '';
  for (var i = 0; i < dataView.byteLength; i++) {
    var str = dataView.getUint8(i);
    var hex = (str & 0xff).toString(16);
    hex = (hex.length === 1) ? '0' + hex : hex;
    hexStr += hex;
  }
  return hexStr.toUpperCase();
}

function hex2ab(str) {
  if (str == null) {
    return new ArrayBuffer(0);
  }
  if (typeof(str) == "number") {
    let buffer = new ArrayBuffer(1)
    let dataView = new DataView(buffer)
    dataView.setUint8(0, str)
    return buffer;
  }
  if (typeof(str) == "string") {
    var buffer = new ArrayBuffer(Math.ceil(str.length / 2));
    let dataView = new DataView(buffer)

    let ind = 0;
    for (var i = 0; i < str.length; i += 2) {
      let code = parseInt(str.substr(i, 2), 16)
      dataView.setUint8(ind, code)
      ind++
    }
    return buffer;
  }
}

/********** 字符串(英文) <---> 16进制 ************ */
function str2hex(str) {
  if (str === "")
    return "";
  var hexCharCode = [];
  // 　　hexCharCode.push("0x");
  for (var i = 0; i < str.length; i++) {
    hexCharCode.push((str.charCodeAt(i)).toString(16));
  }
  return hexCharCode.join("");
}

// 16进制转字符串
function hex2str(hexCharCodeStr) {
  var trimedStr = hexCharCodeStr.trim();
  var rawStr =
    trimedStr.substr(0, 2).toLowerCase() === "0x" ?
    trimedStr.substr(2) :
    trimedStr;
  var len = rawStr.length;
  if (len % 2 !== 0) {
    alert("Illegal Format ASCII Code!");
    return "";
  }
  var curCharCode;
  var resultStr = [];
  for (var i = 0; i < len; i = i + 2) {
    curCharCode = parseInt(rawStr.substr(i, 2), 16); // ASCII Code Value
    resultStr.push(String.fromCharCode(curCharCode));
  }
  return resultStr.join("");
}