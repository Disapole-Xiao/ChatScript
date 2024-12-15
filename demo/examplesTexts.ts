export const exampleTexts = [
  String.raw`PROC welcome
    INIT
        SPEAK $surname $sex "您好"
        SPEAK "请问有什么可以帮您?"
        GOTO menu
# 主菜单
PROC menu
    HEAR /话费充值|(怎么|如何).*话费/ 
        SPEAK "打开移动通信营业厅，选择“话费充值”"
        GOTO menu
    HEAR /话费|余额/
        SPEAK "您的话费余额为" $balance "元"
        SPEAK "还有什么其他问题吗?"
        GOTO menu
    HEAR "套餐"
        SPEAK "您当前使用的是每月" $planPrice "元的流量套餐，国内数据流量总共是" $package "，本月已使用" $usedPackage
        GOTO menu
    HEAR "投诉"
        GOTO complain
    HEAR "转人工"
        GOTO manual
    HEAR "再见"
        GOTO end_chat
    SILENCE 20
        SPEAK "亲，你还在吗？"
    SILENCE 60
        GOTO end_chat
    DEFAULT
        SPEAK "亲，我听不太懂呢，困难的问题您可以转人工试试哦~"
        GOTO menu
PROC complain
    INIT
        SPEAK "亲，有任何问题都可以反馈哦"
    HEAR /.+/
        SPEAK "您的反馈已收到，我们会尽快处理，谢谢"
        SPEAK "还有什么其他能帮您的？"
        GOTO menu
    SILENCE 20
        SPEAK "亲，你还在吗？"
    SILENCE 60
        GOTO end_chat
    DEFAULT
        GOTO menu
PROC manual
    INIT
        SPEAK "正在为您转到人工...请稍后..."
        SPEAK "转接人工失败，请稍后再试"
        GOTO menu
# 结束会话
PROC end_chat
    INIT
        SPEAK "感谢您的使用，再见"
        EXIT
`,

  String.raw`
# 进入聊天
proc hello
    init
        speak "尊敬的" $username "欢迎光临小店😊~"
        speak "最近上新了冬季的新款，可以看看哟👉http://e.tb.cn/h.TeWrouV0tGqA9Ch?tk=tp5v3EDkuZG"
        speak "有任何问题都可以问小妹哦~，小妹会尽力为您服务😊"
        goto menu

# 主菜单
proc menu
    hear /(什么时候|多久)发货/
        speak "亲，您拍下后24小时内就可以为您安排发货的"
        goto menu
    hear "什么快递"
        speak "默认是发韵达快递哦，如果有需要也可以发顺丰，需要您补邮费的哦"
        goto express
    hear /(什么时候|多久)到货/
        speak "亲，一般韵达发货以后3天左右可以到货的，您收到货以后可以仔细检查一下，如有任何质量问题，7天内可以无条件退换货的，邮费也是我们承担。"
        goto menu
    hear /退货|退款|转人工/
        speak "亲亲这边是遇到了什么问题吗，小妹先帮你转售后客服哦"
        goto manual
    hear /谢谢|感谢/
        speak "不用客气，欢迎再来哦~"
        exit
    hear /再见|拜拜/
        speak "再见，欢迎再来哦~"
        exit
    silence 20
        speak "亲，您还在吗？有任何问题随时找小妹哦🥺~"
    silence 60
        exit
    default
        speak "这个小妹不太懂呢"
        goto menu

# 快递
proc express
    hear "顺丰"
        speak "好的小妹这边已经帮您登记了哦，直接拍下就可以了"
        goto menu
    silence 30
        goto menu
    default
        goto menu

# 转人工服务
proc manual
    init
        speak "正在转售后客服中...这段时间请不要离开哦🙏"
        goto menu
`,
];
