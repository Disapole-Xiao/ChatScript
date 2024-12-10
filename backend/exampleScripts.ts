import { Script } from "./src/type";

export const exampleScripts: Script[] = [
    {
        "entryProcId": "welcome",
        "procs": {
          "welcome": {
            "lineIdx": 1,
            "id": "welcome",
            "initEvent": {
              "lineIdx": 2,
              "type": "InitEvent",
              "actions": [
                {
                  "lineIdx": 3,
                  "type": "SpeakAction",
                  "tokens": [
                    {
                      "type": "variable",
                      "content": "surname"
                    },
                    {
                      "type": "variable",
                      "content": "sex"
                    },
                    {
                      "type": "string",
                      "content": "您好"
                    }
                  ]
                },
                {
                  "lineIdx": 4,
                  "type": "SpeakAction",
                  "tokens": [
                    {
                      "type": "string",
                      "content": "请问有什么可以帮您?"
                    }
                  ]
                },
                {
                  "lineIdx": 5,
                  "type": "GotoAction",
                  "procId": "menu"
                }
              ],
              "hasExitOrGoto": true
            }
          },
          "menu": {
            "lineIdx": 7,
            "id": "menu",
            "hearEvents": [
              {
                "lineIdx": 8,
                "type": "HearEvent",
                "pattern": /话费充值|(怎么|如何).*话费/,
                "actions": [
                  {
                    "lineIdx": 9,
                    "type": "SpeakAction",
                    "tokens": [
                      {
                        "type": "string",
                        "content": "打开移动通信营业厅，选择“话费充值”"
                      }
                    ]
                  },
                  {
                    "lineIdx": 10,
                    "type": "GotoAction",
                    "procId": "menu"
                  }
                ],
                "hasExitOrGoto": true
              },
              {
                "lineIdx": 11,
                "type": "HearEvent",
                "pattern": /话费|余额/,
                "actions": [
                  {
                    "lineIdx": 12,
                    "type": "SpeakAction",
                    "tokens": [
                      {
                        "type": "string",
                        "content": "您的话费余额为"
                      },
                      {
                        "type": "variable",
                        "content": "balance"
                      },
                      {
                        "type": "string",
                        "content": "元"
                      }
                    ]
                  },
                  {
                    "lineIdx": 13,
                    "type": "SpeakAction",
                    "tokens": [
                      {
                        "type": "string",
                        "content": "还有什么其他问题吗?"
                      }
                    ]
                  },
                  {
                    "lineIdx": 14,
                    "type": "GotoAction",
                    "procId": "menu"
                  }
                ],
                "hasExitOrGoto": true
              },
              {
                "lineIdx": 15,
                "type": "HearEvent",
                "pattern": "套餐",
                "actions": [
                  {
                    "lineIdx": 16,
                    "type": "SpeakAction",
                    "tokens": [
                      {
                        "type": "string",
                        "content": "您当前使用的是每月"
                      },
                      {
                        "type": "variable",
                        "content": "planPrice"
                      },
                      {
                        "type": "string",
                        "content": "元的流量套餐，国内数据流量总共是"
                      },
                      {
                        "type": "variable",
                        "content": "package"
                      },
                      {
                        "type": "string",
                        "content": "，本月已使用"
                      },
                      {
                        "type": "variable",
                        "content": "usedPackage"
                      }
                    ]
                  },
                  {
                    "lineIdx": 17,
                    "type": "GotoAction",
                    "procId": "menu"
                  }
                ],
                "hasExitOrGoto": true
              },
              {
                "lineIdx": 18,
                "type": "HearEvent",
                "pattern": "投诉",
                "actions": [
                  {
                    "lineIdx": 19,
                    "type": "GotoAction",
                    "procId": "complain"
                  }
                ],
                "hasExitOrGoto": true
              },
              {
                "lineIdx": 20,
                "type": "HearEvent",
                "pattern": "转人工",
                "actions": [
                  {
                    "lineIdx": 21,
                    "type": "GotoAction",
                    "procId": "manual"
                  }
                ],
                "hasExitOrGoto": true
              },
              {
                "lineIdx": 22,
                "type": "HearEvent",
                "pattern": "再见",
                "actions": [
                  {
                    "lineIdx": 23,
                    "type": "GotoAction",
                    "procId": "end_chat"
                  }
                ],
                "hasExitOrGoto": true
              }
            ],
            "silenceEvents": [
              {
                "lineIdx": 24,
                "type": "SilenceEvent",
                "timeout": 20,
                "actions": [
                  {
                    "lineIdx": 25,
                    "type": "SpeakAction",
                    "tokens": [
                      {
                        "type": "string",
                        "content": "亲，你还在吗？"
                      }
                    ]
                  }
                ],
                "hasExitOrGoto": false
              },
              {
                "lineIdx": 26,
                "type": "SilenceEvent",
                "timeout": 60,
                "actions": [
                  {
                    "lineIdx": 27,
                    "type": "GotoAction",
                    "procId": "end_chat"
                  }
                ],
                "hasExitOrGoto": true
              }
            ],
            "defaultEvent": {
              "lineIdx": 28,
              "type": "DefaultEvent",
              "actions": [
                {
                  "lineIdx": 29,
                  "type": "SpeakAction",
                  "tokens": [
                    {
                      "type": "string",
                      "content": "亲，我听不太懂呢，困难的问题您可以转人工试试哦~"
                    }
                  ]
                },
                {
                  "lineIdx": 30,
                  "type": "GotoAction",
                  "procId": "menu"
                }
              ],
              "hasExitOrGoto": true
            }
          },
          "complain": {
            "lineIdx": 31,
            "id": "complain",
            "initEvent": {
              "lineIdx": 32,
              "type": "InitEvent",
              "actions": [
                {
                  "lineIdx": 33,
                  "type": "SpeakAction",
                  "tokens": [
                    {
                      "type": "string",
                      "content": "亲，有任何问题都可以反馈哦"
                    }
                  ]
                }
              ],
              "hasExitOrGoto": false
            },
            "hearEvents": [
              {
                "lineIdx": 34,
                "type": "HearEvent",
                "pattern": /.+/,
                "actions": [
                  {
                    "lineIdx": 35,
                    "type": "SpeakAction",
                    "tokens": [
                      {
                        "type": "string",
                        "content": "您的反馈已收到，我们会尽快处理，谢谢"
                      }
                    ]
                  },
                  {
                    "lineIdx": 36,
                    "type": "SpeakAction",
                    "tokens": [
                      {
                        "type": "string",
                        "content": "还有什么其他能帮您的？"
                      }
                    ]
                  },
                  {
                    "lineIdx": 37,
                    "type": "GotoAction",
                    "procId": "menu"
                  }
                ],
                "hasExitOrGoto": true
              }
            ],
            "silenceEvents": [
              {
                "lineIdx": 38,
                "type": "SilenceEvent",
                "timeout": 20,
                "actions": [
                  {
                    "lineIdx": 39,
                    "type": "SpeakAction",
                    "tokens": [
                      {
                        "type": "string",
                        "content": "亲，你还在吗？"
                      }
                    ]
                  }
                ],
                "hasExitOrGoto": false
              },
              {
                "lineIdx": 40,
                "type": "SilenceEvent",
                "timeout": 60,
                "actions": [
                  {
                    "lineIdx": 41,
                    "type": "GotoAction",
                    "procId": "end_chat"
                  }
                ],
                "hasExitOrGoto": true
              }
            ],
            "defaultEvent": {
              "lineIdx": 42,
              "type": "DefaultEvent",
              "actions": [
                {
                  "lineIdx": 43,
                  "type": "GotoAction",
                  "procId": "menu"
                }
              ],
              "hasExitOrGoto": true
            }
          },
          "manual": {
            "lineIdx": 44,
            "id": "manual",
            "initEvent": {
              "lineIdx": 45,
              "type": "InitEvent",
              "actions": [
                {
                  "lineIdx": 46,
                  "type": "SpeakAction",
                  "tokens": [
                    {
                      "type": "string",
                      "content": "正在为您转到人工...请稍后..."
                    }
                  ]
                },
                {
                  "lineIdx": 47,
                  "type": "SpeakAction",
                  "tokens": [
                    {
                      "type": "string",
                      "content": "转接人工失败，请稍后再试"
                    }
                  ]
                },
                {
                  "lineIdx": 48,
                  "type": "GotoAction",
                  "procId": "menu"
                }
              ],
              "hasExitOrGoto": true
            }
          },
          "end_chat": {
            "lineIdx": 50,
            "id": "end_chat",
            "initEvent": {
              "lineIdx": 51,
              "type": "InitEvent",
              "actions": [
                {
                  "lineIdx": 52,
                  "type": "SpeakAction",
                  "tokens": [
                    {
                      "type": "string",
                      "content": "感谢您的使用，再见"
                    }
                  ]
                },
                {
                  "lineIdx": 53,
                  "type": "ExitAction"
                }
              ],
              "hasExitOrGoto": true
            }
          }
        }
      },
];